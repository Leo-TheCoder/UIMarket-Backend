import nodemailer from "nodemailer";
import { v4 as uuidv4 } from "uuid";
import { readFile } from "fs/promises";
import path from "path";
import Handlebars from "handlebars";

const transporter = nodemailer.createTransport({
  service: "Gmail",
  from: "deex.uimarket@gmail.com",
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendVerifyEmail = async (
  to: string,
  userId: string,
  name: string,
  verifyCode: string
) => {
  const url = `${process.env.FE_DOMAIN_NAME}/verify?userId=${userId}&verifyCode=${verifyCode}`;

  const htmlFile = await readFile(
    path.join(__dirname, "../public/Confirmation.html"),
    "utf-8"
  );

  const data = {
    title: `Thanks for signing up, ${name}!`,
    content: `Please verify your email address to get access to more features`,
    btnTitle: `Verify Email Now`,
    url,
  };

  const template = Handlebars.compile(htmlFile);
  const htmlToSend = template(data);

  const imageFiles = ["logo-big.png"];
  transporter.sendMail(
    {
      messageId: uuidv4(),
      sender: "Deex UI Market",
      from: "<no-reply> deex.uimarket@gmail.com",
      to: to,
      subject: `Verify Account`,
      html: htmlToSend,
      attachments: imageFiles.map((image) => {
        return {
          filename: image,
          path: `./src/public/${image}`,
          cid: image,
        };
      }),
    },
    (err) => {
      if (err) console.log(err.message);
    }
  );
};

const sendForgetPasswordEmail = async(
  to: string,
  userId: string,
  verifyCode: string
) => {
  const url = `${process.env.FE_DOMAIN_NAME}/resetforgetpassword?userId=${userId}&verifyCode=${verifyCode}`;

  const htmlFile = await readFile(
    path.join(__dirname, "../public/Confirmation.html"),
    "utf-8"
  );

  const data = {
    title: `Reset password!`,
    content: `Please reset your password to get full access to your account`,
    btnTitle: `Reset Password Now`,
    url,
  };

  const template = Handlebars.compile(htmlFile);
  const htmlToSend = template(data);

  const imageFiles = ["logo-big.png"];
  transporter.sendMail(
    {
      messageId: uuidv4(),
      sender: "Deex UI Market",
      from: "<no-reply> deex.uimarket@gmail.com",
      to: to,
      subject: `Reset Forgot Password`,
      html: htmlToSend,
      attachments: imageFiles.map((image) => {
        return {
          filename: image,
          path: `./src/public/${image}`,
          cid: image,
        };
      }),
    },
    (err) => {
      if (err) console.log(err.message);
    }
  );
};

const sendResetPasswordConfirmEmail = async (to: string) => {
  transporter.sendMail(
    {
      messageId: uuidv4(),
      from: "<no-reply> deex.uimarket@gmail.com",
      to: to,
      subject: `Your Password has been reset`,
      html: `Just want to say that your password has been changed!`,
    },
    (err) => {
      if (err) console.log(err.message);
    }
  );

  const htmlFile = await readFile(
    path.join(__dirname, "../public/Confirmation.html"),
    "utf-8"
  );

  const data = {
    title: `Your password has been changed!`,
    content: `This mail notify that your password has been changed! Please contact us if there is something wrong`,
    btnTitle: `Contact Now`,
    url: `${process.env.FE_DOMAIN_NAME}/contact`,
  };

  const template = Handlebars.compile(htmlFile);
  const htmlToSend = template(data);

  const imageFiles = ["logo-big.png"];
  transporter.sendMail(
    {
      messageId: uuidv4(),
      sender: "Deex UI Market",
      from: "<no-reply> deex.uimarket@gmail.com",
      to: to,
      subject: `Your Password Changed`,
      html: htmlToSend,
      attachments: imageFiles.map((image) => {
        return {
          filename: image,
          path: `./src/public/${image}`,
          cid: image,
        };
      }),
    },
    (err) => {
      if (err) console.log(err.message);
    }
  );
};

export const sendMailTest = async (to: string, content: string) => {
  const htmlFile = await readFile(
    path.join(__dirname, "../public/Confirmation.html"),
    "utf-8"
  );

  const template = Handlebars.compile(htmlFile);
  const htmlToSend = template({ content });

  const imageFiles = ["logo-big.png"];
  transporter.sendMail(
    {
      messageId: uuidv4(),
      sender: "DeeX UI Market",
      from: "<no-reply> deex.uimarket@gmail.com",
      to: to,
      subject: `This is templete mail`,
      html: htmlToSend,
      attachments: imageFiles.map((image) => {
        return {
          filename: image,
          path: `./src/public/${image}`,
          cid: image,
        };
      }),
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
