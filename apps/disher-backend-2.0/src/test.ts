import { appRouter } from "./routes/index.js";

const caller = appRouter.createCaller({})

caller.createUser({
    email: 'yashkovec@gmail.com',
    name: 'Takov'
})

