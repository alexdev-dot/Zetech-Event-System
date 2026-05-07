import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/hooks/use-toast";
import { LogIn, Shield, GraduationCap, ArrowLeft, Eye, EyeOff, UserPlus, Lock, AlertCircle, Mail } from "lucide-react";
import { useEffect } from "react";
import zetechLogo from "@/assets/zetech-logo.png";
import heroBgImage from "https://www.zetech.ac.ke/images/campuses/Ruiru_Campus.png";

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [admissionNumber, setAdmissionNumber] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "admin">("student");
  const [showPassword, setShowPassword] = useState(false);
  const [isNewStudent, setIsNewStudent] = useState(false);
  
  // New student form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [newStudentPassword, setNewStudentPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const navigate = useNavigate();
  const { user, signIn, createStudentAccount, adminSignIn } = useAuth();

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate("/admin/dashboard");
      } else {
        navigate("/");
      }
    }
  }, [user, navigate]);

  const handleCreateStudentAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Validation
      if (!firstName.trim() || !lastName.trim()) {
        throw new Error("First name and last name are required");
      }
      
      if (!admissionNumber.trim()) {
        throw new Error("Admission number is required");
      }
      
      if (newStudentPassword.length < 6) {
        throw new Error("Password must be at least 6 characters long");
      }
      
      if (newStudentPassword !== confirmPassword) {
        throw new Error("Passwords do not match");
      }
      
      await createStudentAccount(firstName, lastName, admissionNumber, newStudentPassword);
      toast({ 
        title: "Account Created Successfully! 🎉", 
        description: "Your student account has been created. You can now log in."
      });
      setIsNewStudent(false);
      // Clear form
      setFirstName("");
      setLastName("");
      setNewStudentPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({ 
        title: "Account Creation Error", 
        description: error.message || "Failed to create account",
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (role === "admin") {
        await adminSignIn(admissionNumber, password);
        toast({ title: "Welcome Admin! 👋" });
        navigate("/admin/dashboard");
      } else {
        // Student login - use admission number
        await signIn(admissionNumber, password);
        toast({ title: "Welcome back! 👋" });
        navigate("/");
      }
    } catch (error: any) {
      toast({ 
        title: "Authentication Error", 
        description: error.message || "Invalid credentials",
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const campuses = [
    "Ruiru Campus",
    "Mang'u Campus", 
    "CBD (Nairobi Campus)"
  ];

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

                  {/* Login/Create Account Card - Full Height */}
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
                        <p className="text-gray-600">
                          {isNewStudent ? "Create your student account" : "Sign in to access campus events"}
                        </p>
                      </div>

                      <div className="mb-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">
                          {isNewStudent ? "Create Student Account" : "Welcome Back"}
                        </h2>
                        <p className="text-sm text-gray-600">
                          {isNewStudent 
                            ? "Enter your details to create a new student account" 
                            : "Enter your admission number and password to sign in"
                          }
                        </p>
                      </div>

                      {/* Toggle between Login and Create Account */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-700">
                            {isNewStudent ? "Already have an account?" : "New Student?"}
                          </span>
                          <Button
                            variant="link"
                            onClick={() => setIsNewStudent(!isNewStudent)}
                            className="text-blue-600 hover:text-blue-700 p-0 h-auto font-medium"
                          >
                            {isNewStudent ? "Sign In" : "Create Account"}
                          </Button>
                        </div>
                      </div>

                      {/* Role Selection - Only show for login */}
                      {!isNewStudent && (
                        <div className="mb-6">
                          <Label className="block text-sm font-medium text-gray-700 mb-3">Select Your Role</Label>
                          <RadioGroup value={role} onValueChange={(value) => setRole(value as "student" | "admin")} className="flex flex-col space-y-2">
                            <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                              <RadioGroupItem value="student" id="student" />
                              <Label htmlFor="student" className="flex items-center cursor-pointer">
                                <GraduationCap className="w-4 h-4 mr-2 text-blue-600" />
                                <div>
                                  <div className="font-medium">Student</div>
                                  <div className="text-xs text-gray-500">Access events and activities</div>
                                </div>
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                              <RadioGroupItem value="admin" id="admin" />
                              <Label htmlFor="admin" className="flex items-center cursor-pointer">
                                <Shield className="w-4 h-4 mr-2 text-red-600" />
                                <div>
                                  <div className="font-medium">Administrator</div>
                                  <div className="text-xs text-gray-500">Manage events and system</div>
                                </div>
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>
                      )}

                      {/* Login Form */}
                      {!isNewStudent ? (
                        <form onSubmit={handleLogin} className="space-y-4">
                          {role === "student" && (
                            <div>
                              <Label htmlFor="studentAdmission" className="block text-sm font-medium text-gray-700 mb-1">Admission Number</Label>
                              <Input
                                id="studentAdmission"
                                type="text"
                                value={admissionNumber}
                                onChange={(e) => setAdmissionNumber(e.target.value)}
                                placeholder="Enter any admission number"
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Any valid admission number format is accepted
                              </p>
                            </div>
                          )}
                          {role === "admin" && (
                            <div>
                              <Label htmlFor="adminIdentifier" className="block text-sm font-medium text-gray-700 mb-1">Admin ID/Email</Label>
                              <Input
                                id="adminIdentifier"
                                type="text"
                                value={admissionNumber}
                                onChange={(e) => setAdmissionNumber(e.target.value)}
                                placeholder="Admin ID or email"
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Enter your admin identifier
                              </p>
                            </div>
                          )}
                          <div>
                            <Label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</Label>
                            <div className="relative">
                              <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                                minLength={6}
                                className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                              >
                                {showPassword ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                          
                          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 px-4 rounded-lg transition duration-200" disabled={loading}>
                            {loading ? "Please wait..." : "Sign In"}
                          </Button>
                        </form>
                      ) : (
                        /* Create Student Account Form */
                        <form onSubmit={handleCreateStudentAccount} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">First Name</Label>
                              <div className="relative">
                                <UserPlus className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                  id="firstName"
                                  type="text"
                                  value={firstName}
                                  onChange={(e) => setFirstName(e.target.value)}
                                  placeholder="John"
                                  required
                                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Last Name</Label>
                              <div className="relative">
                                <UserPlus className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                  id="lastName"
                                  type="text"
                                  value={lastName}
                                  onChange={(e) => setLastName(e.target.value)}
                                  placeholder="Doe"
                                  required
                                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </div>
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="newStudentAdmission" className="block text-sm font-medium text-gray-700 mb-1">Admission Number</Label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                              <Input
                                id="newStudentAdmission"
                                type="text"
                                value={admissionNumber}
                                onChange={(e) => setAdmissionNumber(e.target.value)}
                                placeholder="Any admission number format"
                                required
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Any admission number format is accepted (BSIT, DCS, BIT, etc.)
                            </p>
                          </div>

                          <div>
                            <Label htmlFor="newStudentPassword" className="block text-sm font-medium text-gray-700 mb-1">Password</Label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                              <Input
                                id="newStudentPassword"
                                type={showPassword ? "text" : "password"}
                                value={newStudentPassword}
                                onChange={(e) => setNewStudentPassword(e.target.value)}
                                placeholder="Create a password"
                                required
                                minLength={6}
                                className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                              >
                                {showPassword ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Minimum 6 characters
                            </p>
                          </div>

                          <div>
                            <Label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</Label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                              <Input
                                id="confirmPassword"
                                type={showPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm your password"
                                required
                                minLength={6}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                          </div>
                          
                          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 px-4 rounded-lg transition duration-200" disabled={loading}>
                            {loading ? "Creating Account..." : "Create Account"}
                          </Button>
                        </form>
                      )}

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
