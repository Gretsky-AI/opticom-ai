import { Conversation, ConversationStatus } from '../domain/models/conversation.js';
import { Message } from '../domain/models/message.js';
import { Agent } from '../domain/models/agent.js';
import { IConversationRepository } from '../data/repositories/conversationRepository.js';
import { IAgentRepository } from '../data/repositories/agentRepository.js';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { displayHeader } from '../utils/display.js';

/**
 * Data transfer object for creating a new conversation.
 * @interface CreateConversationDTO
 */
export interface CreateConversationDTO {
    /** Name/title of the conversation */
    name: string;
    /** Main topic to be discussed */
    topic: string;
    /** Desired outcome or objective */
    goal: string;
    /** Context or environment description */
    surrounding: string;
    /** IDs of agents to participate in the conversation */
    participantIds: string[];
}

/**
 * Data transfer object for adding a message to a conversation.
 * @interface AddMessageDTO
 */
export interface AddMessageDTO {
    /** ID of the conversation to add the message to */
    conversationId: string;
    /** ID of the agent sending the message */
    senderId: string;
    /** Content of the message */
    content: string;
    /** Recipients of the message ('all' for group message, or specific agent IDs) */
    recipients: 'all' | string[];
}

/**
 * Menu option interface for conversation management.
 * @interface MenuOption
 */
interface MenuOption {
    /** Display name of the option */
    name: string;
    /** Value identifier for the option */
    value: string;
    /** Description of what the option does */
    description: string;
}

/**
 * Available menu options for conversation management.
 */
const menuOptions: MenuOption[] = [
    {
        name: '➕ Create Conversation',
        value: 'create',
        description: 'Create a new conversation between agents'
    },
    {
        name: '👁️ View Conversations',
        value: 'view',
        description: 'View all conversations'
    },
    {
        name: '⏯️ Pause/Unpause Conversation',
        value: 'pauseUnpause',
        description: 'Pause or unpause a specific conversation'
    },
    {
        name: '⏸️ Pause All Conversations',
        value: 'pauseAll',
        description: 'Pause all active conversations'
    },
    {
        name: '🛑 Terminate Conversation',
        value: 'terminate',
        description: 'Permanently terminate a conversation'
    },
    {
        name: '↩️ Back',
        value: 'back',
        description: 'Return to main menu'
    }
];

/**
 * Service class for managing conversations between AI agents.
 * Handles conversation creation, monitoring, and state management.
 */
export class ConversationService {
    /**
     * Creates an instance of ConversationService.
     * @param repository - Repository for conversation data persistence
     * @param agentRepository - Repository for agent data access
     */
    constructor(
        private repository: IConversationRepository,
        private agentRepository: IAgentRepository
    ) {}

    /**
     * Retrieves all conversations from the system.
     * @returns Promise resolving to an array of all conversations
     */
    async getAllConversations(): Promise<Conversation[]> {
        return await this.repository.findAll();
    }

    /**
     * Finds a conversation by its unique identifier.
     * @param id - The unique identifier of the conversation
     * @returns Promise resolving to the conversation if found, null otherwise
     */
    async findById(id: string): Promise<Conversation | null> {
        return await this.repository.findById(id);
    }

    /**
     * Checks if an agent is currently participating in any active conversation.
     * @param agentId - The ID of the agent to check
     * @returns Promise resolving to true if agent is in an active conversation
     * @private
     */
    private async isAgentInActiveConversation(agentId: string): Promise<boolean> {
        const conversations = await this.repository.findAll();
        return conversations.some(conversation => 
            conversation.status === 'active' && 
            conversation.participants.includes(agentId)
        );
    }

    /**
     * Checks if a conversation name is already taken.
     * @param name - The name to check for uniqueness
     * @returns Promise resolving to true if name is taken, false otherwise
     */
    async isNameTaken(name: string): Promise<boolean> {
        const conversation = await this.repository.findByName(name);
        return conversation !== null;
    }

