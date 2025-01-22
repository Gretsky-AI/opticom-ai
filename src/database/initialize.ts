import 'reflect-metadata';
import { AppDataSource } from './config.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDevelopment = process.env.NODE_ENV !== 'production';

export async function initializeDatabase() {
    // Create data directory if it doesn't exist
    const dataDir = path.join(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    const dbPath = path.join(dataDir, 'database.sqlite');
    const dbExists = fs.existsSync(dbPath);

    try {
        // Check if database is already initialized
        if (AppDataSource.isInitialized) {
            console.log('Database connection already established.');
            return AppDataSource;
        }

        // Initialize the database connection
        await AppDataSource.initialize();
        
        // Ensure database schema is created/updated
        await AppDataSource.synchronize();
        
        if (dbExists) {
            isDevelopment && console.log('Connected to existing database.');
        } else {
            isDevelopment && console.log('Database created and initialized successfully!');
        }
        
        return AppDataSource;
    } catch (error) {
        console.error('Error during database initialization:', error);
        throw error;
    }
} 