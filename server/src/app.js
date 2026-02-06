import dotenv from "dotenv";
dotenv.config();
import e from "express";

const app = e();

app.get("/health", (req, res) => {
  res.json({ status: "ok" ,message:"server is running!", time: new Date().toISOString()});
});

export default app;