import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ArrowLeft, History } from "lucide-react";
import { toast } from "sonner";

interface AuditLogEntry {
  id: string;
  action: string;
  details: any;
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
  } | null;
}

const AuditLog = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminAndLoadLogs = async () => {
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
      await loadLogs();
    };
    checkAdminAndLoadLogs();
  }, [navigate]);

  const loadLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("audit_log")
      .select("*, profiles(full_name, email)")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load audit logs");
    } else {
      setLogs(data as AuditLogEntry[]);
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
              <History className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Audit Log</span>
            </div>
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Administrator Audit Log</h1>
          <p className="text-muted-foreground">A record of all administrative actions.</p>
        </div>
        <div className="space-y-4">
          {logs.length > 0 ? logs.map((log) => (
            <Card key={log.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{log.action}</p>
                  <p className="text-sm text-muted-foreground">
                    By: {log.profiles?.full_name || 'N/A'} ({log.profiles?.email || 'N/A'})
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  {new Date(log.created_at).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          )) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No audit logs found.
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default AuditLog;