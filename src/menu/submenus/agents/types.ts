export interface AgentMenuOption {
    name: string;
    value: string;
    description: string;
    disabled?: boolean;
}

export interface Agent {
    id: string;
    name: string;
    type: string;
    status: 'active' | 'inactive';
    createdAt: Date;
}

export type AgentAction = 'view' | 'create' | 'delete' | 'back'; 