import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, ArrowLeft, Plus, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const candidateSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  party: z.string().max(200).optional(),
  manifesto: z.string().max(2000).optional(),
  photo_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  election_id: z.string().min(1, "Election is required"),
});

type CandidateFormData = z.infer<typeof candidateSchema>;

interface Candidate {
  id: string;
  name: string;
  party: string | null;
  manifesto: string | null;
  photo_url: string | null;
  election_id: string;
  elections: { title: string };
}

interface Election {
  id: string;
  title: string;
}

const CandidatesManagement = () => {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<CandidateFormData>({
    resolver: zodResolver(candidateSchema),
    defaultValues: {
      name: "",
      party: "",
      manifesto: "",
      photo_url: "",
      election_id: "",
    },
  });

  useEffect(() => {
    checkAdminAndLoadData();
  }, []);

  const checkAdminAndLoadData = async () => {
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

    await loadElections();
    await loadCandidates();
  };

  const loadElections = async () => {
    const { data, error } = await supabase
      .from("elections")
      .select("id, title")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load elections");
      console.error(error);
    } else {
      setElections(data || []);
    }
  };

  const loadCandidates = async () => {
    const { data, error } = await supabase
      .from("candidates")
      .select("*, elections(title)")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load candidates");
      console.error(error);
    } else {
      setCandidates(data || []);
    }
    setLoading(false);
  };

  const onSubmit = async (data: CandidateFormData) => {
    const { error } = await supabase.from("candidates").insert({
      name: data.name,
      party: data.party || null,
      manifesto: data.manifesto || null,
      photo_url: data.photo_url || null,
      election_id: data.election_id,
    });

    if (error) {
      toast.error("Failed to add candidate");
      console.error(error);
    } else {
      toast.success("Candidate added successfully");
      form.reset();
      setIsDialogOpen(false);
      loadCandidates();
    }
  };

  const deleteCandidate = async (id: string) => {
    if (!confirm("Are you sure you want to delete this candidate?")) return;

    const { error } = await supabase
      .from("candidates")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete candidate");
      console.error(error);
    } else {
      toast.success("Candidate deleted");
      loadCandidates();
    }
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
              <span className="text-xl font-bold">Candidates Management</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Manage Candidates</h1>
            <p className="text-muted-foreground">Add and edit candidate information</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Candidate
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Candidate</DialogTitle>
                <DialogDescription>Fill in the candidate details</DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="election_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Election</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an election" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {elections.map((election) => (
                              <SelectItem key={election.id} value={election.id}>
                                {election.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Candidate Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="party"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Party Affiliation</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Independent" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="photo_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Photo URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/photo.jpg" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="manifesto"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Manifesto</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Candidate's platform and policies..." rows={5} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full">Add Candidate</Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {candidates.map((candidate) => (
            <Card key={candidate.id}>
              <CardHeader>
                <div className="flex items-start gap-4">
                  {candidate.photo_url && (
                    <img
                      src={candidate.photo_url}
                      alt={candidate.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <CardTitle className="text-lg">{candidate.name}</CardTitle>
                    <CardDescription>{candidate.party || "Independent"}</CardDescription>
                    <p className="text-sm text-muted-foreground mt-1">
                      {candidate.elections.title}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {candidate.manifesto && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {candidate.manifesto}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button size="sm" variant="destructive" onClick={() => deleteCandidate(candidate.id)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default CandidatesManagement;
