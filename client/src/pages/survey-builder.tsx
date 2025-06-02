import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { DragDropBuilder } from "@/components/survey/drag-drop-builder";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Eye, 
  Settings,
  Save,
  Globe,
  User,
  LogOut,
  ChevronDown,
  X,
  Clock
} from "lucide-react";
import type { Survey, Question, SurveyTheme } from "@shared/schema";

export default function SurveyBuilder() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const surveyId = params.id ? parseInt(params.id) : null;

  const [title, setTitle] = useState<string>("Untitled Survey");
  const [description, setDescription] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [theme, setTheme] = useState<SurveyTheme>({
    primaryColor: "#2563eb",
    fontFamily: "Inter"
  });
  const [isPublished, setIsPublished] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState(false);

  const { data: survey, isLoading, error } = useQuery<Survey>({
    queryKey: [`/api/surveys/${surveyId}`],
    queryFn: async () => {
      // Use user ID directly as authentication token for Vercel
      const userId = (user as any)?.id;
      if (!userId) {
        console.error('Survey Builder: No user ID available', user);
        throw new Error('User not authenticated');
      }
      
      const token = btoa(userId);
      const url = `/api/surveys?id=${surveyId}&token=${encodeURIComponent(token)}`;
      
      console.log('Survey Builder: Fetching survey', {
        surveyId,
        userId,
        url,
        isVercel: window.location.hostname.includes('vercel.app')
      });
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      console.log('Survey Builder: Response', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Survey Builder: API Error', errorText);
        throw new Error(`${response.status}: ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Survey Builder: Survey data received', data);
      return data;
    },
    enabled: !!surveyId && !!user,
  });

  // Debug logging for survey loading
  console.log('Survey Builder Debug:', {
    surveyId,
    isLoading,
    hasSurvey: !!survey,
    error: error?.message,
    survey: survey
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/surveys", data);
      return response.json();
    },
    onSuccess: (newSurvey) => {
      queryClient.invalidateQueries({ queryKey: ["/api/surveys"] });
      setLocation(`/builder/${newSurvey.id}`);
      toast({
        title: "Survey created",
        description: "Your survey has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create survey. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/surveys/${surveyId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/surveys/${surveyId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/surveys"] });
      toast({
        title: "Survey saved",
        description: "Your changes have been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save survey. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (survey) {
      console.log('Loading survey for editing:', survey);
      setTitle(survey.title || "Untitled Survey");
      setDescription(survey.description || "");
      
      // Parse questions if they're stored as JSON string
      let parsedQuestions: Question[] = [];
      if (survey.questions) {
        try {
          parsedQuestions = typeof survey.questions === 'string' 
            ? JSON.parse(survey.questions) 
            : (Array.isArray(survey.questions) ? survey.questions : []);
        } catch (error) {
          console.error('Error parsing questions:', error);
          parsedQuestions = [];
        }
      }
      setQuestions(parsedQuestions);
      
      // Parse theme if it's stored as JSON string
      let parsedTheme = { primaryColor: "#2563eb", fontFamily: "Inter" };
      if (survey.theme) {
        try {
          parsedTheme = typeof survey.theme === 'string' 
            ? JSON.parse(survey.theme) 
            : { ...parsedTheme, ...survey.theme };
        } catch (error) {
          console.error('Error parsing theme:', error);
        }
      }
      setTheme(parsedTheme);
      
      setIsPublished(Boolean(survey.isPublished));
      console.log('Survey data loaded successfully:', {
        title: survey.title,
        questionsCount: parsedQuestions.length,
        isPublished: Boolean(survey.isPublished)
      });
    }
  }, [survey]);

  const handleSave = () => {
    const data = {
      title,
      description,
      questions,
      theme,
      isPublished,
    };

    if (surveyId) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handlePublish = () => {
    const data = {
      title,
      description,
      questions,
      theme,
      isPublished: !isPublished,
    };

    if (surveyId) {
      updateMutation.mutate(data);
      setIsPublished(!isPublished);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    window.location.href = "/";
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading survey...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      {/* Floating Navigation */}
      <nav className="fixed top-2 md:top-4 left-1/2 transform -translate-x-1/2 z-50 backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border border-white/20 dark:border-gray-700/20 rounded-2xl shadow-lg w-[95%] max-w-6xl">
        <div className="px-3 md:px-6 py-2 md:py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 md:space-x-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setLocation("/")}
                className="hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-xl p-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center space-x-2 md:space-x-3">
                <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Settings className="h-3 w-3 md:h-4 md:w-4 text-white" />
                </div>
                <h1 className="text-base md:text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hidden sm:block">
                  Survey Builder
                </h1>
                <h1 className="text-base font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent sm:hidden">
                  Builder
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-1 md:space-x-3">
              <Badge 
                variant="outline" 
                className="px-2 md:px-3 py-1 bg-white/50 dark:bg-gray-800/50 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 text-xs md:text-sm max-w-32 truncate"
              >
                {title || "Untitled"}
              </Badge>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setLocation(`/preview/${surveyId || 'new'}`)}
                disabled={questions.length === 0}
                className="hover:bg-blue-50 dark:hover:bg-blue-900/50 border-blue-200 dark:border-blue-700 p-2"
              >
                <Eye className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Preview</span>
              </Button>
              <Button 
                onClick={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg p-2"
              >
                <Save className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Save</span>
              </Button>
              <Button 
                onClick={handlePublish}
                disabled={!surveyId || questions.length === 0}
                className={`${isPublished 
                  ? "bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white border-0 shadow-lg" 
                  : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 shadow-lg"
                } p-2`}
              >
                <Globe className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">{isPublished ? "Unpublish" : "Publish"}</span>
              </Button>
              
              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="relative h-10 w-10 rounded-full bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-700/80 border border-blue-200 dark:border-blue-700"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.profileImageUrl || ""} alt={user?.firstName || ""} />
                      <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  className="w-56 backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border border-blue-200/50 dark:border-blue-700/50 shadow-xl rounded-xl" 
                  align="end" 
                  forceMount
                >
                  <div className="flex items-center justify-start gap-2 p-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.profileImageUrl || ""} alt={user?.firstName || ""} />
                      <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="bg-blue-200/50 dark:bg-blue-700/50" />
                  <DropdownMenuItem 
                    onClick={() => setLocation("/profile")}
                    className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/50"
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>Account Settings</span>
                  </DropdownMenuItem>
                  {user?.isAdmin && (
                    <DropdownMenuItem 
                      onClick={() => setLocation("/admin")}
                      className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/50"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Admin Panel</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-blue-200/50 dark:bg-blue-700/50" />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex flex-col lg:flex-row h-screen pt-16 md:pt-20">
        {/* Main Content */}
        <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-full lg:max-w-4xl mx-auto">
            {/* Mobile Quick Actions */}
            <div className="lg:hidden mb-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSettings(!showSettings)}
                  className="bg-white/80 backdrop-blur-md border border-white/20 shadow-lg"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
                
                {/* Quick Save Button */}
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                >
                  <Save className="h-4 w-4" />
                </Button>
                
                {/* Quick Publish Toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePublish}
                  disabled={!surveyId || questions.length === 0}
                  className={`shadow-lg ${isPublished ? 'bg-green-100 text-green-700 border-green-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}
                >
                  {isPublished ? <Globe className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            {/* Survey Header */}
            <div className="mb-6 md:mb-8">
              <Card className="backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border border-white/20 dark:border-gray-700/20 shadow-xl rounded-2xl overflow-hidden">
                <CardContent className="p-4 md:p-8">
                  <div className="relative">
                    <div className="absolute -top-4 -left-4 w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-600 opacity-20 rounded-full blur-xl"></div>
                    <Input
                      id="survey-title"
                      name="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter your survey title..."
                      className="text-xl md:text-3xl font-bold border-none p-0 focus-visible:ring-0 mb-4 bg-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    />
                    <Textarea
                      id="survey-description"
                      name="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Add a compelling description that explains what your survey is about..."
                      className="border-none p-0 focus-visible:ring-0 resize-none text-base md:text-lg text-gray-600 dark:text-gray-300 bg-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Drag Drop Builder */}
            <div className="space-y-6">
              <DragDropBuilder
                questions={questions}
                onQuestionsChange={setQuestions}
              />
            </div>
          </div>
        </div>

        {/* Right Panel - Settings */}
        <div className={`${showSettings ? 'block' : 'hidden'} lg:block w-full lg:w-80 p-4 md:p-6 lg:border-l lg:border-gray-200 dark:lg:border-gray-700`}>
          <div className="lg:sticky lg:top-24">
            <Card className="backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border border-white/20 dark:border-gray-700/20 shadow-xl rounded-2xl overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                      <Settings className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Settings
                    </h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSettings(false)}
                    className="lg:hidden"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-6">
                  {/* Survey Status */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-100 dark:border-blue-800">
                    <Label className="text-sm font-medium mb-3 block text-blue-800 dark:text-blue-200">Survey Status</Label>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {isPublished ? "🟢 Published" : "🟡 Draft"}
                      </span>
                      <Switch
                        checked={isPublished}
                        onCheckedChange={handlePublish}
                        disabled={!surveyId || questions.length === 0}
                        className="data-[state=checked]:bg-green-500"
                      />
                    </div>
                  </div>

                  {/* Theme Settings */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-100 dark:border-purple-800">
                    <h4 className="text-sm font-bold text-purple-800 dark:text-purple-200 mb-4">Visual Theme</h4>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium mb-2 block text-gray-700 dark:text-gray-300">Primary Color</Label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="color"
                            value={theme.primaryColor}
                            onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                            className="w-12 h-12 rounded-xl border-2 border-white shadow-lg cursor-pointer"
                          />
                          <div className="flex-1">
                            <div className="text-sm font-mono text-gray-600 dark:text-gray-400">{theme.primaryColor}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-500">Click to change</div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium mb-2 block text-gray-700 dark:text-gray-300">Typography</Label>
                        <Select 
                          value={theme.fontFamily} 
                          onValueChange={(value) => setTheme({ ...theme, fontFamily: value })}
                        >
                          <SelectTrigger className="bg-white/50 dark:bg-gray-800/50 border-purple-200 dark:border-purple-700">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Inter">Inter (Recommended)</SelectItem>
                            <SelectItem value="Roboto">Roboto</SelectItem>
                            <SelectItem value="Open Sans">Open Sans</SelectItem>
                            <SelectItem value="Lato">Lato</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="space-y-3">
                    <Button 
                      onClick={handleSave}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg rounded-xl py-3 font-medium"
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      {createMutation.isPending || updateMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                    
                    <div className="text-center">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {questions.length} question{questions.length !== 1 ? 's' : ''} added
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
