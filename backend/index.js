import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import itemRoutes from "./routes/itemRoutes.js";
import releaseRoutes from "./routes/releaseRoutes.js";
import returnRoutes from "./routes/returnRoutes.js";
import { errorHandler } from "./middleware/errorMidddleware.js";

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Store Management API is running...");
});

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/item", itemRoutes);
app.use("/api/release", releaseRoutes);
app.use("/api/return", returnRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
export default app;
