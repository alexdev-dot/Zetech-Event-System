import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/hooks/use-toast";
import {
  LogIn,
  Shield,
  GraduationCap,
  ArrowLeft,
  Eye,
  EyeOff,
  UserPlus,
  Lock,
  Mail,
  Users,
} from "lucide-react";
import zetechLogo from "@/assets/zetech-logo.png";

type RoleType = "student" | "admin" | "club_leader";

const Auth = () => {
  const [loadingForm, setLoadingForm] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<RoleType>("student");
  const [showPassword, setShowPassword] = useState(false);
  const [isNewStudent, setIsNewStudent] = useState(false);

  // Registration fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [newStudentPassword, setNewStudentPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const navigate = useNavigate();
  const { user, loading, signIn, createStudentAccount, adminSignIn } =
    useAuth();

  useEffect(() => {
    if (!loading && user) {
      if (user.role === "admin") navigate("/admin/dashboard");
      else if (user.role === "club_leader") navigate("/club-leader/dashboard");
      else navigate("/");
    }
  }, [user, loading, navigate]);

  const handleCreateStudentAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingForm(true);
    try {
      if (!firstName.trim() || !lastName.trim())
        throw new Error("First and last name are required");
      if (!studentEmail.trim()) throw new Error("Email address is required");
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(studentEmail))
        throw new Error("Please enter a valid email address");
      if (!identifier.trim()) throw new Error("Admission number is required");
      if (newStudentPassword.length < 6)
        throw new Error("Password must be at least 6 characters");
      if (newStudentPassword !== confirmPassword)
        throw new Error("Passwords do not match");

      await createStudentAccount(
        firstName.trim(),
        lastName.trim(),
        studentEmail.trim(),
        identifier.trim(),
        newStudentPassword,
      );
      toast({
        title: "Account Created!",
        description: "Welcome to Zetech Events Hub.",
      });
    } catch (error: any) {
      toast({
        title: "Registration Error",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setLoadingForm(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingForm(true);
    try {
      if (!identifier.trim() || !password)
        throw new Error("All fields are required");

      if (role === "student") {
        await signIn(identifier.trim(), password);
        toast({ title: "Welcome back!" });
        navigate("/");
      } else {
        // admin or club_leader — both use email login
        await adminSignIn(identifier.trim(), password);
        toast({ title: "Welcome!" });
        // redirect handled by useEffect above
      }
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setLoadingForm(false);
    }
  };

  const identifierLabel: Record<RoleType, string> = {
    student: "Admission Number",
    admin: "Admin Email",
    club_leader: "Club Leader Email",
  };

  const identifierPlaceholder: Record<RoleType, string> = {
    student: "e.g. BIT-01-0001/2024",
    admin: "admin@zetech.ac.ke",
    club_leader: "clubleader@zetech.ac.ke",
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex">
      {/* Left panel — form */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 py-8 sm:py-12">
        <div className="w-full max-w-md">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-4 sm:mb-6 text-gray-600 min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Go home
          </Button>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">
            {/* Logo */}
            <div className="text-center mb-6 sm:mb-8">
              <img
                src={zetechLogo}
                alt="Zetech University"
                className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 object-contain"
              />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                Zetech Events Hub
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {isNewStudent
                  ? "Create your student account"
                  : "Sign in to access campus events"}
              </p>
            </div>

            {/* Toggle login / register */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-4 sm:mb-6">
              <span className="text-sm text-gray-600">
                {isNewStudent ? "Already have an account?" : "New student?"}
              </span>
              <Button
                variant="link"
                onClick={() => {
                  setIsNewStudent(!isNewStudent);
                  setIdentifier("");
                  setPassword("");
                }}
                className="text-blue-600 p-0 h-auto font-medium text-sm min-h-[44px]"
              >
                {isNewStudent ? "Sign In" : "Create Account"}
              </Button>
            </div>

            {/* Role selector — login only */}
            {!isNewStudent && (
              <div className="mb-4 sm:mb-6">
                <Label className="text-sm font-medium text-gray-700 mb-3 block">
                  Sign in as
                </Label>
                {/* Mobile dropdown */}
                <div className="sm:hidden mb-4">
                  <select
                    value={role}
                    onChange={(e) => {
                      setRole(e.target.value as RoleType);
                      setIdentifier("");
                    }}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 bg-white text-sm font-medium focus:border-primary focus:outline-none min-h-[48px]"
                  >
                    <option value="student">Student</option>
                    <option value="admin">Administrator</option>
                    <option value="club_leader">Club Leader</option>
                  </select>
                </div>
                {/* Desktop radio group */}
                <RadioGroup
                  value={role}
                  onValueChange={(v) => {
                    setRole(v as RoleType);
                    setIdentifier("");
                  }}
                  className="space-y-2 hidden sm:block"
                >
                  <div className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors min-h-[56px]">
                    <RadioGroupItem value="student" id="role-student" />
                    <Label
                      htmlFor="role-student"
                      className="flex items-center gap-2 cursor-pointer flex-1"
                    >
                      <GraduationCap className="w-4 h-4 text-blue-600" />
                      <div>
                        <div className="font-medium text-sm">Student</div>
                        <div className="text-xs text-gray-500">
                          Discover and register for events
                        </div>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors min-h-[56px]">
                    <RadioGroupItem value="admin" id="role-admin" />
                    <Label
                      htmlFor="role-admin"
                      className="flex items-center gap-2 cursor-pointer flex-1"
                    >
                      <Shield className="w-4 h-4 text-red-600" />
                      <div>
                        <div className="font-medium text-sm">Administrator</div>
                        <div className="text-xs text-gray-500">
                          Manage events and system
                        </div>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors min-h-[56px]">
                    <RadioGroupItem value="club_leader" id="role-club-leader" />
                    <Label
                      htmlFor="role-club-leader"
                      className="flex items-center gap-2 cursor-pointer flex-1"
                    >
                      <Users className="w-4 h-4 text-green-600" />
                      <div>
                        <div className="font-medium text-sm">Club Leader</div>
                        <div className="text-xs text-gray-500">
                          Manage your club's events
                        </div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* Login Form */}
            {!isNewStudent ? (
              <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
                <div>
                  <Label
                    htmlFor="identifier"
                    className="text-sm font-medium text-gray-700 mb-1 block"
                  >
                    {identifierLabel[role]}
                  </Label>
                  <Input
                    id="identifier"
                    type={role === "student" ? "text" : "email"}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={identifierPlaceholder[role]}
                    required
                    autoComplete={role === "student" ? "username" : "email"}
                    className="h-12 sm:h-10"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="password"
                    className="text-sm font-medium text-gray-700 mb-1 block"
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      autoComplete="current-password"
                      className="pr-12 h-12 sm:h-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full h-12 sm:h-10" disabled={loadingForm}>
                  {loadingForm ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <LogIn className="w-4 h-4" /> Sign In
                    </span>
                  )}
                </Button>
              </form>
            ) : (
              /* Registration Form */
              <form onSubmit={handleCreateStudentAccount} className="space-y-4 sm:space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label
                      htmlFor="firstName"
                      className="text-sm font-medium text-gray-700 mb-1 block"
                    >
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="John"
                      required
                      className="h-12 sm:h-10"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="lastName"
                      className="text-sm font-medium text-gray-700 mb-1 block"
                    >
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                      required
                      className="h-12 sm:h-10"
                    />
                  </div>
                </div>

                <div>
                  <Label
                    htmlFor="regAdmission"
                    className="text-sm font-medium text-gray-700 mb-1 block"
                  >
                    Admission Number
                  </Label>
                  <Input
                    id="regAdmission"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. BIT-01-0001/2024"
                    required
                    className="h-12 sm:h-10"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="studentEmail"
                    className="text-sm font-medium text-gray-700 mb-1 block"
                  >
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="studentEmail"
                      type="email"
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="pl-10 h-12 sm:h-10"
                    />
                  </div>
                </div>

                <div>
                  <Label
                    htmlFor="regPassword"
                    className="text-sm font-medium text-gray-700 mb-1 block"
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="regPassword"
                      type={showPassword ? "text" : "password"}
                      value={newStudentPassword}
                      onChange={(e) => setNewStudentPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      required
                      minLength={6}
                      className="pl-10 pr-12 h-12 sm:h-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <Label
                    htmlFor="confirmPassword"
                    className="text-sm font-medium text-gray-700 mb-1 block"
                  >
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat your password"
                      required
                      minLength={6}
                      className="pl-10 h-12 sm:h-10"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full h-12 sm:h-10" disabled={loadingForm}>
                  {loadingForm ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating account...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <UserPlus className="w-4 h-4" /> Create Account
                    </span>
                  )}
                </Button>
              </form>
            )}

            <div className="mt-6 text-center text-sm text-gray-400 space-x-2 sm:space-x-4">
              <a
                href="https://elearning.zetech.ac.ke/login/forgot_password.php"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-600 inline-block min-h-[44px] py-2"
              >
                Forgot Password?
              </a>
              <span className="hidden sm:inline">·</span>
              <a
                href="https://zetech.ac.ke"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-600 inline-block min-h-[44px] py-2"
              >
                Zetech Website
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — two images (hidden on mobile) */}
      <div className="hidden lg:flex w-2/5 rounded-r-2xl overflow-hidden">
        <div className="flex-1 grid grid-rows-2 gap-2 h-full">
          <div className="relative overflow-hidden">
            <img
              src="https://www.zetech.ac.ke/images/students-gallery/1K1A1621.JPG"
              alt="Login image 1"
              className="w-full h-full object-cover absolute inset-0"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent flex items-end p-6">
              <div>
                <h3 className="text-white text-xl font-semibold">
                  Campus Community
                </h3>
                <p className="text-white/80 text-sm">
                  Join clubs, meet peers, and make the most of your time at
                  Zetech
                </p>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden">
            <img
              src="https://www.zetech.ac.ke/images/students-gallery/1K1A1386.JPG"
              alt="Login image 2"
              className="w-full h-full object-cover absolute inset-0"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent flex items-end p-6">
              <div>
                <h3 className="text-white text-xl font-semibold">
                  Student life at Zetech
                </h3>
                <p className="text-white/80 text-sm">
                  Experience vibrant campus events, worshops, and activities
                  that enrich your university journey
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
