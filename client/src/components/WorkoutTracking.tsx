
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, PlusIcon, TrashIcon } from 'lucide-react';
import { format } from 'date-fns';
import { trpc } from '@/utils/trpc';
import type { FamilyMember, Equipment, CreateWorkoutInput, CreateExerciseLogInput } from '../../../server/src/schema';

interface WorkoutTrackingProps {
  familyMembers: FamilyMember[];
  equipment: Equipment[];
  onWorkoutCreated: () => void;
}

interface ExerciseEntry {
  exercise_name: string;
  equipment_id: number | null;
  sets: number;
  repetitions: number;
  weight_lbs: number | null;
  notes: string | null;
}

export function WorkoutTracking({ familyMembers, equipment, onWorkoutCreated }: WorkoutTrackingProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [workoutData, setWorkoutData] = useState<CreateWorkoutInput>({
    family_member_id: 0,
    name: '',
    duration_minutes: null,
    notes: null,
    workout_date: new Date()
  });

  const [exercises, setExercises] = useState<ExerciseEntry[]>([
    {
      exercise_name: '',
      equipment_id: null,
      sets: 1,
      repetitions: 1,
      weight_lbs: null,
      notes: null
    }
  ]);

  const addExercise = () => {
    setExercises((prev: ExerciseEntry[]) => [
      ...prev,
      {
        exercise_name: '',
        equipment_id: null,
        sets: 1,
        repetitions: 1,
        weight_lbs: null,
        notes: null
      }
    ]);
  };

  const removeExercise = (index: number) => {
    setExercises((prev: ExerciseEntry[]) => prev.filter((_, i) => i !== index));
  };

  const updateExercise = (index: number, field: keyof ExerciseEntry, value: string | number | null) => {
    setExercises((prev: ExerciseEntry[]) => 
      prev.map((exercise, i) => 
        i === index ? { ...exercise, [field]: value } : exercise
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (workoutData.family_member_id === 0) {
      alert('Please select a family member');
      return;
    }

    const validExercises = exercises.filter(ex => ex.exercise_name.trim() !== '');
    if (validExercises.length === 0) {
      alert('Please add at least one exercise');
      return;
    }

    setIsLoading(true);
    try {
      // Create the workout first
      const workout = await trpc.createWorkout.mutate(workoutData);
      
      // Then create all exercise logs
      for (const exercise of validExercises) {
        const exerciseLogData: CreateExerciseLogInput = {
          workout_id: workout.id,
          exercise_name: exercise.exercise_name,
          equipment_id: exercise.equipment_id,
          sets: exercise.sets,
          repetitions: exercise.repetitions,
          weight_lbs: exercise.weight_lbs,
          notes: exercise.notes
        };
        
        await trpc.createExerciseLog.mutate(exerciseLogData);
      }

      // Reset form
      setWorkoutData({
        family_member_id: 0,
        name: '',
        duration_minutes: null,
        notes: null,
        workout_date: new Date()
      });
      setExercises([{
        exercise_name: '',
        equipment_id: null,
        sets: 1,
        repetitions: 1,
        weight_lbs: null,
        notes: null
      }]);

      onWorkoutCreated();
    } catch (error) {
      console.error('Failed to create workout:', error);
      alert('Failed to save workout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedMember = familyMembers.find(m => m.id === workoutData.family_member_id);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Workout Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🏋️ Workout Details</CardTitle>
          <CardDescription>Set up the basic workout information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="family-member">Family Member *</Label>
              <Select
                value={workoutData.family_member_id ? workoutData.family_member_id.toString() : ''}
                onValueChange={(value: string) =>
                  setWorkoutData((prev: CreateWorkoutInput) => ({ 
                    ...prev, 
                    family_member_id: parseInt(value) 
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select family member" />
                </SelectTrigger>
                <SelectContent>
                  {familyMembers.map((member: FamilyMember) => (
                    <SelectItem key={member.id} value={member.id.toString()}>
                      👤 {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="workout-date">Workout Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(workoutData.workout_date, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={workoutData.workout_date}
                    onSelect={(date: Date | undefined) => {
                      if (date) {
                        setWorkoutData((prev: CreateWorkoutInput) => ({ 
                          ...prev, 
                          workout_date: date 
                        }));
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="workout-name">Workout Name *</Label>
              <Input
                id="workout-name"
                placeholder="e.g., Upper Body Strength"
                value={workoutData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setWorkoutData((prev: CreateWorkoutInput) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                placeholder="45"
                value={workoutData.duration_minutes || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setWorkoutData((prev: CreateWorkoutInput) => ({ 
                    ...prev, 
                    duration_minutes: parseInt(e.target.value) || null 
                  }))
                }
                min="1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="workout-notes">Workout Notes</Label>
            <Textarea
              id="workout-notes"
              placeholder="How did the workout feel? Any achievements or notes..."
              value={workoutData.notes || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setWorkoutData((prev: CreateWorkoutInput) => ({ 
                  ...prev, 
                  notes: e.target.value || null 
                }))
              }
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Exercises Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">💪 Exercises</CardTitle>
              <CardDescription>
                Log the exercises performed during this workout
                {selectedMember && (
                  <Badge variant="outline" className="ml-2">
                    for {selectedMember.name}
                  </Badge>
                )}
              </CardDescription>
            </div>
            <Button type="button" onClick={addExercise} variant="outline" size="sm">
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Exercise
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {exercises.map((exercise: ExerciseEntry, index: number) => (
            <Card key={index} className="border-2 border-dashed">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Exercise #{index + 1}</CardTitle>
                  {exercises.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeExercise(index)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`exercise-name-${index}`}>Exercise Name *</Label>
                    <Input
                      id={`exercise-name-${index}`}
                      placeholder="e.g., Bench Press, Squats"
                      value={exercise.exercise_name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updateExercise(index, 'exercise_name', e.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`equipment-${index}`}>Equipment Used</Label>
                    <Select
                      value={exercise.equipment_id ? exercise.equipment_id.toString() : 'none'}
                      onValueChange={(value: string) =>
                        updateExercise(index, 'equipment_id', value === 'none' ? null : parseInt(value))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="No equipment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">🏋️ No equipment / Body weight</SelectItem>
                        {equipment.map((item: Equipment) => (
                          <SelectItem key={item.id} value={item.id.toString()}>
                            🛠️ {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`sets-${index}`}>Sets *</Label>
                    <Input
                      id={`sets-${index}`}
                      type="number"
                      value={exercise.sets}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updateExercise(index, 'sets', parseInt(e.target.value) || 1)
                      }
                      min="1"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`reps-${index}`}>Reps *</Label>
                    <Input
                      id={`reps-${index}`}
                      type="number"
                      value={exercise.repetitions}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updateExercise(index, 'repetitions', parseInt(e.target.value) || 1)
                      }
                      min="1"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`weight-${index}`}>Weight (lbs)</Label>
                    <Input
                      id={`weight-${index}`}
                      type="number"
                      placeholder="Body weight"
                      value={exercise.weight_lbs || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updateExercise(index, 'weight_lbs', parseFloat(e.target.value) || null)
                      }
                      min="0"
                      step="0.5"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`exercise-notes-${index}`}>Exercise Notes</Label>
                  <Textarea
                    id={`exercise-notes-${index}`}
                    placeholder="Form notes, difficulty level, how it felt..."
                    value={exercise.notes || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      updateExercise(index, 'notes', e.target.value || null)
                    }
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Card>
        <CardContent className="pt-6">
          <Button type="submit" disabled={isLoading} className="w-full text-lg py-6">
            {isLoading ? 'Saving Workout...' : '🏆 Save Complete Workout'}
          </Button>
          <p className="text-sm text-gray-600 text-center mt-2">
            This will save the workout and all exercise logs
          </p>
        </CardContent>
      </Card>
    </form>
  );
}
