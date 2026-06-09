"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { apiClient } from "@/lib/apiClient";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/providers/AuthProvider";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { useTheme } from "next-themes";
import { Eye, Users, Camera, Shield } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Viewer");
  const [googleId, setGoogleId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { login, isAuthenticated } = useAuth();

  React.useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }

    // Auto-fill Google details if passed from login page
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const prefillEmail = params.get("email");
      const prefillName = params.get("name");
      const prefillGoogleId = params.get("googleId");
      
      if (prefillEmail) setEmail(prefillEmail);
      if (prefillName) setName(prefillName);
      if (prefillGoogleId) setGoogleId(prefillGoogleId);
    }
  }, [isAuthenticated, router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await apiClient("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password, role, googleId: googleId || undefined }),
      });
      toast({
        title: "Registration Successful",
        description: "You can now sign in.",
      });
      router.push("/login");
    } catch (err: unknown) {
      toast({
        title: "Registration Failed",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (
    credentialResponse: CredentialResponse
  ) => {
    try {
      setIsLoading(true);
      const response = await apiClient("/api/auth/google", {
        method: "POST",
        body: JSON.stringify({ idToken: credentialResponse.credential }),
      });

      if (response.isNewUser) {
        setEmail(response.data.email);
        setName(response.data.name);
        setGoogleId(response.data.googleId);
        toast({
          title: "Almost there!",
          description: "Please set a password and select a role to complete your registration.",
        });
        return;
      }

      login(response.data.token, response.data.user);
      toast({
        title: "Welcome",
        description: "You have successfully signed in with Google.",
      });
      router.push("/dashboard");
    } catch (err: unknown) {
      toast({
        title: "Google Login Failed",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    toast({
      title: "Google Login Failed",
      description: "Could not connect to Google",
      variant: "destructive",
    });
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.15),transparent_55%),radial-gradient(circle_at_bottom,_rgba(236,72,153,0.12),transparent_65%)] dark:bg-[#0B0E14] dark:bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.02),transparent_70%)]">
      {/* Background overlay layer */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.3),transparent_60%)] dark:hidden"></div>

      <div className="relative z-10 w-full">
        <div className="flex flex-col lg:flex-row min-h-screen">
          {/* Left Side - Roles Guide */}
          <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-8 lg:p-12">
            <div className="relative z-10 max-w-lg w-full space-y-6">
              {/* Main Welcome Card */}
              <div className="rounded-[28px] border border-fuchsia-400/30 dark:border-white/5 bg-gradient-to-br from-fuchsia-500/25 via-fuchsia-500/10 to-fuchsia-500/5 dark:bg-[#18181B]/80 backdrop-blur-sm shadow-[0_30px_80px_rgba(217,70,239,0.2)] dark:shadow-none p-4 sm:p-8">
                <h1 className="text-2xl lg:text-3xl font-semibold text-gray-900 dark:text-white mb-3 tracking-tight text-center">
                  SnapSync Roles Guide
                </h1>
                <p className="text-lg lg:text-xl text-gray-700 dark:text-white/60 font-medium leading-relaxed text-center">
                  Learn about the different roles available on the platform and their respective permissions.
                </p>
              </div>

              {/* Feature Cards Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Feature Card 1 - Viewer */}
                <div className="relative group cursor-pointer">
                  <div className="h-full rounded-[20px] border border-sky-400/30 dark:border-sky-500/20 bg-gradient-to-br from-sky-500/25 via-sky-500/10 to-sky-500/5 dark:from-sky-500/10 dark:via-[#18181B] dark:to-[#18181B] backdrop-blur-md shadow-[0_20px_60px_rgba(2,132,199,0.15)] dark:shadow-none p-4 transition-all duration-300 group-hover:scale-[1.03] group-hover:shadow-[0_0_60px_rgba(14,165,233,0.5)] dark:group-hover:shadow-[0_0_40px_rgba(14,165,233,0.15)] group-hover:border-sky-500/80 dark:group-hover:border-sky-500/40 bg-white/40 dark:bg-[#18181B]/90">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="rounded-xl border border-sky-400/30 dark:border-sky-500/20 bg-sky-500/20 dark:bg-sky-500/10 backdrop-blur-sm p-2 transition-transform duration-300 group-hover:scale-110">
                        <Eye className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                      </div>
                      <h3 className="text-md font-semibold text-gray-900 dark:text-white transition-colors duration-300 group-hover:text-sky-700 dark:group-hover:text-sky-300">
                        Viewer
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-white/60 leading-relaxed transition-colors duration-300 group-hover:text-gray-900 dark:group-hover:text-white/90">
                      Can just view images in the galleries. Cannot upload or manage events.
                    </p>
                  </div>
                </div>

                {/* Feature Card 2 - Club Member */}
                <div className="relative group cursor-pointer">
                  <div className="h-full rounded-[20px] border border-emerald-400/30 dark:border-emerald-500/20 bg-gradient-to-br from-emerald-500/30 via-emerald-500/15 to-emerald-500/5 dark:from-emerald-500/10 dark:via-[#18181B] dark:to-[#18181B] backdrop-blur-md shadow-[0_20px_60px_rgba(16,185,129,0.15)] dark:shadow-none p-4 transition-all duration-300 group-hover:scale-[1.03] group-hover:shadow-[0_0_60px_rgba(16,185,129,0.5)] dark:group-hover:shadow-[0_0_40px_rgba(16,185,129,0.15)] group-hover:border-emerald-500/80 dark:group-hover:border-emerald-500/40 bg-white/40 dark:bg-[#18181B]/90">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="rounded-xl border border-emerald-400/30 dark:border-emerald-500/20 bg-emerald-500/20 dark:bg-emerald-500/10 backdrop-blur-sm p-2 transition-transform duration-300 group-hover:scale-110">
                        <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <h3 className="text-md font-semibold text-gray-900 dark:text-white transition-colors duration-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
                        Club Member
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-white/60 leading-relaxed transition-colors duration-300 group-hover:text-gray-900 dark:group-hover:text-white/90">
                      Can view galleries and add their own photos to events.
                    </p>
                  </div>
                </div>

                {/* Feature Card 3 - Photographer */}
                <div className="relative group cursor-pointer">
                  <div className="h-full rounded-[20px] border border-amber-400/30 dark:border-amber-500/20 bg-gradient-to-br from-amber-500/25 via-amber-500/10 to-amber-500/5 dark:from-amber-500/10 dark:via-[#18181B] dark:to-[#18181B] backdrop-blur-md shadow-[0_20px_60px_rgba(245,158,11,0.15)] dark:shadow-none p-4 transition-all duration-300 group-hover:scale-[1.03] group-hover:shadow-[0_0_60px_rgba(245,158,11,0.5)] dark:group-hover:shadow-[0_0_40px_rgba(245,158,11,0.15)] group-hover:border-amber-500/80 dark:group-hover:border-amber-500/40 bg-white/40 dark:bg-[#18181B]/90">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="rounded-xl border border-amber-400/30 dark:border-amber-500/20 bg-amber-500/20 dark:bg-amber-500/10 backdrop-blur-sm p-2 transition-transform duration-300 group-hover:scale-110">
                        <Camera className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <h3 className="text-md font-semibold text-gray-900 dark:text-white transition-colors duration-300 group-hover:text-amber-700 dark:group-hover:text-amber-300">
                        Photographer
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-white/60 leading-relaxed transition-colors duration-300 group-hover:text-gray-900 dark:group-hover:text-white/90">
                      Can add photos and also create new events for clients.
                    </p>
                  </div>
                </div>

                {/* Feature Card 4 - Admin */}
                <div className="relative group cursor-pointer">
                  <div className="h-full rounded-[20px] border border-red-400/30 dark:border-red-500/20 bg-gradient-to-br from-red-500/25 via-red-500/10 to-red-500/5 dark:from-red-500/10 dark:via-[#18181B] dark:to-[#18181B] backdrop-blur-md shadow-[0_20px_60px_rgba(239,68,68,0.15)] dark:shadow-none p-4 transition-all duration-300 group-hover:scale-[1.03] group-hover:shadow-[0_0_60px_rgba(239,68,68,0.5)] dark:group-hover:shadow-[0_0_40px_rgba(239,68,68,0.15)] group-hover:border-red-500/80 dark:group-hover:border-red-500/40 bg-white/40 dark:bg-[#18181B]/90">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="rounded-xl border border-red-400/30 dark:border-red-500/20 bg-red-500/20 dark:bg-red-500/10 backdrop-blur-sm p-2 transition-transform duration-300 group-hover:scale-110">
                        <Shield className="h-5 w-5 text-red-600 dark:text-red-400" />
                      </div>
                      <h3 className="text-md font-semibold text-gray-900 dark:text-white transition-colors duration-300 group-hover:text-red-700 dark:group-hover:text-red-300">
                        Admin
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-white/60 leading-relaxed transition-colors duration-300 group-hover:text-gray-900 dark:group-hover:text-white/90">
                      Full access. Can delete photos, create, and manage events.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Register Form */}
          <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 lg:p-12">
            <div className="w-full max-w-md space-y-6 rounded-[28px] border border-fuchsia-400/30 dark:border-white/5 bg-gradient-to-br from-fuchsia-500/10 via-fuchsia-500/5 to-transparent dark:from-[#18181B] dark:via-[#18181B] dark:to-[#18181B] backdrop-blur-md shadow-[0_30px_80px_rgba(217,70,239,0.15)] dark:shadow-none p-6 sm:p-8 transition-all duration-500 hover:shadow-[0_0_100px_rgba(217,70,239,0.4)] dark:hover:shadow-[0_0_50px_rgba(217,70,239,0.1)] hover:border-fuchsia-500/60 dark:hover:border-white/10 bg-white/40 dark:bg-[#18181B]">
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white text-center tracking-tight">
                  Create Account
                </h2>
                <p className="text-sm sm:text-base text-gray-600 dark:text-white/60 text-center">
                  Join SnapSync today and get started
                </p>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                {/* Name Field */}
                <div className="space-y-2">
                  <label
                    htmlFor="name"
                    className="text-sm font-medium text-gray-700 dark:text-white/80"
                  >
                    Name
                  </label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    required
                    className="w-full bg-white/40 dark:bg-white/5 backdrop-blur-sm border border-fuchsia-400/30 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/30 focus-visible:border-fuchsia-400 dark:focus-visible:border-white/20 focus-visible:ring-fuchsia-500/50 dark:focus-visible:ring-white/10 shadow-[0_10px_30px_rgba(217,70,239,0.05)] dark:shadow-none"
                  />
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-gray-700 dark:text-white/80"
                  >
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full bg-white/40 dark:bg-white/5 backdrop-blur-sm border border-fuchsia-400/30 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/30 focus-visible:border-fuchsia-400 dark:focus-visible:border-white/20 focus-visible:ring-fuchsia-500/50 dark:focus-visible:ring-white/10 shadow-[0_10px_30px_rgba(217,70,239,0.05)] dark:shadow-none"
                  />
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-gray-700 dark:text-white/80"
                  >
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full bg-white/40 dark:bg-white/5 backdrop-blur-sm border border-fuchsia-400/30 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/30 focus-visible:border-fuchsia-400 dark:focus-visible:border-white/20 focus-visible:ring-fuchsia-500/50 dark:focus-visible:ring-white/10 shadow-[0_10px_30px_rgba(217,70,239,0.05)] dark:shadow-none"
                  />
                </div>

                {/* Role Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-white/80">
                    Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 bg-white/40 dark:bg-white/5 backdrop-blur-sm border border-fuchsia-400/30 dark:border-white/10 rounded-md text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 dark:focus:ring-white/10 transition-colors shadow-[0_10px_30px_rgba(217,70,239,0.05)] dark:shadow-none"
                  >
                    <option value="Viewer" className="text-black">Viewer</option>
                    <option value="Club Member" className="text-black">Club Member</option>
                    <option value="Photographer" className="text-black">Photographer</option>
                    <option value="Admin" className="text-black">Admin</option>
                  </select>
                </div>

                {/* Sign Up Button */}
                <Button
                  type="submit"
                  className="w-full rounded-xl border border-fuchsia-400/30 dark:border-white/10 bg-gradient-to-r from-fuchsia-600/80 via-purple-600/80 to-fuchsia-600/80 dark:from-fuchsia-600/60 dark:via-purple-600/60 dark:to-fuchsia-600/60 text-white shadow-[0_15px_35px_rgba(217,70,239,0.3)] dark:shadow-none backdrop-blur-sm transition duration-200 hover:border-fuchsia-300/40 dark:hover:border-white/20 hover:from-fuchsia-500/90 hover:via-purple-500/90 hover:to-fuchsia-500/90 dark:hover:from-fuchsia-500/70 dark:hover:via-purple-500/70 dark:hover:to-fuchsia-500/70 mt-2"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating Account..." : "Sign Up"}
                </Button>
              </form>

              {/* Separator */}
              <div className="relative pt-2">
                <div className="absolute inset-0 flex items-center pt-2">
                  <span className="w-full border-t border-fuchsia-400/20 dark:border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase pt-2">
                  <span className="bg-white/40 dark:bg-[#18181B] px-2 text-gray-600 dark:text-white/40">
                    Or continue with
                  </span>
                </div>
              </div>

              {/* Google OAuth Button */}
              <div className="flex justify-center mt-4">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme="outline"
                  shape="pill"
                />
              </div>

              {/* Login Link */}
              <div className="text-center text-sm pt-2">
                <p className="text-gray-600 dark:text-white/60">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="text-fuchsia-600 dark:text-purple-400 hover:text-fuchsia-700 dark:hover:text-purple-300 transition-colors font-medium"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
