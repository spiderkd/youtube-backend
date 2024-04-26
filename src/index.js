import dotenv from "dotenv";
import connectDB from "./db/index.js";

import { app } from "./app.js";
import { error } from "console";

dotenv.config({
  path: "./env",
});

connectDB()
  .then(() => {
    app.on("errror", (error) => {
      console.log("error:", error);
      throw error;
    });

    app.listen(process.env.PORT || 8000),
      () => {
        console.log(`server is running at ${process.env.PORT}`);
      };
  })
  .catch((error) => {
    console.log("MONGO DB CONNECTION FAILED", error);
  });

// require("dotenv").config({ path: "./env" });
// import mongoose from "mongoose";
// import { DB_NAME } from "./constants";
// import express from "express";
// const app = express()(async () => {
//   try {
//     await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
//     app.on("error", (error) => {
//       console.log("error", error);
//       throw error;

//       app.listen(process.env.PORT, () => {
//         console.log(`app is listening at port ${PORT}`);
//       });
//     });
//   } catch (error) {
//     console.error("ERROR", error);
//     throw err;
//   }
// })();

