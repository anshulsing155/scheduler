'use client'

import { useState } from 'react'
import { CustomQuestion } from '@/services/event-type-service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Plus, Trash2, GripVertical } from 'lucide-react'

interface CustomQuestionsProps {
  questions: CustomQuestion[]
  onChange: (questions: CustomQuestion[]) => void
}

const QUESTION_TYPES = [
  { value: 'text', label: 'Short Text' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'select', label: 'Dropdown' },
  { value: 'radio', label: 'Radio Buttons' },
  { value: 'checkbox', label: 'Checkboxes' },
]

export function CustomQuestions({ questions, onChange }: CustomQuestionsProps) {
  const [editingId, setEditingId] = useState<string | null>(null)

  const addQuestion = () => {
    const newQuestion: CustomQuestion = {
      id: `q-${Date.now()}`,
      question: '',
      type: 'text',
      required: false,
      options: [],
    }
    onChange([...questions, newQuestion])
    setEditingId(newQuestion.id)
  }

  const updateQuestion = (id: string, updates: Partial<CustomQuestion>) => {
    onChange(
      questions.map((q) =>
        q.id === id ? { ...q, ...updates } : q
      )
    )
  }

  const deleteQuestion = (id: string) => {
    onChange(questions.filter((q) => q.id !== id))
  }

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const newQuestions = [...questions]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    
    if (targetIndex < 0 || targetIndex >= newQuestions.length) return
    
    ;[newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]]
    onChange(newQuestions)
  }

  const requiresOptions = (type: string) => ['select', 'radio', 'checkbox'].includes(type)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Custom Questions</Label>
        <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
          <Plus className="h-4 w-4 mr-1" />
          Add Question
        </Button>
      </div>

      {questions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <p className="text-sm text-muted-foreground mb-4">No custom questions yet</p>
            <Button type="button" variant="outline" onClick={addQuestion}>
              <Plus className="h-4 w-4 mr-1" />
              Add Your First Question
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {questions.map((question, index) => (
            <Card key={question.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start gap-2">
                  <div className="flex flex-col gap-1 mt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => moveQuestion(index, 'up')}
                      disabled={index === 0}
                    >
                      <GripVertical className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="space-y-2">
                      <Input
                        placeholder="Enter your question"
                        value={question.question}
                        onChange={(e) => updateQuestion(question.id, { question: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs">Question Type</Label>
                        <Select
                          value={question.type}
                          onValueChange={(value) =>
                            updateQuestion(question.id, {
                              type: value as CustomQuestion['type'],
                              options: requiresOptions(value) ? question.options || [''] : undefined,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {QUESTION_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-end">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Switch
                            checked={question.required}
                            onCheckedChange={(checked) =>
                              updateQuestion(question.id, { required: checked })
                            }
                          />
                          <span className="text-sm">Required</span>
                        </label>
                      </div>
                    </div>

                    {requiresOptions(question.type) && (
                      <div className="space-y-2">
                        <Label className="text-xs">Options</Label>
                        {(question.options || []).map((option, optIndex) => (
                          <div key={optIndex} className="flex gap-2">
                            <Input
                              placeholder={`Option ${optIndex + 1}`}
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...(question.options || [])]
                                newOptions[optIndex] = e.target.value
                                updateQuestion(question.id, { options: newOptions })
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newOptions = (question.options || []).filter((_, i) => i !== optIndex)
                                updateQuestion(question.id, { options: newOptions })
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newOptions = [...(question.options || []), '']
                            updateQuestion(question.id, { options: newOptions })
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Option
                        </Button>
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteQuestion(question.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
