import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Camera, History, Loader2, Edit, Save } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface VoteHistory {
  elections: {
    id: string;
    title: string;
  } | null;
  voted_at: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [votingHistory, setVotingHistory] = useState<VoteHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ fullName: "", avatarUrl: "" });
  const [updating, setUpdating] = useState(false);

  const fetchProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: profileData } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
    setProfile(profileData);
    if (profileData) {
      setFormData({
        fullName: profileData.full_name || "",
        avatarUrl: profileData.avatar_url || "",
      });
    }

    const { data: historyData } = await supabase
      .from("votes")
      .select("voted_at, elections(id, title)")
      .eq("voter_id", session.user.id)
      .order("voted_at", { ascending: false });
      
    setVotingHistory(historyData as any[] || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, [navigate]);
  
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: formData.fullName,
        avatar_url: formData.avatarUrl,
      })
      .eq("id", user.id);
      
    if (error) {
      toast.error("Failed to update profile.");
    } else {
      await fetchProfile(); // Re-fetch profile to get the latest data
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    }
    setUpdating(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-8 max-w-4xl">
        <Card>
          <CardHeader className="text-center relative">
            {!isEditing && (
              <Button variant="outline" size="sm" className="absolute top-4 right-4" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
            <Avatar className="h-32 w-32 mx-auto mb-4 border-4 border-primary">
              <AvatarImage src={profile?.avatar_url} key={profile?.avatar_url} alt={profile?.full_name} className="object-cover" />
              <AvatarFallback className="text-4xl">{getInitials(profile?.full_name)}</AvatarFallback>
            </Avatar>
            {!isEditing ? (
              <>
                <CardTitle className="text-3xl">{profile?.full_name}</CardTitle>
                <CardDescription>{profile?.email}</CardDescription>
                <CardDescription>{profile?.phone_number}</CardDescription>
              </>
            ) : (
              <form onSubmit={handleUpdateProfile} className="space-y-4 text-left px-4 sm:px-12 md:px-20">
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})}/>
                </div>
                <div>
                  <Label htmlFor="avatarUrl">Avatar URL</Label>
                  <Input id="avatarUrl" value={formData.avatarUrl} onChange={(e) => setFormData({...formData, avatarUrl: e.target.value})}/>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button type="button" variant="outline" onClick={() => {
                      setIsEditing(false);
                      setFormData({ fullName: profile.full_name, avatarUrl: profile.avatar_url });
                    }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updating}>
                    {updating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Changes
                  </Button>
                </div>
              </form>
            )}
          </CardHeader>
          <CardContent className="flex justify-center border-t pt-6">
            <Button variant="outline" onClick={() => navigate("/face-registration")}>
              <Camera className="h-4 w-4 mr-2" />
              Re-register Face
            </Button>
          </CardContent>
        </Card>

        <Card className="mt-8">
          <CardHeader>
            <div className="flex items-center gap-2">
              <History className="h-6 w-6 text-primary" />
              <CardTitle>Voting History</CardTitle>
            </div>
            <CardDescription>A record of elections you have participated in.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {votingHistory.length > 0 ? votingHistory.map((vote) => (
                <div key={vote.elections?.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-semibold">{vote.elections?.title}</p>
                    <p className="text-sm text-muted-foreground">Voted on: {new Date(vote.voted_at).toLocaleDateString()}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate(`/results/${vote.elections?.id}`)}>
                    View Results
                  </Button>
                </div>
              )) : (
                <p className="text-center text-muted-foreground py-4">You have not participated in any elections yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Profile;