import { DataSource } from 'typeorm';
import { AgentEntity } from './entities/Agent.js';
import { MessageEntity } from './entities/Message.js';
import { ConversationEntity } from './entities/Conversation.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDevelopment = config.NODE_ENV === 'development';

export const AppDataSource = new DataSource({
    type: 'sqlite',
    database: path.join(__dirname, '../../', config.DATABASE_URL),
    entities: [AgentEntity, MessageEntity, ConversationEntity],
    synchronize: true,
    logging: isDevelopment ? ['query', 'error'] : ['error'],
    logger: isDevelopment ? 'advanced-console' : 'simple-console',
    // Better SQLite specific options
    extra: {
        // Enable WAL mode for better concurrent access
        pragma: [
            'PRAGMA journal_mode = WAL',
            'PRAGMA busy_timeout = 5000',
            'PRAGMA foreign_keys = ON'
        ]
    }
}); 