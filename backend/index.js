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

// Connect to MongoDB
connectDB();

const app = express();

const allowedOrigins = ["http://localhost:5173"];
const corsOptions = {
  origin: (origin, callback) => {
    console.log("CORS check, origin:", origin);
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS: " + origin));
    }
  },
  credentials: true,
};

// Middleware
app.use(cors(corsOptions));      // Apply CORS globally
app.use(express.json());         // Parse JSON bodies

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/item", itemRoutes);
app.use("/api/release", releaseRoutes);
app.use("/api/return", returnRoutes);

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
