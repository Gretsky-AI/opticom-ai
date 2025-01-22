import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { AgentEntity } from './Agent.js';

@Entity('messages')
export class MessageEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('text')
    content: string;

    @Column('simple-array')
    recipients: string[];

    @ManyToOne(() => AgentEntity)
    @JoinColumn({ name: 'senderId' })
    sender: AgentEntity;

    @Column()
    senderId: string;

    @ManyToOne('ConversationEntity', 'messages')
    @JoinColumn({ name: 'conversationId' })
    conversation: any;

    @Column()
    conversationId: string;

    @CreateDateColumn()
    timestamp: Date;
} 