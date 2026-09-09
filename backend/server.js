const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { authenticateToken } = require("./middleware/auth");
const { resumePendingDocuments } = require("./services/documentProcessor");

dotenv.config();

const app = express();

// ==========================================
// MIDDLEWARE
// ==========================================

const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174"
];

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin is not allowed by CORS"));
  }
}));

app.use(express.json({ limit: "2mb" }));

app.use(express.urlencoded({ extended: true }));


// ==========================================
// HOME
// ==========================================

app.get("/", (req, res) => {
  res.json({
    message: "AI Document Intelligence API is running"
  });
});


// ==========================================
// DOCUMENT ROUTES
// ==========================================

app.use(
  "/api/documents",
  require("./routes/documentRoutes")
);

app.use("/api/auth", require("./routes/authRoutes"));


// ==========================================
// AI ROUTES
// ==========================================

app.use("/api/ai", authenticateToken, require("./routes/aiRoutes"));


// ==========================================
// PDF ROUTES
// ==========================================

app.use("/api/pdf", authenticateToken, require("./routes/pdfRoutes"));


// ==========================================
// QUIZ ROUTES
// ==========================================

app.use("/api/quiz", authenticateToken, require("./routes/quizRoutes"));

app.use((error, req, res, next) => {
  if (error) {
    console.error("Unhandled request error:", error);
    const status = error.name === "MulterError" || error.message === "Only PDF files are allowed" ? 400 : 500;
    return res.status(status).json({ message: status === 400 ? error.message : "The server could not process this request." });
  }
  next();
});


// ==========================================
// SERVER
// ==========================================

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(
    `Server running on http://localhost:${PORT}`
  );
  resumePendingDocuments();
});

server.requestTimeout = 30 * 60 * 1000;
server.headersTimeout = 30 * 60 * 1000 + 5000;
server.keepAliveTimeout = 65000;
