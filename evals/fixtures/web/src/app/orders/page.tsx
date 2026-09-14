'use client';
import { useQuery } from '@tanstack/react-query';
import { listOrders } from '@/lib/api/orders';
export default function OrdersPage() { const q = useQuery({ queryKey: ['orders'], queryFn: listOrders, refetchInterval: 3000 }); return <ul>{(q.data ?? []).map((o: any) => <li key={o.id}>{o.customerId} — {o.status}</li>)}</ul>; }
