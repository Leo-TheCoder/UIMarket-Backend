import express from 'express';
import { login, loginWithToken, register } from '../controllers/auth.controller';
import * as authenticationMiddleware from '../middlewares/authentication';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/login', authenticationMiddleware.compulsoryAuth, loginWithToken);

export default router;
