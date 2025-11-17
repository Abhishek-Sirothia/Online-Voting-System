import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Lock, Loader2 } from "lucide-react";

const VerifyOtp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      toast.error("No email provided. Please start the process again.");
      navigate("/forgot-password");
    }
  }, [email, navigate]);

  const handleVerifyAndUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }
    setLoading(true);

    try {
      // Step 1: Verify the OTP
      const { data, error: otpError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email",
      });

      if (otpError) throw otpError;
      if (!data.session) throw new Error("Could not verify OTP. Please try again.");

      // Step 2: If OTP is correct, update the password for the now-authenticated user
      const { error: updateError } = await supabase.auth.updateUser({ password });
      
      if (updateError) throw updateError;

      toast.success("Password updated successfully!", {
        description: "You can now sign in with your new password.",
      });
      navigate("/auth");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-6">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <Lock className="h-10 w-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Verify and Update Password</CardTitle>
          <CardDescription>
            Enter the OTP from your email and set a new password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerifyAndUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code (OTP)</Label>
              <Input
                id="otp"
                type="text"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyOtp;