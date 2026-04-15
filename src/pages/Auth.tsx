import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { LogIn, UserPlus, ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import zetechLogo from "@/assets/zetech-logo.png";
import heroBgImage from "https://www.zetech.ac.ke/images/campuses/Ruiru_Campus.png";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [admissionNumber, setAdmissionNumber] = useState("");
  const [department, setDepartment] = useState("");
  const navigate = useNavigate();
  const { user, signIn } = useAuth();

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      toast({ title: "Welcome back! 👋" });
      navigate("/");
    } catch (error: any) {
      toast({ title: "Login Failed", description: error.message || "Invalid credentials", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !admissionNumber.trim()) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await signIn(email, password);
      toast({ title: "Account created! 🎉" });
      navigate("/");
    } catch (error: any) {
      toast({ title: "Signup Failed", description: error.message || "Could not create account", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8 items-center min-h-screen">
              {/* Left Side - Login Form - Full Height */}
              <div className="flex justify-center items-center min-h-screen">
                <div className="w-full max-w-lg">
                  {/* Go Home Button */}
                  <div className="mb-6">
                    <Button
                      variant="ghost"
                      onClick={() => navigate("/")}
                      className="flex items-center text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Go home
                    </Button>
                  </div>

                  {/* Login Card - Full Height */}
                  <div className="bg-white rounded-lg shadow-lg border border-gray-200 h-full flex flex-col justify-center">
                    <div className="p-8">
                      {/* Logo Section */}
                      <div className="text-center mb-8">
                        <img 
                          src={zetechLogo} 
                          alt="Zetech University Logo" 
                          className="w-20 h-20 mx-auto mb-4 object-contain"
                        />
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">Zetech Event Portal</h1>
                        <p className="text-gray-600">Sign in to access your events and activities</p>
                      </div>

                      <div className="mb-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">
                          {isLogin ? "Welcome Back" : "Create Account"}
                        </h2>
                        <p className="text-sm text-gray-600">
                          {isLogin
                            ? "Enter your credentials to access your account"
                            : "Fill in your details to create a new account"}
                        </p>
                      </div>

                      <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-4">
                        {!isLogin && (
                          <>
                            <div>
                              <Label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">Full Name</Label>
                              <Input
                                id="fullName"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Enter your full name"
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                              />
                            </div>
                            <div>
                              <Label htmlFor="admissionNumber" className="block text-sm font-medium text-gray-700 mb-1">Admission Number</Label>
                              <Input
                                id="admissionNumber"
                                value={admissionNumber}
                                onChange={(e) => setAdmissionNumber(e.target.value)}
                                placeholder="e.g. BSIT-001-2024"
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                              />
                            </div>
                            <div>
                              <Label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">Department</Label>
                              <Input
                                id="department"
                                value={department}
                                onChange={(e) => setDepartment(e.target.value)}
                                placeholder="e.g. School of Computing & IT"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                              />
                            </div>
                          </>
                        )}
                        <div>
                          <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</Label>
                          <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your.email@zetech.ac.ke"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <Label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</Label>
                          <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                            minLength={6}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                          />
                        </div>
                        
                        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 px-4 rounded-lg transition duration-200" disabled={loading}>
                          {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
                        </Button>
                      </form>

                      <div className="mt-6 text-center">
                        <span className="text-sm text-gray-600">
                          {isLogin ? "Don't have an account?" : "Already have an account?"}
                        </span>{" "}
                        <button
                          type="button"
                          onClick={() => setIsLogin(!isLogin)}
                          className="text-sm text-primary hover:text-primary/80 font-medium"
                        >
                          {isLogin ? "Sign Up" : "Sign In"}
                        </button>
                      </div>
                      <div className="mt-6 text-center">
                        <div className="flex justify-center space-x-6 text-sm">
                          <a href="https://elearning.zetech.ac.ke/login/forgot_password.php" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-800">Forgot Password?</a>
                          <a href="https://support.zetech.ac.ke/login" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-800">Help Center</a>
                          <a href="https://zetech.ac.ke" className="text-gray-600 hover:text-gray-800">Zetech Website</a>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Right Side - Campus Images */}
              <div className="lg:hidden h-64 mt-8">
                <div className="relative h-full rounded-lg grid grid-rows-2 gap-0">
                  {/* First Image */}
                  <div className="relative overflow-hidden">
                    <img 
                      src="https://www.zetech.ac.ke/images/students-gallery/1K1A1386.JPG" 
                      alt="Zetech University Students" 
                      className="absolute inset-0 w-full h-full object-cover object-center"
                      loading="eager"
                      style={{
                        filter: 'brightness(0.9) contrast(1.1)',
                        objectFit: 'cover',
                        objectPosition: 'center'
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-transparent pointer-events-none"></div>
                    <div className="absolute bottom-4 left-4 text-white">
                      <h3 className="text-lg font-semibold mb-1">Student Life</h3>
                      <p className="text-sm opacity-90">Experience vibrant campus activities</p>
                    </div>
                  </div>
                  {/* Second Image */}
                  <div className="relative overflow-hidden">
                    <img 
                      src="https://www.zetech.ac.ke/images/students-gallery/1K1A1621.JPG" 
                      alt="Zetech University Campus Life" 
                      className="absolute inset-0 w-full h-full object-cover object-center"
                      loading="eager"
                      style={{
                        filter: 'brightness(0.9) contrast(1.1)',
                        objectFit: 'cover',
                        objectPosition: 'center'
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-transparent pointer-events-none"></div>
                    <div className="absolute bottom-4 left-4 text-white">
                      <h3 className="text-lg font-semibold mb-1">Campus Community</h3>
                      <p className="text-sm opacity-90">Connect with fellow students</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop Images */}
              <div className="hidden lg:block h-full">
                <div className="relative h-full rounded-lg grid grid-rows-2 gap-0">
                  {/* First Image */}
                  <div className="relative overflow-hidden">
                    <img 
                      src="https://www.zetech.ac.ke/images/students-gallery/1K1A1386.JPG" 
                      alt="Zetech University Students" 
                      className="absolute inset-0 w-full h-full object-cover object-center"
                      loading="eager"
                      style={{
                        filter: 'brightness(0.9) contrast(1.1)',
                        objectFit: 'cover',
                        objectPosition: 'center'
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-transparent pointer-events-none"></div>
                    <div className="absolute bottom-4 left-4 text-white">
                      <h3 className="text-lg font-semibold mb-1">Student Life</h3>
                      <p className="text-sm opacity-90">Experience vibrant campus activities</p>
                    </div>
                  </div>
                  {/* Second Image */}
                  <div className="relative overflow-hidden">
                    <img 
                      src="https://www.zetech.ac.ke/images/students-gallery/1K1A1621.JPG" 
                      alt="Zetech University Campus Life" 
                      className="absolute inset-0 w-full h-full object-cover object-center"
                      loading="eager"
                      style={{
                        filter: 'brightness(0.9) contrast(1.1)',
                        objectFit: 'cover',
                        objectPosition: 'center'
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-transparent pointer-events-none"></div>
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
    </Layout>
  );
};

export default Auth;
