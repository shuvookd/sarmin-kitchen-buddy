import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { AuthGuard } from "@/components/auth/AuthGuard";

interface Order {
  id: string;
  total_amount: number;
  status: string;
  delivery_address: string;
  phone: string;
  notes: string | null;
  created_at: string;
  order_items: Array<{
    quantity: number;
    price: number;
    food_items: {
      name: string;
    };
  }>;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const { data } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            quantity,
            price,
            food_items (
              name
            )
          )
        `)
        .order("created_at", { ascending: false });

      setOrders(data || []);
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500",
      confirmed: "bg-blue-500",
      preparing: "bg-purple-500",
      ready: "bg-green-500",
      delivered: "bg-green-700",
      cancelled: "bg-red-500",
    };
    return colors[status] || "bg-gray-500";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Header />

        <main className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">Your Orders</h1>

          {orders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">You haven't placed any orders yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          Order #{order.id.slice(0, 8)}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(order.created_at), "PPP 'at' p")}
                        </p>
                      </div>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Items:</h4>
                      <ul className="space-y-1">
                        {order.order_items.map((item, index) => (
                          <li key={index} className="text-sm">
                            {item.quantity}x {item.food_items.name} - ৳
                            {(Number(item.price) * item.quantity).toFixed(2)}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <p className="text-sm font-semibold">Delivery Address:</p>
                        <p className="text-sm text-muted-foreground">
                          {order.delivery_address}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Phone:</p>
                        <p className="text-sm text-muted-foreground">{order.phone}</p>
                      </div>
                      {order.notes && (
                        <div className="md:col-span-2">
                          <p className="text-sm font-semibold">Notes:</p>
                          <p className="text-sm text-muted-foreground">{order.notes}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t">
                      <span className="font-bold">Total Amount:</span>
                      <span className="text-xl font-bold text-primary">
                        ৳{Number(order.total_amount).toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
