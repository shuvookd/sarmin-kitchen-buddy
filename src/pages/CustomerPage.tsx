import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { FoodCard } from "@/components/food/FoodCard";
import { ChatAssistant } from "@/components/chat/ChatAssistant";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search } from "lucide-react";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [sessionId] = useState(() => {
    let id = localStorage.getItem("guest_session_id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("guest_session_id", id);
    }
    return id;
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const [foodResponse, categoriesResponse] = await Promise.all([
        supabase
          .from("food_items")
          .select("*, categories(name)")
          .order("name"),
        supabase.from("categories").select("id, name").order("display_order"),
      ]);

      // Load cart - either from database (if logged in) or localStorage (if guest)
      let cartData: CartItem[] = [];
      if (user) {
        const { data } = await supabase
          .from("cart_items")
          .select("food_item_id, quantity")
          .eq("user_id", user.id);
        cartData = data || [];
      } else {
        // Guest cart from localStorage
        const guestCart = localStorage.getItem("guest_cart");
        if (guestCart) {
          cartData = JSON.parse(guestCart);
        }
      }

      if (foodResponse.data) setFoodItems(foodResponse.data);
      setCartItems(cartData);
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

      if (user) {
        // Logged in user - save to database
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
      } else {
        // Guest user - save to localStorage
        const guestCart = [...cartItems];
        const existingItem = guestCart.find((item) => item.food_item_id === foodItemId);
        
        if (existingItem) {
          existingItem.quantity += 1;
        } else {
          guestCart.push({ food_item_id: foodItemId, quantity: 1 });
        }
        
        setCartItems(guestCart);
        localStorage.setItem("guest_cart", JSON.stringify(guestCart));
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
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesCategory && matchesSearch;
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
    <div className="min-h-screen bg-background">
      <Header cartItemCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)} />

      <main className="container mx-auto px-4 py-8">
          <div className="mb-8 animate-fade-in">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Welcome to Sarmin's Cloud Kitchen
            </h1>
            <p className="text-muted-foreground text-lg">Fresh, delicious meals delivered to you</p>
          </div>

          <div className="mb-6 relative animate-slide-in">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              placeholder="Search for food items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>

          <div className="mb-6 flex flex-wrap gap-2 animate-slide-in">
            <Badge
              variant={selectedCategory === "all" ? "default" : "outline"}
              className="cursor-pointer hover:scale-105 transition-transform px-4 py-2"
              onClick={() => setSelectedCategory("all")}
            >
              All Categories
            </Badge>
            {categories.map((category) => (
              <Badge
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                className="cursor-pointer hover:scale-105 transition-transform px-4 py-2"
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </Badge>
            ))}
          </div>

          <Tabs defaultValue="cooked" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 h-12">
              <TabsTrigger value="cooked" className="text-base">Cooked Food</TabsTrigger>
              <TabsTrigger value="ready_to_cook" className="text-base">Ready To Cook</TabsTrigger>
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
  );
}
