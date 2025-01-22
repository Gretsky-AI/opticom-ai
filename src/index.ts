import { showMainMenu } from './menu/mainMenu.js';
import { initializeDatabase } from './database/initialize.js';
import { OpenAIService } from './services/openaiService.js';
import { BackgroundService } from './services/backgroundService.js';
import { ConversationService } from './services/conversationService.js';
import { ConversationRepository } from './data/repositories/conversationRepository.js';
import { AgentRepository } from './data/repositories/agentRepository.js';
import { config } from './config/env.js';
import chalk from 'chalk';

declare global {
    var openaiService: OpenAIService;
}

async function main() {
    try {
        // Initialize database
        await initializeDatabase();

        // Initialize repositories
        const conversationRepo = new ConversationRepository();
        const agentRepo = new AgentRepository();

        // Initialize services
        const conversationService = new ConversationService(conversationRepo, agentRepo);
        global.openaiService = new OpenAIService(
            config.OPENAI_API_KEY,
            conversationService,
            agentRepo
        );

        // Check OpenAI service status
        const aiStatus = global.openaiService.getStatus();
        if (!aiStatus.isEnabled) {
            console.log(chalk.yellow('\n⚠️ Warning: Limited Functionality'));
            console.log(chalk.white(aiStatus.reason || 'OpenAI service is disabled.'));
            console.log(chalk.blue('You can still manage agents and conversations, but agents cannot communicate.'));
            console.log(chalk.blue('To enable agent communication, please fix the issue and restart the application.\n'));
        }

        const backgroundService = new BackgroundService(global.openaiService);

        // Start background processing
        backgroundService.start();

        // Show main menu
        await showMainMenu();

        // Stop background processing before exit
        backgroundService.stop();
        process.exit(0);
    } catch (error) {
        console.error('Failed to start application:', error);
        process.exit(1);
    }
}

// Handle Ctrl+C
process.on('SIGINT', () => {
    console.log(chalk.yellow('\n👋 Goodbye!'));
    process.exit(0);
});

main();
