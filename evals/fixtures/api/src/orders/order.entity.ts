import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
@Entity('orders')
export class Order { @PrimaryGeneratedColumn('uuid') id: string; @Column() customerId: string; @Column('int') total: number; @Column({ default: 'queued' }) status: 'queued' | 'done' | 'failed'; }
