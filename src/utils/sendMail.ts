import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "Gmail",
  from: "deex.uimarket@gmail.com",
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendVerifyEmail = (to: string, userId: string, verifyCode: string) => {
  const url = `${process.env.DOMAIN_NAME}/api/v1/verify?userId=${userId}&verifyCode=${verifyCode}`;
  transporter.sendMail(
    {
      from: "<no-reply> deex.uimarket@gmail.com",
      to: to,
      subject: `Verify Account`,
      html: `Click <a href = '${url}'>here</a> to confirm your email.`,
    },
    (err) => {
      if (err) console.log(err?.message);
    }
  );
};

const sendForgetPasswordEmail = (
  to: string,
  userId: string,
  verifyCode: string
) => {
  const url = `${process.env.DOMAIN_NAME}/api/v1/verify/resetForgetPassword?userId=${userId}&verifyCode=${verifyCode}`;
  transporter.sendMail(
    {
      from: "<no-reply> deex.uimarket@gmail.com",
      to: to,
      subject: `Forget Password`,
      html: `Click <a href = '${url}'>here</a> to reset your password`,
    },
    (err) => {
      if (err) console.log(err.message);
    }
  );
};

const sendResetPasswordConfirmEmail = (to: string) => {
  transporter.sendMail(
    {
      from: "<no-reply> deex.uimarket@gmail.com",
      to: to,
      subject: `Your Password has been reset`,
      html: `Just want to say that your password has been changed!`,
    },
    (err) => {
      if (err) console.log(err.message);
    }
  );
};

export {
  sendVerifyEmail,
  sendForgetPasswordEmail,
  sendResetPasswordConfirmEmail,
};