    /**
     * Creates a new conversation between agents.
     * @param data - The conversation creation data
     * @returns Promise resolving to the created conversation
     * @throws Error if name is taken, invalid participant count, or agents not available
     */
    async createConversation(data: CreateConversationDTO): Promise<Conversation> {
        // Validate name uniqueness
        const isNameTaken = await this.isNameTaken(data.name);
        if (isNameTaken) {
            throw new Error('A conversation with this name already exists');
        }

        // Validate participant count
        if (data.participantIds.length < 2 || data.participantIds.length > 10) {
            throw new Error('A conversation must have between 2 and 10 participants');
        }

        // Check if any participant is not inactive
        for (const participantId of data.participantIds) {
            const agent = await this.agentRepository.findById(participantId);
            if (!agent) {
                throw new Error(`Agent ${participantId} not found`);
            }
            if (agent.status !== 'inactive') {
                throw new Error(`Agent ${agent.name} is not inactive and cannot be added to a new conversation`);
            }
        }

        // Create the conversation
        const conversation = await this.repository.create({
            name: data.name,
            topic: data.topic,
            goal: data.goal,
            surrounding: data.surrounding,
            participants: data.participantIds,
            status: 'active',
            messages: [],
            startedAt: new Date(),
            endedAt: undefined,
            goalAchieved: false
        });

        // Set all participating agents to active
        for (const participantId of data.participantIds) {
            await this.agentRepository.update(participantId, {
                status: 'active'
            });
        }

        // Show conversation details
        console.log(chalk.green('\n✅ Conversation created successfully!'));
        await this.viewConversationDetails(conversation);

        return conversation;
    }

    /**
     * Adds a new message to an existing conversation.
     * @param data - The message data to add
     * @returns Promise resolving to the created message
     * @throws Error if conversation not found, not active, or invalid participants
     */
    async addMessage(data: AddMessageDTO): Promise<Message> {
        const conversation = await this.repository.findById(data.conversationId);
        if (!conversation) {
            throw new Error('Conversation not found');
        }

        if (conversation.status !== 'active') {
            throw new Error('Cannot add message to a non-active conversation');
        }

        // Validate sender is a participant
        if (!conversation.participants.includes(data.senderId)) {
            throw new Error('Sender is not a participant in this conversation');
        }

        // Validate recipients
        if (data.recipients !== 'all') {
            // Check if all recipients are participants
            const invalidRecipients = data.recipients.filter(
                id => !conversation.participants.includes(id)
            );
            if (invalidRecipients.length > 0) {
                throw new Error(`Invalid recipients: ${invalidRecipients.join(', ')}`);
            }
        }

        const message = await this.repository.addMessage(
            data.conversationId,
            {
                conversationId: data.conversationId,
                senderId: data.senderId,
                content: data.content,
                recipients: data.recipients === 'all' ? conversation.participants : data.recipients,
                timestamp: new Date()
            } as Message
        );

        return message;
    }

    /**
     * Marks a conversation as completed with goal achievement status.
     * @param id - The ID of the conversation to complete
     * @param goalAchieved - Whether the conversation's goal was achieved
     * @returns Promise resolving to the updated conversation
     * @throws Error if conversation not found or not active
     */
    async completeConversation(id: string, goalAchieved: boolean): Promise<Conversation> {
        const conversation = await this.repository.findById(id);
        if (!conversation) {
            throw new Error('Conversation not found');
        }

        if (conversation.status !== 'active') {
            throw new Error('Conversation is not active');
        }

        // Set all participating agents to inactive
        for (const participantId of conversation.participants) {
            await this.agentRepository.update(participantId, {
                status: 'inactive'
            });
        }

        const updatedConversation = await this.repository.update(id, {
            status: 'completed',
            endedAt: new Date(),
            goalAchieved
        });

        if (!updatedConversation) {
            throw new Error('Failed to complete conversation');
        }

        return updatedConversation;
    }

