import { Button } from "@/components/ui/button";
import { Shield, CheckCircle, Lock, FileCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <nav className="container mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold text-primary">SecureVote</span>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/auth?mode=signin")}>
            Sign In
          </Button>
          <Button onClick={() => navigate("/auth?mode=signup")}>
            Sign Up
          </Button>
        </div>
      </nav>

      <main className="container mx-auto px-6">
        <section className="py-20 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Secure Online Voting Platform
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Vote with confidence. Verified identity, encrypted ballots, and transparent results
              powered by advanced facial recognition technology.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate("/auth?mode=signup")} className="text-lg">
                Get Started
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/auth?mode=signin")}>
                Sign In to Vote
              </Button>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-card p-6 rounded-lg border shadow-md transition-all hover:shadow-lg">
              <Shield className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Biometric Security</h3>
              <p className="text-muted-foreground">
                Facial recognition ensures only verified voters can cast their ballot
              </p>
            </div>
            <div className="bg-card p-6 rounded-lg border shadow-md transition-all hover:shadow-lg">
              <Lock className="h-12 w-12 text-success mb-4" />
              <h3 className="text-xl font-semibold mb-2">Ballot Secrecy</h3>
              <p className="text-muted-foreground">
                Your vote is encrypted and anonymous. Privacy guaranteed.
              </p>
            </div>
            <div className="bg-card p-6 rounded-lg border shadow-md transition-all hover:shadow-lg">
              <CheckCircle className="h-12 w-12 text-accent mb-4" />
              <h3 className="text-xl font-semibold mb-2">Verified Receipt</h3>
              <p className="text-muted-foreground">
                Get a unique confirmation ID proving your vote was counted
              </p>
            </div>
            <div className="bg-card p-6 rounded-lg border shadow-md transition-all hover:shadow-lg">
              <FileCheck className="h-12 w-12 text-warning mb-4" />
              <h3 className="text-xl font-semibold mb-2">Transparent Results</h3>
              <p className="text-muted-foreground">
                Real-time turnout and published results with full audit trails
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 text-center">
          <div className="bg-primary/5 rounded-2xl p-12 border border-primary/10">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8 mt-8 text-left">
              <div>
                <div className="bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl mb-4">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-2">Register & Verify</h3>
                <p className="text-muted-foreground">
                  Sign up with your email, verify your identity with facial recognition
                </p>
              </div>
              <div>
                <div className="bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl mb-4">
                  2
                </div>
                <h3 className="text-xl font-semibold mb-2">Browse & Choose</h3>
                <p className="text-muted-foreground">
                  Review candidates, read manifestos, and make your informed choice
                </p>
              </div>
              <div>
                <div className="bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl mb-4">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-2">Vote Securely</h3>
                <p className="text-muted-foreground">
                  Verify your identity one more time and cast your encrypted vote
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t mt-20">
        <div className="container mx-auto px-6 py-8 text-center text-muted-foreground">
          <p>&copy; 2025 SecureVote. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;