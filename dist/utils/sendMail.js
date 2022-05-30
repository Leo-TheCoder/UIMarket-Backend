"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendResetPasswordConfirmEmail = exports.sendForgetPasswordEmail = exports.sendVerifyEmail = exports.sendMailTest = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const uuid_1 = require("uuid");
const promises_1 = require("fs/promises");
const path_1 = __importDefault(require("path"));
const handlebars_1 = __importDefault(require("handlebars"));
const transporter = nodemailer_1.default.createTransport({
    service: "Gmail",
    from: "deex.uimarket@gmail.com",
    auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
    },
});
const sendVerifyEmail = (to, userId, verifyCode) => {
    const url = `${process.env.FE_DOMAIN_NAME}/verify?userId=${userId}&verifyCode=${verifyCode}`;
    transporter.sendMail({
        messageId: (0, uuid_1.v4)(),
        from: "<no-reply> deex.uimarket@gmail.com",
        to: to,
        subject: `Verify Account`,
        html: `Click <a href = '${url}'>here</a> to confirm your email.`,
    }, (err) => {
        if (err)
            console.log(err?.message);
    });
};
exports.sendVerifyEmail = sendVerifyEmail;
const sendForgetPasswordEmail = (to, userId, verifyCode) => {
    const url = `${process.env.FE_DOMAIN_NAME}/resetforgetpassword?userId=${userId}&verifyCode=${verifyCode}`;
    transporter.sendMail({
        messageId: (0, uuid_1.v4)(),
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
        messageId: (0, uuid_1.v4)(),
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
const sendMailTest = async (to, content) => {
    const htmlFile = await (0, promises_1.readFile)(path_1.default.join(__dirname, "../public/index.html"), 'utf-8');
    const template = handlebars_1.default.compile(htmlFile);
    const htmlToSend = template({ content });
    const imageFiles = [
        "image-1.png",
        "image-2.png",
        "image-3.png",
        "image-4.png",
        "image-5.png",
        "image-6.png",
        "image-7.png",
        "image-8.png",
        "image-9.png",
        "image-10.jpeg",
    ];
    transporter.sendMail({
        messageId: (0, uuid_1.v4)(),
        sender: "DeeX UI Market",
        from: "<no-reply> deex.uimarket@gmail.com",
        to: to,
        subject: `This is templete mail`,
        html: htmlToSend,
        attachments: imageFiles.map((image) => {
            return {
                filename: image,
                path: `./src/public/images/${image}`,
                cid: image,
            };
        }),
    }, (err) => {
        if (err)
            console.log(err.message);
    });
};
exports.sendMailTest = sendMailTest;
//# sourceMappingURL=sendMail.js.map