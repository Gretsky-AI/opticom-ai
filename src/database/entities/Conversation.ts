import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import { ConversationStatus } from '../../domain/models/conversation.js';
import { AgentEntity } from './Agent.js';
import { MessageEntity } from './Message.js';

@Entity('conversations')
export class ConversationEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    name: string;

    @Column()
    topic: string;

    @Column()
    goal: string;

    @Column()
    surrounding: string;

    @Column({
        type: 'text',
        enum: ['active', 'completed', 'terminated', 'paused']
    })
    status: ConversationStatus;

    @Column('simple-array')
    participants: string[];

    @OneToMany(() => MessageEntity, message => message.conversation)
    messages: MessageEntity[];

    @CreateDateColumn()
    startedAt: Date;

    @Column({ nullable: true })
    endedAt?: Date;

    @Column({ nullable: true })
    goalAchieved?: boolean;
} 