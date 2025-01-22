import inquirer from 'inquirer';
import chalk from 'chalk';
import { conversationService } from '../../../services/serviceRegistry.js';
import { agentService } from '../../../services/serviceRegistry.js';
import { Conversation, ConversationStatus } from '../../../domain/models/conversation.js';
import { Agent } from '../../../domain/models/agent.js';
import { displayHeader } from '../../../utils/display.js';
import fs from 'fs';

async function hasEnoughInactiveAgents(): Promise<boolean> {
    const agents = await agentService.getAllAgents();
    const inactiveAgents = agents.filter((a: Agent) => a.status === 'inactive');
    return inactiveAgents.length >= 2;
}

async function viewConversationDetails(conversation: Conversation): Promise<void> {
    displayHeader();
    console.log(chalk.cyan('\n=== Conversation Details ==='));
    
    const statusColor = getStatusColor(conversation.status);
    
    // Fetch agent details to get names
    const agents = await agentService.getAllAgents();
    const participantNames = conversation.participants
        .map(participantId => {
            const agent = agents.find(a => a.id === participantId);
            return agent ? `${agent.name} (${agent.type})` : 'Unknown Agent';
        })
        .join('\n  - ');
    
    // Get message count
    const messages = await conversationService.getConversationMessages(conversation.id);
    
    console.log(chalk.white(`ID: ${conversation.id}`));
    console.log(chalk.white(`Name: ${chalk.bold(conversation.name)}`));
    console.log(chalk.white(`Topic: ${conversation.topic}`));
    console.log(chalk.white(`Goal: ${conversation.goal}`));
    console.log(chalk.white(`Surrounding: ${chalk.italic(conversation.surrounding)}`));
    console.log(chalk.white(`Status: ${statusColor(conversation.status)}`));
    console.log(chalk.white('Participants:'));
    console.log(chalk.white(`  - ${participantNames}`));
    console.log(chalk.white(`Messages: ${chalk.cyan(messages.length)}`));
    console.log(chalk.white(`Started: ${chalk.yellow(conversation.startedAt.toLocaleString())}`));
    
    await inquirer.prompt([
        {
            type: 'input',
            name: 'continue',
            message: chalk.dim('Press enter to go back...'),
        }
    ]);
}

