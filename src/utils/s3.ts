require("dotenv").config();
// import S3 from "aws-sdk/clients/s3";
import fs from "fs";
import aws from "aws-sdk";
import crypto from "crypto";
import { promisify } from "util";
const randomBytes = promisify(crypto.randomBytes);

const bucketName = process.env.AWS_BUCKET_NAME!;
const region = process.env.AWS_BUCKET_REGION!;
const accessKeyId = process.env.AWS_ACCESS_KEY!;
const secretAccessKey = process.env.AWS_SECRECT_KEY!;

//BE Solution
// const s3 = new S3({
//   region,
//   accessKeyId,
//   secretAccessKey,
// });

// //uploads a file to S3
// function uploadFile(file: Express.Multer.File, folder: String) {
//   const fileStream = fs.createReadStream(file.path);
//   // const fileContent = fs.readFileSync(file.filename);

//   const uploadParams = {
//     Bucket: bucketName,
//     Body: fileStream,
//     Key: `${folder}/${file.filename}.jpg`,
//     ContentType: "image/jpeg",
//   };

//   return s3.upload(uploadParams).promise();
// }

// //download a file from S3
// function getFileStream(fileKey: string) {
//   const downloadParams = {
//     Key: fileKey,
//     Bucket: bucketName,
//   };

//   return s3.getObject(downloadParams).createReadStream();
// }

//FE Solution
const _s3 = new aws.S3({
  region,
  accessKeyId,
  secretAccessKey,
  signatureVersion: "v4",
});

async function generateUploadURL() {
  const rawBytes = await randomBytes(16);
  const imageName = rawBytes.toString("hex");

  const params = {
    Bucket: bucketName,
    Key: imageName,
    Expires: 60,
    // ContentType: "image/jpeg",
  };

  const uploadURL = await _s3.getSignedUrlPromise("putObject", params);
  return uploadURL;
}

export {
  //
  // uploadFile,
  // getFileStream,
  generateUploadURL,
};
