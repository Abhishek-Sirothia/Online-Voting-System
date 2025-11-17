import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ArrowLeft } from "lucide-react";
import { useEffect } from "react";

const VoteConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { receipt, electionTitle } = location.state || {};

  // Redirect if accessed directly without state
  useEffect(() => {
    if (!receipt || !electionTitle) {
      navigate("/dashboard");
    }
  }, [receipt, electionTitle, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-success/10 flex items-center justify-center p-6">
      <Card className="max-w-lg w-full text-center shadow-xl">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-success" />
          </div>
          <CardTitle className="text-2xl">Vote Cast Successfully!</CardTitle>
          <CardDescription>
            Your vote for the "{electionTitle}" election has been securely recorded.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm text-muted-foreground">Your unique vote receipt ID:</p>
            <p className="font-mono text-lg font-semibold break-all">{receipt}</p>
          </div>
          <Button className="mt-6 w-full" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default VoteConfirmation;