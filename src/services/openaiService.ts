import { OpenAI } from 'openai';
import { Conversation } from '../domain/models/conversation.js';
import { Message } from '../domain/models/message.js';
import { ConversationService } from './conversationService.js';
import { AgentRepository } from '../data/repositories/agentRepository.js';
import { ConversationContext } from '../types/openai.js';
import { Agent } from '../domain/models/agent.js';
import chalk from 'chalk';
import { config } from '../config/env.js';

/**
 * Service for managing OpenAI API interactions and agent communications.
 * Handles conversation processing, message generation, and goal achievement checking.
 */
export class OpenAIService {
    private openai: OpenAI | null = null;
    private conversationContexts: Map<string, ConversationContext> = new Map();
    private readonly messageCheckThreshold: number;
    private consecutiveErrors = 0;
    private maxConsecutiveErrors = 10;
    private isEnabled = true;
    private disabledReason: string | null = null;

    /**
     * Creates an instance of OpenAIService.
     * @param apiKey - OpenAI API key for authentication
     * @param conversationService - Service for conversation management
     * @param agentRepository - Repository for agent data access
     */
    constructor(
        apiKey: string | undefined,
        private conversationService: ConversationService,
        private agentRepository: AgentRepository
    ) {
        this.messageCheckThreshold = config.GOAL_CHECK_INTERVAL;
        try {
            if (!apiKey) {
                this.disableService('OpenAI API key is missing. Agents cannot communicate. Please check your .env file and add OPENAI_API_KEY.');
                return;
            }

            this.openai = new OpenAI({
                apiKey: apiKey
            });
        } catch (error) {
            this.disableService('Failed to initialize OpenAI client. Agents cannot communicate. Please check your API key configuration.');
        }
    }

    /**
     * Disables the OpenAI service with a specific reason.
     * @param reason - The reason for disabling the service
     * @private
     */
    private disableService(reason: string): void {
        this.isEnabled = false;
        this.disabledReason = reason;
        console.error(chalk.yellow('\n⚠️ OpenAI Service Disabled:'));
        console.error(chalk.white(reason));
    }

    /**
     * Gets the current status of the OpenAI service.
     * @returns Object containing enabled status and any disable reason
     */
    public getStatus(): { isEnabled: boolean; reason: string | null } {
        return {
            isEnabled: this.isEnabled,
            reason: this.disabledReason
        };
    }

    /**
     * Handles API errors and tracks consecutive failures.
     * @param error - The error to handle
     * @private
     */
    private async handleApiError(error: any): Promise<void> {
        this.consecutiveErrors++;
        if (this.consecutiveErrors >= this.maxConsecutiveErrors) {
            this.disableService('Too many consecutive API errors. Service temporarily disabled.');
        }
        console.error(chalk.red('OpenAI API Error:'), error);
    }

    /**
     * Resets the consecutive error counter after successful operations.
     * @private
     */
    private resetErrorCount(): void {
        this.consecutiveErrors = 0;
    }

    /**
     * Initializes a new conversation context with system prompts and participant information.
     * @param conversation - The conversation to initialize
     */
    async initializeConversation(conversation: Conversation): Promise<void> {
        const participants = await Promise.all(
            conversation.participants.map(async id => {
                const agent = await this.agentRepository.findById(id);
                if (!agent) throw new Error(`Agent ${id} not found`);
                return {
                    id: agent.id,
                    name: agent.name,
                    type: agent.type,
                    description: agent.description
                };
            })
        );

        this.conversationContexts.set(conversation.id, {
            topic: conversation.topic,
            goal: conversation.goal,
            surrounding: conversation.surrounding,
            participants: participants.map(p => ({
                id: p.id,
                name: p.name,
                type: p.type,
                description: p.description
            })),
            messageCount: 0
        });
    }

