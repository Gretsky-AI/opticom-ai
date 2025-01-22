import { Agent, AgentType, AgentStatus } from '../domain/models/agent.js';
import { IAgentRepository } from '../data/repositories/agentRepository.js';

/**
 * Data transfer object for creating a new agent.
 * @interface CreateAgentDTO
 */
export interface CreateAgentDTO {
    /** Name of the agent (must be unique and at least 3 characters) */
    name: string;
    /** Type of the agent (learning, assistant, or specialist) */
    type: AgentType;
    /** Initial status of the agent (defaults to 'inactive') */
    status?: AgentStatus;
    /** Optional description of the agent's capabilities */
    description?: string;
}

/**
 * Service class for managing AI agents in the system.
 * Handles agent creation, retrieval, updates, and deletion.
 */
export class AgentService {
    /**
     * Creates an instance of AgentService.
     * @param repository - The repository implementation for agent data persistence
     */
    constructor(private repository: IAgentRepository) {}

    /**
     * Retrieves all agents from the system.
     * @returns Promise resolving to an array of all agents
     */
    async getAllAgents(): Promise<Agent[]> {
        return await this.repository.findAll();
    }

    /**
     * Finds an agent by their unique identifier.
     * @param id - The unique identifier of the agent
     * @returns Promise resolving to the agent if found, null otherwise
     */
    async findById(id: string): Promise<Agent | null> {
        return await this.repository.findById(id);
    }

    /**
     * Checks if an agent name is already taken.
     * @param name - The name to check for uniqueness
     * @returns Promise resolving to true if name is taken, false otherwise
     */
    async isNameTaken(name: string): Promise<boolean> {
        const existingAgent = await this.repository.findByName(name);
        return !!existingAgent;
    }

    /**
     * Creates a new agent in the system.
     * @param data - The agent creation data transfer object
     * @returns Promise resolving to the created agent
     * @throws Error if name is invalid or already taken
     */
    async createAgent(data: CreateAgentDTO): Promise<Agent> {
        // Business logic validation
        if (!data.name || data.name.length < 3) {
            throw new Error('Agent name must be at least 3 characters long');
        }

        // Check name uniqueness
        const isNameTaken = await this.isNameTaken(data.name);
        if (isNameTaken) {
            throw new Error('An agent with this name already exists');
        }

        const agent = await this.repository.create({
            name: data.name,
            type: data.type,
            status: data.status || 'inactive',
            description: data.description
        });

        return agent;
    }

    /**
     * Deletes an agent from the system.
     * @param id - The unique identifier of the agent to delete
     * @returns Promise resolving to true if deletion was successful
     * @throws Error if agent is not found or cannot be deleted
     */
    async deleteAgent(id: string): Promise<boolean> {
        const agent = await this.repository.findById(id);
        if (!agent) {
            throw new Error('Agent not found');
        }

        // Business logic: Check if agent can be deleted
        if (agent.status === 'active') {
            throw new Error('Cannot delete an active agent');
        }

        return await this.repository.delete(id);
    }

    async activateAgent(id: string): Promise<Agent> {
        const agent = await this.repository.findById(id);
        if (!agent) {
            throw new Error('Agent not found');
        }

        const updatedAgent = await this.repository.update(id, { status: 'active' });
        if (!updatedAgent) {
            throw new Error('Failed to activate agent');
        }

        return updatedAgent;
    }

    async deactivateAgent(id: string): Promise<Agent> {
        const agent = await this.repository.findById(id);
        if (!agent) {
            throw new Error('Agent not found');
        }

        const updatedAgent = await this.repository.update(id, { status: 'inactive' });
        if (!updatedAgent) {
            throw new Error('Failed to deactivate agent');
        }

        return updatedAgent;
    }

    async updateAgentDescription(id: string, description: string): Promise<Agent> {
        const agent = await this.repository.findById(id);
        if (!agent) {
            throw new Error('Agent not found');
        }

        const updatedAgent = await this.repository.update(id, { description });
        if (!updatedAgent) {
            throw new Error('Failed to update agent description');
        }

        return updatedAgent;
    }
} 