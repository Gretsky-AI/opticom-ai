import * as dotenv from 'dotenv';
import { z } from 'zod';
import chalk from 'chalk';

// Load environment variables
try {
    const result = dotenv.config();
    if (result.error) {
        console.warn(chalk.yellow('⚠️ No .env file found. Using default configuration.'));
    }
} catch (error) {
    console.warn(chalk.yellow('⚠️ Error loading .env file:', error));
}

// Define environment schema
const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    DATABASE_URL: z.string().default('sqlite:database.sqlite'),
    OPENAI_API_KEY: z.string().optional(),
    AGENT_RESPONSE_INTERVAL: z.string()
        .transform(val => parseInt(val, 10))
        .refine(val => !isNaN(val) && val > 0, {
            message: 'AGENT_RESPONSE_INTERVAL must be a positive number'
        })
        .optional()
        .default('1000'),
    GOAL_CHECK_INTERVAL: z.string()
        .transform(val => parseInt(val, 10))
        .refine(val => !isNaN(val) && val > 0, {
            message: 'GOAL_CHECK_INTERVAL must be a positive number'
        })
        .optional()
        .default('50')
});

// Parse and validate environment variables
export const config = envSchema.parse(process.env);

// Export type for use in other files
export type Config = z.infer<typeof envSchema>; 