require("dotenv").config();
import S3 from "aws-sdk/clients/s3";
import fs from "fs";

const bucketName = process.env.AWS_BUCKET_NAME!;
const region = process.env.AWS_BUCKET_REGION!;
const accessKeyId = process.env.AWS_ACCESS_KEY!;
const secretAccessKey = process.env.AWS_SECRECT_KEY!;

const s3 = new S3({
  region,
  accessKeyId,
  secretAccessKey,
});

//uploads a file to S3
function uploadFile(file: Express.Multer.File, folder: String) {
  const fileStream = fs.createReadStream(file.path);
  // const fileContent = fs.readFileSync(file.filename);

  const uploadParams = {
    Bucket: bucketName,
    Body: fileStream,
    Key: `${folder}/${file.filename}.jpg`,
    ContentType: "image/jpeg",
  };

  return s3.upload(uploadParams).promise();
}

//download a file from S3
function getFileStream(fileKey: string) {
  const downloadParams = {
    Key: fileKey,
    Bucket: bucketName,
  };

  return s3.getObject(downloadParams).createReadStream();
}

export {
  //
  uploadFile,
  getFileStream,
};
