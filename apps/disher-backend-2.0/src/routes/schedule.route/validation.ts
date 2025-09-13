import { z } from "zod";

const TimeValueSchema = z.object({
    value: z.number().min(0),
    time: z.string().regex(/^\d{2}:\d{2}$/) // "HH:MM"
});

export const DailySurveySchema = z.object({
    cravings: z.array(z.string()).optional(),

    sleep: z.object({
        quality: z.number().min(1).max(10).optional(),
        hours: z.number().min(0).max(24).optional()
    }).optional(),

    mood: z.array(TimeValueSchema).optional(),

    energy: z.array(TimeValueSchema).optional(),

    digestion: z.object({
        bloating: z.array(TimeValueSchema).optional(),
        stomach_pain: z.array(TimeValueSchema).optional(),
        heartburn: z.array(TimeValueSchema).optional(),
        constipation: z.array(TimeValueSchema).optional(),
        diarrhea: z.array(TimeValueSchema).optional()
    }).optional(),

    activity: z.array(z.object({
        type: z.string(),
        duration_min: z.number().min(0),
        time: z.string().regex(/^\d{2}:\d{2}$/)
    })).optional(),

    notes: z.string().optional()
});

export type DailySurvey = z.infer<typeof DailySurveySchema>