import { appRouter } from "./routes";

const caller = appRouter.createCaller({})

caller.createUser({
    email: 'yashkovec@gmail.com',
    name: 'Takov'
})