    /**
     * Temporarily pauses an active conversation.
     * @param id - The ID of the conversation to pause
     * @returns Promise resolving to the updated conversation
     * @throws Error if conversation not found or not active
     */
    async pauseConversation(id: string): Promise<Conversation> {
        const conversation = await this.repository.findById(id);
        if (!conversation) {
            throw new Error('Conversation not found');
        }
        if (conversation.status !== 'active') {
            throw new Error('Only active conversations can be paused');
        }

        // Note: We keep agents active when paused
        const updatedConversation = await this.repository.update(id, { status: 'paused' });
        if (!updatedConversation) {
            throw new Error('Failed to pause conversation');
        }
        return updatedConversation;
    }

    /**
     * Pauses all currently active conversations in the system.
     * @returns Promise resolving when all conversations are paused
     */
    async pauseAllConversations(): Promise<void> {
        const conversations = await this.repository.findAll();
        const activeConversations = conversations.filter(c => c.status === 'active');
        
        for (const conversation of activeConversations) {
            // Note: We keep agents active when paused
            await this.repository.update(conversation.id, { status: 'paused' });
        }
    }

    /**
     * Resumes a paused conversation.
     * @param id - The ID of the conversation to unpause
     * @returns Promise resolving to the updated conversation
     * @throws Error if conversation not found or not paused
     */
    async unpauseConversation(id: string): Promise<Conversation> {
        const conversation = await this.repository.findById(id);
        if (!conversation) {
            throw new Error('Conversation not found');
        }

        if (conversation.status !== 'paused') {
            throw new Error('Only paused conversations can be unpaused');
        }

        // Note: Agents are already active from when the conversation was first created
        const updatedConversation = await this.repository.update(id, {
            status: 'active',
        });

        if (!updatedConversation) {
            throw new Error('Failed to unpause conversation');
        }

        return updatedConversation;
    }

    /**
     * Permanently terminates a conversation before completion.
     * @param id - The ID of the conversation to terminate
     * @returns Promise resolving to the updated conversation
     * @throws Error if conversation not found or not in terminable state
     */
    async terminateConversation(id: string): Promise<Conversation> {
        const conversation = await this.repository.findById(id);
        if (!conversation) {
            throw new Error('Conversation not found');
        }

        if (conversation.status !== 'active' && conversation.status !== 'paused') {
            throw new Error('Only active or paused conversations can be terminated');
        }

        // Set all participating agents to inactive
        for (const participantId of conversation.participants) {
            await this.agentRepository.update(participantId, {
                status: 'inactive'
            });
        }

        const updatedConversation = await this.repository.update(id, {
            status: 'terminated',
            endedAt: new Date(),
            goalAchieved: false
        });

        if (!updatedConversation) {
            throw new Error('Failed to terminate conversation');
        }

        return updatedConversation;
    }

    /**
     * Retrieves all messages from a specific conversation.
     * @param id - The ID of the conversation
     * @returns Promise resolving to array of messages
     * @throws Error if conversation not found
     */
    async getConversationMessages(id: string): Promise<Message[]> {
        const conversation = await this.repository.findById(id);
        if (!conversation) {
            throw new Error('Conversation not found');
        }

        return await this.repository.getMessages(id);
    }

    /**
     * Gets all agents that are available to join new conversations.
     * @returns Promise resolving to array of available agents
     */
    async getAvailableAgents(): Promise<Agent[]> {
        const allAgents = await this.agentRepository.findAll();
        const activeConversations = await this.repository.findAll();
        
        // Get all agent IDs that are in active conversations
        const busyAgentIds = new Set(
            activeConversations
                .filter(conv => conv.status === 'active')
                .flatMap(conv => conv.participants)
        );
        
        // Return only agents that are not in any active conversation and are inactive
        return allAgents.filter(agent => 
            !busyAgentIds.has(agent.id) && 
            agent.status === 'inactive'
        );
    }

