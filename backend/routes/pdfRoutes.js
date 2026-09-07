const express = require("express");

const router = express.Router();

const {
  generateSummaryPDF,
  generateQuestionsPDF,
  generateQuizPDF
} = require("../controllers/pdfController");


// Download summary PDF
router.get(
  "/:id/summary/pdf",
  generateSummaryPDF
);


// Download important questions PDF
router.get(
  "/:id/important-questions/pdf",
  generateQuestionsPDF
);


// Download quiz PDF
router.get(
  "/:id/quiz/pdf",
  generateQuizPDF
);


module.exports = router;