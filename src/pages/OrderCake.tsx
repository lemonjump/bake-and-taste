import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

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

const OrderCake = () => {
  const { cakeId } = useParams<{ cakeId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [cake, setCake] = useState<Cake | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Order form state
  const [quantity, setQuantity] = useState(1);
  const [deliveryType, setDeliveryType] = useState<string>("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [preferredDeliveryTime, setPreferredDeliveryTime] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");

  useEffect(() => {
    if (cakeId) {
      fetchCake();
    }
  }, [cakeId]);

  const fetchCake = async () => {
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
        .eq('id', cakeId)
        .eq('available', true)
        .single();

      if (error) throw error;
      setCake(data);
    } catch (error) {
      console.error('Error fetching cake:', error);
      toast({
        title: "Cake not found",
        description: "The cake you're looking for is not available.",
        variant: "destructive",
      });
      navigate('/browse');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cake) return;

    setSubmitting(true);

    try {
      // Get current user's profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to place an order.",
          variant: "destructive",
        });
        navigate('/auth');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      const totalAmount = cake.price * quantity;

      const { error } = await supabase.from('orders').insert({
        customer_id: profile.id,
        cake_id: cake.id,
        bakery_id: cake.bakery_id,
        quantity,
        total_amount: totalAmount,
        delivery_type: deliveryType,
        delivery_address: deliveryType === 'delivery' ? deliveryAddress : null,
        preferred_delivery_time: preferredDeliveryTime || null,
        special_instructions: specialInstructions || null,
        status: 'pending',
        payment_status: 'pending'
      });

      if (error) throw error;

      toast({
        title: "Order placed successfully!",
        description: "Your order has been submitted and is being processed.",
      });

      navigate('/orders');
    } catch (error: any) {
      console.error('Error placing order:', error);
      toast({
        title: "Error placing order",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="bg-muted h-8 rounded w-1/4"></div>
          <div className="bg-muted h-64 rounded"></div>
        </div>
      </div>
    );
  }

  if (!cake) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Cake not found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button 
        variant="outline" 
        onClick={() => navigate('/browse')}
        className="mb-6"
      >
        ← Back to Browse
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Cake Details */}
        <Card>
          {cake.image_url && (
            <div className="h-64 bg-muted flex items-center justify-center">
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
            <CardTitle>{cake.name}</CardTitle>
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
            <p className="text-muted-foreground mb-4">{cake.description}</p>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {cake.category && (
                <Badge variant="secondary">{cake.category}</Badge>
              )}
              {cake.allergens && cake.allergens.length > 0 && (
                <Badge variant="outline">
                  Allergens: {cake.allergens.join(', ')}
                </Badge>
              )}
            </div>

            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold">${cake.price}</span>
              <span className="text-sm text-muted-foreground">
                {cake.preparation_time_hours}h prep time
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Order Form */}
        <Card>
          <CardHeader>
            <CardTitle>Place Your Order</CardTitle>
            <CardDescription>
              Fill in the details for your order
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitOrder} className="space-y-4">
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="deliveryType">Delivery Type</Label>
                <Select value={deliveryType} onValueChange={setDeliveryType} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select delivery type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pickup">Pickup</SelectItem>
                    <SelectItem value="delivery">Delivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {deliveryType === 'delivery' && (
                <div>
                  <Label htmlFor="deliveryAddress">Delivery Address</Label>
                  <Input
                    id="deliveryAddress"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Enter your delivery address"
                    required
                  />
                </div>
              )}

              <div>
                <Label htmlFor="preferredDeliveryTime">Preferred {deliveryType === 'pickup' ? 'Pickup' : 'Delivery'} Time</Label>
                <Input
                  id="preferredDeliveryTime"
                  type="datetime-local"
                  value={preferredDeliveryTime}
                  onChange={(e) => setPreferredDeliveryTime(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="specialInstructions">Special Instructions</Label>
                <Textarea
                  id="specialInstructions"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="Any special requests, allergies, or instructions..."
                  rows={3}
                />
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-2xl font-bold">${(cake.price * quantity).toFixed(2)}</span>
                </div>
                
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? 'Placing Order...' : 'Place Order'}
                </Button>
                
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Payment processing will be handled after order confirmation
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrderCake;