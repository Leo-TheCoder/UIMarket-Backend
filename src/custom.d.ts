declare namespace Express {
    export interface Request {
        user?: {
            userId: string;
            name: string;
            isActive: boolean;
        }
    }
}

