import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AuthGuard } from "@/components/auth/AuthGuard";

interface CartItem {
  id: string;
  quantity: number;
  food_items: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
  };
}

export default function CartPage() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCart();
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("address, phone")
        .eq("id", user.id)
        .single();

      if (profile) {
        setDeliveryAddress(profile.address || "");
        setPhone(profile.phone || "");
      }
    }
  };

  const loadCart = async () => {
    try {
      const { data } = await supabase
        .from("cart_items")
        .select(`
          id,
          quantity,
          food_items (
            id,
            name,
            price,
            image_url
          )
        `);

      setCartItems(data || []);
    } catch (error) {
      console.error("Error loading cart:", error);
      toast.error("Failed to load cart");
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, delta: number) => {
    const item = cartItems.find((i) => i.id === itemId);
    if (!item) return;

    const newQuantity = item.quantity + delta;

    if (newQuantity <= 0) {
      await removeItem(itemId);
      return;
    }

    try {
      await supabase
        .from("cart_items")
        .update({ quantity: newQuantity })
        .eq("id", itemId);

      loadCart();
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast.error("Failed to update quantity");
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      await supabase.from("cart_items").delete().eq("id", itemId);
      toast.success("Item removed from cart");
      loadCart();
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error("Failed to remove item");
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce(
      (sum, item) => sum + Number(item.food_items.price) * item.quantity,
      0
    );
  };

  const handleCheckout = async () => {
    if (!deliveryAddress || !phone) {
      toast.error("Please provide delivery address and phone number");
      return;
    }

    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const totalAmount = calculateTotal();

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          total_amount: totalAmount,
          delivery_address: deliveryAddress,
          phone: phone,
          notes: notes,
          status: "pending",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = cartItems.map((item) => ({
        order_id: order.id,
        food_item_id: item.food_items.id,
        quantity: item.quantity,
        price: item.food_items.price,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      await supabase.from("cart_items").delete().eq("user_id", user.id);

      toast.success("Order placed successfully!");
      navigate("/orders");
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error("Failed to place order");
    } finally {
      setSubmitting(false);
    }
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
        <Header cartItemCount={cartItems.length} />

        <main className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">Your Cart</h1>

          {cartItems.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">Your cart is empty</p>
                <Button onClick={() => navigate("/")}>Browse Menu</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {cartItems.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="flex items-center gap-4 p-6">
                      <div className="w-24 h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                        {item.food_items.image_url ? (
                          <img
                            src={item.food_items.image_url}
                            alt={item.food_items.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                            No image
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <h3 className="font-semibold">{item.food_items.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          ৳{item.food_items.price} each
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, -1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-semibold">
                          {item.quantity}
                        </span>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-lg">
                          ৳{(Number(item.food_items.price) * item.quantity).toFixed(2)}
                        </p>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeItem(item.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="lg:col-span-1">
                <Card className="sticky top-24">
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="address">Delivery Address</Label>
                      <Textarea
                        id="address"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="Enter your delivery address"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Your phone number"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Order Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Any special instructions?"
                      />
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between mb-2">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-semibold">
                          ৳{calculateTotal().toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between mb-4">
                        <span className="text-lg font-bold">Total</span>
                        <span className="text-lg font-bold text-primary">
                          ৳{calculateTotal().toFixed(2)}
                        </span>
                      </div>

                      <Button
                        className="w-full"
                        size="lg"
                        onClick={handleCheckout}
                        disabled={submitting}
                      >
                        {submitting ? "Placing Order..." : "Place Order"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
