export interface ConversationContext {
    topic: string;
    goal: string;
    surrounding: string;
    participants: {
        id: string;
        name: string;
        type: string;
        description?: string;
    }[];
    messageCount: number;
}

export interface OpenAIServiceStatus {
    isEnabled: boolean;
    reason: string | null;
} 