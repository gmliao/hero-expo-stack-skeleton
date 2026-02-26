import { Request, Response, NextFunction } from 'express';
export interface AuthenticatedRequest extends Request {
    uid?: string;
    email?: string;
}
export declare function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
