import chalk from 'chalk';
import { OpenAIService } from '../services/openaiService.js';

export function displayStatusWarning(): void {
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
} 