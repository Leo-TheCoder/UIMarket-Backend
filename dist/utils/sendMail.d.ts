declare const sendVerifyEmail: (to: string, userId: string, verifyCode: string) => void;
declare const sendForgetPasswordEmail: (to: string, userId: string, verifyCode: string) => void;
declare const sendResetPasswordConfirmEmail: (to: string) => void;
export declare const sendMailTest: (to: string, content: string) => Promise<void>;
export { sendVerifyEmail, sendForgetPasswordEmail, sendResetPasswordConfirmEmail, };
//# sourceMappingURL=sendMail.d.ts.map