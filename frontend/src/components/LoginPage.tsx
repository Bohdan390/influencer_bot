import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, AlertCircle, User, Building2 } from "lucide-react";

interface LoginPageProps {
  onLogin: () => void;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const LoginPage = ({ onLogin }: LoginPageProps) => {
  const [loginData, setLoginData] = useState({
    email: "",
    password: ""
  });
  
  const [signupData, setSignupData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    full_name: "",
    company: "Dermao"
  });
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      const result = await response.json();

      if (result.success) {
        // Store authentication data
        localStorage.setItem("dermao_authenticated", "true");
        localStorage.setItem("dermao_token", result.data.token);
        localStorage.setItem("dermao_user", JSON.stringify(result.data.user));
        
        setSuccess("Login successful!");
        setTimeout(() => onLogin(), 1000);
      } else {
        setError(result.error || "Login failed");
      }
    } catch (error) {
      console.error('Login error:', error);
      setError("Failed to connect to server. Please try again.");
    }
    
    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    // Validate passwords match
    if (signupData.password !== signupData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    // Validate password strength
    if (signupData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: signupData.email,
          password: signupData.password,
          full_name: signupData.full_name,
          company: signupData.company
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess("Account created successfully! Please login with your credentials.");
        // Switch to login tab
        setActiveTab("login");
        // Pre-fill login email
        setLoginData(prev => ({ ...prev, email: signupData.email }));
      } else {
        setError(result.error || "Signup failed");
      }
    } catch (error) {
      console.error('Signup error:', error);
      setError("Failed to connect to server. Please try again.");
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Dermao Influencer Hub
            </CardTitle>
            <CardDescription>
              Access your influencer marketing platform
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="Enter your email"
                    value={loginData.email}
                    onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Enter your password"
                    value={loginData.password}
                    onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                    required
                    disabled={isLoading}
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">
                    <User className="w-4 h-4 inline mr-2" />
                    Full Name
                  </Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Enter your full name"
                    value={signupData.full_name}
                    onChange={(e) => setSignupData(prev => ({ ...prev, full_name: e.target.value }))}
                    required
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-company">
                    <Building2 className="w-4 h-4 inline mr-2" />
                    Company
                  </Label>
                  <Input
                    id="signup-company"
                    type="text"
                    placeholder="Enter your company name"
                    value={signupData.company}
                    onChange={(e) => setSignupData(prev => ({ ...prev, company: e.target.value }))}
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your email"
                    value={signupData.email}
                    onChange={(e) => setSignupData(prev => ({ ...prev, email: e.target.value }))}
                    required
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Create a password (8+ characters)"
                    value={signupData.password}
                    onChange={(e) => setSignupData(prev => ({ ...prev, password: e.target.value }))}
                    required
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm">Confirm Password</Label>
                  <Input
                    id="signup-confirm"
                    type="password"
                    placeholder="Confirm your password"
                    value={signupData.confirmPassword}
                    onChange={(e) => setSignupData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    required
                    disabled={isLoading}
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md mt-4">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          
          {success && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-md mt-4">
              <TrendingUp className="w-4 h-4" />
              {success}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage; 