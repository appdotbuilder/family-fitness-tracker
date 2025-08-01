
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { familyMembersTable, workoutsTable } from '../db/schema';
import { getWorkouts } from '../handlers/get_workouts';

describe('getWorkouts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no workouts exist', async () => {
    const result = await getWorkouts();
    expect(result).toEqual([]);
  });

  it('should return all workouts', async () => {
    // Create a family member first (required for foreign key)
    const familyMember = await db.insert(familyMembersTable)
      .values({
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      })
      .returning()
      .execute();

    const memberId = familyMember[0].id;

    // Create test workouts
    const workout1 = {
      family_member_id: memberId,
      name: 'Morning Cardio',
      duration_minutes: 30,
      notes: 'High intensity',
      workout_date: '2024-01-15'
    };

    const workout2 = {
      family_member_id: memberId,
      name: 'Evening Strength',
      duration_minutes: 45,
      notes: null,
      workout_date: '2024-01-16'
    };

    await db.insert(workoutsTable)
      .values([workout1, workout2])
      .execute();

    const result = await getWorkouts();

    expect(result).toHaveLength(2);
    
    // Check first workout
    const firstWorkout = result.find(w => w.name === 'Morning Cardio');
    expect(firstWorkout).toBeDefined();
    expect(firstWorkout!.family_member_id).toEqual(memberId);
    expect(firstWorkout!.duration_minutes).toEqual(30);
    expect(firstWorkout!.notes).toEqual('High intensity');
    expect(firstWorkout!.workout_date).toBeInstanceOf(Date);
    expect(firstWorkout!.workout_date.toISOString().split('T')[0]).toEqual('2024-01-15');
    expect(firstWorkout!.created_at).toBeInstanceOf(Date);

    // Check second workout
    const secondWorkout = result.find(w => w.name === 'Evening Strength');
    expect(secondWorkout).toBeDefined();
    expect(secondWorkout!.family_member_id).toEqual(memberId);
    expect(secondWorkout!.duration_minutes).toEqual(45);
    expect(secondWorkout!.notes).toBeNull();
    expect(secondWorkout!.workout_date).toBeInstanceOf(Date);
    expect(secondWorkout!.workout_date.toISOString().split('T')[0]).toEqual('2024-01-16');
  });

  it('should return workouts for multiple family members', async () => {
    // Create two family members
    const member1 = await db.insert(familyMembersTable)
      .values({
        name: 'Alice',
        email: 'alice@example.com',
        age: 25
      })
      .returning()
      .execute();

    const member2 = await db.insert(familyMembersTable)
      .values({
        name: 'Bob',
        email: 'bob@example.com',
        age: 35
      })
      .returning()
      .execute();

    // Create workouts for both members
    await db.insert(workoutsTable)
      .values([
        {
          family_member_id: member1[0].id,
          name: 'Alice Workout',
          duration_minutes: 60,
          notes: 'Full body',
          workout_date: '2024-01-17'
        },
        {
          family_member_id: member2[0].id,
          name: 'Bob Workout',
          duration_minutes: 40,
          notes: 'Upper body',
          workout_date: '2024-01-18'
        }
      ])
      .execute();

    const result = await getWorkouts();

    expect(result).toHaveLength(2);
    
    const aliceWorkout = result.find(w => w.name === 'Alice Workout');
    const bobWorkout = result.find(w => w.name === 'Bob Workout');
    
    expect(aliceWorkout).toBeDefined();
    expect(aliceWorkout!.family_member_id).toEqual(member1[0].id);
    
    expect(bobWorkout).toBeDefined();
    expect(bobWorkout!.family_member_id).toEqual(member2[0].id);
  });
});
