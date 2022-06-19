//Setup enviroment
import "dotenv/config";
import "express-async-errors";
import express, { Request, Response, Application } from "express";
import cors from "cors";
import connectDB from "./db/connect";
import cron from "node-cron";

//Create server app instance
const app: Application = express();
const PORT = process.env.PORT || 5000;

//Router
import authRouter from "./routes/auth.route";
import questionRouter from "./routes/question.route";
import questionTagRouter from "./routes/questionTag.route";
import votingRouter from "./routes/voting.route";
import answerRouter from "./routes/answer.route";
import commentRouter from "./routes/comment.route";
import profileRouter from "./routes/profile.route";
import shopRouter from "./routes/shop.route";
import adminRouter from "./routes/admin.route";
import productRouter from "./routes/product.route";
import fileRouter from "./routes/file.route";
import verifyRouter from "./routes/verify.route";
import paymentRouter from "./routes/payment.route";
import productCategoryRouter from "./routes/productCategory.route";
import tokenRouter from "./routes/token.route";
import invoiceRouter from "./routes/invoice.route";
import reviewRouter from "./routes/review.route";
import licenseRouter from "./routes/license.route";
import cartRouter from "./routes/cart.route";
import reportRouter from "./routes/report.route";

//Middleware
import errorHandlerMiddleware from "./middlewares/handle-errors";
import notFoundMiddleware from "./middlewares/not-found";
import {
  compulsoryAuth,
  optionalAuth,
  adminAuth,
} from "./middlewares/authentication";

app.use(cors());
app.use(express.json());

app.get("/", (req: Request, res: Response): void => {
  res.send("Hello this is DEEX BACKEND");
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/questions", questionRouter);
app.use("/api/v1/questionTags", questionTagRouter);
app.use("/api/v1/voting", compulsoryAuth, votingRouter);
app.use("/api/v1/answers", answerRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/profile", profileRouter);
app.use("/api/v1/file", compulsoryAuth, fileRouter);
app.use("/api/v1/shop", shopRouter);
app.use("/api/v1/admin", compulsoryAuth, adminAuth, adminRouter);
app.use("/api/v1/products", optionalAuth, productRouter);
app.use("/api/v1/verify", verifyRouter);
app.use("/api/v1/payment", paymentRouter);
app.use("/api/v1/category", productCategoryRouter);
app.use("/api/v1/token", tokenRouter);
app.use("/api/v1/invoices", compulsoryAuth, invoiceRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/licenses", licenseRouter);
app.use("/api/v1/carts", compulsoryAuth, cartRouter);
app.use("/api/v1/reports", compulsoryAuth, reportRouter);

//tool
// import { resetTransaction } from "./controllers/dev.test";
// app.get("/resetTransaction", resetTransaction);

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

//Scheduled Task
import { resolveBounty } from "./scheduled/resolveBounty";
import { resolveShopPayment } from "./scheduled/commitTransaction";
import { clearInvoiceModel } from "./scheduled/clearPendingInvoices";

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI!);
    app.listen(PORT, (): void => {
      console.log(`Server is listening on port ${PORT}...`);
    });

    //Scheduled Tasks
    //Resolve bounty run everyday at every hour
    cron.schedule("1 * * * *", async () => {
      await resolveBounty();
    });

    //Resolve shop payment run everyday at 00:01
    cron.schedule("1 0 * * *", async () => {
      await resolveShopPayment();
    });

    cron.schedule("1 0 * * *", async () => {
      await clearInvoiceModel();
    });
  } catch (error) {
    console.log(error);
  }
};

start();
