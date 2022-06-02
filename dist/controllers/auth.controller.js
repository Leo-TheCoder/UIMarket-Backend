"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleLogin = exports.resetPassword = exports.resetForgetPassword = exports.forgetPasswordEmail = exports.resendVerifyEmail = exports.verifyEmailCode = exports.loginWithToken = exports.login = exports.register = void 0;
const User_model_1 = __importDefault(require("../models/User.model"));
const http_status_codes_1 = require("http-status-codes");
const errors_1 = require("../errors");
const sendMail_1 = require("../utils/sendMail");
const User_model_2 = __importDefault(require("../models/User.model"));
const ErrorMessage = __importStar(require("../errors/error_message"));
const google_auth_library_1 = require("google-auth-library");
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const register = async (req, res) => {
    const user = await User_model_1.default.create({
        ...req.body,
    });
    await user.createRefreshToken();
    await user.hashPassword();
    await user.save();
    //send email for verification - need to differentiate google auth and email auth
    (0, sendMail_1.sendVerifyEmail)(req.body.customerEmail, user._id, user.refreshToken);
    res.status(http_status_codes_1.StatusCodes.CREATED).json({
        userId: user._id,
        email: req.body.customerEmail,
        msg: "Account created! Need verify email",
    });
};
exports.register = register;
const login = async (req, res) => {
    const { customerEmail, customerPassword } = req.body;
    if (!customerEmail || !customerPassword) {
        throw new errors_1.BadRequestError(ErrorMessage.ERROR_MISSING_BODY);
    }
    const user = await User_model_1.default.findOne({ customerEmail });
    //Checking email
    if (!user) {
        throw new errors_1.UnauthenticatedError(ErrorMessage.ERROR_AUTHENTICATION_INVALID);
    }
    //checking password
    const isPasswordCorrect = await user.comparePassword(customerPassword);
    if (!isPasswordCorrect) {
        throw new errors_1.UnauthenticatedError(ErrorMessage.ERROR_AUTHENTICATION_INVALID);
    }
    if (user.customerStatus !== 1) {
        return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
            userId: user._id,
            msg: ErrorMessage.ERROR_ACCOUNT_INACTIVED,
        });
    }
    //create JWT for authentication
    const token = user.createJWT();
    const refreshToken = await user.createRefreshToken();
    await user.save();
    const userObj = Object.assign({}, user._doc);
    delete userObj.customerPassword;
    delete userObj.authenToken;
    delete userObj.refreshToken;
    res.status(http_status_codes_1.StatusCodes.OK).json({ user: userObj, token, refreshToken });
};
exports.login = login;
const loginWithToken = async (req, res) => {
    const { userId } = req.user;
    const user = await User_model_1.default.find({ _id: userId }, { customerPassword: 0, authenToken: 0 });
    if (!user) {
        return new errors_1.UnauthenticatedError(ErrorMessage.ERROR_AUTHENTICATION_INVALID);
    }
    res.status(http_status_codes_1.StatusCodes.OK).json({ user: user[0] });
};
exports.loginWithToken = loginWithToken;
const verifyEmailCode = async (req, res) => {
    const { userId, verifyCode } = req.query;
    const user = await User_model_1.default.findById(userId);
    if (user.verifyToken(verifyCode)) {
        user.customerStatus = 1;
        //create JWT for authentication
        const token = user.createJWT();
        const refreshToken = await user.createRefreshToken();
        await user.save();
        const userObj = Object.assign({}, user._doc);
        delete userObj.customerPassword;
        delete userObj.authenToken;
        delete userObj.refreshToken;
        return res
            .status(http_status_codes_1.StatusCodes.OK)
            .json({ user: userObj, token, refreshToken });
    }
    throw new errors_1.UnauthenticatedError(ErrorMessage.ERROR_FAILED);
};
exports.verifyEmailCode = verifyEmailCode;
const resendVerifyEmail = async (req, res) => {
    const { userId } = req.query;
    const user = await User_model_1.default.findById(userId);
    if (!user || !userId) {
        throw new errors_1.UnauthenticatedError(ErrorMessage.ERROR_AUTHENTICATION_INVALID);
    }
    if (user.customerStatus === 1) {
        return res.status(http_status_codes_1.StatusCodes.OK).json({
            msg: "Account has already verified!",
        });
    }
    await user.createRefreshToken();
    await user.save();
    (0, sendMail_1.sendVerifyEmail)(user.customerEmail, user._id, user.refreshToken);
    res.status(http_status_codes_1.StatusCodes.OK).json({
        msg: "Verify email sent!",
    });
};
exports.resendVerifyEmail = resendVerifyEmail;
const forgetPasswordEmail = async (req, res) => {
    const { customerEmail } = req.body;
    const user = await User_model_1.default.findOne({ customerEmail });
    if (!user) {
        throw new errors_1.UnauthenticatedError(ErrorMessage.ERROR_AUTHENTICATION_INVALID);
    }
    await user.createRefreshToken();
    await user.save();
    (0, sendMail_1.sendForgetPasswordEmail)(customerEmail, user._id, user.refreshToken);
    res.status(http_status_codes_1.StatusCodes.OK).json({
        msg: "Verify email sent!",
    });
};
exports.forgetPasswordEmail = forgetPasswordEmail;
const resetForgetPassword = async (req, res) => {
    const { userId, verifyCode, newPassword } = req.body;
    const user = await User_model_1.default.findById(userId);
    if (user.verifyToken(verifyCode)) {
        user.customerPassword = newPassword;
        await user.hashPassword();
        await user.save();
        return res
            .status(http_status_codes_1.StatusCodes.OK)
            .json({ msg: "Reset password successfully!" });
    }
    else {
        throw new errors_1.UnauthenticatedError(ErrorMessage.ERROR_FAILED);
    }
};
exports.resetForgetPassword = resetForgetPassword;
const resetPassword = async (req, res) => {
    const { userId } = req.user;
    const { newPassword } = req.body;
    const user = await User_model_1.default.findById(userId);
    if (!user) {
        throw new errors_1.UnauthenticatedError(ErrorMessage.ERROR_AUTHENTICATION_INVALID);
    }
    user.customerPassword = newPassword;
    await user.hashPassword();
    await user.save();
    (0, sendMail_1.sendResetPasswordConfirmEmail)(user.customerEmail);
    return res.status(http_status_codes_1.StatusCodes.OK).json({
        msg: "Reset password successfully, email confirm sent!",
    });
};
exports.resetPassword = resetPassword;
const googleLogin = async (req, res) => {
    const client = new google_auth_library_1.OAuth2Client(GOOGLE_CLIENT_ID);
    const token = req.body.tokenId;
    if (!token) {
        throw new errors_1.BadRequestError(ErrorMessage.ERROR_GOOGLE_INVALID);
    }
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: GOOGLE_CLIENT_ID, // Specify the CLIENT_ID of the app that accesses the backend
        // Or, if multiple clients access the backend:
        //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
    });
    const payload = ticket.getPayload();
    // If request specified a G Suite domain:
    // const domain = payload['hd'];
    const customerEmail = payload.email;
    const customerName = payload.name;
    const googleId = payload.sub;
    const customerAvatar = payload.picture;
    let user = await User_model_2.default.findOne({ customerEmail });
    if (!user) {
        user = new User_model_2.default();
        await user.createAccountWithGoogleID(customerName, googleId, customerEmail, customerAvatar);
    }
    else {
        if (user.doesAccountCreatedWithGoogle()) {
            //Compare this googleId with googleId in db
            if (!user.verifyGoogleID(googleId)) {
                throw new errors_1.UnauthenticatedError(ErrorMessage.ERROR_GOOGLE_INVALID);
            }
        }
        else {
            await user.updateAccountWithGoogle(googleId, customerAvatar);
        }
    }
    const accessToken = user.createJWT();
    const refressToken = await user.createRefreshToken();
    const userObj = JSON.parse(JSON.stringify(user));
    delete userObj.customerPassword;
    delete userObj.authenToken;
    delete userObj.refreshToken;
    res.status(http_status_codes_1.StatusCodes.OK).json({ user: userObj, accessToken, refressToken });
};
exports.googleLogin = googleLogin;
//# sourceMappingURL=auth.controller.js.map