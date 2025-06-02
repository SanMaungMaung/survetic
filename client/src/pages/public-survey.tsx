import { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, ChevronRight, Star, CheckCircle } from 'lucide-react';
import type { Survey, Question } from '@shared/schema';

export default function PublicSurvey() {
  const [, params] = useRoute('/survey/:id');
  const { toast } = useToast();
  const surveyId = params?.id ? parseInt(params.id) : 1;

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { data: survey, isLoading } = useQuery<Survey>({
    queryKey: [`/api/surveys/public/${surveyId}`],
    queryFn: async () => {
      const response = await fetch(`/api/surveys?id=${surveyId}&public=true`);
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!surveyId,
  });

  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
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

  const questions = survey?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmit = () => {
    const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
      questionId,
      answer
    }));
    
    submitMutation.mutate(formattedAnswers);
  };

  const renderQuestion = (question: Question) => {
    const currentAnswer = answers[question.id];

    switch (question.type) {
      case 'multiple-choice':
        return (
          <RadioGroup 
            value={currentAnswer || ''} 
            onValueChange={(value) => handleAnswerChange(question.id, value)}
            className="space-y-3"
          >
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${question.id}-${index}`} />
                <Label htmlFor={`${question.id}-${index}`} className="cursor-pointer">{option}</Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'text-input':
        return (
          <Textarea
            placeholder="Enter your answer..."
            value={currentAnswer || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className="w-full min-h-[100px]"
          />
        );

      case 'rating':
        const scale = question.ratingScale || 5;
        return (
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Poor</span>
              <span>Excellent</span>
            </div>
            <RadioGroup 
              value={currentAnswer?.toString() || ''} 
              onValueChange={(value) => handleAnswerChange(question.id, parseInt(value))}
              className="flex justify-between"
            >
              {Array.from({ length: scale }, (_, i) => i + 1).map((rating) => (
                <div key={rating} className="flex flex-col items-center space-y-2">
                  <RadioGroupItem value={rating.toString()} id={`${question.id}-${rating}`} />
                  <Label htmlFor={`${question.id}-${rating}`} className="cursor-pointer">
                    <Star className="h-4 w-4" />
                  </Label>
                  <span className="text-xs">{rating}</span>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case 'dropdown':
        return (
          <Select value={currentAnswer || ''} onValueChange={(value) => handleAnswerChange(question.id, value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select an option..." />
            </SelectTrigger>
            <SelectContent>
              {question.options?.map((option, index) => (
                <SelectItem key={index} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading survey...</p>
        </div>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Survey Not Found</h2>
            <p className="text-gray-600">This survey is not available or has been removed.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Thank You!</h2>
            <p className="text-gray-600">Your response has been submitted successfully.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const canProceed = currentQuestion ? answers[currentQuestion.id] !== undefined : false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{survey.title}</h1>
            {survey.description && (
              <p className="text-lg text-gray-600">{survey.description}</p>
            )}
          </div>

          {/* Progress */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Question Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                  {currentQuestionIndex + 1}
                </span>
                {currentQuestion?.title}
                {currentQuestion?.required && (
                  <span className="text-red-500">*</span>
                )}
              </CardTitle>
              {currentQuestion?.description && (
                <p className="text-gray-600">{currentQuestion.description}</p>
              )}
            </CardHeader>
            <CardContent>
              {currentQuestion && renderQuestion(currentQuestion)}
            </CardContent>
          </Card>

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

            {isLastQuestion ? (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed || submitMutation.isPending}
                className="min-w-[120px]"
              >
                {submitMutation.isPending ? 'Submitting...' : 'Submit Survey'}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!canProceed}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}