export interface MenuOption {
    name: string;
    value: string;
    description: string;
    disabled?: boolean;
}

export type MainMenuAction = 'conversations' | 'agents' | 'help' | 'exit' | 'sandbox'; 