    /**
     * Displays detailed information about a conversation.
     * @param conversation - The conversation to display details for
     */
    async viewConversationDetails(conversation: Conversation): Promise<void> {
        console.clear();
        console.log(chalk.cyan('\n=== Conversation Details ==='));
        console.log(chalk.white(`ID: ${conversation.id}`));
        console.log(chalk.white(`Name: ${chalk.bold(conversation.name)}`));
        console.log(chalk.white(`Topic: ${chalk.italic(conversation.topic)}`));
        console.log(chalk.white(`Goal: ${chalk.yellow(conversation.goal)}`));
        console.log(chalk.white(`Surrounding: ${chalk.italic(conversation.surrounding)}`));
        console.log(chalk.white(`Status: ${this.getStatusColor(conversation.status)}`));
        console.log(chalk.white(`Participants: ${conversation.participants.length}`));
        console.log(chalk.white(`Started: ${chalk.yellow(conversation.startedAt.toLocaleString())}`));
        if (conversation.endedAt) {
            console.log(chalk.white(`Ended: ${chalk.yellow(conversation.endedAt.toLocaleString())}`));
        }
        if (conversation.goalAchieved !== undefined) {
            console.log(chalk.white(`Goal Achieved: ${conversation.goalAchieved ? chalk.green('Yes') : chalk.red('No')}`));
        }
        
        await inquirer.prompt([
            {
                type: 'input',
                name: 'continue',
                message: chalk.dim('Press enter to continue...'),
            }
        ]);
    }

    /**
     * Gets the chalk color for a conversation status.
     * @param status - The status to get color for
     * @returns Colored status string
     * @private
     */
    private getStatusColor(status: ConversationStatus): string {
        switch (status) {
            case 'active':
                return chalk.green(status);
            case 'completed':
                return chalk.blue(status);
            case 'terminated':
                return chalk.red(status);
            case 'paused':
                return chalk.yellow(status);
            default:
                return chalk.white(status);
        }
    }

    /**
     * Retrieves statistical information about conversations and messages.
     * @returns Promise resolving to statistics object
     */
    async getStatistics(): Promise<{
        totalMessages: number;
        messagesByAgent: { agentId: string; name: string; count: number }[];
        conversationsByAgent: { agentId: string; name: string; count: number }[];
        conversationStats: {
            total: number;
            active: number;
            paused: number;
            completed: number;
            terminated: number;
        };
    }> {
        const conversations = await this.repository.findAll();
        const messages = await Promise.all(
            conversations.map(conv => this.repository.getMessages(conv.id))
        );
        const allMessages = messages.flat();

        // Count messages by agent
        const messageCountByAgent = new Map<string, number>();
        allMessages.forEach(msg => {
            messageCountByAgent.set(msg.senderId, (messageCountByAgent.get(msg.senderId) || 0) + 1);
        });

        // Count conversations by agent
        const conversationCountByAgent = new Map<string, number>();
        conversations.forEach(conv => {
            conv.participants.forEach(agentId => {
                conversationCountByAgent.set(agentId, (conversationCountByAgent.get(agentId) || 0) + 1);
            });
        });

        // Get agent details for the counts
        const agents = await this.agentRepository.findAll();
        const agentMap = new Map(agents.map(agent => [agent.id, agent]));

        const messagesByAgent = Array.from(messageCountByAgent.entries())
            .map(([agentId, count]) => ({
                agentId,
                name: agentMap.get(agentId)?.name || 'Unknown Agent',
                count
            }))
            .sort((a, b) => b.count - a.count);

        const conversationsByAgent = Array.from(conversationCountByAgent.entries())
            .map(([agentId, count]) => ({
                agentId,
                name: agentMap.get(agentId)?.name || 'Unknown Agent',
                count
            }))
            .sort((a, b) => b.count - a.count);

        return {
            totalMessages: allMessages.length,
            messagesByAgent,
            conversationsByAgent,
            conversationStats: {
                total: conversations.length,
                active: conversations.filter(c => c.status === 'active').length,
                paused: conversations.filter(c => c.status === 'paused').length,
                completed: conversations.filter(c => c.status === 'completed').length,
                terminated: conversations.filter(c => c.status === 'terminated').length
            }
        };
    }

