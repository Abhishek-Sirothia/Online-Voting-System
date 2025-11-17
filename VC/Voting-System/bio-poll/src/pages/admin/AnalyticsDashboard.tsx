import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, BarChart, LineChart } from "lucide-react";
import { toast } from "sonner";
import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";

interface Election {
  id: string;
  title: string;
}

interface VoteData {
  name: string;
  votes: number;
}

const AnalyticsDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElectionId, setSelectedElectionId] = useState<string | null>(null);
  const [voteData, setVoteData] = useState<VoteData[]>([]);

  useEffect(() => {
    const checkAdminAndLoad = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "admin").single();
      if (!roleData) {
        toast.error("Access denied.");
        navigate("/dashboard");
        return;
      }
      await loadElections();
      setLoading(false);
    };
    checkAdminAndLoad();
  }, [navigate]);

  useEffect(() => {
    if (selectedElectionId) {
      loadVoteData(selectedElectionId);
    }
  }, [selectedElectionId]);

  const loadElections = async () => {
    const { data, error } = await supabase.from("elections").select("id, title").eq("status", "ended");
    if (error) {
      toast.error("Failed to load elections.");
    } else {
      setElections(data || []);
      if (data && data.length > 0) {
        setSelectedElectionId(data[0].id);
      }
    }
  };

  const loadVoteData = async (electionId: string) => {
    setLoading(true);
    const { data: candidates, error: cError } = await supabase.from("candidates").select("id, name").eq("election_id", electionId);
    const { data: votes, error: vError } = await supabase.from("votes").select("candidate_id").eq("election_id", electionId);

    if (cError || vError) {
      toast.error("Failed to load vote data.");
      setLoading(false);
      return;
    }

    const voteCounts = votes.reduce((acc, vote) => {
      acc[vote.candidate_id] = (acc[vote.candidate_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const chartData = candidates.map(c => ({
      name: c.name,
      votes: voteCounts[c.id] || 0,
    }));

    setVoteData(chartData);
    setLoading(false);
  };

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
              <LineChart className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Analytics Dashboard</span>
            </div>
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Election Analytics</h1>
          <p className="text-muted-foreground">Visualize election results and user data.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Vote Distribution</CardTitle>
            <CardDescription>Select a completed election to see the vote distribution.</CardDescription>
            <Select onValueChange={setSelectedElectionId} defaultValue={selectedElectionId || undefined}>
              <SelectTrigger className="w-[280px] mt-4">
                <SelectValue placeholder="Select an election" />
              </SelectTrigger>
              <SelectContent>
                {elections.map(election => (
                  <SelectItem key={election.id} value={election.id}>{election.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">Loading chart data...</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={voteData}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="votes" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AnalyticsDashboard;