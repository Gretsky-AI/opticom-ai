import chalk from 'chalk';
import { displayHeader } from '../utils/display.js';
import readline from 'readline';

export async function showHelp(): Promise<void> {
    displayHeader();
    console.log(chalk.cyan('=== OptiCom Help Guide ===\n'));

    // Application Overview
    console.log(chalk.yellow('📱 Application Overview'));
    console.log('OptiCom is an AI agent management system that allows you to create, manage, and orchestrate');
    console.log('conversations between different types of AI agents. Each agent has unique characteristics');
    console.log('and capabilities based on their type.\n');

    // Agent Types
    console.log(chalk.yellow('🤖 Agent Types'));
    console.log(`${chalk.green('Learning')}    - Adaptive agents that grow and learn from interactions`);
    console.log(`${chalk.blue('Assistant')}   - Task-focused agents that excel at specific operations`);
    console.log(`${chalk.red('Specialist')}  - Expert agents with deep knowledge in particular domains\n`);

    // Main Features
    console.log(chalk.yellow('🎯 Main Features'));
    console.log(`${chalk.bold('1. Agent Management')}`);
    console.log('   - Create new agents with custom names and descriptions');
    console.log('   - View and modify existing agents');
    console.log('   - Monitor agent status and performance\n');

    console.log(`${chalk.bold('2. Conversation Management')}`);
    console.log('   - Create conversations between multiple agents');
    console.log('   - Set conversation goals and topics');
    console.log('   - Monitor conversation progress and outcomes');
    console.log('   - Export conversations to readable text files');
    console.log('   - Review exported conversations in your preferred text editor\n');

    console.log(`${chalk.bold('3. Statistics & Analytics')}`);
    console.log('   - View system-wide performance metrics');
    console.log('   - Track agent interactions and success rates');
    console.log('   - Monitor resource usage and efficiency\n');

    console.log(`${chalk.bold('4. AI Logs')}`);
    console.log('   - Review detailed communication logs');
    console.log('   - Track AI decision-making processes');
    console.log('   - Debug agent interactions\n');

    console.log(`${chalk.bold('5. Sandbox Environment')}`);
    console.log('   - Explore pre-configured example agents');
    console.log('   - View sample conversations and interactions');
    console.log('   - Learn best practices through examples\n');

    // Quick Tips
    console.log(chalk.yellow('💡 Quick Tips'));
    console.log('1. Start with the sandbox data to understand the system');
    console.log('2. Create specialized agents for specific tasks');
    console.log('3. Group complementary agents in conversations');
    console.log('4. Monitor AI logs for insights into agent behavior');
    console.log('5. Use statistics to optimize agent performance');
    console.log('6. Export important conversations for offline review or sharing\n');

    // Navigation
    console.log(chalk.yellow('🎮 Navigation'));
    console.log('- Use arrow keys to navigate menus');
    console.log('- Press Enter to select an option');
    console.log('- Follow on-screen prompts for input\n');

    console.log(chalk.gray('Press Enter to return to the main menu...'));
    
    // Create readline interface for key press
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    // Wait for Enter key
    await new Promise<void>(resolve => {
        rl.question('', () => {
            rl.close();
            resolve();
        });
    });
} 