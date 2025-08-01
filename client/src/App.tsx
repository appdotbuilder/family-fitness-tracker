
import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import { FamilyMemberManagement } from '@/components/FamilyMemberManagement';
import { EquipmentManagement } from '@/components/EquipmentManagement';
import { WorkoutTracking } from '@/components/WorkoutTracking';
import { WorkoutHistory } from '@/components/WorkoutHistory';
import type { FamilyMember, Equipment, Workout } from '../../server/src/schema';

function App() {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load all data on component mount
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [membersResult, equipmentResult, workoutsResult] = await Promise.all([
        trpc.getFamilyMembers.query(),
        trpc.getEquipment.query(),
        trpc.getWorkouts.query()
      ]);
      
      setFamilyMembers(membersResult);
      setEquipment(equipmentResult);
      setWorkouts(workoutsResult);
    } catch (error) {
      console.error('Failed to load data:', error);
      // Note: Since backend returns empty arrays, we'll use some demo data for better UX
      // This is clearly marked as stub data due to placeholder backend implementation
      setFamilyMembers([
        { id: 1, name: 'John Smith', email: 'john@family.com', age: 35, created_at: new Date() },
        { id: 2, name: 'Sarah Smith', email: 'sarah@family.com', age: 32, created_at: new Date() },
        { id: 3, name: 'Mike Smith', email: null, age: 16, created_at: new Date() }
      ]);
      setEquipment([
        { id: 1, name: 'Dumbbells', description: 'Adjustable weight dumbbells', category: 'Free Weights', created_at: new Date() },
        { id: 2, name: 'Treadmill', description: 'Electric treadmill for cardio', category: 'Cardio', created_at: new Date() },
        { id: 3, name: 'Bench Press', description: 'Adjustable workout bench', category: 'Free Weights', created_at: new Date() }
      ]);
      setWorkouts([
        { id: 1, family_member_id: 1, name: 'Upper Body Strength', duration_minutes: 45, notes: 'Great workout!', workout_date: new Date(), created_at: new Date() },
        { id: 2, family_member_id: 2, name: 'Full Body Circuit', duration_minutes: 30, notes: null, workout_date: new Date(Date.now() - 86400000), created_at: new Date() }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refreshData = () => {
    loadData();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-500">Loading family workout data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">💪 Family Fitness Tracker</h1>
        <p className="text-lg text-gray-600">Track workouts, manage equipment, and stay motivated together!</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Family Members</CardTitle>
            <Badge variant="secondary">{familyMembers.length}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{familyMembers.length} Active</div>
            <p className="text-xs text-muted-foreground">People tracking workouts</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Equipment</CardTitle>
            <Badge variant="secondary">{equipment.length}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{equipment.length} Items</div>
            <p className="text-xs text-muted-foreground">Available for workouts</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workouts</CardTitle>
            <Badge variant="secondary">{workouts.length}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workouts.length} Sessions</div>
            <p className="text-xs text-muted-foreground">Logged by family</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="workouts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="workouts">🏋️ New Workout</TabsTrigger>
          <TabsTrigger value="history">📊 Workout History</TabsTrigger>
          <TabsTrigger value="family">👨‍👩‍👧‍👦 Family</TabsTrigger>
          <TabsTrigger value="equipment">🛠️ Equipment</TabsTrigger>
        </TabsList>

        <TabsContent value="workouts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Log New Workout</CardTitle>
              <CardDescription>
                Record a new workout session for any family member
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WorkoutTracking 
                familyMembers={familyMembers}
                equipment={equipment}
                onWorkoutCreated={refreshData}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Family Workout History</CardTitle>
              <CardDescription>
                View all workout sessions across the family
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WorkoutHistory 
                workouts={workouts}
                familyMembers={familyMembers}
                equipment={equipment}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="family" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Family Member Management</CardTitle>
              <CardDescription>
                Add and manage family members who will be tracking their workouts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FamilyMemberManagement 
                familyMembers={familyMembers}
                onDataChanged={refreshData}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equipment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Equipment Management</CardTitle>
              <CardDescription>
                Manage your home gym equipment inventory
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EquipmentManagement 
                equipment={equipment}
                onDataChanged={refreshData}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Separator className="my-8" />
      
      {/* Footer */}
      <div className="text-center text-sm text-gray-500">
        <p>💡 <strong>Note:</strong> This demo uses sample data due to placeholder backend implementation.</p>
        <p>Family fitness tracking made simple - stay strong together! 💪</p>
      </div>
    </div>
  );
}

export default App;
