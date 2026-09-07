const express = require("express");

const router = express.Router();

const {
  generateSummary,
  chatWithDocument,
  explainSimply,
  generateQuiz,
  generateImportantQuestions,
  generateImportantDates,
  extractTables
} = require("../controllers/aiController");


// ===============================
// SUMMARY
// ===============================
router.get("/:id/summary", generateSummary);


// ===============================
// CHAT
// ===============================
router.post("/:id/chat", chatWithDocument);


// ===============================
// EXPLAIN SIMPLY
// ===============================
router.get("/:id/explain", explainSimply);


// ===============================
// GENERATE QUIZ
// ===============================
router.post("/:id/quiz", generateQuiz);


// ===============================
// IMPORTANT QUESTIONS
// ===============================
router.post(
  "/:id/important-questions",
  generateImportantQuestions
);


// ===============================
// IMPORTANT DATES
// ===============================
router.get("/:id/dates", generateImportantDates);


// ===============================
// EXTRACT TABLES
// ===============================
router.get("/:id/tables", extractTables);


module.exports = router;