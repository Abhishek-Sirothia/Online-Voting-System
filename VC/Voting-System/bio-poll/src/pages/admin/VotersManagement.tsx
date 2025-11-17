import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Shield, ArrowLeft, Search, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

interface Voter {
  id: string;
  full_name: string;
  email: string;
  face_registered: boolean;
  created_at: string;
}

const VotersManagement = () => {
  const navigate = useNavigate();
  const [voters, setVoters] = useState<Voter[]>([]);
  const [filteredVoters, setFilteredVoters] = useState<Voter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    checkAdminAndLoadVoters();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredVoters(voters);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredVoters(
        voters.filter(
          (voter) =>
            voter.full_name.toLowerCase().includes(query) ||
            voter.email.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, voters]);

  const checkAdminAndLoadVoters = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      toast.error("Access denied. Admin privileges required.");
      navigate("/dashboard");
      return;
    }

    await loadVoters();
  };

  const loadVoters = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load voters");
      console.error(error);
    } else {
      setVoters(data || []);
      setFilteredVoters(data || []);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Voters Management</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Manage Voters</h1>
          <p className="text-muted-foreground">View and manage registered voters</p>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid gap-4">
          {filteredVoters.map((voter) => (
            <Card key={voter.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{voter.full_name}</CardTitle>
                    <CardDescription>{voter.email}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {voter.face_registered ? (
                      <div className="flex items-center gap-1 text-success">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm">Face Registered</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <XCircle className="h-4 w-4" />
                        <span className="text-sm">Face Not Registered</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Registered: {new Date(voter.created_at).toLocaleDateString()}</span>
                  <span>ID: {voter.id.slice(0, 8)}...</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredVoters.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No voters found</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default VotersManagement;
