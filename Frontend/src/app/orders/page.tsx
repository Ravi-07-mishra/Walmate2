import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const orders = [
    {
        id: 'ORD-2024-00128',
        date: 'July 15, 2024',
        status: 'Delivered',
        total: 8498,
        items: [
            { name: 'Classic Denim Jacket', quantity: 1, price: 3499 },
            { name: 'Urban Leather Boots', quantity: 1, price: 4999 },
        ]
    },
    {
        id: 'ORD-2024-00115',
        date: 'June 28, 2024',
        status: 'Shipped',
        total: 4198,
        items: [
            { name: 'Striped Cotton Shirt', quantity: 1, price: 2199 },
            { name: 'Minimalist Canvas Tote', quantity: 1, price: 1999 },
        ]
    },
    {
        id: 'ORD-2024-00102',
        date: 'May 10, 2024',
        status: 'Delivered',
        total: 1899,
        items: [
            { name: 'Retro Round Eyeglasses', quantity: 1, price: 1899 },
        ]
    }
]

export default function OrdersPage() {
  return (
    <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">My Orders</h1>
        <div className="space-y-4">
            {orders.map(order => (
                <Card key={order.id}>
                    <CardHeader className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-sm font-semibold">Order ID</p>
                            <p className="text-muted-foreground">{order.id}</p>
                        </div>
                        <div>
                            <p className="text-sm font-semibold">Date</p>
                            <p className="text-muted-foreground">{order.date}</p>
                        </div>
                        <div>
                            <p className="text-sm font-semibold">Total</p>
                            <p className="text-muted-foreground">₹{order.total.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="flex items-center">
                            <Badge variant={order.status === 'Delivered' ? 'secondary' : 'default'} className={order.status === 'Delivered' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : ''}>
                                {order.status}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Separator className="my-4"/>
                        <p className="font-semibold mb-2">Items:</p>
                        <ul className="list-disc list-inside text-muted-foreground">
                            {order.items.map(item => (
                                <li key={item.name}>{item.quantity} x {item.name}</li>
                            ))}
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline">View Details</Button>
                        <Button variant="ghost" className="ml-2">Track Order</Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
    </div>
  );
}
