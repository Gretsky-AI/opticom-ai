/**
 * Represents an AI agent in the OptiCom system.
 * @interface Agent
 */
export interface Agent {
    /** Unique identifier for the agent */
    id: string;
    /** Name of the agent */
    name: string;
    /** Type of the agent (learning, assistant, or specialist) */
    type: string;
    /** Optional description of the agent's capabilities and purpose */
    description?: string;
    /** Current status of the agent (active or inactive) */
    status: 'active' | 'inactive';
    /** Timestamp when the agent was created */
    createdAt: Date;
}

/** Status options for an agent */
export type AgentStatus = 'active' | 'inactive';

/**
 * Types of agents available in the system.
 * - learning: Agents that adapt and improve over time
 * - assistant: Task-focused agents for specific operations
 * - specialist: Expert agents with deep domain knowledge
 */
export type AgentType = 'learning' | 'assistant' | 'specialist'; 