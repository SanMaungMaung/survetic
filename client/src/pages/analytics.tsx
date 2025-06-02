import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PieChart } from "@/components/charts/pie-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { 
  ArrowLeft, 
  Download, 
  FileText,
  Users,
  TrendingUp,
  Clock,
  Star
} from "lucide-react";
import type { Survey, Response } from "@shared/schema";

export default function Analytics() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const surveyId = parseInt(params.id);

  const { data: survey, isLoading: surveyLoading } = useQuery<Survey>({
    queryKey: [`/api/surveys/${surveyId}`],
    enabled: !!surveyId,
  });

  const { data: responses = [], isLoading: responsesLoading } = useQuery<Response[]>({
    queryKey: [`/api/surveys/${surveyId}/responses`],
    enabled: !!surveyId,
  });

  const { data: stats } = useQuery({
    queryKey: [`/api/surveys/${surveyId}/stats`],
    enabled: !!surveyId,
  });

  const handleExportCSV = () => {
    window.open(`/api/surveys/${surveyId}/export`, '_blank');
  };

  if (surveyLoading || responsesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <h1 className="text-xl font-bold text-gray-900 mb-2">Survey Not Found</h1>
            <p className="text-gray-600">This survey may have been removed.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const questions = survey.questions as any[] || [];
  const completedResponses = responses.filter(r => r.isComplete);

  // Calculate analytics data
  const getQuestionAnalytics = (questionId: string, questionType: string) => {
    if (questionType === 'multiple-choice' || questionType === 'dropdown') {
      const answers = responses.map(r => (r.answers as any)[questionId]).filter(Boolean);
      const counts: Record<string, number> = {};
      answers.forEach(answer => {
        counts[answer] = (counts[answer] || 0) + 1;
      });
      return Object.entries(counts).map(([label, value]) => ({ label, value }));
    }
    return [];
  };

  const getTextResponses = (questionId: string) => {
    return responses
      .map(r => (r.answers as any)[questionId])
      .filter(answer => answer && typeof answer === 'string')
      .slice(0, 5); // Show latest 5
  };

  const getWordFrequency = (questionId: string) => {
    const texts = responses
      .map(r => (r.answers as any)[questionId])
      .filter(answer => answer && typeof answer === 'string')
      .join(' ');
    
    const words = texts.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    const frequency: Record<string, number> = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });
    
    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word, count]) => ({ word, count }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setLocation("/")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">Analytics</h1>
              <span className="text-sm text-gray-500">• {survey.title}</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline"
                onClick={handleExportCSV}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-8">
        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                    <SelectItem value="all">All time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All responses</SelectItem>
                    <SelectItem value="complete">Complete</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Question</label>
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All questions</SelectItem>
                    {questions.map((q, index) => (
                      <SelectItem key={q.id} value={q.id}>
                        Question {index + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-primary-100 p-3 rounded-lg">
                  <Users className="text-primary-600 h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Responses</p>
                  <p className="text-2xl font-bold text-gray-900">{responses.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-success-100 p-3 rounded-lg">
                  <TrendingUp className="text-success-600 h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {responses.length > 0 ? Math.round((completedResponses.length / responses.length) * 100) : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Clock className="text-purple-600 h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg. Time</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats ? `${Math.floor(stats.averageTime / 60)}m ${stats.averageTime % 60}s` : '0m 0s'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <Star className="text-yellow-600 h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg. Rating</p>
                  <p className="text-2xl font-bold text-gray-900">4.2</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {questions.map((question, index) => {
            if (question.type === 'multiple-choice' || question.type === 'dropdown') {
              const data = getQuestionAnalytics(question.id, question.type);
              return (
                <Card key={question.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Question {index + 1}: {question.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {data.length > 0 ? (
                      <PieChart data={data} />
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No responses yet
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            }
            return null;
          })}
        </div>

        {/* Text Responses */}
        {questions.map((question, index) => {
          if (question.type === 'text-input') {
            const textResponses = getTextResponses(question.id);
            const wordFreq = getWordFrequency(question.id);
            
            return (
              <Card key={question.id} className="mb-8">
                <CardHeader>
                  <CardTitle className="text-lg">
                    Question {index + 1}: {question.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Word Frequency */}
                  {wordFreq.length > 0 && (
                    <div className="mb-8">
                      <h4 className="text-sm font-semibold text-gray-700 mb-4">Most Common Words</h4>
                      <div className="flex flex-wrap gap-2">
                        {wordFreq.map(({ word, count }) => (
                          <span 
                            key={word}
                            className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium"
                          >
                            {word} ({count})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sample Responses */}
                  {textResponses.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-4">Recent Responses</h4>
                      <div className="space-y-4">
                        {textResponses.map((response, idx) => (
                          <div key={idx} className="border-l-4 border-primary-500 pl-4">
                            <p className="text-gray-700">"{response}"</p>
                            <p className="text-xs text-gray-500 mt-2">
                              {new Date().toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                      <Button variant="ghost" className="mt-4 text-primary-600 hover:text-primary-700">
                        View All Responses
                      </Button>
                    </div>
                  )}

                  {textResponses.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No text responses yet
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}
