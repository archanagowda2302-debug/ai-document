const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();

const app = express();

connectDB();


// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors());

app.use(express.json());

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


// ==========================================
// AI ROUTES
// ==========================================

app.use(
  "/api/ai",
  require("./routes/aiRoutes")
);


// ==========================================
// PDF ROUTES
// ==========================================

app.use(
  "/api/pdf",
  require("./routes/pdfRoutes")
);


// ==========================================
// QUIZ ROUTES
// ==========================================

app.use(
  "/api/quiz",
  require("./routes/quizRoutes")
);


// ==========================================
// SERVER
// ==========================================

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(
    `Server running on http://localhost:${PORT}`
  );
});