"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUploadURL = void 0;
require("dotenv").config();
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const crypto_1 = __importDefault(require("crypto"));
const util_1 = require("util");
const randomBytes = (0, util_1.promisify)(crypto_1.default.randomBytes);
const bucketName = process.env.AWS_BUCKET_NAME;
const prdbucketName = process.env.AWS_PRDBUCKET_NAME;
const region = process.env.AWS_BUCKET_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_KEY;
//BE Solution
const s3 = new aws_sdk_1.default.S3({
    region,
    accessKeyId,
    secretAccessKey,
    signatureVersion: "v4",
});
//uploads a file to S3
// function uploadFile(file: Express.Multer.File, folder: String) {
//   const fileStream = fs.createReadStream(file.path);
//   // const fileContent = fs.readFileSync(file.filename);
//   const uploadParams = {
//     Bucket: prdbucketName,
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
function generateUploadURL(folder, isPrivate) {
    return __awaiter(this, void 0, void 0, function* () {
        const rawBytes = yield randomBytes(16);
        const fileName = rawBytes.toString("hex");
        let bucket;
        if (isPrivate == true) {
            bucket = prdbucketName;
        }
        else {
            bucket = bucketName;
        }
        // console.log(bucket);
        const params = {
            Bucket: bucket,
            Key: `${folder}/${fileName}`,
            Expires: 60,
        };
        const uploadURL = yield s3.getSignedUrlPromise("putObject", params);
        return uploadURL;
    });
}
exports.generateUploadURL = generateUploadURL;
//# sourceMappingURL=s3.js.map