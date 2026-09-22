import dotenv from "dotenv";
import express from "express";
import cors from "cors";

import apiRoutes from "./routes";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Main API Router
app.use("/api", apiRoutes);

app.get("/", (req, res) => {
  console.log("api is running");
  res.json({
    message: "api is running",
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
