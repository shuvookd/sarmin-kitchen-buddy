import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShoppingCart, User, LogOut, UtensilsCrossed } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";

interface HeaderProps {
  cartItemCount?: number;
  isAdmin?: boolean;
}

export const Header = ({ cartItemCount = 0, isAdmin = false }: HeaderProps) => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");

  useEffect(() => {
    loadUserName();
  }, []);

  const loadUserName = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();
      
      setUserName(profile?.full_name || user.email?.split("@")[0] || "User");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/auth");
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <button 
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-2xl font-bold text-primary hover:opacity-80 transition-opacity"
        >
          <UtensilsCrossed className="h-7 w-7" />
          Sarmin's Kitchen
        </button>

        <nav className="flex items-center gap-4">
          {!isAdmin && (
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => navigate("/cart")}
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {cartItemCount}
                </Badge>
              )}
            </Button>
          )}
          
          {isAdmin && (
            <Button
              variant="outline"
              onClick={() => navigate("/")}
            >
              Customer View
            </Button>
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            {userName}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            title="Sign Out"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </nav>
      </div>
    </header>
  );
};
