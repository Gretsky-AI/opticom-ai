import inquirer from 'inquirer';
import chalk from 'chalk';
import { conversationService } from '../../../services/serviceRegistry.js';
import { agentService } from '../../../services/serviceRegistry.js';
import { Agent } from '../../../domain/models/agent.js';
import { displayHeader } from '../../../utils/display.js';

export async function showStatistics(): Promise<void> {
    displayHeader();
    console.log(chalk.cyan('\n=== System Statistics ===\n'));

    try {
        // Get all statistics
        const stats = await conversationService.getStatistics();
        const agents = await agentService.getAllAgents();

        // Agent Statistics
        console.log(chalk.bold('\n📊 Agent Statistics'));
        console.log(chalk.white(`Total Agents: ${agents.length}`));
        console.log(chalk.white(`Active Agents: ${agents.filter((a: Agent) => a.status === 'active').length}`));
        console.log(chalk.white(`Inactive Agents: ${agents.filter((a: Agent) => a.status === 'inactive').length}`));

        // Conversation Statistics
        console.log(chalk.bold('\n💬 Conversation Statistics'));
        console.log(chalk.white(`Total Conversations: ${stats.conversationStats.total}`));
        console.log(chalk.white(`Active: ${chalk.green(stats.conversationStats.active)}`));
        console.log(chalk.white(`Paused: ${chalk.yellow(stats.conversationStats.paused)}`));
        console.log(chalk.white(`Completed: ${chalk.blue(stats.conversationStats.completed)}`));
        console.log(chalk.white(`Terminated: ${chalk.red(stats.conversationStats.terminated)}`));

        // Message Statistics
        console.log(chalk.bold('\n✉️ Message Statistics'));
        console.log(chalk.white(`Total Messages: ${stats.totalMessages}`));

        // Top Agents by Messages
        if (stats.messagesByAgent.length > 0) {
            console.log(chalk.bold('\n🏆 Most Active Messaging Agents'));
            stats.messagesByAgent.slice(0, 3).forEach((agent, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
                console.log(chalk.white(`${medal} ${chalk.bold(agent.name)}: ${agent.count} messages`));
            });
        }

        // Top Agents by Conversations
        if (stats.conversationsByAgent.length > 0) {
            console.log(chalk.bold('\n👥 Most Social Agents'));
            stats.conversationsByAgent.slice(0, 3).forEach((agent, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
                console.log(chalk.white(`${medal} ${chalk.bold(agent.name)}: ${agent.count} conversations`));
            });
        }

    } catch (error) {
        console.error(chalk.red('\n❌ Error fetching statistics:'), error);
    }

    // Wait for user input before returning
    await inquirer.prompt([{
        type: 'input',
        name: 'continue',
        message: chalk.dim('\nPress enter to go back to main menu...')
    }]);
} 