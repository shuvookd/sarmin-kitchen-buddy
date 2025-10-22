import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus } from "lucide-react";

interface FoodCardProps {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  available: boolean;
  categoryName?: string;
  quantity?: number;
  onAddToCart: (id: string) => void;
  onUpdateQuantity?: (id: string, delta: number) => void;
}

export const FoodCard = ({
  id,
  name,
  description,
  price,
  imageUrl,
  available,
  categoryName,
  quantity = 0,
  onAddToCart,
  onUpdateQuantity,
}: FoodCardProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="aspect-video bg-muted relative overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            No image
          </div>
        )}
        {!available && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge variant="destructive" className="text-lg">Unavailable</Badge>
          </div>
        )}
      </div>
      
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{name}</CardTitle>
            {categoryName && (
              <Badge variant="secondary" className="mt-1">{categoryName}</Badge>
            )}
          </div>
          <span className="text-xl font-bold text-primary">৳{price}</span>
        </div>
        {description && (
          <CardDescription className="line-clamp-2">{description}</CardDescription>
        )}
      </CardHeader>

      <CardFooter>
        {quantity > 0 && onUpdateQuantity ? (
          <div className="flex items-center gap-3 w-full">
            <Button
              size="icon"
              variant="outline"
              onClick={() => onUpdateQuantity(id, -1)}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="flex-1 text-center font-semibold">{quantity}</span>
            <Button
              size="icon"
              variant="outline"
              onClick={() => onUpdateQuantity(id, 1)}
              disabled={!available}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            className="w-full"
            onClick={() => onAddToCart(id)}
            disabled={!available}
          >
            Add to Cart
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
