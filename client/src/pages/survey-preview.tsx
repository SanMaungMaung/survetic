import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  ChevronLeft, 
  ChevronRight, 
  X,
  Star,
  Check,
  Zap
} from "lucide-react";
import type { Survey, Question } from "@shared/schema";

export default function SurveyPreview() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const surveyId = params.id ? parseInt(params.id) : 1;

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(true);

  // Check if this is demo mode from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    setIsPreviewMode(urlParams.get('demo') === 'true' || isAuthenticated);
  }, [isAuthenticated]);

  const { data: survey, isLoading } = useQuery<Survey>({
    queryKey: [`/api/surveys/${surveyId}`, isAuthenticated ? 'auth' : 'public'],
    queryFn: async () => {
      if (isAuthenticated) {
        // Use user ID directly as authentication token for Vercel
        const userId = (user as any)?.id;
        if (!userId) throw new Error('User not authenticated');
        
        const response = await fetch(`/api/surveys?id=${surveyId}&token=${encodeURIComponent(btoa(userId))}`, {
          headers: {
            'Authorization': `Bearer ${btoa(userId)}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`${response.status}: ${response.statusText}`);
        }
        
        return response.json();
      } else {
        // Use public access for non-authenticated users
        const response = await fetch(`/api/surveys?id=${surveyId}&public=true`);
        if (!response.ok) {
          throw new Error(`${response.status}: ${response.statusText}`);
        }
        return response.json();
      }
    },
    enabled: !!surveyId,
  });

  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      // Use direct fetch for public response submission since apiRequest might require auth
      const response = await fetch(`/api/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          surveyId: surveyId,
          responses: data
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to submit response: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Response submitted",
        description: "Thank you for your response!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit response. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    // Check if this is a preview mode (from builder)
    const urlParams = new URLSearchParams(window.location.search);
    setIsPreviewMode(urlParams.get('preview') === 'true' || isAuthenticated);
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading survey...</p>
        </div>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <h1 className="text-xl font-bold text-gray-900 mb-2">Survey Not Found</h1>
            <p className="text-gray-600">This survey may have been removed or is no longer available.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!survey.isPublished && !isPreviewMode) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <h1 className="text-xl font-bold text-gray-900 mb-2">Survey Not Available</h1>
            <p className="text-gray-600">This survey is not currently published.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const questions = survey.questions as Question[] || [];
  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    if (isPreviewMode) {
      setIsSubmitted(true);
      return;
    }

    submitMutation.mutate({
      answers,
      isComplete: true,
    });
  };

  const canProceed = () => {
    if (!currentQuestion) return false;
    if (!currentQuestion.required) return true;
    const answer = answers[currentQuestion.id];
    return answer !== undefined && answer !== '' && answer !== null;
  };

  const renderQuestion = (question: Question) => {
    const answer = answers[question.id];

    switch (question.type) {
      case 'multiple-choice':
        return (
          <RadioGroup
            value={answer || ''}
            onValueChange={(value) => handleAnswerChange(question.id, value)}
          >
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${question.id}-${index}`} />
                <Label htmlFor={`${question.id}-${index}`} className="text-gray-700 cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'text-input':
        return (
          <div className="space-y-4">
            <Input
              value={answer || ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              placeholder="Type your answer here..."
              className="w-full"
            />
          </div>
        );

      case 'rating':
        const scale = question.ratingScale || 5;
        return (
          <div className="flex space-x-2">
            {[...Array(scale)].map((_, index) => (
              <button
                key={index}
                onClick={() => handleAnswerChange(question.id, index + 1)}
                className={`p-2 rounded-lg transition-colors ${
                  answer === index + 1
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <Star className="h-6 w-6" fill={answer === index + 1 ? 'currentColor' : 'none'} />
              </button>
            ))}
          </div>
        );

      case 'dropdown':
        return (
          <Select
            value={answer || ''}
            onValueChange={(value) => handleAnswerChange(question.id, value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an option..." />
            </SelectTrigger>
            <SelectContent>
              {question.options?.map((option, index) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      default:
        return null;
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center px-4">
          <Card>
            <CardContent className="pt-8 pb-6">
              <div className="mb-6">
                <div className="bg-success-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="text-success-600 h-8 w-8" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h1>
                <p className="text-gray-600">Your response has been submitted successfully.</p>
              </div>
              
              <div className="space-y-4">
                {isPreviewMode && (
                  <>
                    <Button 
                      onClick={() => setIsSubmitted(false)}
                      className="w-full bg-primary-600 hover:bg-primary-700"
                    >
                      Take Survey Again
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setLocation(`/builder/${surveyId}`)}
                      className="w-full"
                    >
                      Back to Builder
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Demo Banner */}
      {isPreviewMode && (
        <div className="bg-blue-600 text-white py-3 px-4">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div className="flex items-center">
              <Zap className="h-5 w-5 mr-2" />
              <span className="font-medium">Demo Mode</span>
              <span className="ml-2 text-blue-100">You're previewing how this survey looks to respondents</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setLocation('/')}
              className="text-white hover:bg-blue-700"
            >
              <X className="h-4 w-4 mr-1" />
              Exit Demo
            </Button>
          </div>
        </div>
      )}
      
      <div className="max-w-2xl mx-auto py-12 px-4">
        {/* Survey Header */}
        <Card className="mb-6">
          <CardContent className="p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{survey.title}</h1>
            {survey.description && (
              <p className="text-gray-600 text-lg mb-6">{survey.description}</p>
            )}
            
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Progress</span>
                <span>{currentQuestionIndex + 1} of {questions.length}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Question */}
        {currentQuestion && (
          <Card className="mb-6">
            <CardContent className="p-8">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {currentQuestionIndex + 1}. {currentQuestion.title}
                  {currentQuestion.required && <span className="text-red-500 ml-1">*</span>}
                </h2>
                {currentQuestion.description && (
                  <p className="text-gray-600">{currentQuestion.description}</p>
                )}
              </div>
              
              {renderQuestion(currentQuestion)}
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={!canProceed() || submitMutation.isPending}
          >
            {currentQuestionIndex === questions.length - 1 ? (
              submitMutation.isPending ? 'Submitting...' : 'Submit'
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>

        {/* Close Preview Button (only in preview mode) */}
        {isPreviewMode && (
          <div className="text-center mt-8">
            <Button 
              variant="ghost" 
              onClick={() => setLocation(`/builder/${surveyId}`)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4 mr-1" />
              Close Preview
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
