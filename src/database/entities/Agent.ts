import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { AgentType, AgentStatus } from '../../domain/models/agent.js';

@Entity('agents')
export class AgentEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    name: string;

    @Column({
        type: 'text',
        enum: ['learning', 'assistant', 'specialist']
    })
    type: AgentType;

    @Column({
        type: 'text',
        enum: ['active', 'inactive'],
        default: 'inactive'
    })
    status: AgentStatus;

    @Column({
        type: 'text',
        nullable: true
    })
    description: string;

    @CreateDateColumn()
    createdAt: Date;
}