    /**
     * Checks if there are enough inactive agents to start a conversation.
     * @returns Promise resolving to true if enough agents are available
     * @private
     */
    private async hasEnoughInactiveAgents(): Promise<boolean> {
        const agents = await this.agentRepository.findAll();
        const inactiveAgents = agents.filter(agent => agent.status === 'inactive');
        return inactiveAgents.length >= 2;
    }

    /**
     * Shows the main conversation management menu.
     */
    async showConversationMenu(): Promise<void> {
        while (true) {
            displayHeader();
            console.log(chalk.cyan('\n=== Conversation Management ===\n'));

            const hasEnough = await this.hasEnoughInactiveAgents();
            const conversations = await this.getAllConversations();
            
            // Check conditions for menu options
            const hasConversations = conversations.length > 0;
            const hasActiveConversations = conversations.some((c: Conversation) => c.status === 'active');
            const hasActivePausedConversations = conversations.some((c: Conversation) => 
                c.status === 'active' || c.status === 'paused'
            );
            const hasPausableOrUnpausableConversations = conversations.some((c: Conversation) => 
                c.status === 'active' || c.status === 'paused'
            );

            const { choice } = await inquirer.prompt<{ choice: string }>([
                {
                    type: 'list',
                    name: 'choice',
                    message: 'What would you like to do?',
                    choices: menuOptions.map(option => ({
                        name: `${option.name} - ${option.description}`,
                        value: option.value,
                        disabled: (
                            (option.value === 'create' && !hasEnough) ||
                            (option.value === 'pauseUnpause' && !hasPausableOrUnpausableConversations) ||
                            (option.value === 'pauseAll' && (!hasConversations || !hasActiveConversations)) ||
                            (option.value === 'terminate' && !hasActivePausedConversations)
                        )
                    }))
                }
            ]);

            switch (choice) {
                case 'create': {
                    const data = await this.promptForConversationData();
                    if (data) {
                        await this.createConversation(data);
                    }
                    break;
                }
                case 'view':
                    await this.viewConversations();
                    break;
                case 'pauseUnpause':
                    await this.handlePauseUnpause();
                    break;
                case 'pauseAll':
                    await this.pauseAllConversations();
                    break;
                case 'terminate': {
                    const selectedId = await this.promptForConversationSelection();
                    if (selectedId) {
                        await this.terminateConversation(selectedId);
                    }
                    break;
                }
                case 'back':
                    return;
            }
        }
    }

    /**
     * Prompts user for conversation creation data.
     * @returns Promise resolving to conversation data or null if cancelled
     * @private
     */
    private async promptForConversationData(): Promise<CreateConversationDTO | null> {
        // Implementation of conversation data collection
        // This should be moved from createConversation to here
        // For now, return null to satisfy the type checker
        return null;
    }

    /**
     * Prompts user to select a conversation.
     * @returns Promise resolving to selected conversation ID or null if cancelled
     * @private
     */
    private async promptForConversationSelection(): Promise<string | null> {
        const conversations = await this.getAllConversations();
        const terminableConversations = conversations.filter(c => 
            c.status === 'active' || c.status === 'paused'
        );

        if (terminableConversations.length === 0) {
            console.log(chalk.yellow('\nNo conversations available.'));
            await this.pressEnterToContinue();
            return null;
        }

        const { selectedId } = await inquirer.prompt<{ selectedId: string }>([
            {
                type: 'list',
                name: 'selectedId',
                message: 'Select a conversation:',
                choices: [
                    ...terminableConversations.map(c => ({
                        name: `${c.name} (${c.status})`,
                        value: c.id
                    })),
                    { name: 'Cancel', value: 'cancel' }
                ]
            }
        ]);

        return selectedId === 'cancel' ? null : selectedId;
    }

