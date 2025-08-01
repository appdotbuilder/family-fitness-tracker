
import { db } from '../db';
import { workoutsTable, familyMembersTable } from '../db/schema';
import { type GetWorkoutsByMemberInput, type Workout } from '../schema';
import { eq } from 'drizzle-orm';

export const getWorkoutsByMember = async (input: GetWorkoutsByMemberInput): Promise<Workout[]> => {
  try {
    // Verify family member exists first
    const familyMember = await db.select()
      .from(familyMembersTable)
      .where(eq(familyMembersTable.id, input.family_member_id))
      .execute();

    if (familyMember.length === 0) {
      throw new Error(`Family member with id ${input.family_member_id} not found`);
    }

    // Fetch all workouts for the family member
    const workouts = await db.select()
      .from(workoutsTable)
      .where(eq(workoutsTable.family_member_id, input.family_member_id))
      .execute();

    // Convert workout_date from string to Date object
    return workouts.map(workout => ({
      ...workout,
      workout_date: new Date(workout.workout_date)
    }));
  } catch (error) {
    console.error('Failed to get workouts by member:', error);
    throw error;
  }
};
