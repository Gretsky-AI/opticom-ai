export type MainMenuOption = 'agents' | 'conversations' | 'statistics' | 'logs' | 'help' | 'about' | 'sandbox' | 'exit';

export interface MenuOption {
    name: string;
    value: MainMenuOption;
    description: string;
} 