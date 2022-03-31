//Setup enviroment
import "dotenv/config";
import "express-async-errors";
import express, { Request, Response, Application } from "express";
import cors from "cors";
import connectDB from "./db/connect";

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
import pictureRouter from "./routes/picture.route";
import shopRouter from "./routes/shop.route";

//Middleware
import errorHandlerMiddleware from "./middlewares/handle-errors";
import notFoundMiddleware from "./middlewares/not-found";
import { compulsoryAuth } from "./middlewares/authentication";

app.use(cors());
app.use(express.json());

app.get("/", (req: Request, res: Response): void => {
  res.send("Hello this is UIMarket project");
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/questions", questionRouter);
app.use("/api/v1/questionTags", questionTagRouter);
app.use("/api/v1/voting", compulsoryAuth, votingRouter);
app.use("/api/v1/answers", answerRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/profile", profileRouter);
app.use("/api/v1/pictures", compulsoryAuth, pictureRouter);
app.use("/api/v1/shops", shopRouter);

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI!);
    app.listen(PORT, (): void => {
      console.log(`Server is listening on port ${PORT}...`);
    });
  } catch (error) {
    console.log(error);
  }
};

start();
