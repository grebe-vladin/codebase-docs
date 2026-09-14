const base = process.env.NEXT_PUBLIC_API_URL!;
export const listOrders = () => fetch(`${base}/orders`).then(r => r.json());
export const getOrder = (id: string) => fetch(`${base}/orders/${id}`).then(r => r.json());
export const createOrder = (body: { customerId: string; total: number }) => fetch(`${base}/orders`, { method: 'POST', body: JSON.stringify(body) }).then(r => r.json());
