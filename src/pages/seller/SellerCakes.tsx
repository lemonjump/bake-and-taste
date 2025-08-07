import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit, Plus } from "lucide-react";

interface Cake {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  allergens: string[];
  image_url: string;
  available: boolean;
  preparation_time_hours: number;
}

const SellerCakes = () => {
  const [cakes, setCakes] = useState<Cake[]>([]);
  const [bakeryId, setBakeryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingCake, setEditingCake] = useState<Cake | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    allergens: '',
    image_url: '',
    available: true,
    preparation_time_hours: '24'
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchBakeryAndCakes();
  }, []);

  const fetchBakeryAndCakes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      // Get bakery
      const { data: bakery, error: bakeryError } = await supabase
        .from('bakeries')
        .select('id')
        .eq('seller_id', profile.id)
        .maybeSingle();

      if (bakeryError) throw bakeryError;

      if (!bakery) {
        toast({
          title: "No bakery found",
          description: "Please set up your bakery first.",
          variant: "destructive",
        });
        return;
      }

      setBakeryId(bakery.id);

      // Get cakes
      const { data: cakesData, error: cakesError } = await supabase
        .from('cakes')
        .select('*')
        .eq('bakery_id', bakery.id)
        .order('created_at', { ascending: false });

      if (cakesError) throw cakesError;
      setCakes(cakesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error loading cakes",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      allergens: '',
      image_url: '',
      available: true,
      preparation_time_hours: '24'
    });
    setEditingCake(null);
  };

  const handleEdit = (cake: Cake) => {
    setEditingCake(cake);
    setFormData({
      name: cake.name,
      description: cake.description || '',
      price: cake.price.toString(),
      category: cake.category || '',
      allergens: cake.allergens?.join(', ') || '',
      image_url: cake.image_url || '',
      available: cake.available,
      preparation_time_hours: cake.preparation_time_hours?.toString() || '24'
    });
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bakeryId) return;

    try {
      const allergensArray = formData.allergens
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);

      const cakeData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        allergens: allergensArray,
        image_url: formData.image_url,
        available: formData.available,
        preparation_time_hours: parseInt(formData.preparation_time_hours),
        bakery_id: bakeryId
      };

      if (editingCake) {
        const { error } = await supabase
          .from('cakes')
          .update(cakeData)
          .eq('id', editingCake.id);

        if (error) throw error;
        toast({ title: "Cake updated successfully!" });
      } else {
        const { error } = await supabase
          .from('cakes')
          .insert(cakeData);

        if (error) throw error;
        toast({ title: "Cake created successfully!" });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchBakeryAndCakes();
    } catch (error: any) {
      console.error('Error saving cake:', error);
      toast({
        title: "Error saving cake",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (cakeId: string) => {
    if (!confirm('Are you sure you want to delete this cake?')) return;

    try {
      const { error } = await supabase
        .from('cakes')
        .delete()
        .eq('id', cakeId);

      if (error) throw error;

      toast({ title: "Cake deleted successfully!" });
      fetchBakeryAndCakes();
    } catch (error: any) {
      console.error('Error deleting cake:', error);
      toast({
        title: "Error deleting cake",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleAvailability = async (cake: Cake) => {
    try {
      const { error } = await supabase
        .from('cakes')
        .update({ available: !cake.available })
        .eq('id', cake.id);

      if (error) throw error;

      toast({
        title: `Cake ${!cake.available ? 'made available' : 'made unavailable'}`,
      });

      fetchBakeryAndCakes();
    } catch (error: any) {
      console.error('Error updating availability:', error);
      toast({
        title: "Error updating cake",
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-muted h-64 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Cakes</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Add New Cake
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingCake ? 'Edit Cake' : 'Add New Cake'}</DialogTitle>
              <DialogDescription>
                Fill in the details for your cake
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="prep_time">Prep Time (hours)</Label>
                  <Input
                    id="prep_time"
                    type="number"
                    value={formData.preparation_time_hours}
                    onChange={(e) => setFormData({...formData, preparation_time_hours: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  placeholder="e.g., Birthday, Wedding, Cupcakes"
                />
              </div>

              <div>
                <Label htmlFor="allergens">Allergens (comma separated)</Label>
                <Input
                  id="allergens"
                  value={formData.allergens}
                  onChange={(e) => setFormData({...formData, allergens: e.target.value})}
                  placeholder="e.g., nuts, dairy, gluten"
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

              <div className="flex items-center space-x-2">
                <Switch
                  id="available"
                  checked={formData.available}
                  onCheckedChange={(checked) => setFormData({...formData, available: checked})}
                />
                <Label htmlFor="available">Available for orders</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingCake ? 'Update' : 'Create'} Cake
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {cakes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No cakes yet. Create your first cake to get started!</p>
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
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{cake.name}</CardTitle>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(cake)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(cake.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription>{cake.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant={cake.available ? 'default' : 'secondary'}>
                    {cake.available ? 'Available' : 'Unavailable'}
                  </Badge>
                  {cake.category && (
                    <Badge variant="outline">{cake.category}</Badge>
                  )}
                </div>

                <div className="flex justify-between items-center mb-4">
                  <span className="text-2xl font-bold">${cake.price}</span>
                  <span className="text-sm text-muted-foreground">
                    {cake.preparation_time_hours}h prep
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <Switch
                    checked={cake.available}
                    onCheckedChange={() => toggleAvailability(cake)}
                  />
                  <span className="text-sm text-muted-foreground">
                    {cake.available ? 'Available' : 'Unavailable'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SellerCakes;