async function viewConversations(): Promise<void> {
    displayHeader();
    const conversations = await conversationService.getAllConversations();
    
    if (conversations.length === 0) {
        console.log(chalk.yellow('\nNo conversations found.'));
        await pressEnterToContinue();
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
        
        // Get message counts for all conversations
        const messageCountsPromises = conversations.map(async (conv) => {
            const messages = await conversationService.getConversationMessages(conv.id);
            return { id: conv.id, count: messages.length };
        });
        const messageCounts = await Promise.all(messageCountsPromises);
        const messageCountMap = new Map(messageCounts.map(mc => [mc.id, mc.count]));

        const { selectedId } = await inquirer.prompt<{ selectedId: string }>([
            {
                type: 'list',
                name: 'selectedId',
                message: 'Select a conversation to view details or go back:',
                choices: [
                    ...conversations.map(c => ({
                        name: `${chalk.bold(c.name)} | ${c.participants.length} participants | ${chalk.cyan(messageCountMap.get(c.id))} messages | Status: ${getStatusColor(c.status)(c.status)} | Started: ${chalk.yellow(c.startedAt.toLocaleString())}`,
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

        const selectedConversation = conversations.find(conv => conv.id === selectedId);
        if (selectedConversation) {
            await viewConversationDetails(selectedConversation);
        }
    }
}

async function pressEnterToContinue(): Promise<void> {
    await inquirer.prompt([
        {
            type: 'input',
            name: 'continue',
            message: 'Press Enter to continue...',
        }
    ]);
}

function getStatusColor(status: ConversationStatus): (text: string) => string {
    switch (status) {
        case 'active':
            return chalk.green;
        case 'paused':
            return chalk.yellow;
        case 'completed':
            return chalk.blue;
        case 'terminated':
            return chalk.red;
        default:
            return chalk.white;
    }
}

async function createConversation(): Promise<void> {
    displayHeader();
    console.log(chalk.cyan('\n=== Create New Conversation ===\n'));

    try {
        // Get conversation name with cancel option
        let nameIsUnique = false;
        let name = '';

        while (!nameIsUnique) {
            const nameAnswer = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'name',
                    message: 'Enter conversation name (or type "cancel" to abort):',
                    validate: (input) => {
                        if (input.toLowerCase() === 'cancel') return true;
                        return input.length >= 3 || 'Name must be at least 3 characters long';
                    }
                }
            ]);

            if (nameAnswer.name.toLowerCase() === 'cancel') {
                const { confirmCancel } = await inquirer.prompt([
                    {
                        type: 'confirm',
                        name: 'confirmCancel',
                        message: chalk.yellow('\nAre you sure you want to cancel conversation creation?'),
                        default: false
                    }
                ]);

                if (confirmCancel) {
                    console.log(chalk.blue('\nConversation creation cancelled.'));
                    return;
                }
                continue;
            }

            name = nameAnswer.name;
            
            try {
                const isNameTaken = await conversationService.isNameTaken(name);
                if (isNameTaken) {
                    console.log(chalk.red(`\n❌ A conversation with the name "${name}" already exists. Please choose a different name.`));
                    continue;
                }
                nameIsUnique = true;
            } catch (error) {
                console.error(chalk.red('\n❌ Error checking name availability:'), error);
                continue;
            }
        }

        // Get remaining conversation details
        const remainingAnswers = await inquirer.prompt([
            {
                type: 'input',
                name: 'topic',
                message: 'Enter conversation topic (or type "cancel" to abort):',
                validate: (input) => {
                    if (input.toLowerCase() === 'cancel') return true;
                    return input.length >= 3 || 'Topic must be at least 3 characters long';
                }
            },
            {
                type: 'input',
                name: 'goal',
                message: 'Enter conversation goal (or type "cancel" to abort):',
                when: (answers) => answers.topic.toLowerCase() !== 'cancel',
                validate: (input) => {
                    if (input.toLowerCase() === 'cancel') return true;
                    return input.length >= 3 || 'Goal must be at least 3 characters long';
                }
            },
            {
                type: 'input',
                name: 'surrounding',
                message: 'Describe the surrounding environment (or type "cancel" to abort):',
                when: (answers) => answers.goal?.toLowerCase() !== 'cancel',
                validate: (input) => {
                    if (input.toLowerCase() === 'cancel') return true;
                    return input.length >= 3 || 'Surrounding description must be at least 3 characters long';
                }
            }
        ]);

        if (remainingAnswers.topic.toLowerCase() === 'cancel' || 
            remainingAnswers.goal?.toLowerCase() === 'cancel' ||
            remainingAnswers.surrounding?.toLowerCase() === 'cancel') {
            const { confirmCancel } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'confirmCancel',
                    message: chalk.yellow('\nAre you sure you want to cancel conversation creation?'),
                    default: false
                }
            ]);

            if (confirmCancel) {
                console.log(chalk.blue('\nConversation creation cancelled.'));
                return;
            } else {
                return await createConversation();
            }
        }

        const availableAgents = await agentService.getAllAgents();
        const inactiveAgents = availableAgents.filter((agent: Agent) => agent.status === 'inactive');
        
        if (inactiveAgents.length < 2) {
            console.log(chalk.yellow('\nNot enough inactive agents. You need at least 2 inactive agents.'));
            await pressEnterToContinue();
            return;
        }

        const { selectedAgents } = await inquirer.prompt({
            type: 'checkbox',
            name: 'selectedAgents',
            message: 'Select participants (minimum 2, or press Ctrl+C to cancel):',
            choices: [
                ...inactiveAgents.map((agent: Agent) => ({
                    name: `${agent.name} (${agent.type})`,
                    value: agent.id
                })),
                new inquirer.Separator(),
                { name: chalk.yellow('Cancel conversation creation'), value: 'cancel' }
            ],
            validate: (answer: any): boolean | string => {
                if (answer.includes('cancel')) return true;
                return (answer as string[]).length >= 2 || 'Please select at least 2 agents';
            }
        });

        if (selectedAgents.includes('cancel')) {
            const { confirmCancel } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'confirmCancel',
                    message: chalk.yellow('\nAre you sure you want to cancel conversation creation?'),
                    default: false
                }
            ]);

            if (confirmCancel) {
                console.log(chalk.blue('\nConversation creation cancelled.'));
                return;
            } else {
                return await createConversation();
            }
        }

        const conversation = await conversationService.createConversation({
            name,
            topic: remainingAnswers.topic,
            goal: remainingAnswers.goal,
            surrounding: remainingAnswers.surrounding,
            participantIds: selectedAgents
        });

        console.clear();
        console.log(chalk.green('\n✓ Conversation created successfully!'));
        await viewConversationDetails(conversation);

    } catch (error) {
        if (error instanceof Error) {
            console.error(chalk.red('\n❌ Failed to create conversation:'), error.message);
        } else {
            console.error(chalk.red('\n❌ Failed to create conversation: Unknown error'));
        }
        await pressEnterToContinue();
    }
}

