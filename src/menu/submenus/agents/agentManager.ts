import inquirer from 'inquirer';
import { AgentMenuOption, AgentAction } from './types.js';
import { AgentService } from '../../../services/agentService.js';
import { AgentRepository } from '../../../data/repositories/agentRepository.js';
import { Agent, AgentType, AgentStatus } from '../../../domain/models/agent.js';
import chalk from 'chalk';
import { displayHeader } from '../../../utils/display.js';
import { conversationService } from '../../../services/serviceRegistry.js';

const agentService = new AgentService(new AgentRepository());

async function getAgentMenuOptions(): Promise<AgentMenuOption[]> {
    const agents = await agentService.getAllAgents();
    const agentCount = agents.length;

    return [
        {
            name: `👀 View Agents (${agentCount})`,
            value: 'view',
            description: 'View all available agents'
        },
        {
            name: '➕ Create Agent',
            value: 'create',
            description: 'Create a new agent'
        },
        {
            name: agentCount === 0 ? chalk.gray('🗑️ Delete Agent (No agents available)') : '🗑️ Delete Agent',
            value: 'delete',
            description: 'Delete an existing agent',
            disabled: agentCount === 0
        },
        {
            name: '↩️ Back to Main Menu',
            value: 'back',
            description: 'Return to main menu'
        }
    ];
}

async function viewAgentDetails(agent: Agent): Promise<void> {
    displayHeader();
    
    // Get statistics to find message count for this agent
    const stats = await conversationService.getStatistics();
    const agentMessages = stats.messagesByAgent.find(m => m.agentId === agent.id);
    const messageCount = agentMessages?.count || 0;
    
    console.log(chalk.cyan('\n=== Agent Details ==='));
    console.log(chalk.white(`ID: ${agent.id}`));
    console.log(chalk.white(`Name: ${chalk.bold(agent.name)}`));
    console.log(chalk.white(`Type: ${getTypeColor(agent.type as AgentType)}`));
    console.log(chalk.white(`Status: ${getStatusColor(agent.status)}`));
    console.log(chalk.white(`Description: ${agent.description ? chalk.italic(agent.description) : chalk.gray('No description provided')}`));
    console.log(chalk.white(`Created: ${chalk.yellow(agent.createdAt.toLocaleString())}`));
    console.log(chalk.white(`Total Messages Sent: ${chalk.cyan(messageCount)}`));
    
    await inquirer.prompt([
        {
            type: 'input',
            name: 'continue',
            message: chalk.dim('Press enter to go back...'),
        }
    ]);
}

// Color coding helpers
function getStatusColor(status: AgentStatus): string {
    return status === 'active' ? chalk.green(status) : chalk.gray(status);
}

function getTypeColor(type: AgentType): string {
    switch (type) {
        case 'learning':
            return chalk.blue(type);
        case 'assistant':
            return chalk.magenta(type);
        case 'specialist':
            return chalk.yellow(type);
        default:
            return chalk.white(type);
    }
}

async function viewAgents(): Promise<void> {
    displayHeader();
    const agents = await agentService.getAllAgents();
    
    if (agents.length === 0) {
        console.log(chalk.yellow('\n⚠️ No agents available.'));
        console.log(chalk.blue('Please create a new agent using the "Create Agent" option.'));
        
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
        console.log(chalk.cyan('\n=== Available Agents ===\n'));

        // Display agent status counters
        const activeCount = agents.filter(a => a.status === 'active').length;
        const inactiveCount = agents.filter(a => a.status === 'inactive').length;

        console.log(chalk.white(`Total: ${agents.length} | `) + 
            chalk.green(`Active: ${activeCount}`) + chalk.white(' | ') +
            chalk.gray(`Inactive: ${inactiveCount}`) + '\n');
        
        const choices = [
            ...agents.map(agent => ({
                name: `${chalk.bold(agent.name)} | ${getTypeColor(agent.type as AgentType)} | ${getStatusColor(agent.status)} | Created: ${chalk.yellow(agent.createdAt.toLocaleString())}`,
                value: agent.id
            })),
            { name: chalk.yellow('↩️  Back'), value: 'back' }
        ];

        const { selection } = await inquirer.prompt([
            {
                type: 'list',
                name: 'selection',
                message: 'Select an agent to view details or go back:',
                choices,
                pageSize: 10
            }
        ]);

        if (selection === 'back') {
            return;
        }

        const selectedAgent = agents.find(agent => agent.id === selection);
        if (selectedAgent) {
            await viewAgentDetails(selectedAgent);
        }
    }
}

