import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, Vote, Clock, CheckCircle, Shield } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslation } from "react-i18next";

type Election = {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  status: string;
  results_published: boolean;
};

// Helper function to calculate time remaining
const calculateTimeRemaining = (targetDate: string) => {
  const now = new Date();
  const target = new Date(targetDate);
  const difference = target.getTime() - now.getTime();

  if (difference <= 0) {
    return "Time's up!";
  }

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((difference % (1000 * 60)) / 1000);

  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
};

const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<Record<string, string>>({});

  useEffect(() => {
    const initDashboard = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
      setProfile(profileData);

      if (!profileData?.face_registered) {
        toast.info("Please register your face for voting");
        navigate("/face-registration");
        return;
      }

      const { data: electionsData, error } = await supabase
        .from("elections")
        .select("*")
        .in("status", ["active", "scheduled", "ended"])
        .order("start_time", { ascending: false });
        
      if (error) {
        toast.error("Could not fetch elections.");
        console.error(error);
      } else {
        setElections(electionsData || []);
      }
      setLoading(false);
    };

    initDashboard();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") navigate("/auth");
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeRemaining: Record<string, string> = {};
      elections.forEach((election) => {
        if (election.status === 'active') {
          newTimeRemaining[election.id] = calculateTimeRemaining(election.end_time);
        } else if (election.status === 'scheduled') {
          newTimeRemaining[election.id] = calculateTimeRemaining(election.start_time);
        }
      });
      setTimeRemaining(newTimeRemaining);
    }, 1000);

    return () => clearInterval(timer);
  }, [elections]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; text: string; icon: any }> = {
      active: { variant: "default", text: "Active", icon: Vote },
      ended: { variant: "secondary", text: "Ended", icon: CheckCircle },
      scheduled: { variant: "outline", text: "Scheduled", icon: Clock },
    };
    const config = variants[status] || variants.scheduled;
    const Icon = config.icon;
    return <Badge variant={config.variant} className="gap-1"><Icon className="h-3 w-3" />{config.text}</Badge>;
  };

  const getInitials = (name: string) => {
    if (!name) return "";
    return name.split(' ').map(n => n[0]).join('');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const now = new Date();
  const activeElections = elections.filter(e => e.status === 'active');
  const upcomingElections = elections.filter(e => e.status === 'scheduled' && new Date(e.start_time) > now);
  const completedElections = elections.filter(e => e.status === 'ended');

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">SecureVote</span>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link to="/profile" className="flex items-center gap-3 cursor-pointer group">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium group-hover:underline">{profile?.full_name}</div>
                <div className="text-xs text-muted-foreground">{profile?.email}</div>
              </div>
              <Avatar>
                <AvatarImage src={profile?.avatar_url} alt={profile?.full_name} />
                <AvatarFallback>{getInitials(profile?.full_name)}</AvatarFallback>
              </Avatar>
            </Link>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-8">
        {/* Active Elections Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Active Elections</h2>
          {activeElections.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {activeElections.map((election) => (
                <Card key={election.id}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>{election.title}</CardTitle>
                      {getStatusBadge(election.status)}
                    </div>
                    <CardDescription>{election.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground">Time Remaining</p>
                      <p className="text-lg font-mono font-semibold text-destructive">
                        {timeRemaining[election.id] || 'Loading...'}
                      </p>
                    </div>
                    <Button className="w-full" onClick={() => navigate(`/vote/${election.id}`)}>
                      <Vote className="mr-2 h-4 w-4" /> Vote Now
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No active elections at the moment.</p>
          )}
        </section>

        {/* Upcoming Elections Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Upcoming Elections</h2>
          {upcomingElections.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {upcomingElections.map((election) => (
                <Card key={election.id} className="bg-muted/30">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>{election.title}</CardTitle>
                      {getStatusBadge(election.status)}
                    </div>
                    <CardDescription>{election.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Starts in</p>
                    <p className="text-lg font-mono font-semibold text-primary">
                      {timeRemaining[election.id] || 'Loading...'}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No upcoming elections scheduled.</p>
          )}
        </section>

        {/* Completed Elections Section */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Completed Elections</h2>
          {completedElections.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {completedElections.map((election) => (
                <Card key={election.id} className="opacity-75">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>{election.title}</CardTitle>
                      {getStatusBadge(election.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {election.results_published ? (
                      <Button variant="outline" className="w-full" onClick={() => navigate(`/results/${election.id}`)}>
                        View Results
                      </Button>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center">Results are being tallied.</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">You have not participated in any elections yet.</p>
          )}
        </section>
      </main>
    </div>
  );
};

export default Dashboard;