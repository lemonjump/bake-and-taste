import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Bakery {
  id: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  image_url: string;
}

interface Stats {
  totalCakes: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
}

const SellerDashboard = () => {
  const [bakery, setBakery] = useState<Bakery | null>(null);
  const [stats, setStats] = useState<Stats>({ totalCakes: 0, totalOrders: 0, pendingOrders: 0, totalRevenue: 0 });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    image_url: ''
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchBakeryAndStats();
  }, []);

  const fetchBakeryAndStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      if (profile.role !== 'seller') {
        toast({
          title: "Access denied",
          description: "You need to be a seller to access this page.",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      // Fetch bakery
      const { data: bakeryData, error: bakeryError } = await supabase
        .from('bakeries')
        .select('*')
        .eq('seller_id', profile.id)
        .maybeSingle();

      if (bakeryError) throw bakeryError;

      if (bakeryData) {
        setBakery(bakeryData);
        setFormData({
          name: bakeryData.name || '',
          description: bakeryData.description || '',
          address: bakeryData.address || '',
          phone: bakeryData.phone || '',
          image_url: bakeryData.image_url || ''
        });

        // Fetch stats
        const [cakesResult, ordersResult] = await Promise.all([
          supabase
            .from('cakes')
            .select('id')
            .eq('bakery_id', bakeryData.id),
          supabase
            .from('orders')
            .select('id, status, total_amount')
            .eq('bakery_id', bakeryData.id)
        ]);

        if (cakesResult.error) throw cakesResult.error;
        if (ordersResult.error) throw ordersResult.error;

        const totalOrders = ordersResult.data?.length || 0;
        const pendingOrders = ordersResult.data?.filter(order => order.status === 'pending').length || 0;
        const totalRevenue = ordersResult.data?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

        setStats({
          totalCakes: cakesResult.data?.length || 0,
          totalOrders,
          pendingOrders,
          totalRevenue
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error loading dashboard",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBakery = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      if (bakery) {
        // Update existing bakery
        const { error } = await supabase
          .from('bakeries')
          .update(formData)
          .eq('id', bakery.id);

        if (error) throw error;
      } else {
        // Create new bakery
        const { error } = await supabase
          .from('bakeries')
          .insert({
            ...formData,
            seller_id: profile.id
          });

        if (error) throw error;
      }

      toast({
        title: "Bakery saved successfully!",
        description: "Your bakery information has been updated.",
      });

      setEditing(false);
      fetchBakeryAndStats();
    } catch (error: any) {
      console.error('Error saving bakery:', error);
      toast({
        title: "Error saving bakery",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="bg-muted h-8 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-muted h-24 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Seller Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Cakes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCakes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Bakery Information */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Bakery Information</CardTitle>
              <CardDescription>
                Manage your bakery details and information
              </CardDescription>
            </div>
            {!editing && (
              <Button onClick={() => setEditing(true)} variant="outline">
                {bakery ? 'Edit' : 'Create Bakery'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editing ? (
            <form onSubmit={handleSaveBakery} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Bakery Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="image_url">Image URL</Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">Save</Button>
                <Button type="button" variant="outline" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : bakery ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold">Name</h4>
                  <p className="text-muted-foreground">{bakery.name}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Phone</h4>
                  <p className="text-muted-foreground">{bakery.phone || 'Not provided'}</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold">Address</h4>
                <p className="text-muted-foreground">{bakery.address || 'Not provided'}</p>
              </div>
              <div>
                <h4 className="font-semibold">Description</h4>
                <p className="text-muted-foreground">{bakery.description || 'No description provided'}</p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">
              You haven't set up your bakery yet. Click "Create Bakery" to get started.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SellerDashboard;