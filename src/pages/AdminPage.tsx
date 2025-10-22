import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Edit, Trash2 } from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { CategoryManagement } from "@/components/admin/CategoryManagement";
import { OrdersManagement } from "@/components/admin/OrdersManagement";
import { InvoiceUpload } from "@/components/admin/InvoiceUpload";

interface FoodItem {
  id: string;
  name: string;
  description: string | null;
  category_id: string | null;
  price: number;
  image_url: string | null;
  food_type: string;
  available: boolean;
}

interface Category {
  id: string;
  name: string;
}

export default function AdminPage() {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category_id: "",
    price: "",
    image_url: "",
    food_type: "cooked",
    available: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [foodResponse, categoriesResponse] = await Promise.all([
      supabase.from("food_items").select("*").order("name"),
      supabase.from("categories").select("*").order("display_order"),
    ]);

    if (foodResponse.data) setFoodItems(foodResponse.data);
    if (categoriesResponse.data) setCategories(categoriesResponse.data);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category_id: "",
      price: "",
      image_url: "",
      food_type: "cooked",
      available: true,
    });
    setEditingItem(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data = {
        ...formData,
        price: parseFloat(formData.price),
      };

      if (editingItem) {
        await supabase.from("food_items").update(data).eq("id", editingItem.id);
        toast.success("Food item updated");
      } else {
        await supabase.from("food_items").insert(data);
        toast.success("Food item added");
      }

      setIsAddDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error("Error saving food item:", error);
      toast.error("Failed to save food item");
    }
  };

  const handleEdit = (item: FoodItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || "",
      category_id: item.category_id || "",
      price: item.price.toString(),
      image_url: item.image_url || "",
      food_type: item.food_type,
      available: item.available,
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      await supabase.from("food_items").delete().eq("id", id);
      toast.success("Food item deleted");
      loadData();
    } catch (error) {
      console.error("Error deleting food item:", error);
      toast.error("Failed to delete food item");
    }
  };

  return (
    <AuthGuard requireAdmin>
      <div className="min-h-screen bg-background">
        <Header isAdmin />

        <main className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

          <Tabs defaultValue="inventory" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="invoice">Invoice Upload</TabsTrigger>
            </TabsList>

            <TabsContent value="inventory">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Inventory Management</h2>
            <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
              setIsAddDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Food Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? "Edit Food Item" : "Add New Food Item"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category_id}
                      onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Price (৳)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="image_url">Image URL</Label>
                    <Input
                      id="image_url"
                      type="url"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="food_type">Food Type</Label>
                    <Select
                      value={formData.food_type}
                      onValueChange={(value) => setFormData({ ...formData, food_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cooked">Cooked Food</SelectItem>
                        <SelectItem value="ready_to_cook">Ready to Cook</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="available"
                      checked={formData.available}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, available: checked })
                      }
                    />
                    <Label htmlFor="available">Available</Label>
                  </div>

                  <Button type="submit" className="w-full">
                    {editingItem ? "Update" : "Add"} Food Item
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
              </div>

              <Tabs defaultValue="cooked" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="cooked">Cooked Food</TabsTrigger>
                  <TabsTrigger value="ready_to_cook">Ready to Cook</TabsTrigger>
                </TabsList>

                <TabsContent value="cooked" className="mt-6">
                  <div className="grid gap-4">
                    {foodItems
                      .filter((item) => item.food_type === "cooked")
                      .map((item) => (
                        <Card key={item.id}>
                          <CardContent className="flex items-center gap-4 p-6">
                            <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                              {item.image_url ? (
                                <img
                                  src={item.image_url}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                                  No image
                                </div>
                              )}
                            </div>

                            <div className="flex-1">
                              <h3 className="font-semibold">{item.name}</h3>
                              {item.description && (
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                  {item.description}
                                </p>
                              )}
                              <p className="text-sm font-bold text-primary mt-1">
                                ৳{Number(item.price).toFixed(2)}
                              </p>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => handleEdit(item)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => handleDelete(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </TabsContent>

                <TabsContent value="ready_to_cook" className="mt-6">
                  <div className="grid gap-4">
                    {foodItems
                      .filter((item) => item.food_type === "ready_to_cook")
                      .map((item) => (
                        <Card key={item.id}>
                          <CardContent className="flex items-center gap-4 p-6">
                            <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                              {item.image_url ? (
                                <img
                                  src={item.image_url}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                                  No image
                                </div>
                              )}
                            </div>

                            <div className="flex-1">
                              <h3 className="font-semibold">{item.name}</h3>
                              {item.description && (
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                  {item.description}
                                </p>
                              )}
                              <p className="text-sm font-bold text-primary mt-1">
                                ৳{Number(item.price).toFixed(2)}
                              </p>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => handleEdit(item)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => handleDelete(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="categories">
              <CategoryManagement />
            </TabsContent>

            <TabsContent value="orders">
              <OrdersManagement />
            </TabsContent>

            <TabsContent value="invoice">
              <InvoiceUpload />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </AuthGuard>
  );
}
