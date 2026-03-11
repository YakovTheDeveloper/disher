
import z from "zod";
import { prisma } from "../client.js"
import { t } from "../trpc.js"
import { createResponseObject } from "../lib/response.js";

export const userRoutes = ({
    createUser: t.procedure
        .input(
            z.object({
                name: z.string().min(1),
                email: z.string().email(),
            })
        )
        .mutation(async ({ input }) => {
            const result = await prisma.user.create({
                data: {
                    name: input.name,
                    email: input.email,
                },
            });
            return createResponseObject(400, 'ok', result)
        }),

    getUser: t.procedure
        .input(
            z.object({
                id: z.number().int().positive(),
            })
        )
        .query(async ({ input }) => {
            return prisma.user.findUnique({
                where: { id: input.id },
            });
        }),
});