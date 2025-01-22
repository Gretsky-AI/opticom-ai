import inquirer from 'inquirer';
import chalk from 'chalk';
import { displayHeader } from '../../../utils/display.js';
import { conversationService, agentService } from '../../../services/serviceRegistry.js';

export async function showAILogs(): Promise<void> {
    displayHeader();
    console.log(chalk.cyan('\n=== AI Logs ===\n'));

    try {
        // Get all conversations
        const conversations = await conversationService.getAllConversations();
        const agents = await agentService.getAllAgents();

        // Process each conversation
        for (const conversation of conversations) {
            const messages = await conversationService.getConversationMessages(conversation.id);
            
            if (messages.length > 0) {
                console.log(chalk.bold(`\n${chalk.blue(conversation.name)}`));
                
                for (const message of messages) {
                    // Get sender name
                    const sender = agents.find(a => a.id === message.senderId);
                    const senderName = sender ? sender.name : 'Unknown Agent';

                    // Get recipient names
                    let recipientNames = 'All Participants';
                    if (Array.isArray(message.recipients)) {
                        recipientNames = message.recipients
                            .map(recipientId => {
                                const recipient = agents.find(a => a.id === recipientId);
                                return recipient ? recipient.name : 'Unknown Agent';
                            })
                            .join(', ');
                    }

                    // Get first 10 words of message
                    const previewWords = message.content.split(' ').slice(0, 10).join(' ');
                    const preview = previewWords + (message.content.split(' ').length > 10 ? '...' : '');

                    // Format and display the log entry
                    console.log(chalk.white(`${chalk.green(senderName)} → ${chalk.yellow(recipientNames)}`));
                    console.log(chalk.dim(preview));
                    console.log(chalk.gray('─'.repeat(50)));
                }
            }
        }

        if (conversations.length === 0 || conversations.every(c => c.messages?.length === 0)) {
            console.log(chalk.yellow('\nNo messages found in any conversations.'));
        }

    } catch (error) {
        console.error(chalk.red('\n❌ Error fetching AI logs:'), error);
    }

    // Wait for user input before returning
    await inquirer.prompt([{
        type: 'input',
        name: 'continue',
        message: chalk.dim('\nPress enter to go back to main menu...')
    }]);
} 