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

export { sendVerifyEmail };
