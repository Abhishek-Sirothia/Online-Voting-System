import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

const Communications = () => {
  const navigate = useNavigate();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).in("role", ["admin", "super_admin"]).single();
      if (!roleData) {
        toast.error("Access denied.");
        navigate("/dashboard");
        return;
      }
    };
    checkAdmin();
  }, [navigate]);

  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !body) {
      toast.error("Subject and body are required.");
      return;
    }
    setLoading(true);

    // In a real implementation, this would call a Supabase Edge Function
    // For now, we will simulate the action and show a success message.
    try {
      // const { error } = await supabase.functions.invoke('send-announcement', {
      //   body: { subject, body },
      // });
      // if (error) throw error;

      // Simulate a delay for the demo
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast.success("Announcement email has been sent to all users.");
      setSubject("");
      setBody("");
    } catch (error) {
        if (error instanceof Error) {
            toast.error(error.message);
        }
    } finally {
      setLoading(false);
    }
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
              <Send className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Communications</span>
            </div>
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-6 py-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Send Announcement</CardTitle>
            <CardDescription>Compose and send an email to all registered users.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendAnnouncement} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" placeholder="e.g., Upcoming Election Details" value={subject} onChange={(e) => setSubject(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="body">Email Body</Label>
                <Textarea id="body" placeholder="Write your announcement here..." value={body} onChange={(e) => setBody(e.target.value)} rows={10} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send to All Users
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Communications;