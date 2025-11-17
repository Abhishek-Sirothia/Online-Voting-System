import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, Vote, BarChart3, LogOut, Calendar, History, LineChart, Send } from "lucide-react";
import { toast } from "sonner";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [stats, setStats] = useState({ totalVoters: 0, totalElections: 0, activeElections: 0, totalVotes: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "admin").single();
      if (!roleData) {
        toast.error("Access denied. Admin privileges required.");
        navigate("/dashboard");
        return;
      }
      setUserRole(roleData.role);

      const { count: v } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      const { count: e } = await supabase.from("elections").select("*", { count: "exact", head: true });
      const { count: a } = await supabase.from("elections").select("*", { count: "exact", head: true }).eq("status", "active");
      const { count: vo } = await supabase.from("votes").select("*", { count: "exact", head: true });
      setStats({ totalVoters: v || 0, totalElections: e || 0, activeElections: a || 0, totalVotes: vo || 0 });
      setLoading(false);
    };
    checkAdmin();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Admin Panel</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>User View</Button>
            <Button variant="outline" size="sm" onClick={handleSignOut}><LogOut className="h-4 w-4 mr-2" />Sign Out</Button>
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage elections, voters, and candidates</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Stats Cards */}
          <Card> <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"> <CardTitle className="text-sm font-medium">Total Voters</CardTitle> <Users className="h-4 w-4 text-muted-foreground" /> </CardHeader> <CardContent> <div className="text-2xl font-bold">{stats.totalVoters}</div> </CardContent> </Card>
          <Card> <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"> <CardTitle className="text-sm font-medium">Total Elections</CardTitle> <Calendar className="h-4 w-4 text-muted-foreground" /> </CardHeader> <CardContent> <div className="text-2xl font-bold">{stats.totalElections}</div> </CardContent> </Card>
          <Card> <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"> <CardTitle className="text-sm font-medium">Active Elections</CardTitle> <Vote className="h-4 w-4 text-success" /> </CardHeader> <CardContent> <div className="text-2xl font-bold text-success">{stats.activeElections}</div> </CardContent> </Card>
          <Card> <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"> <CardTitle className="text-sm font-medium">Total Votes Cast</CardTitle> <BarChart3 className="h-4 w-4 text-muted-foreground" /> </CardHeader> <CardContent> <div className="text-2xl font-bold">{stats.totalVotes}</div> </CardContent> </Card>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/admin/elections")}> <CardHeader> <Vote className="h-12 w-12 text-primary mb-4" /> <CardTitle>Manage Elections</CardTitle> <CardDescription>Create, schedule, and control elections</CardDescription> </CardHeader> <CardContent> <Button className="w-full">Go to Elections</Button> </CardContent> </Card>
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/admin/candidates")}> <CardHeader> <Users className="h-12 w-12 text-accent mb-4" /> <CardTitle>Manage Candidates</CardTitle> <CardDescription>Add and edit candidate information</CardDescription> </CardHeader> <CardContent> <Button className="w-full">Go to Candidates</Button> </CardContent> </Card>
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/admin/voters")}> <CardHeader> <Shield className="h-12 w-12 text-success mb-4" /> <CardTitle>Manage Voters</CardTitle> <CardDescription>View and manage registered voters</CardDescription> </CardHeader> <CardContent> <Button className="w-full">Go to Voters</Button> </CardContent> </Card>
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/admin/audit-log")}> <CardHeader> <History className="h-12 w-12 text-muted-foreground mb-4" /> <CardTitle>Audit Log</CardTitle> <CardDescription>View a log of all administrator actions</CardDescription> </CardHeader> <CardContent> <Button className="w-full">View Audit Log</Button> </CardContent> </Card>
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/admin/analytics")}> <CardHeader> <LineChart className="h-12 w-12 text-primary mb-4" /> <CardTitle>Analytics</CardTitle> <CardDescription>Visualize election data and results</CardDescription> </CardHeader> <CardContent> <Button className="w-full">View Analytics</Button> </CardContent> </Card>
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/admin/communications")}> <CardHeader> <Send className="h-12 w-12 text-accent mb-4" /> <CardTitle>Communications</CardTitle> <CardDescription>Send announcements to users</CardDescription> </CardHeader> <CardContent> <Button className="w-full">Send Email</Button> </CardContent> </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;