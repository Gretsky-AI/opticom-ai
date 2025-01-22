import { AgentService } from '../../../services/agentService.js';
import { ConversationService } from '../../../services/conversationService.js';
import { AgentRepository } from '../../../data/repositories/agentRepository.js';
import { ConversationRepository } from '../../../data/repositories/conversationRepository.js';
import chalk from 'chalk';
import { AgentType } from '../../../domain/models/agent.js';
import readline from 'readline';

// Sandbox data identifiers
const SANDBOX_AGENT_NAMES = [
    "Sophia", "Maxwell", "Iris", "Aria", "Leo", "Vera", "Eli"
];

const SANDBOX_CONVERSATION_NAMES = [
    "Design Dilemma", "Cybersecurity Framework"
];

export async function checkSandboxDataExists(): Promise<boolean> {
    const agentRepository = new AgentRepository();
    const conversationRepository = new ConversationRepository();
    const agentService = new AgentService(agentRepository);
    const conversationService = new ConversationService(conversationRepository, agentRepository);

    // Check if any sandbox agents exist
    const existingAgents = await agentService.getAllAgents();
    const hasSandboxAgents = SANDBOX_AGENT_NAMES.some(name => 
        existingAgents.some(agent => agent.name === name)
    );

    // Check if any sandbox conversations exist
    const existingConversations = await conversationService.getAllConversations();
    const hasSandboxConversations = SANDBOX_CONVERSATION_NAMES.some(name =>
        existingConversations.some(conv => conv.name === name)
    );

    return hasSandboxAgents || hasSandboxConversations;
}

export async function createSandboxData(): Promise<void> {
    const agentRepository = new AgentRepository();
    const conversationRepository = new ConversationRepository();
    const agentService = new AgentService(agentRepository);
    const conversationService = new ConversationService(conversationRepository, agentRepository);

    // Create example agents
    const agentConfigs = [
        {
            name: "Sophia",
            type: "learning" as AgentType,
            description: "Curious and adaptive, Sophia absorbs knowledge to tackle any challenge.",
            status: 'inactive' as const
        },
        {
            name: "Maxwell",
            type: "assistant" as AgentType,
            description: "Organized and reliable, Maxwell excels in streamlining daily tasks efficiently.",
            status: 'inactive' as const
        },
        {
            name: "Iris",
            type: "specialist" as AgentType,
            description: "A creative problem solver with deep expertise in design and user experience.",
            status: 'inactive' as const
        },
        {
            name: "Aria",
            type: "learning" as AgentType,
            description: "A fast learner who thrives on analyzing patterns and making data-driven decisions.",
            status: 'inactive' as const
        },
        {
            name: "Leo",
            type: "assistant" as AgentType,
            description: "Friendly and resourceful, Leo handles scheduling and reminders with ease.",
            status: 'inactive' as const
        },
        {
            name: "Vera",
            type: "specialist" as AgentType,
            description: "Focused on cybersecurity, Vera ensures data is protected from emerging threats.",
            status: 'inactive' as const
        },
        {
            name: "Eli",
            type: "learning" as AgentType,
            description: "Always curious, Eli enjoys diving into new topics to expand their expertise.",
            status: 'inactive' as const
        }
    ];

    const createdAgents = await Promise.all(
        agentConfigs.map(config => agentService.createAgent(config))
    );

    // Helper function to get agent IDs by names
    const getAgentIdsByNames = (names: string[]) => {
        return names.map(name => {
            const agent = createdAgents.find(a => a.name === name);
            if (!agent) throw new Error(`Agent ${name} not found`);
            return agent.id;
        });
    };

    // Create example conversations
    const conversations = [
        {
            name: "Design Dilemma",
            topic: "Discussing the best layout for a user-friendly dashboard interface",
            goal: "Agree on a design that balances functionality and aesthetic appeal",
            surrounding: "A virtual meeting room with a shared interactive whiteboard",
            participantIds: getAgentIdsByNames(["Iris", "Maxwell"])
        },
        {
            name: "Cybersecurity Framework",
            topic: "Creating a framework to secure data and prevent unauthorized access",
            goal: "Finalize a comprehensive security plan that minimizes vulnerabilities",
            surrounding: "A high-tech conference room with holographic displays showing real-time data",
            participantIds: getAgentIdsByNames(["Vera", "Sophia", "Leo"])
        }
    ];

    await Promise.all(
        conversations.map(conv => conversationService.createConversation(conv))
    );

    // Display creation summary
    console.clear();
    console.log(chalk.green('✓ Sandbox data created successfully!\n'));
    
    console.log(chalk.blue('Created Agents:'));
    createdAgents.forEach(agent => {
        const typeColor = agent.type === 'specialist' ? chalk.red : 
                         agent.type === 'assistant' ? chalk.blue : 
                         chalk.green;
        console.log(`- ${chalk.yellow(agent.name)}: ${typeColor(agent.type)} - ${agent.description}`);
    });

    console.log(chalk.blue('\nCreated Conversations:'));
    conversations.forEach(conv => {
        const participants = conv.participantIds
            .map(id => createdAgents.find(a => a.id === id)?.name)
            .filter(Boolean)
            .join(', ');
        console.log(`- ${chalk.yellow(conv.name)} (${chalk.cyan(participants)})`);
        console.log(`  ${chalk.gray('Goal:')} ${conv.goal}`);
        console.log(`  ${chalk.gray('Setting:')} ${chalk.italic(conv.surrounding)}\n`);
    });
    
    // Create readline interface for key press
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log(chalk.gray('Press Enter to continue...'));
    
    // Wait for Enter key
    await new Promise<void>(resolve => {
        rl.question('', () => {
            rl.close();
            resolve();
        });
    });
} 