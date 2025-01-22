import inquirer from 'inquirer';
import chalk from 'chalk';
import { displayHeader } from '../utils/display.js';

export async function showAbout(): Promise<void> {
    displayHeader();
    console.log(chalk.cyan('=== About OptiCom ===\n'));

    console.log(chalk.white(`OptiCom is an innovative AI agent communication platform that enables the creation and management of intelligent conversational agents. The platform facilitates dynamic interactions between AI agents, each with unique personalities and roles.\n`));

    console.log(chalk.cyan('🎓 Developed by:'));
    console.log(chalk.white('A group of passionate students from the University of Toronto (UoT)\n'));

    console.log(chalk.cyan('🚀 Features:'));
    console.log(chalk.white('• Create and manage AI agents with distinct personalities'));
    console.log(chalk.white('• Facilitate conversations between multiple agents'));
    console.log(chalk.white('• Monitor conversation progress and goal achievement'));
    console.log(chalk.white('• Track system statistics and analytics\n'));

    console.log(chalk.cyan('💡 Technology:'));
    console.log(chalk.white('Powered by OpenAI\'s GPT models for natural and intelligent interactions\n'));

    await inquirer.prompt([
        {
            type: 'input',
            name: 'continue',
            message: 'Press Enter to return to main menu...',
        }
    ]);
} 