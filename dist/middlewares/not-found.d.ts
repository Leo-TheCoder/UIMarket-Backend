import { Request, Response } from 'express';
declare const notFound: (req: Request, res: Response) => Response<any, Record<string, any>>;
export default notFound;