async function terminateConversation(): Promise<void> {
    displayHeader();
    const conversations = await conversationService.getAllConversations();
    const terminableConversations = conversations.filter(c => c.status === 'active' || c.status === 'paused');
    
    if (terminableConversations.length === 0) {
        console.log(chalk.yellow('\n⚠️ No active or paused conversations available to terminate.'));
        console.log(chalk.blue('Only active or paused conversations can be terminated.'));
        
        await inquirer.prompt([
            {
                type: 'input',
                name: 'continue',
                message: chalk.dim('Press enter to continue...'),
            }
        ]);
        return;
    }

    while (true) {
        displayHeader();
        console.log(chalk.cyan('\n=== Terminate Conversation ===\n'));
        console.log(chalk.yellow('⚠️  Warning: Terminated conversations cannot be reactivated!\n'));
        
        const choices = [
            ...terminableConversations.map(conversation => ({
                name: `${chalk.bold(conversation.name)} | ${conversation.participants.length} participants | Status: ${getStatusColor(conversation.status)(conversation.status)} | Started: ${chalk.yellow(conversation.startedAt.toLocaleString())}`,
                value: conversation.id
            })),
            { name: chalk.yellow('↩️  Back'), value: 'back' }
        ];

        const { selection } = await inquirer.prompt([
            {
                type: 'list',
                name: 'selection',
                message: 'Select a conversation to terminate or go back:',
                choices,
                pageSize: 10
            }
        ]);

        if (selection === 'back') {
            return;
        }

        const selectedConversation = conversations.find(conv => conv.id === selection);
        if (selectedConversation) {
            // Ask for confirmation immediately
            const { confirm } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'confirm',
                    message: chalk.red(`\nAre you sure you want to terminate the conversation "${chalk.bold(selectedConversation.name)}"?\nThis action cannot be undone!`),
                    default: false
                }
            ]);

            if (confirm) {
                try {
                    await conversationService.terminateConversation(selectedConversation.id);
                    console.log(chalk.green('\n✓ Conversation terminated successfully!'));
                } catch (error) {
                    console.error(chalk.red('\n✗ Failed to terminate conversation:'), error);
                }
                await pressEnterToContinue();
                return;
            } else {
                console.log(chalk.blue('\nTermination cancelled.'));
                await pressEnterToContinue();
            }
        }
    }
}

