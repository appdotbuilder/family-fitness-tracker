
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import {
  createFamilyMemberInputSchema,
  updateFamilyMemberInputSchema,
  createEquipmentInputSchema,
  updateEquipmentInputSchema,
  createWorkoutInputSchema,
  updateWorkoutInputSchema,
  createExerciseLogInputSchema,
  updateExerciseLogInputSchema,
  getWorkoutsByMemberInputSchema,
  getExerciseLogsByWorkoutInputSchema
} from './schema';

// Import handlers
import { createFamilyMember } from './handlers/create_family_member';
import { getFamilyMembers } from './handlers/get_family_members';
import { updateFamilyMember } from './handlers/update_family_member';
import { createEquipment } from './handlers/create_equipment';
import { getEquipment } from './handlers/get_equipment';
import { updateEquipment } from './handlers/update_equipment';
import { createWorkout } from './handlers/create_workout';
import { getWorkouts } from './handlers/get_workouts';
import { getWorkoutsByMember } from './handlers/get_workouts_by_member';
import { updateWorkout } from './handlers/update_workout';
import { createExerciseLog } from './handlers/create_exercise_log';
import { getExerciseLogsByWorkout } from './handlers/get_exercise_logs_by_workout';
import { updateExerciseLog } from './handlers/update_exercise_log';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Family Member routes
  createFamilyMember: publicProcedure
    .input(createFamilyMemberInputSchema)
    .mutation(({ input }) => createFamilyMember(input)),
  getFamilyMembers: publicProcedure
    .query(() => getFamilyMembers()),
  updateFamilyMember: publicProcedure
    .input(updateFamilyMemberInputSchema)
    .mutation(({ input }) => updateFamilyMember(input)),

  // Equipment routes
  createEquipment: publicProcedure
    .input(createEquipmentInputSchema)
    .mutation(({ input }) => createEquipment(input)),
  getEquipment: publicProcedure
    .query(() => getEquipment()),
  updateEquipment: publicProcedure
    .input(updateEquipmentInputSchema)
    .mutation(({ input }) => updateEquipment(input)),

  // Workout routes
  createWorkout: publicProcedure
    .input(createWorkoutInputSchema)
    .mutation(({ input }) => createWorkout(input)),
  getWorkouts: publicProcedure
    .query(() => getWorkouts()),
  getWorkoutsByMember: publicProcedure
    .input(getWorkoutsByMemberInputSchema)
    .query(({ input }) => getWorkoutsByMember(input)),
  updateWorkout: publicProcedure
    .input(updateWorkoutInputSchema)
    .mutation(({ input }) => updateWorkout(input)),

  // Exercise Log routes
  createExerciseLog: publicProcedure
    .input(createExerciseLogInputSchema)
    .mutation(({ input }) => createExerciseLog(input)),
  getExerciseLogsByWorkout: publicProcedure
    .input(getExerciseLogsByWorkoutInputSchema)
    .query(({ input }) => getExerciseLogsByWorkout(input)),
  updateExerciseLog: publicProcedure
    .input(updateExerciseLogInputSchema)
    .mutation(({ input }) => updateExerciseLog(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
