import { z } from "zod"
import { prisma } from "../../client"
import { createResponseObject } from "../../lib/response"
import { t } from "../../trpc"

const defaultSelect = {
    id: true,
    name: true,
    description: true,
    items: {
        select: {
            quantity: true,
            nutrientId: true
        }
    },
}

export const dailyNormRoute = {
    getDailyNorms: t.procedure.query(async () => {
        const result = await prisma.dailyNorm.findMany({
            select: defaultSelect,
            where: {
                userId: 1,
            },
        })
        return createResponseObject(200, "good", result)
    }),

    createDailyNorms: t.procedure
        .input(
            z.object({
                name: z.string(),
                description: z.string(),
                items: z.array(
                    z.object({
                        nutrientId: z.number(),
                        quantity: z.number().nullable().optional(),
                    })
                ),
            })
        )
        .mutation(async ({ input }) => {
            const result = await prisma.dailyNorm.create({
                data: {
                    name: input.name,
                    description: input.description,
                    userId: 1,
                    items: {
                        createMany: {
                            data: input.items.map((i) => ({
                                nutrientId: i.nutrientId,
                                quantity: i.quantity,
                            })),
                        },
                    },
                },
                select: defaultSelect,
            })
            return createResponseObject(200, "created", result)
        }),

    updateDailyNorms: t.procedure
        .input(
            z.object({
                id: z.number(),
                name: z.string(),
                description: z.string(),
                items: z.array(
                    z.object({
                        nutrientId: z.number(),
                        quantity: z.number().nullable().optional(),
                    })
                ),
            })
        )
        .mutation(async ({ input }) => {
            // wipe all items and recreate with full array
            await prisma.dailyNormItem.deleteMany({
                where: { normId: input.id },
            })

            const result = await prisma.$transaction(async (tx) => {

                await tx.dailyNormItem.deleteMany({
                    where: { normId: input.id },
                })

                return tx.dailyNorm.update({
                    where: { id: input.id },
                    data: {
                        name: input.name,
                        description: input.description,
                        items: {
                            createMany: {
                                data: input.items.map((i) => ({
                                    nutrientId: i.nutrientId,
                                    quantity: i.quantity,
                                })),
                            },
                        },
                    },
                    select: defaultSelect,
                })
            })


            return createResponseObject(200, "updated", result)
        }),

    removeDailyNorm: t.procedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
            const result = await prisma.dailyNorm.delete({
                where: { id: input.id },
                select: defaultSelect,
            })

            return createResponseObject(200, "deleted", result)
        }),
}
