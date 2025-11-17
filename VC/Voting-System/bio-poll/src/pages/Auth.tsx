import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Shield, Loader2, Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

// Schemas for full form submission
const signUpSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
  phone_number: z.string().min(10, "Phone number must be at least 10 digits").max(15),
});

const signInSchema = z.object({
  email: z.string().email("Invalid email address").max(255),
  password: z.string().min(1, "Password is required"),
});

// Schemas for inline validation
const emailValidationSchema = z.string().email("Invalid email format.");
const passwordValidationSchema = z.string().min(8, "Password must be at least 8 characters.");
const phoneValidationSchema = z.string().regex(/^\d{10,15}$/, "Please enter a valid phone number.");

const Auth = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<"signin" | "signup">(
    (searchParams.get("mode") as "signin" | "signup") || "signin"
  );
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phone_number: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });

    if (value === "") {
      setErrors(prev => ({ ...prev, [id]: null }));
      return;
    }

    let validationResult;
    if (id === 'email') validationResult = emailValidationSchema.safeParse(value);
    else if (id === 'password') validationResult = passwordValidationSchema.safeParse(value);
    else if (id === 'phone_number') validationResult = phoneValidationSchema.safeParse(value);

    if (validationResult) {
      setErrors(prev => ({
        ...prev,
        [id]: validationResult.success ? null : validationResult.error.errors[0].message,
      }));
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const validated = signUpSchema.safeParse(formData);
    if (!validated.success) {
      toast.error(validated.error.errors[0].message);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: validated.data.email,
        password: validated.data.password,
        options: {
          data: {
            full_name: validated.data.fullName,
            phone_number: validated.data.phone_number,
          },
        },
      });

      if (error) throw error;

      toast.success("Account created!", { description: "Please check your email to verify your account." });
      setMode("signin");
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const validated = signInSchema.safeParse(formData);
    if (!validated.success) {
      toast.error(validated.error.errors[0].message);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: validated.data.email,
        password: validated.data.password,
      });

      if (error) throw error;

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .eq("role", "admin")
        .single();

      if (roleData) {
        toast.success("Admin login successful");
        navigate("/admin");
        return;
      }

      const { data: profile } = await supabase.from("profiles").select("face_registered").eq("id", data.user.id).single();

      if (!profile?.face_registered) {
        toast.info("Please register your face to continue");
        navigate("/face-registration");
      } else {
        toast.success("Welcome back!");
        navigate("/dashboard");
      }
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
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
              <Shield className="h-10 w-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">
            {mode === "signin" ? t("welcomeBack") : t("createAccount")}
          </CardTitle>
          <CardDescription>
            {mode === "signin"
              ? "Sign in to access your voting dashboard"
              : "Register to participate in secure elections"}
          </CardDescription>
          <p className="text-xs text-muted-foreground pt-2 flex items-center justify-center gap-1.5">
            🔐 Your data is encrypted and secure.
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={mode === "signin" ? handleSignIn : handleSignUp} className="space-y-4">
            {mode === "signup" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">{t("fullName")}</Label>
                  <Input id="fullName" type="text" placeholder="e.g. John Doe" value={formData.fullName} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone_number">{t("phoneNumber")}</Label>
                  <Input id="phone_number" type="tel" placeholder="e.g. 9876543210" value={formData.phone_number} onChange={handleInputChange} className={cn(errors.phone_number && "border-destructive")} required />
                  {errors.phone_number && <p className="text-xs text-destructive pt-1">{errors.phone_number}</p>}
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">{t("emailAddress")}</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={formData.email} onChange={handleInputChange} className={cn(errors.email && "border-destructive")} required />
              {errors.email && <p className="text-xs text-destructive pt-1">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">{t("password")}</Label>
                {mode === "signin" && (
                  <button type="button" onClick={() => navigate("/forgot-password")} className="text-sm text-primary hover:underline font-medium">
                    {t("forgotPassword")}
                  </button>
                )}
              </div>
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={formData.password} onChange={handleInputChange} className={cn("pr-10", errors.password && "border-destructive")} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center justify-center h-full w-10 text-muted-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive pt-1">{errors.password}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "signin" ? t("signIn") : t("signUp")}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            {mode === "signin" ? (
              <p className="text-muted-foreground">
                {t("noAccount")}{" "}
                <button type="button" onClick={() => setMode("signup")} className="text-primary hover:underline font-medium">{t("signUpHere")}</button>
              </p>
            ) : (
              <p className="text-muted-foreground">
                {t("haveAccount")}{" "}
                <button type="button" onClick={() => setMode("signin")} className="text-primary hover:underline font-medium">{t("signInHere")}</button>
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;