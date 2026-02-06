import dotenv from "dotenv";
dotenv.config();
import e from "express";

const app = e();

app.get("/", (req, res) => {
  res.send("Hello World!");
});

export default app;