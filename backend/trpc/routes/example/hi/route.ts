import { z } from "zod";
import { publicProcedure } from "../../../create-context";

export default publicProcedure
  .input(z.object({ name: z.string().optional() }).optional())
  .query(({ input }) => {
    console.log('🔥 tRPC Hi route called successfully!');
    return {
      hello: input?.name || "World",
      date: new Date(),
      status: "Backend is working!",
      message: "tRPC connection successful"
    };
  });