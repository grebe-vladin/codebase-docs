import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Order } from './order.entity';
// Design choice: fulfilment runs in a queue so the HTTP request stays fast; retries live in the queue, not the browser.
@Injectable()
export class OrdersService {
  constructor(private readonly repo: Repository<Order>) {}
  list() { return this.repo.find(); }
  findOne(id: string) { return this.repo.findOneBy({ id }); }
  async create(dto: { customerId: string; total: number }) { const o = await this.repo.save({ ...dto, status: 'queued' }); return o; }
}
