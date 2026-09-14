'use client';
import { createOrder } from '@/lib/api/orders';
export default function NewOrderPage() { return <form onSubmit={async e => { e.preventDefault(); const f = new FormData(e.currentTarget); await createOrder({ customerId: String(f.get('customerId')), total: Number(f.get('total')) }); }}><input name="customerId" /><input name="total" type="number" /><button>Save & send</button></form>; }
