import nodemailer from "nodemailer";
import { v4 as uuidv4 } from "uuid";
import { readFile } from "fs/promises";
import path from "path";

const transporter = nodemailer.createTransport({
	service: 'Gmail',
	from: 'deex.uimarket@gmail.com',
	auth: {
		user: process.env.EMAIL_USERNAME,
		pass: process.env.EMAIL_PASSWORD,
	},
});

const sendVerifyEmail = (to: string, userId: string, verifyCode: string) => {
	const url = `${process.env.FE_DOMAIN_NAME}/verify?userId=${userId}&verifyCode=${verifyCode}`;
	transporter.sendMail(
		{
      messageId: uuidv4(),
			from: '<no-reply> deex.uimarket@gmail.com',
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
	const url = `${process.env.FE_DOMAIN_NAME}/resetforgetpassword?userId=${userId}&verifyCode=${verifyCode}`;
	transporter.sendMail(
		{
      messageId: uuidv4(),
			from: '<no-reply> deex.uimarket@gmail.com',
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
      messageId: uuidv4(),
			from: '<no-reply> deex.uimarket@gmail.com',
			to: to,
			subject: `Your Password has been reset`,
			html: `Just want to say that your password has been changed!`,
		},
		(err) => {
			if (err) console.log(err.message);
		}
	);
};

export const sendMailTest = async (to: string, content: string) => {
  const htmlToSend = await readFile(
    path.join(__dirname, "../public/index.html")
  );

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
  transporter.sendMail(
    {
      messageId: uuidv4(),
      sender: "DeeX UI Market",
      from: "<no-reply> deex.uimarket@gmail.com",
      to: to,
      subject: `This is templete mail`,
      html: htmlToSend,
      attachments: imageFiles.map(image => {
        return {
          filename: image,
          path: `./src/public/images/${image}`,
          cid: image
        }
      })
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