async function pauseUnpauseConversation(): Promise<void> {
    displayHeader();
    const conversations = await conversationService.getAllConversations();
    const pausableConversations = conversations.filter(c => c.status === 'active' || c.status === 'paused');
    
    if (pausableConversations.length === 0) {
        console.log(chalk.yellow('\n⚠️ No active or paused conversations available.'));
        console.log(chalk.blue('Only active or paused conversations can be modified.'));
        
        await inquirer.prompt([
            {
                type: 'input',
                name: 'continue',
                message: chalk.dim('Press enter to continue...'),
            }
        ]);
        return;
    }

    while (true) {
        displayHeader();
        console.log(chalk.cyan('\n=== Pause/Unpause Conversation ===\n'));
        
        // Display conversation status counters
        const activeCount = pausableConversations.filter(c => c.status === 'active').length;
        const pausedCount = pausableConversations.filter(c => c.status === 'paused').length;

        console.log(chalk.white(`Available Conversations: ${pausableConversations.length} | `) + 
            chalk.green(`Active: ${activeCount}`) + chalk.white(' | ') +
            chalk.yellow(`Paused: ${pausedCount}`) + '\n');
        
        const choices = [
            ...pausableConversations.map(conversation => ({
                name: `${chalk.bold(conversation.name)} | ${conversation.participants.length} participants | Status: ${getStatusColor(conversation.status)(conversation.status)} | Started: ${chalk.yellow(conversation.startedAt.toLocaleString())}`,
                value: conversation.id
            })),
            { name: chalk.yellow('↩️  Back'), value: 'back' }
        ];

        const { selection } = await inquirer.prompt([
            {
                type: 'list',
                name: 'selection',
                message: 'Select a conversation to pause/unpause or go back:',
                choices,
                pageSize: 10
            }
        ]);

        if (selection === 'back') {
            return;
        }

        const selectedConversation = conversations.find(conv => conv.id === selection);
        if (selectedConversation) {
            try {
                if (selectedConversation.status === 'active') {
                    await conversationService.pauseConversation(selectedConversation.id);
                    console.log(chalk.green(`\n✓ Conversation "${selectedConversation.name}" has been paused.`));
                } else {
                    await conversationService.unpauseConversation(selectedConversation.id);
                    console.log(chalk.green(`\n✓ Conversation "${selectedConversation.name}" has been unpaused.`));
                }
                await pressEnterToContinue();
                return;
            } catch (error) {
                console.error(chalk.red('\n✗ Failed to modify conversation:'), error);
                await pressEnterToContinue();
            }
        }
    }
}

async function exportConversation(): Promise<void> {
    displayHeader();
    const conversations = await conversationService.getAllConversations();
    
    if (conversations.length === 0) {
        console.log(chalk.yellow('\n⚠️ No conversations found to export.'));
        await pressEnterToContinue();
        return;
    }

    // Show list of conversations
    const choices = [
        ...conversations.map(conversation => ({
            name: `${chalk.bold(conversation.name)} | ${conversation.participants.length} participants | Status: ${getStatusColor(conversation.status)(conversation.status)} | Started: ${chalk.yellow(conversation.startedAt.toLocaleString())}`,
            value: conversation.id
        })),
        { name: chalk.yellow('↩️  Back'), value: 'back' }
    ];

    const { selection } = await inquirer.prompt([
        {
            type: 'list',
            name: 'selection',
            message: 'Select a conversation to export:',
            choices,
            pageSize: 10
        }
    ]);

    if (selection === 'back') {
        return;
    }

    const selectedConversation = conversations.find(conv => conv.id === selection);
    if (selectedConversation) {
        try {
            // Get all messages
            const messages = await conversationService.getConversationMessages(selectedConversation.id);
            const agents = await agentService.getAllAgents();

            // Create downloads directory if it doesn't exist
            const downloadsDir = './downloads';
            if (!fs.existsSync(downloadsDir)) {
                fs.mkdirSync(downloadsDir);
            }

            // Format current date/time for filename
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `${downloadsDir}/${selectedConversation.name}_${timestamp}.txt`;

            // Format messages
            let content = `Conversation: ${selectedConversation.name}\n`;
            content += `Topic: ${selectedConversation.topic}\n`;
            content += `Goal: ${selectedConversation.goal}\n`;
            content += `Surrounding: ${selectedConversation.surrounding}\n`;
            content += `Status: ${selectedConversation.status}\n`;
            content += `Started: ${selectedConversation.startedAt.toLocaleString()}\n\n`;
            content += `Messages:\n\n`;

            for (const message of messages) {
                const sender = agents.find(a => a.id === message.senderId);
                const senderName = sender ? sender.name : 'Unknown Agent';

                // Convert recipient IDs to names
                let recipientNames = 'All Participants';
                if (Array.isArray(message.recipients)) {
                    recipientNames = message.recipients
                        .map(recipientId => {
                            const recipient = agents.find(a => a.id === recipientId);
                            return recipient ? recipient.name : 'Unknown Agent';
                        })
                        .join(', ');
                }

                content += `From: ${senderName}\n`;
                content += `To: ${recipientNames}\n`;
                content += `Message: ${message.content}\n\n`;
            }

            // Write to file
            fs.writeFileSync(filename, content);
            console.log(chalk.green(`\n✓ Conversation exported successfully to: ${filename}`));
        } catch (error) {
            console.error(chalk.red('\n✗ Failed to export conversation:'), error);
        }
        await pressEnterToContinue();
    }
}