async function createAgent(): Promise<void> {
    displayHeader();
    console.log(chalk.cyan('\n=== Create New Agent ===\n'));
    try {
        let nameIsUnique = false;
        let name = '';

        while (!nameIsUnique) {
            const nameAnswer = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'name',
                    message: 'Enter agent name (or type "cancel" to abort):',
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
                        message: chalk.yellow('\nAre you sure you want to cancel agent creation?'),
                        default: false
                    }
                ]);

                if (confirmCancel) {
                    console.log(chalk.blue('\nAgent creation cancelled.'));
                    return;
                }
                continue;
            }

            name = nameAnswer.name;
            
            try {
                const isNameTaken = await agentService.isNameTaken(name);
                if (isNameTaken) {
                    console.log(chalk.red(`\n❌ An agent with the name "${name}" already exists. Please choose a different name.`));
                    continue;
                }
                nameIsUnique = true;
            } catch (error) {
                console.error(chalk.red('\n❌ Error checking name availability:'), error);
                continue;
            }
        }

        // Get remaining agent details
        const remainingAnswers = await inquirer.prompt([
            {
                type: 'list',
                name: 'type',
                message: 'Select agent type:',
                choices: [
                    {
                        name: `${getTypeColor('learning')} - Curious and adaptable, focuses on gathering information and understanding different perspectives`,
                        value: 'learning'
                    },
                    {
                        name: `${getTypeColor('assistant')} - Helpful and supportive, aims to facilitate discussion and find common ground`,
                        value: 'assistant'
                    },
                    {
                        name: `${getTypeColor('specialist')} - Expert in their field, provides detailed insights and technical knowledge`,
                        value: 'specialist'
                    },
                    new inquirer.Separator(),
                    { name: chalk.yellow('Cancel agent creation'), value: 'cancel' }
                ]
            },
            {
                type: 'input',
                name: 'description',
                message: 'Enter agent description (optional, or type "cancel" to abort):',
                when: (answers) => answers.type !== 'cancel'
            }
        ]);

        if (remainingAnswers.type === 'cancel' || remainingAnswers.description?.toLowerCase() === 'cancel') {
            const { confirmCancel } = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'confirmCancel',
                    message: chalk.yellow('\nAre you sure you want to cancel agent creation?'),
                    default: false
                }
            ]);

            if (confirmCancel) {
                console.log(chalk.blue('\nAgent creation cancelled.'));
                return;
            } else {
                return await createAgent();
            }
        }

        const agent = await agentService.createAgent({
            name,
            type: remainingAnswers.type as AgentType,
            description: remainingAnswers.description || undefined
        });

        console.clear();
        console.log(chalk.green('\n✅ Agent created successfully!'));
        await viewAgentDetails(agent);

    } catch (error) {
        if (error instanceof Error) {
            console.error(chalk.red('\n❌ Failed to create agent:'), error.message);
        } else {
            console.error(chalk.red('\n❌ Failed to create agent: Unknown error'));
        }
        
        await inquirer.prompt([
            {
                type: 'input',
                name: 'continue',
                message: chalk.dim('Press enter to continue...'),
            }
        ]);
    }
}

async function deleteAgent(): Promise<void> {
    displayHeader();
    const agents = await agentService.getAllAgents();
    
    if (agents.length === 0) {
        console.log(chalk.yellow('\nNo agents available to delete.'));
        return;
    }

    const inactiveAgents = agents.filter(agent => agent.status === 'inactive');
    if (inactiveAgents.length === 0) {
        console.log(chalk.yellow('\n⚠️ All agents are currently active and cannot be deleted.'));
        console.log(chalk.blue('Please deactivate agents before attempting to delete them.'));
        await inquirer.prompt([
            {
                type: 'input',
                name: 'continue',
                message: chalk.dim('Press enter to continue...'),
            }
        ]);
        return;
    }

    const { agentId } = await inquirer.prompt([
        {
            type: 'list',
            name: 'agentId',
            message: 'Select agent to delete:',
            choices: [
                ...agents.map(agent => ({
                    name: `${chalk.bold(agent.name)} | ${getTypeColor(agent.type as AgentType)} | ${getStatusColor(agent.status)}`,
                    value: agent.id,
                    disabled: agent.status === 'active' ? 'Cannot delete active agent' : false
                })),
                { name: chalk.yellow('↩️  Back'), value: 'back' }
            ]
        }
    ]);

    if (agentId === 'back') {
        return;
    }

    // Double-check status before deletion (in case it changed)
    const agentToDelete = await agentService.findById(agentId);
    if (!agentToDelete) {
        console.error(chalk.red('\n❌ Agent not found.'));
        return;
    }

    if (agentToDelete.status === 'active') {
        console.error(chalk.red('\n❌ Cannot delete active agent.'));
        console.log(chalk.yellow('Please deactivate the agent first.'));
        return;
    }

    // Confirmation prompt
    const { confirm } = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'confirm',
            message: chalk.yellow(`\nAre you sure you want to delete agent "${chalk.bold(agentToDelete.name)}"?`),
            default: false
        }
    ]);

    if (!confirm) {
        console.log(chalk.blue('\nDeletion cancelled.'));
        return;
    }

    try {
        await agentService.deleteAgent(agentId);
        console.log(chalk.green('\n✅ Agent deleted successfully!'));
    } catch (error) {
        console.error(chalk.red('\n❌ Failed to delete agent:'), error);
    }
}

export async function showAgentMenu(): Promise<void> {
    while (true) {
        displayHeader();
        console.log(chalk.cyan('\n=== Agent Management ===\n'));
        const menuOptions = await getAgentMenuOptions();
        
        const { choice } = await inquirer.prompt<{ choice: AgentAction }>([
            {
                type: 'list',
                name: 'choice',
                message: 'Agent Management',
                choices: menuOptions.map(option => ({
                    name: `${option.name} - ${option.description}`,
                    value: option.value,
                    disabled: option.disabled
                }))
            }
        ]);

        if (choice === 'back') {
            return;
        }

        switch (choice) {
            case 'view':
                await viewAgents();
                break;
            case 'create':
                await createAgent();
                break;
            case 'delete':
                await deleteAgent();
                break;
        }
    }
}