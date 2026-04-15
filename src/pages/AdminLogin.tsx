import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, AlertTriangle, LogIn, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if admin is already logged in
    const adminToken = localStorage.getItem("adminToken");
    if (adminToken) {
      navigate("/admin/dashboard");
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simulate admin authentication (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Demo credentials check
      if (email === "admin@zetech.ac.ke" && password === "admin123") {
        // Store admin token
        localStorage.setItem("adminToken", "demo-admin-token");
        localStorage.setItem("adminUser", JSON.stringify({ email, role: "admin" }));
        
        toast.success("Login successful! Redirecting to admin dashboard...");
        
        setTimeout(() => {
          navigate("/admin/dashboard");
        }, 1000);
      } else {
        toast.error("Invalid credentials. Please try again.");
      }
    } catch (error) {
      toast.error("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 relative overflow-hidden">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23FFD700' fill-opacity='0.1'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z'/%3E%3C/g%3E%3C/svg%3E")`
        }}
      />

      <div className="relative z-10 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8 items-center min-h-screen">
              
              {/* Left Side - Login Form */}
              <div className="flex justify-center items-center min-h-screen">
                <div className="w-full max-w-lg">
                  {/* Back to Home Button */}
                  <div className="mb-4">
                    <Button 
                      variant="ghost" 
                      onClick={() => navigate("/")}
                      className="flex items-center space-x-2 text-white hover:text-white/80"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span>Back to Home</span>
                    </Button>
                  </div>

                  <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-2xl fade-in">
                    <CardHeader className="text-center pb-8">
                      <div className="flex justify-center mb-4">
                        <div className="w-32 h-32 bg-white rounded-full shadow-lg border-4 border-yellow-400 overflow-hidden flex items-center justify-center">
                          <img 
                            src="/src/assets/zetech-logo.png" 
                            alt="Zetech University Logo" 
                            className="w-24 h-24 object-contain"
                            onError={(e) => {
                              e.currentTarget.src = "https://via.placeholder.com/96x96?text=ZU";
                            }}
                          />
                        </div>
                      </div>
                      <CardTitle className="text-3xl text-gray-800 mb-2">Admin Portal</CardTitle>
                      <CardDescription className="text-gray-600 font-medium">
                        Zetech University Event Hub Management
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      <div className="text-center mb-6">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Welcome Back</h2>
                        <p className="text-gray-600">Enter your credentials to access the admin dashboard</p>
                      </div>

                      <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email Field */}
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                            <i className="fas fa-envelope mr-2"></i>Email Address
                          </Label>
                          <Input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@zetech.ac.ke"
                            className="transition-all duration-300 focus:translate-y-[-2px] focus:shadow-lg"
                            required
                          />
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                          <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                            <i className="fas fa-lock mr-2"></i>Password
                          </Label>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              id="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="Enter your password"
                              className="pr-12 transition-all duration-300 focus:translate-y-[-2px] focus:shadow-lg"
                              required
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                              onClick={togglePassword}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>

                        {/* Remember Me & Forgot Password */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="remember"
                              checked={rememberMe}
                              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                            />
                            <Label htmlFor="remember" className="text-sm text-gray-600">
                              Remember me
                            </Label>
                          </div>
                          <a href="#" className="text-sm text-blue-600 hover:text-blue-800 transition-colors">
                            Forgot password?
                          </a>
                        </div>

                        {/* Login Button */}
                        <Button
                          type="submit"
                          disabled={isLoading}
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg"
                        >
                          {isLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Authenticating...
                            </>
                          ) : (
                            <>
                              <LogIn className="mr-2 h-4 w-4" />
                              Sign In
                            </>
                          )}
                        </Button>
                      </form>

                      {/* Security Notice */}
                      <Alert className="bg-yellow-50 border-yellow-200">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <AlertDescription className="text-sm text-yellow-800">
                          <p className="font-semibold mb-1">Security Notice</p>
                          <p>This is a restricted area. Unauthorized access attempts will be logged and reported.</p>
                        </AlertDescription>
                      </Alert>

                      {/* Footer Links */}
                      <div className="text-center text-sm text-gray-600">
                        <p>
                          Don't have an admin account?{" "}
                          <a href="#" className="text-blue-600 hover:text-blue-800 font-medium transition-colors">
                            Contact IT Support
                          </a>
                        </p>
                        <div className="mt-4 flex justify-center space-x-4 text-xs">
                          <a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a>
                          <span>•</span>
                          <a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a>
                          <span>•</span>
                          <a href="#" className="hover:text-blue-600 transition-colors">Help Center</a>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Right Side - Campus Images */}
              <div className="hidden lg:block h-full">
                <div className="relative h-full rounded-lg grid grid-rows-2 gap-0">
                  {/* First Image */}
                  <div className="relative overflow-hidden rounded-lg">
                    <img
                      src="https://www.zetech.ac.ke/images/students-gallery/1K1A1386.JPG"
                      alt="Zetech University Students"
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="eager"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-900/30 to-transparent pointer-events-none"></div>
                    <div className="absolute bottom-4 left-4 text-white">
                      <h3 className="text-lg font-semibold mb-1">Student Life</h3>
                      <p className="text-sm opacity-90">Experience vibrant campus activities</p>
                    </div>
                  </div>
                  {/* Second Image */}
                  <div className="relative overflow-hidden rounded-lg">
                    <img
                      src="https://www.zetech.ac.ke/images/students-gallery/1K1A1621.JPG"
                      alt="Zetech University Campus Life"
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="eager"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-900/30 to-transparent pointer-events-none"></div>
                    <div className="absolute bottom-4 left-4 text-white">
                      <h3 className="text-lg font-semibold mb-1">Campus Community</h3>
                      <p className="text-sm opacity-90">Connect with fellow students</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Images */}
              <div className="lg:hidden h-64 mt-8">
                <div className="relative h-full rounded-lg grid grid-rows-2 gap-0">
                  {/* First Image */}
                  <div className="relative overflow-hidden rounded-lg">
                    <img
                      src="https://www.zetech.ac.ke/images/students-gallery/1K1A1386.JPG"
                      alt="Zetech University Students"
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="eager"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-900/30 to-transparent pointer-events-none"></div>
                    <div className="absolute bottom-4 left-4 text-white">
                      <h3 className="text-lg font-semibold mb-1">Student Life</h3>
                      <p className="text-sm opacity-90">Experience vibrant campus activities</p>
                    </div>
                  </div>
                  {/* Second Image */}
                  <div className="relative overflow-hidden rounded-lg">
                    <img
                      src="https://www.zetech.ac.ke/images/students-gallery/1K1A1621.JPG"
                      alt="Zetech University Campus Life"
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="eager"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-900/30 to-transparent pointer-events-none"></div>
                    <div className="absolute bottom-4 left-4 text-white">
                      <h3 className="text-lg font-semibold mb-1">Campus Community</h3>
                      <p className="text-sm opacity-90">Connect with fellow students</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
