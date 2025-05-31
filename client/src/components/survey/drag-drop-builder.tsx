import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QuestionEditor, QuestionTypePicker } from "./question-types";
import { Plus } from "lucide-react";
import type { Question, QuestionType } from "@shared/schema";

interface DragDropBuilderProps {
  questions: Question[];
  onQuestionsChange: (questions: Question[]) => void;
}

export function DragDropBuilder({ questions, onQuestionsChange }: DragDropBuilderProps) {
  const [showQuestionTypes, setShowQuestionTypes] = useState(false);

  const generateQuestionId = () => {
    return `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const createDefaultQuestion = (type: QuestionType): Question => {
    const baseQuestion: Question = {
      id: generateQuestionId(),
      type,
      title: '',
      required: false,
    };

    switch (type) {
      case 'multiple-choice':
      case 'dropdown':
        return {
          ...baseQuestion,
          title: type === 'multiple-choice' ? 'Multiple Choice Question' : 'Dropdown Question',
          options: ['Option 1', 'Option 2'],
        };
      case 'text-input':
        return {
          ...baseQuestion,
          title: 'Text Input Question',
        };
      case 'rating':
        return {
          ...baseQuestion,
          title: 'Rating Question',
          ratingScale: 5,
        };
      default:
        return baseQuestion;
    }
  };

  const addQuestion = (type: QuestionType) => {
    const newQuestion = createDefaultQuestion(type);
    onQuestionsChange([...questions, newQuestion]);
    setShowQuestionTypes(false);
  };

  const updateQuestion = (index: number, updatedQuestion: Question) => {
    const newQuestions = [...questions];
    newQuestions[index] = updatedQuestion;
    onQuestionsChange(newQuestions);
  };

  const deleteQuestion = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    onQuestionsChange(newQuestions);
  };

  const duplicateQuestion = (index: number) => {
    const questionToDuplicate = questions[index];
    const duplicatedQuestion: Question = {
      ...questionToDuplicate,
      id: generateQuestionId(),
      title: `${questionToDuplicate.title} (Copy)`,
    };
    const newQuestions = [...questions];
    newQuestions.splice(index + 1, 0, duplicatedQuestion);
    onQuestionsChange(newQuestions);
  };

  return (
    <div className="space-y-6">
      {/* Existing Questions */}
      {questions.map((question, index) => (
        <QuestionEditor
          key={question.id}
          question={question}
          index={index}
          onUpdate={(updatedQuestion) => updateQuestion(index, updatedQuestion)}
          onDelete={() => deleteQuestion(index)}
          onDuplicate={() => duplicateQuestion(index)}
        />
      ))}

      {/* Add Question Section */}
      {showQuestionTypes ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Choose Question Type</h3>
              <Button 
                variant="ghost" 
                onClick={() => setShowQuestionTypes(false)}
              >
                Cancel
              </Button>
            </div>
            <QuestionTypePicker onAddQuestion={addQuestion} />
          </CardContent>
        </Card>
      ) : (
        <Card className="border-2 border-dashed border-gray-300 hover:border-primary-400 transition-colors">
          <CardContent className="p-8 text-center">
            <Button
              variant="ghost"
              onClick={() => setShowQuestionTypes(true)}
              className="h-auto py-4"
            >
              <Plus className="h-6 w-6 text-gray-400 mb-2" />
              <div>
                <p className="text-gray-500 font-medium">Add Question</p>
                <p className="text-sm text-gray-400">Click to choose question type</p>
              </div>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Left Panel - Question Types (Mobile) */}
      <div className="lg:hidden">
        {showQuestionTypes && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Question Types</h3>
              <QuestionTypePicker onAddQuestion={addQuestion} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
