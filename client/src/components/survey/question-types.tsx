import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  GripVertical, 
  Copy, 
  Trash2, 
  Plus,
  List,
  Type,
  Star,
  ChevronDown
} from "lucide-react";
import type { Question, QuestionType } from "@shared/schema";

interface QuestionEditorProps {
  question: Question;
  index: number;
  onUpdate: (question: Question) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export function QuestionEditor({ question, index, onUpdate, onDelete, onDuplicate }: QuestionEditorProps) {
  const [isEditing, setIsEditing] = useState(false);

  const updateQuestion = (updates: Partial<Question>) => {
    onUpdate({ ...question, ...updates });
  };

  const addOption = () => {
    const newOptions = [...(question.options || []), ''];
    updateQuestion({ options: newOptions });
  };

  const updateOption = (optionIndex: number, value: string) => {
    const newOptions = [...(question.options || [])];
    newOptions[optionIndex] = value;
    updateQuestion({ options: newOptions });
  };

  const removeOption = (optionIndex: number) => {
    const newOptions = question.options?.filter((_, i) => i !== optionIndex) || [];
    updateQuestion({ options: newOptions });
  };

  const getQuestionIcon = () => {
    switch (question.type) {
      case 'multiple-choice':
        return <List className="h-4 w-4" />;
      case 'text-input':
        return <Type className="h-4 w-4" />;
      case 'rating':
        return <Star className="h-4 w-4" />;
      case 'dropdown':
        return <ChevronDown className="h-4 w-4" />;
      default:
        return <List className="h-4 w-4" />;
    }
  };

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-primary-50 text-primary-700">
              {index + 1}
            </Badge>
            {getQuestionIcon()}
            {question.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
          </div>
          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="sm">
              <GripVertical className="h-4 w-4 text-gray-400" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onDuplicate}>
              <Copy className="h-4 w-4 text-gray-400" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>

        {/* Question Title */}
        <Input
          id={`question-title-${question.id}`}
          name={`question-title-${question.id}`}
          value={question.title}
          onChange={(e) => updateQuestion({ title: e.target.value })}
          placeholder="Question text..."
          className="text-lg font-medium mb-4 border-none p-0 focus-visible:ring-0"
        />

        {/* Question Description */}
        <Textarea
          id={`question-description-${question.id}`}
          name={`question-description-${question.id}`}
          value={question.description || ''}
          onChange={(e) => updateQuestion({ description: e.target.value })}
          placeholder="Add description (optional)..."
          className="border-none p-0 focus-visible:ring-0 resize-none mb-4"
          rows={2}
        />

        {/* Question Content */}
        <div className="space-y-4">
          {question.type === 'multiple-choice' && (
            <div className="space-y-2">
              {question.options?.map((option, optionIndex) => (
                <div key={optionIndex} className="flex items-center space-x-2">
                  <input 
                    type="radio" 
                    disabled 
                    className="flex-shrink-0"
                    id={`radio-${question.id}-${optionIndex}`}
                    name={`question-${question.id}`}
                  />
                  <Input
                    id={`option-${question.id}-${optionIndex}`}
                    name={`option-${question.id}-${optionIndex}`}
                    value={option}
                    onChange={(e) => updateOption(optionIndex, e.target.value)}
                    placeholder={`Option ${optionIndex + 1}`}
                    className="flex-1"
                  />
                  {question.options && question.options.length > 2 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOption(optionIndex)}
                    >
                      <Trash2 className="h-4 w-4 text-gray-400" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="ghost" onClick={addOption} className="text-primary-600">
                <Plus className="h-4 w-4 mr-1" />
                Add Option
              </Button>
            </div>
          )}

          {question.type === 'dropdown' && (
            <div className="space-y-2">
              <Select disabled>
                <SelectTrigger>
                  <SelectValue placeholder="Select an option..." />
                </SelectTrigger>
              </Select>
              {question.options?.map((option, optionIndex) => (
                <div key={optionIndex} className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500 w-8">{optionIndex + 1}.</span>
                  <Input
                    value={option}
                    onChange={(e) => updateOption(optionIndex, e.target.value)}
                    placeholder={`Option ${optionIndex + 1}`}
                    className="flex-1"
                  />
                  {question.options && question.options.length > 2 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOption(optionIndex)}
                    >
                      <Trash2 className="h-4 w-4 text-gray-400" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="ghost" onClick={addOption} className="text-primary-600">
                <Plus className="h-4 w-4 mr-1" />
                Add Option
              </Button>
            </div>
          )}

          {question.type === 'text-input' && (
            <Textarea
              disabled
              placeholder="Type your answer here..."
              className="w-full"
              rows={3}
            />
          )}

          {question.type === 'rating' && (
            <div className="space-y-4">
              <div className="flex space-x-2">
                {[...Array(question.ratingScale || 5)].map((_, index) => (
                  <div key={index} className="p-2 border rounded-lg">
                    <Star className="h-6 w-6 text-gray-400" />
                  </div>
                ))}
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Rating Scale</Label>
                <Select
                  value={String(question.ratingScale || 5)}
                  onValueChange={(value) => updateQuestion({ ratingScale: parseInt(value) })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">1-3</SelectItem>
                    <SelectItem value="5">1-5</SelectItem>
                    <SelectItem value="7">1-7</SelectItem>
                    <SelectItem value="10">1-10</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* Question Settings */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <Switch
              checked={question.required}
              onCheckedChange={(checked) => updateQuestion({ required: checked })}
            />
            <Label className="text-sm text-gray-700">Required question</Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface QuestionTypePickerProps {
  onAddQuestion: (type: QuestionType) => void;
}

export function QuestionTypePicker({ onAddQuestion }: QuestionTypePickerProps) {
  const questionTypes = [
    { type: 'multiple-choice' as QuestionType, label: 'Multiple Choice', icon: List },
    { type: 'text-input' as QuestionType, label: 'Text Input', icon: Type },
    { type: 'rating' as QuestionType, label: 'Rating Scale', icon: Star },
    { type: 'dropdown' as QuestionType, label: 'Dropdown', icon: ChevronDown },
  ];

  return (
    <div className="space-y-3">
      {questionTypes.map(({ type, label, icon: Icon }) => (
        <Button
          key={type}
          variant="outline"
          className="w-full justify-start p-3 h-auto hover:bg-gray-50"
          onClick={() => onAddQuestion(type)}
        >
          <Icon className="h-5 w-5 text-primary-600 mr-3" />
          <span className="font-medium">{label}</span>
        </Button>
      ))}
    </div>
  );
}
