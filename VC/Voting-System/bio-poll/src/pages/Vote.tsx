import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowLeft, Camera, CheckCircle, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Candidate = {
  id: string;
  name: string;
  party: string;
  photo_url: string;
  manifesto: string;
};

const Vote = () => {
  const navigate = useNavigate();
  const { electionId } = useParams();
  const [election, setElection] = useState<any>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [showVerification, setShowVerification] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasVoted, setHasVoted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const loadElection = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: electionData } = await supabase
        .from("elections")
        .select("*")
        .eq("id", electionId)
        .single();

      if (!electionData || electionData.status !== "active") {
        toast.error("This election is not available for voting");
        navigate("/dashboard");
        return;
      }

      setElection(electionData);

      const { data: candidatesData } = await supabase
        .from("candidates")
        .select("*")
        .eq("election_id", electionId);

      setCandidates(candidatesData || []);

      const { data: voteData } = await supabase
        .from("votes")
        .select("id")
        .eq("election_id", electionId)
        .eq("voter_id", session.user.id)
        .single();

      if (voteData) {
        setHasVoted(true);
      }

      setLoading(false);
    };

    loadElection();
  }, [electionId, navigate]);

  const handleCastVote = () => {
    if (!selectedCandidate) {
      toast.error("Please select a candidate");
      return;
    }
    setShowVerification(true);
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play(); // Explicitly play the video
      }
    } catch (error) {
      toast.error("Failed to access camera");
    }
  };

  const verifyAndSubmit = async () => {
    try {
      setVerifying(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // In a real implementation, this would verify face against stored data
      // For demo, we'll simulate verification
      await new Promise(resolve => setTimeout(resolve, 2000));

      const voteReceipt = `VR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const { error } = await supabase
        .from("votes")
        .insert({
          election_id: electionId,
          candidate_id: selectedCandidate,
          voter_id: session.user.id,
          vote_receipt: voteReceipt,
          face_verified: true,
        });

      if (error) throw error;

      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      // Redirect to confirmation page instead of showing toast
      navigate('/vote-confirmation', { 
        state: { 
          receipt: voteReceipt, 
          electionTitle: election.title 
        } 
      });

    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setVerifying(false);
      setShowVerification(false);
    }
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (hasVoted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-16 w-16 text-success mb-4" />
            <h2 className="text-2xl font-bold mb-2">Vote Already Cast</h2>
            <p className="text-muted-foreground text-center mb-6">
              You have already voted in this election
            </p>
            <Button onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <nav className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{election?.title}</h1>
          <p className="text-muted-foreground">{election?.description}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {candidates.map((candidate) => (
            <Card
              key={candidate.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedCandidate === candidate.id
                  ? "ring-2 ring-primary shadow-lg"
                  : ""
              }`}
              onClick={() => setSelectedCandidate(candidate.id)}
            >
              <CardHeader className="text-center">
                <Avatar className="h-24 w-24 mx-auto mb-4">
                  <AvatarImage src={candidate.photo_url} alt={candidate.name} />
                  <AvatarFallback className="text-2xl">
                    {candidate.name.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <CardTitle>{candidate.name}</CardTitle>
                <CardDescription className="font-medium">{candidate.party}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-4">
                  {candidate.manifesto}
                </p>
                {selectedCandidate === candidate.id && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-primary font-medium">
                    <CheckCircle className="h-5 w-5" />
                    Selected
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedCandidate && (
          <div className="mt-8 flex justify-center">
            <Button size="lg" onClick={handleCastVote} className="px-12">
              Cast Vote
            </Button>
          </div>
        )}
      </main>

      <Dialog open={showVerification} onOpenChange={setShowVerification}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verify Your Identity</DialogTitle>
            <DialogDescription>
              Please verify your face to cast your vote securely
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              {!stream ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button onClick={startCamera}>
                    <Camera className="mr-2 h-5 w-5" />
                    Start Verification
                  </Button>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted // Mute the video to help with autoplay policies
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            {stream && (
              <Button onClick={verifyAndSubmit} disabled={verifying} className="w-full">
                {verifying ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Verify & Submit Vote
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Vote;