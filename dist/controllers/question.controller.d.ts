import { Request, Response } from "express";
import { IUserRequest } from "../types/express";
declare const createQuestion: (req: IUserRequest, res: Response) => Promise<void>;
declare const getQuestions: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const getQuestionByID: (req: IUserRequest, res: Response) => Promise<void>;
declare const chooseBestAnswer: (req: IUserRequest, res: Response) => Promise<void>;
declare const deleteQuestion: (req: IUserRequest, res: Response) => Promise<void>;
declare const updateQuestion: (req: IUserRequest, res: Response) => Promise<void>;
declare const rebountyQuestion: (req: IUserRequest, res: Response) => Promise<void>;
export { createQuestion, getQuestions, getQuestionByID, chooseBestAnswer, deleteQuestion, updateQuestion, rebountyQuestion, };
//# sourceMappingURL=question.controller.d.ts.map