import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Order {
  id: string;
  quantity: number;
  total_amount: number;
  delivery_type: string;
  delivery_address: string;
  preferred_delivery_time: string;
  special_instructions: string;
  status: string;
  payment_status: string;
  created_at: string;
  cakes: {
    name: string;
    price: number;
  };
  profiles: {
    display_name: string;
    email: string;
    phone: string;
  };
}

const SellerOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      const { data: bakery, error: bakeryError } = await supabase
        .from('bakeries')
        .select('id')
        .eq('seller_id', profile.id)
        .maybeSingle();

      if (bakeryError) throw bakeryError;
      if (!bakery) return;

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          cakes (
            name,
            price
          ),
          profiles (
            display_name,
            email,
            phone
          )
        `)
        .eq('bakery_id', bakery.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error loading orders",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Order status updated",
        description: `Order has been marked as ${newStatus.replace('_', ' ')}.`,
      });

      fetchOrders();
    } catch (error: any) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error updating order",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'confirmed': return 'default';
      case 'in_progress': return 'outline';
      case 'ready': return 'default';
      case 'completed': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Orders</h1>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-muted h-32 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Orders</h1>
      
      {orders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No orders yet. Orders will appear here when customers place them.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{order.cakes?.name}</CardTitle>
                    <CardDescription>
                      Order from {order.profiles?.display_name || order.profiles?.email}
                      <br />
                      Placed: {new Date(order.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">${order.total_amount}</div>
                    <div className="flex gap-2 mt-2">
                      <Badge variant={getStatusColor(order.status)}>
                        {order.status.replace('_', ' ')}
                      </Badge>
                      <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'}>
                        {order.payment_status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="font-semibold mb-2">Order Details</h4>
                    <p className="text-sm text-muted-foreground">Quantity: {order.quantity}</p>
                    <p className="text-sm text-muted-foreground">Delivery: {order.delivery_type}</p>
                    {order.delivery_address && (
                      <p className="text-sm text-muted-foreground">Address: {order.delivery_address}</p>
                    )}
                    {order.preferred_delivery_time && (
                      <p className="text-sm text-muted-foreground">
                        Preferred time: {new Date(order.preferred_delivery_time).toLocaleString()}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Customer Info</h4>
                    <p className="text-sm text-muted-foreground">
                      {order.profiles?.display_name || 'Name not provided'}
                    </p>
                    <p className="text-sm text-muted-foreground">{order.profiles?.email}</p>
                    {order.profiles?.phone && (
                      <p className="text-sm text-muted-foreground">{order.profiles.phone}</p>
                    )}
                  </div>
                </div>

                {order.special_instructions && (
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">Special Instructions</h4>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                      {order.special_instructions}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Update Status:</span>
                  <Select
                    value={order.status}
                    onValueChange={(value) => updateOrderStatus(order.id, value)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="ready">Ready</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SellerOrders;