    /**
     * Generates the system prompt for a conversation based on participants and context.
     * @param conversationId - ID of the conversation
     * @returns Promise resolving to the generated system prompt
     * @private
     */
    private async generateSystemPrompt(conversationId: string): Promise<string> {
        const context = this.conversationContexts.get(conversationId);
        if (!context) throw new Error('Conversation context not found');

        const participantDescriptions = context.participants.map(p => {
            const typeDescription = this.getAgentTypeDescription(p.type);
            return `- ${p.name} (${p.type}):
  Role: ${typeDescription}
  Personality: ${p.description || 'No specific personality traits defined'}
  Communication Style: Based on their type and description, they communicate in a ${this.getCommunicationStyle(p.type, p.description)}`;
        }).join('\n\n');

        return `You are managing a conversation between multiple AI agents. Here are the details:

Topic: ${context.topic}
Goal: ${context.goal}
Environment: ${context.surrounding}

Participants and their characteristics:
${participantDescriptions}

Interaction Guidelines:
1. Each response should be from the perspective of the agent that should respond next
2. Stay in character based on the agent's type, personality, and communication style
3. Consider how each agent's characteristics influence:
   - Their understanding of the topic
   - Their approach to the goal
   - Their interaction with other agents
   - Their communication style and tone
   - Their reaction to the surrounding environment
4. Keep responses focused on the topic and goal while maintaining character authenticity
5. Consider the conversation history and previous messages
6. Respect the specified recipients of each message
7. Let the surrounding environment influence the agent's mood and responses

Current message count: ${context.messageCount}

Important: Generate responses that reflect the unique personality and communication style of the speaking agent, while considering how they would be affected by their current environment.`;
    }

    /**
     * Gets a description of an agent type's characteristics.
     * @param type - The agent type to describe
     * @returns Description of the agent type
     * @private
     */
    private getAgentTypeDescription(type: string): string {
        switch (type.toLowerCase()) {
            case 'learning':
                return 'Curious and adaptable, focuses on gathering information and understanding different perspectives';
            case 'assistant':
                return 'Helpful and supportive, aims to facilitate discussion and find common ground';
            case 'specialist':
                return 'Expert in their field, provides detailed insights and technical knowledge';
            default:
                return 'Standard agent with balanced characteristics';
        }
    }

    /**
     * Determines the communication style for an agent based on type and description.
     * @param type - The agent's type
     * @param description - Optional description of the agent
     * @returns Communication style string
     * @private
     */
    private getCommunicationStyle(type: string, description?: string): string {
        const baseStyle = (() => {
            switch (type.toLowerCase()) {
                case 'learning':
                    return 'inquisitive and open-minded manner, often asking questions and seeking clarification';
                case 'assistant':
                    return 'supportive and diplomatic way, focusing on clarity and understanding';
                case 'specialist':
                    return 'precise and authoritative tone, using field-specific terminology when appropriate';
                default:
                    return 'balanced and professional manner';
            }
        })();

        // Analyze description for additional communication traits
        if (description) {
            const traits = this.analyzeDescriptionForTraits(description);
            return `${baseStyle}, while also being ${traits}`;
        }

        return baseStyle;
    }

    /**
     * Analyzes an agent's description to extract personality traits.
     * @param description - The description to analyze
     * @returns String of identified traits
     * @private
     */
    private analyzeDescriptionForTraits(description: string): string {
        const traits: string[] = [];

        // Look for key personality indicators in the description
        if (description.toLowerCase().includes('formal')) traits.push('formal');
        if (description.toLowerCase().includes('casual')) traits.push('casual');
        if (description.toLowerCase().includes('direct')) traits.push('direct');
        if (description.toLowerCase().includes('diplomatic')) traits.push('diplomatic');
        if (description.toLowerCase().includes('technical')) traits.push('technical');
        if (description.toLowerCase().includes('friendly')) traits.push('friendly');
        if (description.toLowerCase().includes('professional')) traits.push('professional');

        // If no specific traits found, analyze the general tone
        if (traits.length === 0) {
            if (description.toLowerCase().includes('expert')) traits.push('authoritative');
            if (description.toLowerCase().includes('help')) traits.push('supportive');
            if (description.toLowerCase().includes('learn')) traits.push('curious');
            if (description.toLowerCase().includes('collaborate')) traits.push('collaborative');
        }

        return traits.length > 0 ? traits.join(' and ') : 'adaptable and context-aware';
    }

