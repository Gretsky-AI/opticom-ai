import { OpenAIService } from './openaiService.js';
import { config } from '../config/env.js';
import { conversationService } from './serviceRegistry.js';

export class BackgroundService {
    private intervalId?: NodeJS.Timeout;
    private isProcessing = false;
    private readonly processInterval: number;
    private lastMessageTime: Map<string, number> = new Map();

    constructor(private openAIService: OpenAIService) {
        this.processInterval = config.AGENT_RESPONSE_INTERVAL;
    }

    start(): void {
        if (this.intervalId) {
            return; // Already running
        }

        this.intervalId = setInterval(async () => {
            if (this.isProcessing) {
                return; // Skip if still processing previous iteration
            }

            this.isProcessing = true;
            try {
                await this.processConversations();
            } catch (error) {
                console.error('Error processing conversations:', error);
            } finally {
                this.isProcessing = false;
            }
        }, Math.min(1000, this.processInterval)); // Check at least every second
    }

    private async processConversations(): Promise<void> {
        const now = Date.now();
        
        try {
            const conversations = await conversationService.getAllConversations();
            const activeConversations = conversations.filter(c => c.status === 'active');
            
            for (const conversation of activeConversations) {
                const lastTime = this.lastMessageTime.get(conversation.id) || 0;
                const timeSinceLastMessage = now - lastTime;

                // If enough time has passed since the last message
                if (timeSinceLastMessage >= this.processInterval) {
                    const messages = await conversationService.getConversationMessages(conversation.id);
                    
                    if (messages.length === 0) {
                        // Start the conversation with a message from the first participant
                        await this.openAIService.processActiveConversations();
                        this.lastMessageTime.set(conversation.id, now);
                    } else {
                        const lastMessage = messages[messages.length - 1];
                        await this.openAIService.processMessage(lastMessage, conversation);
                        this.lastMessageTime.set(conversation.id, now);
                    }
                }
            }
        } catch (error) {
            console.error('Error in processConversations:', error);
        }
    }

    stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = undefined;
            this.lastMessageTime.clear();
        }
    }
} 