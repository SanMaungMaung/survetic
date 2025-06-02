import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShareDialog } from "@/components/survey/share-dialog";
import { useAuth } from "@/hooks/useAuth";
import { 
  Plus, 
  BarChart3, 
  Users, 
  Clock, 
  TrendingUp,
  Edit,
  Share,
  Trash2,
  MoreVertical,
  FileText,
  Zap,
  RefreshCw
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Survey } from "@shared/schema";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);

  const { data: surveys = [], isLoading, refetch } = useQuery<Survey[]>({
    queryKey: ["/api/surveys"],
    enabled: !!user, // Only fetch when user is authenticated
  });

  // Add a manual refresh button for testing
  const handleRefresh = () => {
    console.log('Manual refresh triggered, user:', !!user);
    refetch();
  };

  // Test session endpoint
  const testSession = async () => {
    try {
      const response = await fetch('/api/test-session', {
        credentials: 'include'
      });
      const data = await response.json();
      console.log('Session test result:', data);
    } catch (error) {
      console.error('Session test error:', error);
    }
  };

  // Debug logging
  console.log('Dashboard render - user:', !!user, 'surveys:', surveys.length, 'isLoading:', isLoading);

  const handleLogout = async () => {
    try {
      // Clear the auth token from localStorage
      localStorage.removeItem('authToken');
      // Clear all local state and redirect to home
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Clear token even if logout request fails
      localStorage.removeItem('authToken');
      // Fallback - still redirect to home
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

  const totalResponses = surveys.reduce((acc, survey) => acc + (survey as any).responseCount || 0, 0);
  const activeSurveys = surveys.filter(survey => survey.isPublished).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation with Animation */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-50 animate-fade-in-up">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Survetic
              </h1>
            </div>
            <div className="flex items-center space-x-2 md:space-x-4 animate-slide-in-right">
              <Button 
                variant="outline"
                onClick={testSession}
                className="border-red-200 text-red-700 hover:bg-red-50 hover-lift transition-all duration-300 hover:border-red-400 text-sm md:text-base px-2 md:px-4"
              >
                Test Session
              </Button>
              <Button 
                variant="outline"
                onClick={handleRefresh}
                className="border-green-200 text-green-700 hover:bg-green-50 hover-lift transition-all duration-300 hover:border-green-400 text-sm md:text-base px-2 md:px-4"
              >
                🔄 Refresh
              </Button>
              <Button 
                variant="outline"
                onClick={() => setLocation("/templates")}
                className="border-primary-200 text-primary-700 hover:bg-primary-50 hover-lift transition-all duration-300 hover:border-primary-400 text-sm md:text-base px-2 md:px-4"
              >
                <FileText className="h-4 w-4 mr-1 md:mr-2 animate-float" />
                <span className="hidden sm:inline">Templates</span>
                <span className="sm:hidden">Temp</span>
              </Button>
              <Button 
                onClick={handleCreateSurvey} 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover-lift hover-glow transition-all duration-300 text-sm md:text-base px-3 md:px-4"
              >
                <Plus className="h-4 w-4 mr-1 md:mr-2 animate-bounce-slow" />
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
                    <span className="text-sm font-medium">
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
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-purple-200" onClick={() => setLocation('/analytics')}>
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
            <Button 
              variant="outline"
              onClick={handleRefresh}
              className="border-green-200 text-green-700 hover:bg-green-50"
            >
              🔄 Refresh
            </Button>
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
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Badge variant={survey.isPublished ? "default" : "secondary"}>
                        {survey.isPublished ? "Published" : "Draft"}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(survey.createdAt).toLocaleDateString()}
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
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                      <p className="text-2xl font-bold text-gray-900">78%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="bg-yellow-100 p-3 rounded-lg">
                      <Clock className="text-yellow-600 h-6 w-6" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Avg. Time</p>
                      <p className="text-2xl font-bold text-gray-900">3m 24s</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Surveys */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-semibold">Recent Surveys</CardTitle>
                  <Button variant="ghost" size="sm" className="text-primary-600 hover:text-primary-700">
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : surveys.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No surveys yet</h3>
                    <p className="text-gray-600 mb-4">Get started by creating your first survey</p>
                    <Button onClick={handleCreateSurvey} className="bg-primary-600 hover:bg-primary-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Survey
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {surveys.map((survey) => (
                      <div key={survey.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="bg-primary-100 p-2 rounded-lg">
                            <Users className="text-primary-600 h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{survey.title}</h3>
                            <p className="text-sm text-gray-600">
                              Created {new Date(survey.createdAt!).toLocaleDateString()} •{" "}
                              <Badge variant={survey.isPublished ? "default" : "secondary"}>
                                {survey.isPublished ? "Live" : "Draft"}
                              </Badge>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">0 responses</p>
                            <p className="text-xs text-gray-500">0% completion</p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setLocation('/guide')}>
                                <FileText className="h-4 w-4 mr-2" />
                                Survey Builder Guide
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setLocation(`/builder/${survey.id}`)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setLocation(`/analytics/${survey.id}`)}>
                                <BarChart3 className="h-4 w-4 mr-2" />
                                Analytics
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleShareSurvey(survey)}>
                                <Share className="h-4 w-4 mr-2" />
                                Share
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Share Dialog */}
      {selectedSurvey && (
        <ShareDialog
          isOpen={shareDialogOpen}
          onClose={() => setShareDialogOpen(false)}
          surveyId={selectedSurvey.id}
          surveyTitle={selectedSurvey.title}
          isPublished={Boolean(selectedSurvey.isPublished)}
        />
      )}
    </div>
  );
}