const menuOptions = [
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
        name: '📥 Export Conversation',
        value: 'export',
        description: 'Export conversation messages to a file'
    },
    {
        name: '↩️ Back',
        value: 'back',
        description: 'Return to main menu'
    }
];

export async function showConversationMenu(): Promise<void> {
    while (true) {
        displayHeader();
        console.log(chalk.cyan('\n=== Conversation Management ===\n'));

        const hasEnough = await hasEnoughInactiveAgents();
        const { choice } = await inquirer.prompt<{ choice: string }>([
            {
                type: 'list',
                name: 'choice',
                message: 'What would you like to do?',
                choices: menuOptions.map(option => ({
                    name: option.value === 'create' && !hasEnough 
                        ? `${option.name} - ${option.description} ${chalk.gray('(Disabled: Need at least 2 inactive agents)')}`
                        : `${option.name} - ${option.description}`,
                    value: option.value,
                    disabled: option.value === 'create' && !hasEnough
                }))
            }
        ]);

        switch (choice) {
            case 'create':
                await createConversation();
                break;
            case 'view':
                await viewConversations();
                break;
            case 'pauseUnpause':
                await pauseUnpauseConversation();
                break;
            case 'pauseAll':
                await pauseAllConversations();
                break;
            case 'terminate':
                await terminateConversation();
                break;
            case 'export':
                await exportConversation();
                break;
            case 'back':
                return;
        }
    }
}

async function pauseAllConversations(): Promise<void> {
    const conversations = await conversationService.getAllConversations();
    const activeCount = conversations.filter((c: Conversation) => c.status === 'active').length;

    if (activeCount === 0) {
        console.log(chalk.yellow('\nNo active conversations to pause.'));
        await pressEnterToContinue();
        return;
    }

    const { confirm } = await inquirer.prompt<{ confirm: boolean }>([
        {
            type: 'confirm',
            name: 'confirm',
            message: `Are you sure you want to pause all active conversations (${activeCount} conversation${activeCount !== 1 ? 's' : ''})?`,
            default: false
        }
    ]);

    if (!confirm) {
        console.log(chalk.yellow('\nOperation cancelled.'));
        await pressEnterToContinue();
        return;
    }

    try {
        await conversationService.pauseAllConversations();
        console.log(chalk.green(`\n✓ Successfully paused ${activeCount} conversation${activeCount !== 1 ? 's' : ''}.`));
    } catch (error) {
        console.error(chalk.red('\n✗ Failed to pause conversations:'), error);
    }

    await pressEnterToContinue();
} 