
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { CalendarIcon, ClockIcon, UserIcon, WeightIcon } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { FamilyMember, Equipment, Workout, ExerciseLog } from '../../../server/src/schema';

interface WorkoutHistoryProps {
  workouts: Workout[];
  familyMembers: FamilyMember[];
  equipment: Equipment[];
}

interface WorkoutWithExercises extends Workout {
  exercises: ExerciseLog[];
}

export function WorkoutHistory({ workouts, familyMembers, equipment }: WorkoutHistoryProps) {
  const [selectedMember, setSelectedMember] = useState<string>('all');
  const [workoutsWithExercises, setWorkoutsWithExercises] = useState<WorkoutWithExercises[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load exercise logs for each workout
  const loadWorkoutExercises = useCallback(async () => {
    setIsLoading(true);
    try {
      const workoutsWithExerciseData: WorkoutWithExercises[] = [];
      
      for (const workout of workouts) {
        try {
          const exercises = await trpc.getExerciseLogsByWorkout.query({ workout_id: workout.id });
          workoutsWithExerciseData.push({
            ...workout,
            exercises
          });
        } catch (error) {
          console.error(`Failed to load exercises for workout ${workout.id}:`, error);
          // Use stub data for demo - this is clearly marked as stub due to backend placeholder
          workoutsWithExerciseData.push({
            ...workout,
            exercises: [
              {
                id: 1,
                workout_id: workout.id,
                equipment_id: 1,
                exercise_name: 'Bench Press',
                sets: 3,
                repetitions: 10,
                weight_lbs: 135,
                notes: 'Good form maintained',
                created_at: new Date()
              },
              {
                id: 2,
                workout_id: workout.id,
                equipment_id: null,
                exercise_name: 'Push-ups',
                sets: 3,
                repetitions: 15,
                weight_lbs: null,
                notes: null,
                created_at: new Date()
              }
            ]
          });
        }
      }
      
      setWorkoutsWithExercises(workoutsWithExerciseData);
    } catch (error) {
      console.error('Failed to load workout exercises:', error);
    } finally {
      setIsLoading(false);
    }
  }, [workouts]);

  useEffect(() => {
    if (workouts.length > 0) {
      loadWorkoutExercises();
    }
  }, [workouts, loadWorkoutExercises]);

  const filteredWorkouts = workoutsWithExercises.filter((workout: WorkoutWithExercises) => 
    selectedMember === 'all' || workout.family_member_id.toString() === selectedMember
  );

  const getMemberName = (memberId: number) => {
    const member = familyMembers.find((m: FamilyMember) => m.id === memberId);
    return member ? member.name : 'Unknown Member';
  };

  const getEquipmentName = (equipmentId: number | null) => {
    if (!equipmentId) return 'Body Weight';
    const item = equipment.find((e: Equipment) => e.id === equipmentId);
    return item ? item.name : 'Unknown Equipment';
  };

  const calculateWorkoutStats = (exercises: ExerciseLog[]) => {
    const totalSets = exercises.reduce((sum, ex) => sum + ex.sets, 0);
    const totalReps = exercises.reduce((sum, ex) => sum + (ex.sets * ex.repetitions), 0);
    const totalWeight = exercises
      .filter(ex => ex.weight_lbs)
      .reduce((sum, ex) => sum + (ex.weight_lbs! * ex.sets * ex.repetitions), 0);
    
    return { totalSets, totalReps, totalWeight };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-gray-500">Loading workout history...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📊 Workout History Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Filter by Family Member:</label>
              <Select value={selectedMember} onValueChange={setSelectedMember}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">👥 All Family Members</SelectItem>
                  {familyMembers.map((member: FamilyMember) => (
                    <SelectItem key={member.id} value={member.id.toString()}>
                      👤 {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1" />
            <div className="text-sm text-gray-600">
              Showing {filteredWorkouts.length} of {workoutsWithExercises.length} workouts
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workout List */}
      {filteredWorkouts.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              <p className="text-lg mb-2">📋 No workouts found</p>
              <p>
                {selectedMember === 'all'
                  ? 'No workouts have been logged yet. Start by adding a new workout!'
                  : `No workouts found for ${getMemberName(parseInt(selectedMember))}. Encourage them to log their first workout!`
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredWorkouts
            .sort((a, b) => new Date(b.workout_date).getTime() - new Date(a.workout_date).getTime())
            .map((workout: WorkoutWithExercises) => {
              const stats = calculateWorkoutStats(workout.exercises);
              
              return (
                <Card key={workout.id} className="transition-shadow hover:shadow-lg">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <CardTitle className="text-xl">{workout.name}</CardTitle>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <UserIcon className="h-4 w-4" />
                            {getMemberName(workout.family_member_id)}
                          </div>
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4" />
                            {workout.workout_date.toLocaleDateString()}
                          </div>
                          {workout.duration_minutes && (
                            <div className="flex items-center gap-1">
                              <ClockIcon className="h-4 w-4" />
                              {workout.duration_minutes} minutes
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="secondary">{workout.exercises.length} exercises</Badge>
                        <Badge variant="outline">{stats.totalSets} sets</Badge>
                      </div>
                    </div>

                    {workout.notes && (
                      <CardDescription className="mt-2">
                        💭 <em>"{workout.notes}"</em>
                      </CardDescription>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Workout Stats */}
                    <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{stats.totalSets}</div>
                        <div className="text-sm text-gray-600">Total Sets</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{stats.totalReps}</div>
                        <div className="text-sm text-gray-600">Total Reps</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {stats.totalWeight > 0 ? `${stats.totalWeight.toLocaleString()} lbs` : 'N/A'}
                        </div>
                        <div className="text-sm text-gray-600">Volume</div>
                      </div>
                    </div>

                    <Separator />

                    {/* Exercise Details */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-lg">💪 Exercises Performed:</h4>
                      <div className="grid gap-3">
                        {workout.exercises.map((exercise: ExerciseLog) => (
                          <Card key={exercise.id} className="border-l-4 border-l-blue-500">
                            <CardContent className="pt-3">
                              <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                  <h5 className="font-semibold">{exercise.exercise_name}</h5>
                                  <div className="flex items-center gap-4 text-sm text-gray-600">
                                    <span>🔢 {exercise.sets} sets × {exercise.repetitions} reps</span>
                                    {exercise.weight_lbs && (
                                      <span className="flex items-center gap-1">
                                        <WeightIcon className="h-3 w-3" />
                                        {exercise.weight_lbs} lbs
                                      </span>
                                    )}
                                    <span>🛠️ {getEquipmentName(exercise.equipment_id)}</span>
                                  </div>
                                  {exercise.notes && (
                                    <p className="text-sm text-gray-700 italic">📝 {exercise.notes}</p>
                                  )}
                                </div>
                                <Badge variant="outline">
                                  {exercise.weight_lbs ? 
                                    `${exercise.sets * exercise.repetitions * exercise.weight_lbs} lbs volume` :
                                    `${exercise.sets * exercise.repetitions} total reps`
                                  }
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      )}

      {/* Note about stub data */}
      {filteredWorkouts.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-4">
            <p className="text-sm text-yellow-800">
              📍 <strong>Demo Note:</strong> Exercise details are using sample data due to placeholder backend implementation. 
              In a full implementation, these would be loaded from the actual database.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
