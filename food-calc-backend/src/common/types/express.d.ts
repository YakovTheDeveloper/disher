
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: number,
                login: string
            };
        }
    }
}

export { }; 