import mongoose from "mongoose";

const connectDB = (url: string) => {
  return mongoose.connect(url, { maxPoolSize: 15 });
};

export default connectDB;
