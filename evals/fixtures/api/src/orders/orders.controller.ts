import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtGuard } from '../auth/jwt.guard';

@Controller('orders')
@UseGuards(JwtGuard)
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}
  @Get() list() { return this.orders.list(); }
  @Post() create(@Body() dto: CreateOrderDto) { return this.orders.create(dto); }
  @Get(':id') one(@Param('id') id: string) { return this.orders.findOne(id); }
}
