import { adminProcedure, router } from "../index";

export const seedRouter = router({
  run: adminProcedure.mutation(() => {
    return { seeded: true };
  }),
});
