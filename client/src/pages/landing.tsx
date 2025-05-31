import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Users, 
  BarChart3, 
  Smartphone, 
  Wand2,
  CheckCircle,
  ArrowRight,
  ArrowUp,
  Star,
  Globe,
  Shield,
  Zap,
  X,
  Menu,
  Activity,
  Eye,
  EyeOff
} from "lucide-react";
import { SiFacebook, SiGoogle } from "react-icons/si";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function Landing() {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  // Signup form state
  const [signupForm, setSignupForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem('authToken', data.token);
      setShowLoginModal(false);
      // Force a page refresh to trigger the auth state change
      window.location.reload();
      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Sign in failed",
        description: error.message || "Invalid email or password.",
        variant: "destructive",
      });
    },
  });

  // Signup mutation
  const signupMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/auth/register", data);
      return response.json();
    },
    onSuccess: () => {
      setShowSignupModal(false);
      toast({
        title: "Account created!",
        description: "Please check your email to verify your account.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Registration failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }
    loginMutation.mutate(loginForm);
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupForm.firstName || !signupForm.lastName || !signupForm.email || !signupForm.password) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }
    if (signupForm.password !== signupForm.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }
    signupMutation.mutate({
      firstName: signupForm.firstName,
      lastName: signupForm.lastName,
      email: signupForm.email,
      password: signupForm.password,
    });
  };

  // Handle scroll for back to top button and floating nav
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Enhanced Background with Multiple Gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-900 via-blue-900 to-indigo-900"></div>
      <div className="absolute inset-0 bg-gradient-to-tl from-pink-600/30 via-purple-600/20 to-blue-600/30"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 via-blue-500/10 to-purple-600/10"></div>
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute top-20 -right-4 w-96 h-96 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{animationDelay: '4s'}}></div>
        <div className="absolute top-1/2 right-1/4 w-72 h-72 bg-gradient-to-r from-green-400 to-teal-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{animationDelay: '6s'}}></div>
      </div>

      {/* Floating Navigation with Transparent Blue */}
      <nav className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-500 w-[85%] max-w-5xl ${
        scrolled 
          ? 'bg-blue-600/20 backdrop-blur-xl border border-blue-400/30 shadow-2xl rounded-2xl px-6 py-3' 
          : 'bg-black/20 backdrop-blur-xl border border-white/30 px-8 py-4 rounded-2xl'
      }`}>
        <div className="flex justify-between items-center w-full max-w-full mx-auto px-6 lg:px-8">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-xl transition-all duration-300 ${
              scrolled ? 'scale-90' : 'scale-100'
            }`}>
              <BarChart3 className="h-4 w-4 md:h-6 md:w-6 text-white" />
            </div>
            <h1 className={`font-bold transition-all duration-300 ${
              scrolled 
                ? 'text-lg md:text-xl bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent' 
                : 'text-xl md:text-2xl bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent'
            }`}>
              Survetic
            </h1>
          </div>
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Button 
              onClick={() => setShowLoginModal(true)}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg hover:shadow-xl transition-all duration-300 text-white border-0 transform hover:scale-105 font-semibold"
            >
              Sign In
            </Button>
            <Button 
              onClick={() => setShowSignupModal(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl hover:shadow-2xl transition-all duration-300 text-white border-0 transform hover:scale-105"
            >
              Sign up for free
            </Button>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-white hover:bg-white/20 transition-all duration-300 p-2"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>


        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 mt-2 mx-4 bg-white/90 backdrop-blur-xl border border-white/20 rounded-xl shadow-xl animate-in slide-in-from-top-2 duration-200">
            <div className="p-4 space-y-3">
              <Button 
                onClick={() => {
                  setShowLoginModal(true);
                  setMobileMenuOpen(false);
                }}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg hover:shadow-xl transition-all duration-300 text-white border-0 font-semibold"
              >
                Sign In
              </Button>
              <Button 
                onClick={() => {
                  setShowSignupModal(true);
                  setMobileMenuOpen(false);
                }}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl hover:shadow-2xl transition-all duration-300 text-white border-0"
              >
                Sign up for free
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden py-20 lg:py-32">        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center pt-16">
            <Badge className="mb-8 bg-gradient-to-r from-cyan-400/20 to-blue-600/20 text-cyan-100 border border-cyan-400/30 px-6 py-3 text-sm font-medium backdrop-blur-sm">
              ✨ Professional Survey Platform
            </Badge>
            <h1 className="text-4xl md:text-6xl lg:text-8xl font-bold mb-8 md:mb-12 leading-tight">
              <span className="bg-gradient-to-r from-white via-cyan-200 to-blue-200 bg-clip-text text-transparent drop-shadow-2xl">
                Create Powerful
              </span>
              <br />
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent drop-shadow-2xl">
                Surveys Effortlessly
              </span>
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-cyan-100/90 mb-12 md:mb-16 max-w-4xl mx-auto leading-relaxed drop-shadow-lg px-4">
              Design beautiful surveys with multiple question types, customize your brand experience, 
              and analyze responses with powerful built-in analytics dashboard.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 md:gap-8 justify-center items-center px-4">
              <Button 
                size="lg"
                onClick={handleLogin}
                className="bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:via-blue-500 hover:to-purple-500 text-white text-lg md:text-xl px-8 md:px-12 py-4 md:py-6 shadow-2xl hover:shadow-cyan-500/25 transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 rounded-2xl border-0 w-full sm:w-auto"
              >
                <Zap className="h-5 w-5 md:h-6 md:w-6 mr-2 md:mr-3" />
                <span className="hidden sm:inline">Start Building for Free</span>
                <span className="sm:hidden">Start Building</span>
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => window.location.href = '/guide'}
                className="border-2 border-cyan-300/60 text-white bg-white/10 hover:bg-cyan-400/20 hover:border-cyan-200 hover:text-white text-lg md:text-xl px-8 md:px-12 py-4 md:py-6 transition-all duration-500 backdrop-blur-sm rounded-2xl transform hover:-translate-y-1 shadow-xl hover:shadow-cyan-400/25 w-full sm:w-auto"
              >
                <ArrowRight className="h-5 w-5 md:h-6 md:w-6 mr-2 md:mr-3" />
                <span className="hidden sm:inline">Survey Builder Guide</span>
                <span className="sm:hidden">Guide</span>
              </Button>
            </div>
            
            {/* Enhanced Stats with Gradients */}
            <div className="mt-24 flex flex-col items-center">
              <p className="text-lg text-cyan-200/80 mb-8 font-medium">Everything you need to create professional surveys</p>
              <div className="grid grid-cols-3 gap-12 text-center">
                <div className="group">
                  <div className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300">4</div>
                  <div className="text-cyan-200/70 font-medium">Question Types</div>
                </div>
                <div className="group">
                  <div className="text-5xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300">∞</div>
                  <div className="text-cyan-200/70 font-medium">Responses</div>
                </div>
                <div className="group">
                  <div className="text-5xl font-bold mb-2 group-hover:scale-110 transition-transform duration-300 flex justify-center">
                    <Activity className="h-12 w-12 text-purple-400" />
                  </div>
                  <div className="text-cyan-200/70 font-medium">Real-time Analytics</div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Feature highlights with Stunning Gradients */}
          <div className="mt-40 grid grid-cols-1 md:grid-cols-3 gap-12">
            <Card className="group text-center border-0 bg-white/10 backdrop-blur-xl shadow-2xl hover:shadow-cyan-500/25 transition-all duration-500 transform hover:-translate-y-4 hover:scale-105 relative overflow-hidden rounded-3xl">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 to-blue-600/10 rounded-3xl"></div>
              <CardContent className="pt-12 pb-12 relative z-10">
                <div className="bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl group-hover:scale-125 group-hover:rotate-6 transition-all duration-500">
                  <Wand2 className="text-white h-12 w-12" />
                </div>
                <h3 className="text-3xl font-bold mb-6 text-white group-hover:text-cyan-200 transition-colors duration-300">Survey Builder</h3>
                <p className="text-cyan-100/80 text-lg leading-relaxed">Create surveys with multiple choice, text input, rating scales, and dropdown questions using our intuitive builder</p>
              </CardContent>
            </Card>
            
            <Card className="group text-center border-0 bg-white/10 backdrop-blur-xl shadow-2xl hover:shadow-green-500/25 transition-all duration-500 transform hover:-translate-y-4 hover:scale-105 relative overflow-hidden rounded-3xl">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 via-emerald-500/20 to-teal-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-emerald-600/10 rounded-3xl"></div>
              <CardContent className="pt-12 pb-12 relative z-10">
                <div className="bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl group-hover:scale-125 group-hover:rotate-6 transition-all duration-500">
                  <BarChart3 className="text-white h-12 w-12" />
                </div>
                <h3 className="text-3xl font-bold mb-6 text-white group-hover:text-green-200 transition-colors duration-300">Analytics Dashboard</h3>
                <p className="text-cyan-100/80 text-lg leading-relaxed">View response statistics, completion rates, and export your data with built-in charts and reporting tools</p>
              </CardContent>
            </Card>
            
            <Card className="group text-center border-0 bg-white/10 backdrop-blur-xl shadow-2xl hover:shadow-purple-500/25 transition-all duration-500 transform hover:-translate-y-4 hover:scale-105 relative overflow-hidden rounded-3xl">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-rose-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400/10 to-pink-600/10 rounded-3xl"></div>
              <CardContent className="pt-12 pb-12 relative z-10">
                <div className="bg-gradient-to-br from-purple-400 via-pink-500 to-rose-600 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl group-hover:scale-125 group-hover:rotate-6 transition-all duration-500">
                  <Users className="text-white h-12 w-12" />
                </div>
                <h3 className="text-3xl font-bold mb-6 text-white group-hover:text-purple-200 transition-colors duration-300">User Management</h3>
                <p className="text-cyan-100/80 text-lg leading-relaxed">Secure authentication system with admin panel for managing users and comprehensive survey oversight</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-gray-50 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-20">
            <Badge className="mb-6 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-0 px-4 py-2 text-sm font-medium">
              ✨ Powerful Features
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent">
                Everything you need to create
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                professional surveys
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Built with the essential tools for survey creation, distribution, and analysis
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Features list */}
            <div className="space-y-8">
              <div className="group flex items-start space-x-6 p-6 rounded-2xl bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-all duration-300 hover:shadow-lg">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <CheckCircle className="text-white h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-700 transition-colors">4 Question Types</h3>
                  <p className="text-gray-600 text-lg leading-relaxed">Multiple choice, text input, rating scales, and dropdown questions for comprehensive data collection</p>
                </div>
              </div>
              
              <div className="group flex items-start space-x-6 p-6 rounded-2xl bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-all duration-300 hover:shadow-lg">
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-xl flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Globe className="text-white h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-green-700 transition-colors">Easy Sharing</h3>
                  <p className="text-gray-600 text-lg leading-relaxed">Generate unique survey links that work perfectly across all devices and platforms</p>
                </div>
              </div>
              
              <div className="group flex items-start space-x-6 p-6 rounded-2xl bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-all duration-300 hover:shadow-lg">
                <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-3 rounded-xl flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Shield className="text-white h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-purple-700 transition-colors">Secure Authentication</h3>
                  <p className="text-gray-600 text-lg leading-relaxed">Built-in user management system with admin controls and secure data handling</p>
                </div>
              </div>
              
              <div className="group flex items-start space-x-6 p-6 rounded-2xl bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-all duration-300 hover:shadow-lg">
                <div className="bg-gradient-to-br from-yellow-500 to-orange-600 p-3 rounded-xl flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Zap className="text-white h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-yellow-700 transition-colors">Real-time Results</h3>
                  <p className="text-gray-600 text-lg leading-relaxed">Watch responses come in live with instant analytics and insights</p>
                </div>
              </div>
            </div>

            {/* Right side - Visual element */}
            <div className="relative">
              <div className="bg-gradient-to-br from-primary-50 to-purple-50 rounded-2xl p-8 shadow-lg">
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
                      <span className="text-sm font-medium">Survey Question</span>
                    </div>
                    <p className="text-gray-600 text-sm">How satisfied are you with our service?</p>
                    <div className="flex space-x-1 mt-3">
                      {[1,2,3,4,5].map((i) => (
                        <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Response Rate</span>
                      <Badge className="bg-success-100 text-success-700">+12%</Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-success-600 h-2 rounded-full" style={{width: '78%'}}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">78% completion rate</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/20 via-indigo-500/20 to-purple-500/20"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to start collecting insights?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of organizations using Survetic to make data-driven decisions
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={handleLogin}
              className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-12 py-4 shadow-2xl hover:shadow-white/25 font-semibold transform hover:scale-105 transition-all duration-300"
            >
              Start Building for Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Floating Back to Top Button */}
      {showBackToTop && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 h-16 w-16 rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:via-blue-500 hover:to-purple-500 shadow-2xl hover:shadow-cyan-500/25 z-50 border-0 transition-all duration-500 transform hover:scale-110 backdrop-blur-sm"
          size="icon"
        >
          <ArrowUp className="h-8 w-8 text-white" />
        </Button>
      )}

      {/* Login Modal */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="sm:max-w-md backdrop-blur-xl bg-blue-600/30 dark:bg-blue-900/80 border border-white/20 dark:border-gray-700/20 shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-center">
              Welcome Back
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleLogin} className="space-y-6 mt-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="login-email" className="text-sm font-medium text-white">
                  Email Address
                </Label>
                <Input
                  id="login-email"
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  placeholder="Enter your email"
                  className="mt-1 bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 rounded-xl"
                  required
                />
              </div>
              <div>
                <Label htmlFor="login-password" className="text-sm font-medium text-white">
                  Password
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    placeholder="Enter your password"
                    className="bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 rounded-xl pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
            <Button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg rounded-xl py-3 font-medium"
            >
              {loginMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
            <div className="text-center">
              <p className="text-sm text-white">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setShowLoginModal(false);
                    setShowSignupModal(true);
                  }}
                  className="text-blue-200 hover:text-white font-medium underline"
                >
                  Sign up for free
                </button>
              </p>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Signup Modal */}
      <Dialog open={showSignupModal} onOpenChange={setShowSignupModal}>
        <DialogContent className="sm:max-w-md backdrop-blur-xl bg-blue-600/30 dark:bg-blue-900/80 border border-white/20 dark:border-gray-700/20 shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-center">
              Create Your Account
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSignup} className="space-y-6 mt-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first-name" className="text-sm font-medium text-white">
                    First Name
                  </Label>
                  <Input
                    id="first-name"
                    type="text"
                    value={signupForm.firstName}
                    onChange={(e) => setSignupForm({ ...signupForm, firstName: e.target.value })}
                    placeholder="First name"
                    className="mt-1 bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="last-name" className="text-sm font-medium text-white">
                    Last Name
                  </Label>
                  <Input
                    id="last-name"
                    type="text"
                    value={signupForm.lastName}
                    onChange={(e) => setSignupForm({ ...signupForm, lastName: e.target.value })}
                    placeholder="Last name"
                    className="mt-1 bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 rounded-xl"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="signup-email" className="text-sm font-medium text-white">
                  Email Address
                </Label>
                <Input
                  id="signup-email"
                  type="email"
                  value={signupForm.email}
                  onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                  placeholder="Enter your email"
                  className="mt-1 bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 rounded-xl"
                  required
                />
              </div>
              <div>
                <Label htmlFor="signup-password" className="text-sm font-medium text-white">
                  Password
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    value={signupForm.password}
                    onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                    placeholder="Create a password"
                    className="bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 rounded-xl pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="confirm-password" className="text-sm font-medium text-white">
                  Confirm Password
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={signupForm.confirmPassword}
                  onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                  placeholder="Confirm your password"
                  className="mt-1 bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 rounded-xl"
                  required
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={signupMutation.isPending}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg rounded-xl py-3 font-medium"
            >
              {signupMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
            <div className="text-center">
              <p className="text-sm text-white">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setShowSignupModal(false);
                    setShowLoginModal(true);
                  }}
                  className="text-blue-200 hover:text-white font-medium underline"
                >
                  Sign in
                </button>
              </p>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
