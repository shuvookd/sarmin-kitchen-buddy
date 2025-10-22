import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { FoodCard } from "@/components/food/FoodCard";
import { ChatAssistant } from "@/components/chat/ChatAssistant";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AuthGuard } from "@/components/auth/AuthGuard";

interface FoodItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  available: boolean;
  food_type: string;
  category_id: string | null;
  categories: { name: string } | null;
}

interface CartItem {
  food_item_id: string;
  quantity: number;
}

export default function CustomerPage() {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [foodResponse, cartResponse, categoriesResponse] = await Promise.all([
        supabase
          .from("food_items")
          .select("*, categories(name)")
          .order("name"),
        supabase.from("cart_items").select("food_item_id, quantity"),
        supabase.from("categories").select("id, name").order("display_order"),
      ]);

      if (foodResponse.data) setFoodItems(foodResponse.data);
      if (cartResponse.data) setCartItems(cartResponse.data);
      if (categoriesResponse.data) setCategories(categoriesResponse.data);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load food items");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (foodItemId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const existingItem = cartItems.find((item) => item.food_item_id === foodItemId);

      if (existingItem) {
        await supabase
          .from("cart_items")
          .update({ quantity: existingItem.quantity + 1 })
          .eq("user_id", user.id)
          .eq("food_item_id", foodItemId);
      } else {
        await supabase
          .from("cart_items")
          .insert({ user_id: user.id, food_item_id: foodItemId, quantity: 1 });
      }

      toast.success("Added to cart");
      loadData();
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Failed to add to cart");
    }
  };

  const filterFoodItems = (foodType: string) => {
    return foodItems.filter((item) => {
      const matchesType = item.food_type === foodType;
      const matchesCategory =
        selectedCategory === "all" || item.category_id === selectedCategory;
      return matchesType && matchesCategory;
    });
  };

  const getCartItemQuantity = (foodItemId: string) => {
    return cartItems.find((item) => item.food_item_id === foodItemId)?.quantity || 0;
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
        <Header cartItemCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)} />

        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Welcome to Sarmin's Cloud Kitchen
            </h1>
            <p className="text-muted-foreground">Fresh, delicious meals delivered to you</p>
          </div>

          <div className="mb-6 flex flex-wrap gap-2">
            <Badge
              variant={selectedCategory === "all" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedCategory("all")}
            >
              All Categories
            </Badge>
            {categories.map((category) => (
              <Badge
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </Badge>
            ))}
          </div>

          <Tabs defaultValue="cooked" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="cooked">Cooked Food</TabsTrigger>
              <TabsTrigger value="ready_to_cook">Ready To Cook</TabsTrigger>
            </TabsList>

            <TabsContent value="cooked">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filterFoodItems("cooked").map((item) => (
                  <FoodCard
                    key={item.id}
                    id={item.id}
                    name={item.name}
                    description={item.description}
                    price={Number(item.price)}
                    imageUrl={item.image_url}
                    available={item.available}
                    categoryName={item.categories?.name}
                    quantity={getCartItemQuantity(item.id)}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="ready_to_cook">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filterFoodItems("ready_to_cook").map((item) => (
                  <FoodCard
                    key={item.id}
                    id={item.id}
                    name={item.name}
                    description={item.description}
                    price={Number(item.price)}
                    imageUrl={item.image_url}
                    available={item.available}
                    categoryName={item.categories?.name}
                    quantity={getCartItemQuantity(item.id)}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </main>

        <ChatAssistant />
      </div>
    </AuthGuard>
  );
}
