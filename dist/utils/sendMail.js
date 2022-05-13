"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendResetPasswordConfirmEmail = exports.sendForgetPasswordEmail = exports.sendVerifyEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const transporter = nodemailer_1.default.createTransport({
    service: "Gmail",
    from: "deex.uimarket@gmail.com",
    auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
    },
});
const sendVerifyEmail = (to, userId, verifyCode) => {
    const url = `${process.env.DOMAIN_NAME}/api/v1/verify?userId=${userId}&verifyCode=${verifyCode}`;
    transporter.sendMail({
        from: "<no-reply> deex.uimarket@gmail.com",
        to: to,
        subject: `Verify Account`,
        html: `Click <a href = '${url}'>here</a> to confirm your email.`,
    }, (err) => {
        if (err)
            console.log(err === null || err === void 0 ? void 0 : err.message);
    });
};
exports.sendVerifyEmail = sendVerifyEmail;
const sendForgetPasswordEmail = (to, userId, verifyCode) => {
    const url = `${process.env.FE_DOMAIN_NAME}/resetforgotpassword?userId=${userId}&verifyCode=${verifyCode}`;
    transporter.sendMail({
        from: "<no-reply> deex.uimarket@gmail.com",
        to: to,
        subject: `Forget Password`,
        html: `Click <a href = '${url}'>here</a> to reset your password`,
    }, (err) => {
        if (err)
            console.log(err.message);
    });
};
exports.sendForgetPasswordEmail = sendForgetPasswordEmail;
const sendResetPasswordConfirmEmail = (to) => {
    transporter.sendMail({
        from: "<no-reply> deex.uimarket@gmail.com",
        to: to,
        subject: `Your Password has been reset`,
        html: `Just want to say that your password has been changed!`,
    }, (err) => {
        if (err)
            console.log(err.message);
    });
};
exports.sendResetPasswordConfirmEmail = sendResetPasswordConfirmEmail;
//# sourceMappingURL=sendMail.js.map