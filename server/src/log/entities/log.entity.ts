import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('logs')
export class Log {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', length: 50 })
  source: string; // e.g., 'frontend', 'backend', 'service-name'

  @Column({ type: 'varchar', length: 20 })
  level: string; // e.g., 'info', 'warn', 'error', 'debug'

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>; // Optional additional data

  @CreateDateColumn({ type: 'timestamptz' })
  timestamp: Date;
}
