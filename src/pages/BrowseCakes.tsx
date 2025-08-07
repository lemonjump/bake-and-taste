import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Cake {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  allergens: string[];
  image_url: string;
  preparation_time_hours: number;
  bakery_id: string;
  bakeries: {
    name: string;
    address: string;
  };
}

const BrowseCakes = () => {
  const [cakes, setCakes] = useState<Cake[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCakes();
  }, []);

  const fetchCakes = async () => {
    try {
      const { data, error } = await supabase
        .from('cakes')
        .select(`
          *,
          bakeries (
            name,
            address
          )
        `)
        .eq('available', true);

      if (error) throw error;
      setCakes(data || []);
    } catch (error) {
      console.error('Error fetching cakes:', error);
      toast({
        title: "Error loading cakes",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOrderCake = (cakeId: string) => {
    navigate(`/order/${cakeId}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-muted h-48 rounded-lg mb-4"></div>
              <div className="bg-muted h-4 rounded mb-2"></div>
              <div className="bg-muted h-4 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Browse Cakes</h1>
      
      {cakes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No cakes available at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cakes.map((cake) => (
            <Card key={cake.id} className="overflow-hidden">
              {cake.image_url && (
                <div className="h-48 bg-muted flex items-center justify-center">
                  <img 
                    src={cake.image_url} 
                    alt={cake.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-lg">{cake.name}</CardTitle>
                <CardDescription>
                  By {cake.bakeries?.name}
                  {cake.bakeries?.address && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {cake.bakeries.address}
                    </div>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{cake.description}</p>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  {cake.category && (
                    <Badge variant="secondary">{cake.category}</Badge>
                  )}
                  {cake.allergens && cake.allergens.length > 0 && (
                    <Badge variant="outline">
                      Allergens: {cake.allergens.join(', ')}
                    </Badge>
                  )}
                </div>

                <div className="flex justify-between items-center mb-4">
                  <span className="text-2xl font-bold">${cake.price}</span>
                  <span className="text-sm text-muted-foreground">
                    {cake.preparation_time_hours}h prep time
                  </span>
                </div>

                <Button 
                  onClick={() => handleOrderCake(cake.id)} 
                  className="w-full"
                >
                  Order Now
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default BrowseCakes;