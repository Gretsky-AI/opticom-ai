import { Agent } from './agent.js';

/**
 * Represents a message within a conversation.
 * @interface Message
 */
export interface Message {
    /** Unique identifier for the message */
    id: string;
    /** ID of the conversation this message belongs to */
    conversationId: string;
    /** ID of the agent who sent the message */
    senderId: string;
    /** Content of the message */
    content: string;
    /** Recipients of the message ('all' for group message, or specific agent IDs) */
    recipients: 'all' | string[];
    /** Timestamp when the message was sent */
    timestamp: Date;
}

/**
 * Represents a conversation between AI agents.
 * @interface Conversation
 */
export interface Conversation {
    /** Unique identifier for the conversation */
    id: string;
    /** Name/title of the conversation */
    name: string;
    /** Main topic being discussed */
    topic: string;
    /** Desired outcome or objective */
    goal: string;
    /** Context or environment description */
    surrounding: string;
    /** Current status of the conversation */
    status: ConversationStatus;
    /** IDs of agents participating in the conversation */
    participants: string[];
    /** List of messages exchanged in the conversation */
    messages: Message[];
    /** Timestamp when the conversation started */
    startedAt: Date;
    /** Optional timestamp when the conversation ended */
    endedAt?: Date;
    /** Whether the conversation's goal was achieved */
    goalAchieved?: boolean;
}

/**
 * Data transfer object for creating a new conversation.
 * @interface CreateConversationDTO
 */
export interface CreateConversationDTO {
    /** Name/title of the conversation */
    name: string;
    /** Main topic to be discussed */
    topic: string;
    /** Desired outcome or objective */
    goal: string;
    /** Context or environment description */
    surrounding: string;
    /** IDs of agents to participate in the conversation */
    participantIds: string[];
}

/**
 * Status options for a conversation.
 * - active: Conversation is ongoing
 * - completed: Conversation finished successfully
 * - terminated: Conversation ended prematurely
 * - paused: Conversation temporarily suspended
 */
export type ConversationStatus = 'active' | 'completed' | 'terminated' | 'paused'; 