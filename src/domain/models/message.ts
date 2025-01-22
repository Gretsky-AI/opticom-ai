export interface Message {
    id: string;
    content: string;
    senderId: string;
    recipients: string[];
    conversationId: string;
    timestamp: Date;
} 