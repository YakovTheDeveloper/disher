import { z } from "zod";
import { publicProcedure } from "../../trpc.js";
import { createResponseObject } from "../../lib/response.js";
import { AnalyzeScheduleInputSchema } from "./validation.js";
import { analyzeSchedule } from "./analytics.service.js";

export const analyticsRoutes = {
    analyzeSchedule: publicProcedure
        .input(
            z.object({
                snapshot: AnalyzeScheduleInputSchema,
            })
        )
        .mutation(async ({ input }) => {
            const { snapshot } = input;

            const result = await analyzeSchedule(snapshot);

            if (result.success && result.data) {
                return createResponseObject(200, "Analysis completed successfully", result.data);
            }

            return createResponseObject(
                500,
                result.error || "Failed to analyze schedule",
                null
            );
        }),
};