    /**
     * Handles the pause/unpause conversation workflow.
     * @private
     */
    private async handlePauseUnpause(): Promise<void> {
        const conversations = await this.getAllConversations();
        const availableConversations = conversations.filter(c => 
            c.status === 'active' || c.status === 'paused'
        );

        if (availableConversations.length === 0) {
            console.log(chalk.yellow('\nNo conversations available to pause/unpause.'));
            await this.pressEnterToContinue();
            return;
        }

        const { selectedId } = await inquirer.prompt<{ selectedId: string }>([
            {
                type: 'list',
                name: 'selectedId',
                message: 'Select a conversation to pause/unpause:',
                choices: [
                    ...availableConversations.map(c => ({
                        name: `${c.name} (${c.status})`,
                        value: c.id
                    })),
                    { name: 'Cancel', value: 'cancel' }
                ]
            }
        ]);

        if (selectedId === 'cancel') {
            return;
        }

        const conversation = availableConversations.find(c => c.id === selectedId);
        if (conversation) {
            if (conversation.status === 'active') {
                await this.pauseConversation(selectedId);
            } else {
                await this.unpauseConversation(selectedId);
            }
        }
    }

    /**
     * Utility function to wait for user input.
     * @private
     */
    private async pressEnterToContinue(): Promise<void> {
        await inquirer.prompt([
            {
                type: 'input',
                name: 'continue',
                message: chalk.dim('Press enter to continue...'),
            }
        ]);
    }

    /**
     * Shows the conversation viewing interface.
     * Displays all conversations with their current status and allows viewing details.
     * @private
     */
    private async viewConversations(): Promise<void> {
        const conversations = await this.getAllConversations();
        
        if (conversations.length === 0) {
            console.log(chalk.yellow('\nNo conversations found.'));
            await this.pressEnterToContinue();
            return;
        }

        while (true) {
            displayHeader();
            console.log(chalk.cyan('\n=== Available Conversations ===\n'));
            
            // Display conversation status counters
            const activeCount = conversations.filter(c => c.status === 'active').length;
            const pausedCount = conversations.filter(c => c.status === 'paused').length;
            const completedCount = conversations.filter(c => c.status === 'completed').length;
            const terminatedCount = conversations.filter(c => c.status === 'terminated').length;

            console.log(chalk.white(`Total: ${conversations.length} | `) + 
                chalk.green(`Active: ${activeCount}`) + chalk.white(' | ') +
                chalk.yellow(`Paused: ${pausedCount}`) + chalk.white(' | ') +
                chalk.blue(`Completed: ${completedCount}`) + chalk.white(' | ') +
                chalk.red(`Terminated: ${terminatedCount}`) + '\n');
            
            const { selectedId } = await inquirer.prompt<{ selectedId: string }>([
                {
                    type: 'list',
                    name: 'selectedId',
                    message: 'Select a conversation to view details or go back:',
                    choices: [
                        ...conversations.map(c => ({
                            name: `${chalk.bold(c.name)} | ${c.participants.length} participants | Status: ${this.getStatusColor(c.status)} | Started: ${chalk.yellow(c.startedAt.toLocaleString())}`,
                            value: c.id
                        })),
                        { name: chalk.yellow('↩️  Back'), value: 'back' }
                    ],
                    pageSize: 10
                }
            ]);

            if (selectedId === 'back') {
                return;
            }

            const selectedConversation = conversations.find(c => c.id === selectedId);
            if (selectedConversation) {
                await this.viewConversationDetails(selectedConversation);
            }
        }
    }
} 