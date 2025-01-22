import inquirer from 'inquirer';
import { showAgentMenu } from './submenus/agents/agentManager.js';
import { showConversationMenu } from './submenus/conversations/conversationManager.js';
import { showStatistics } from './submenus/statistics/statisticsManager.js';
import { showAILogs } from './submenus/statistics/aiLogsManager.js';
import { showHelp } from './help.js';
import { showAbout } from './about.js';
import { createSandboxData, checkSandboxDataExists } from './submenus/sandbox/sandboxManager.js';
import chalk from 'chalk';
import { getOptiComBanner } from '../utils/banner.js';
import { MainMenuOption } from '../types/menu.js';
import { OpenAIService } from '../services/openaiService.js';

export async function showMainMenu(): Promise<void> {
    while (true) {
        console.clear();
        console.log(getOptiComBanner());
        console.log(chalk.cyan('=== OptiCom Main Menu ==='));
        
        // Get OpenAI service instance from the global scope
        const openaiService = (global as any).openaiService as OpenAIService;
        const aiStatus = openaiService?.getStatus();
        
        if (aiStatus?.isEnabled) {
            console.log(chalk.green('AI: Enabled ✓'));
        } else {
            console.log(chalk.red('AI: Disabled ✗'));
            if (aiStatus?.reason) {
                console.log(chalk.white(aiStatus.reason));
                console.log(chalk.blue('You can still manage your agents and conversations, but automated communication is disabled.'));
            }
        }
        console.log(); // Empty line for spacing

        const sandboxExists = await checkSandboxDataExists();
        
        const { option } = await inquirer.prompt<{ option: MainMenuOption }>([
            {
                type: 'list',
                name: 'option',
                message: 'What would you like to do?',
                choices: [
                    {
                        name: `${chalk.green('👥')} Agent Management - Create, view, and manage agents`,
                        value: 'agents'
                    },
                    {
                        name: `${chalk.blue('💬')} Conversation Management - Create and manage conversations between agents`,
                        value: 'conversations'
                    },
                    {
                        name: `${chalk.magenta('📊')} Statistics - View system statistics and analytics`,
                        value: 'statistics'
                    },
                    {
                        name: `${chalk.yellow('🎮')} Add Sandbox Data - Create example agents and conversations`,
                        value: 'sandbox',
                        disabled: sandboxExists ? 'Sandbox data already exists' : false
                    },
                    {
                        name: `${chalk.cyan('📝')} AI Logs - View AI communication logs`,
                        value: 'logs'
                    },
                    {
                        name: `${chalk.blue('❓')} Help - View help information`,
                        value: 'help'
                    },
                    {
                        name: `${chalk.gray('ℹ️')} About - View information about OptiCom`,
                        value: 'about'
                    },
                    {
                        name: `${chalk.red('✖')} Exit`,
                        value: 'exit'
                    }
                ]
            }
        ]);

        switch (option) {
            case 'agents':
                await showAgentMenu();
                break;
            case 'conversations':
                await showConversationMenu();
                break;
            case 'statistics':
                await showStatistics();
                break;
            case 'logs':
                await showAILogs();
                break;
            case 'help':
                await showHelp();
                break;
            case 'about':
                await showAbout();
                break;
            case 'sandbox':
                await createSandboxData();
                break;
            case 'exit':
                console.clear();
                return;
        }
    }
} 