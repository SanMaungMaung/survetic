import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShareDialog } from "@/components/survey/share-dialog";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Plus, 
  BarChart3, 
  Users, 
  FileText,
  Edit,
  Share,
  Eye,
  MoreVertical,
  Trash2
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Survey } from "@shared/schema";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const { toast } = useToast();

  const { data: surveys = [], isLoading, refetch } = useQuery<Survey[]>({
    queryKey: ["/api/surveys"],
    enabled: !!user,
  });

  const handleLogout = async () => {
    try {
      localStorage.removeItem('authToken');
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('authToken');
      window.location.href = '/';
    }
  };

  const handleCreateSurvey = () => {
    setLocation("/builder");
  };

  const handleShareSurvey = (survey: Survey) => {
    setSelectedSurvey(survey);
    setShareDialogOpen(true);
  };

  const deleteMutation = useMutation({
    mutationFn: async (surveyId: number) => {
      await apiRequest("DELETE", `/api/surveys/${surveyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/surveys"] });
      toast({
        title: "Survey deleted",
        description: "The survey has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete survey. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteSurvey = (surveyId: number, surveyTitle: string) => {
    if (window.confirm(`Are you sure you want to delete "${surveyTitle}"? This action cannot be undone.`)) {
      deleteMutation.mutate(surveyId);
    }
  };



  console.log('Dashboard render - user:', !!user, 'surveys:', surveys.length, 'isLoading:', isLoading);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      
      {/* Navigation */}
      <nav className="fixed top-2 md:top-4 left-1/2 transform -translate-x-1/2 z-50 backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border border-white/20 dark:border-gray-700/20 rounded-2xl shadow-lg w-[95%] max-w-6xl">
        <div className="px-3 md:px-6 py-2 md:py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3 md:space-x-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Survetic
              </h1>
            </div>
            <div className="flex items-center space-x-2 md:space-x-4">
              <Button 
                variant="outline"
                onClick={() => setLocation("/templates")}
                className="border-primary-200 text-primary-700 hover:bg-primary-50 text-sm px-2 md:px-4"
              >
                <FileText className="h-4 w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Templates</span>
              </Button>
              <Button 
                onClick={handleCreateSurvey} 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-sm px-3 md:px-4"
              >
                <Plus className="h-4 w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Create Survey</span>
                <span className="sm:hidden">Create</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={(user as any)?.profileImageUrl || ""} />
                      <AvatarFallback>
                        {(user as any)?.firstName?.[0]}{(user as any)?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium hidden md:block">
                      {(user as any)?.firstName} {(user as any)?.lastName}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setLocation('/profile')}>Profile Settings</DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>Sign Out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 p-6 md:p-8 mt-20 md:mt-24">
        
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Welcome back, {(user as any)?.firstName}!
          </h1>
          <p className="text-lg text-gray-600">
            What would you like to do today?
          </p>
        </div>

        {/* Quick Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Create New Survey */}
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-200" onClick={handleCreateSurvey}>
            <CardContent className="p-0">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-blue-100 rounded-lg mr-4">
                  <Plus className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Create New Survey</h3>
                  <p className="text-sm text-gray-600">Start from scratch or use a template</p>
                </div>
              </div>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Get Started
              </Button>
            </CardContent>
          </Card>

          {/* Manage Surveys */}
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-green-200">
            <CardContent className="p-0">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-green-100 rounded-lg mr-4">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Manage Surveys</h3>
                  <p className="text-sm text-gray-600">Edit, publish, or view your surveys</p>
                </div>
              </div>
              <div className="text-2xl font-bold text-green-600 mb-2">{surveys.length}</div>
              <p className="text-sm text-gray-600">Total surveys</p>
            </CardContent>
          </Card>

          {/* Analytics */}
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-purple-200" onClick={() => alert('Analytics feature coming soon!')}>
            <CardContent className="p-0">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-purple-100 rounded-lg mr-4">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">View Analytics</h3>
                  <p className="text-sm text-gray-600">Track responses and insights</p>
                </div>
              </div>
              <Button variant="outline" className="w-full border-purple-200 text-purple-600 hover:bg-purple-50">
                View Reports
              </Button>
            </CardContent>
          </Card>

        </div>

        {/* Recent Surveys Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Recent Surveys</h2>

          </div>

          {/* Survey Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : surveys.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {surveys.map((survey) => (
                <Card key={survey.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{survey.title}</h3>
                        <p className="text-sm text-gray-600">{survey.description}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setLocation(`/builder/${survey.id}`)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleShareSurvey(survey)}>
                            <Share className="h-4 w-4 mr-2" />
                            Share
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setLocation(`/preview/${survey.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setLocation(`/analytics/${survey.id}`)}>
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Analytics
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteSurvey(survey.id, survey.title)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Badge variant={survey.isPublished ? "default" : "secondary"}>
                        {survey.isPublished ? "Published" : "Draft"}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {survey.createdAt ? new Date(survey.createdAt).toLocaleDateString() : 'Unknown'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No surveys yet</h3>
              <p className="text-gray-600 mb-4">Get started by creating your first survey.</p>
              <Button onClick={handleCreateSurvey} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Survey
              </Button>
            </div>
          )}
        </div>

        {/* Share Dialog */}
        <ShareDialog
          isOpen={shareDialogOpen}
          onClose={() => setShareDialogOpen(false)}
          surveyId={selectedSurvey?.id || 0}
          surveyTitle={selectedSurvey?.title || ""}
          isPublished={selectedSurvey?.isPublished || false}
        />
      </div>
    </div>
  );
}