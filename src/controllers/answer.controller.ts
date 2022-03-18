import { StatusCodes } from 'http-status-codes';
import { BadRequestError, UnauthenticatedError } from '../errors';
import { Request, Response } from 'express';
import { IUserRequest } from '../types/express';
import Question from '../models/Question.model';
import QuestionTag from '../models/QuestionTag.model';
import { ObjectId } from 'mongodb';
import VotingModel from '../models/Voting.model';
