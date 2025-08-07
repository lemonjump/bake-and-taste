import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChefHat, ShoppingCart, Star } from "lucide-react";

interface FeaturedCake {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  bakeries: {
    name: string;
  };
}

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [featuredCakes, setFeaturedCakes] = useState<FeaturedCake[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchUserProfile(session.user.id);
      }
      setLoading(false);
    });

    // Fetch featured cakes
    fetchFeaturedCakes();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setUserRole(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      setUserRole(profile?.role || null);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchFeaturedCakes = async () => {
    try {
      const { data, error } = await supabase
        .from('cakes')
        .select(`
          id,
          name,
          description,
          price,
          category,
          image_url,
          bakeries (
            name
          )
        `)
        .eq('available', true)
        .limit(6);

      if (error) throw error;
      setFeaturedCakes(data || []);
    } catch (error) {
      console.error('Error fetching featured cakes:', error);
    }
  };

  const getDashboardLink = () => {
    if (!user) return '/auth';
    if (userRole === 'seller') return '/seller/dashboard';
    return '/browse';
  };

  const getDashboardText = () => {
    if (!user) return 'Get Started';
    if (userRole === 'seller') return 'Go to Dashboard';
    return 'Browse Cakes';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 to-secondary/10 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6 text-primary">
            Welcome to Bake & Taste
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Discover amazing cakes from local bakers or showcase your own delicious creations. 
            Connect with customers and grow your baking business.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={getDashboardLink()}>
              <Button size="lg" className="w-full sm:w-auto">
                <ShoppingCart className="w-5 h-5 mr-2" />
                {getDashboardText()}
              </Button>
            </Link>
            
            {!user && (
              <Link to="/auth">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  <ChefHat className="w-5 h-5 mr-2" />
                  Become a Seller
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <ShoppingCart className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Browse & Order</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Discover delicious cakes from local bakers. Place custom orders with special instructions 
                  and choose pickup or delivery options.
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <ChefHat className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Sell Your Cakes</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Showcase your baking skills and manage your bakery online. 
                  Receive orders and grow your customer base.
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Star className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Quality Assured</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  All bakers are verified and committed to providing high-quality, 
                  fresh cakes made with love and care.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Cakes Section */}
      {featuredCakes.length > 0 && (
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-12">
              <h2 className="text-3xl font-bold">Featured Cakes</h2>
              <Link to="/browse">
                <Button variant="outline">View All Cakes</Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCakes.map((cake) => (
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
                    <CardDescription>By {cake.bakeries?.name}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">{cake.description}</p>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold">${cake.price}</span>
                      {cake.category && (
                        <Badge variant="secondary">{cake.category}</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join our community of cake lovers and talented bakers today!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/browse">
              <Button size="lg" className="w-full sm:w-auto">
                Start Browsing Cakes
              </Button>
            </Link>
            
            <Link to="/auth">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Join as a Seller
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
