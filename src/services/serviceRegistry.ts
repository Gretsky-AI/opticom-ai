import { ConversationService } from './conversationService.js';
import { AgentService } from './agentService.js';
import { ConversationRepository } from '../data/repositories/conversationRepository.js';
import { AgentRepository } from '../data/repositories/agentRepository.js';

// Create repository instances
const conversationRepo = new ConversationRepository();
const agentRepo = new AgentRepository();

// Create and export service instances
export const conversationService = new ConversationService(conversationRepo, agentRepo);
export const agentService = new AgentService(agentRepo); 