    /**
     * Checks if a conversation has achieved its goal.
     * @param conversationId - ID of the conversation to check
     * @returns Promise resolving to true if goal is achieved
     * @private
     */
    private async checkGoalAchievement(conversationId: string): Promise<boolean> {
        if (!this.openai) {
            throw new Error('OpenAI client is not initialized');
        }

        const context = this.conversationContexts.get(conversationId);
        if (!context) throw new Error('Conversation context not found');

        const conversation = await this.conversationService.findById(conversationId);
        if (!conversation) throw new Error('Conversation not found');

        const messages = await this.conversationService.getConversationMessages(conversationId);
        
        // Convert message sender IDs to names
        const formattedMessages = messages.slice(-10).map(m => {
            const sender = context.participants.find(p => p.id === m.senderId);
            if (!sender) throw new Error(`Sender ${m.senderId} not found in conversation context`);
            return `${sender.name}: ${m.content}`;
        }).join('\n');

        const completion = await this.openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                {
                    role: 'system',
                    content: `You are evaluating if a conversation has reached its goal. The goal is: ${context.goal}`
                },
                {
                    role: 'user',
                    content: `Based on these messages, have the participants reached an agreement and achieved their goal?\n\nMessages:\n${formattedMessages}\n\nRespond with only 'yes' or 'no'.`
                }
            ]
        });

        const answer = completion.choices[0]?.message?.content?.toLowerCase() || 'no';
        return answer.includes('yes');
    }

    /**
     * Processes all active conversations in the system.
     * Handles message generation and goal checking.
     */
    async processActiveConversations(): Promise<void> {
        if (!this.isEnabled || !this.openai) {
            return;
        }

        try {
            const conversations = await this.conversationService.getAllConversations();
            const activeConversations = conversations.filter(c => c.status === 'active');

            for (const conversation of activeConversations) {
                const messages = await this.conversationService.getConversationMessages(conversation.id);
                if (messages.length === 0) {
                    // Start the conversation with a message from the first participant
                    const firstAgent = conversation.participants[0];
                    const agent = await this.agentRepository.findById(firstAgent);
                    if (!agent) continue;

                    await this.conversationService.addMessage({
                        conversationId: conversation.id,
                        senderId: firstAgent,
                        content: `As a ${agent.type}${agent.description ? ` who ${agent.description}` : ''}, I'd like to begin our discussion about ${conversation.topic}. Our goal is to ${conversation.goal}. Let's work together to achieve this.`,
                        recipients: 'all'
                    });
                } else {
                    const lastMessage = messages[messages.length - 1];
                    await this.processMessage(lastMessage, conversation);
                }
            }
        } catch (error) {
            await this.handleApiError(error);
        }
    }

    /**
     * Processes a single message in a conversation.
     * @param message - The message to process
     * @param conversation - The conversation context
     */
    async processMessage(message: Message, conversation: Conversation): Promise<void> {
        if (!this.isEnabled || !this.openai) {
            return;
        }

        try {
            let context = this.conversationContexts.get(conversation.id);
            
            if (!context) {
                await this.initializeConversation(conversation);
                context = this.conversationContexts.get(conversation.id);
                if (!context) throw new Error('Failed to initialize conversation context');
            }

            context.messageCount++;

            const messages = await this.conversationService.getConversationMessages(conversation.id);
            
            // Convert message sender IDs to names using the context participants
            const formattedMessages = messages.slice(-5).map(m => {
                const sender = context!.participants.find(p => p.id === m.senderId);
                if (!sender) throw new Error(`Sender ${m.senderId} not found in conversation context`);
                return {
                    role: 'user' as const,
                    content: `${sender.name}: ${m.content} (to: ${Array.isArray(m.recipients) ? m.recipients.join(', ') : 'all'})`
                };
            });

            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: await this.generateSystemPrompt(conversation.id)
                    },
                    ...formattedMessages
                ]
            });

            const content = completion.choices[0]?.message?.content;
            if (!content) throw new Error('No response from OpenAI');

            const [senderId, messageContent] = this.parseResponse(content, context.participants);
            
            await this.conversationService.addMessage({
                conversationId: conversation.id,
                senderId,
                content: messageContent,
                recipients: 'all'
            });

            if (context.messageCount % this.messageCheckThreshold === 0) {
                const goalAchieved = await this.checkGoalAchievement(conversation.id);
                if (goalAchieved) {
                    await this.conversationService.completeConversation(conversation.id, true);
                }
            }

            this.resetErrorCount();
        } catch (error) {
            await this.handleApiError(error);
        }
    }

    /**
     * Parses an AI response into content and recipient parts.
     * @param response - The raw AI response to parse
     * @param participants - Available conversation participants
     * @returns Tuple of [message content, recipient]
     * @private
     */
    private parseResponse(response: string, participants: ConversationContext['participants']): [string, string] {
        // Expected format: "AgentName: Message content"
        const match = response.match(/^([^:]+):\s*(.+)$/s);
        if (!match) throw new Error('Invalid response format');

        const [, agentName, content] = match;
        const agent = participants.find(p => 
            p.name.toLowerCase().trim() === agentName.toLowerCase().trim()
        );
        
        if (!agent) {
            const availableAgents = participants.map(p => p.name).join(', ');
            throw new Error(`Agent "${agentName}" not found in conversation. Available agents: ${availableAgents}`);
        }

        return [agent.id, content.trim()];
    }
} 