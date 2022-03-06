import 'dotenv/config';
import 'express-async-errors';
import express, { Request, Response, Application } from "express";
import connectDB from "./db/connect";

const app: Application = express();
const PORT = process.env.PORT || 5000;

app.get("/", (req: Request, res: Response): void => {
  res.send("Hello this is UIMarket project");
});

app.use("/api/v1/auth", )


const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI!);
    app.listen(PORT, (): void => {
      console.log(`Sever is listening on port ${PORT}...`);
    });
  } catch (error) {
    console.log(error);
  }
}

start();