import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Trophy, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";

type CandidateResult = {
  id: string;
  name: string;
  party: string;
  photo_url: string;
  votes: number;
  percentage: number;
};

const Results = () => {
  const navigate = useNavigate();
  const { electionId } = useParams();
  const [election, setElection] = useState<any>(null);
  const [results, setResults] = useState<CandidateResult[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadResults = async () => {
      const { data: electionData } = await supabase.from("elections").select("*").eq("id", electionId).single();
      if (!electionData || !electionData.results_published) {
        navigate("/dashboard");
        return;
      }
      setElection(electionData);

      const { data: candidatesData } = await supabase.from("candidates").select("*").eq("election_id", electionId);
      const { data: votesData } = await supabase.from("votes").select("candidate_id").eq("election_id", electionId);

      const voteCount = votesData?.length || 0;
      setTotalVotes(voteCount);

      const voteCounts = votesData?.reduce((acc: Record<string, number>, vote) => {
        acc[vote.candidate_id] = (acc[vote.candidate_id] || 0) + 1;
        return acc;
      }, {}) || {};

      const resultsWithVotes = candidatesData?.map((candidate) => ({
        ...candidate,
        votes: voteCounts[candidate.id] || 0,
        percentage: voteCount > 0 ? ((voteCounts[candidate.id] || 0) / voteCount) * 100 : 0,
      })).sort((a, b) => b.votes - a.votes) || [];

      setResults(resultsWithVotes);
      setLoading(false);
    };
    loadResults();
  }, [electionId, navigate]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  const winner = results[0];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <nav className="border-b bg-card/50 backdrop-blur-sm"><div className="container mx-auto px-6 py-4"><Button variant="ghost" onClick={() => navigate("/dashboard")}><ArrowLeft className="h-4 w-4 mr-2" />Back to Dashboard</Button></div></nav>
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8"><h1 className="text-3xl font-bold mb-2">{election?.title} - Results</h1><div className="flex items-center gap-4 text-muted-foreground"><div className="flex items-center gap-2"><Users className="h-4 w-4" /><span>{totalVotes} Total Votes</span></div></div></div>
        {winner && <Card className="mb-8 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20"><CardHeader><div className="flex items-center gap-2 text-primary mb-2"><Trophy className="h-6 w-6" /><span className="text-sm font-medium">Winner</span></div><div className="flex items-center gap-4"><Avatar className="h-20 w-20"><AvatarImage src={winner.photo_url} alt={winner.name} /><AvatarFallback className="text-2xl">{winner.name.split(" ").map(n => n[0]).join("")}</AvatarFallback></Avatar><div className="flex-1"><CardTitle className="text-2xl">{winner.name}</CardTitle><CardDescription className="text-base">{winner.party}</CardDescription></div><div className="text-right"><div className="text-3xl font-bold text-primary">{winner.percentage.toFixed(1)}%</div><div className="text-sm text-muted-foreground">{winner.votes} votes</div></div></div></CardHeader></Card>}
        <Card>
          <CardHeader>
            <CardTitle>Vote Distribution Chart</CardTitle>
            <CardDescription>A visual representation of the final vote counts.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={results}>
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{fill: 'hsl(var(--muted))'}} />
                <Legend />
                <Bar dataKey="votes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Results;