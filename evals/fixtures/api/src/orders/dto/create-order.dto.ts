import { IsInt, IsString, Min } from 'class-validator';
export class CreateOrderDto { @IsString() customerId: string; @IsInt() @Min(1) total: number; }
