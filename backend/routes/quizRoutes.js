const express = require("express");

const router = express.Router();

const {
  getQuizForAttempt,
  submitQuiz
} = require("../controllers/quizController");


// ==========================================
// GET QUIZ FOR ATTENDING
// ==========================================

router.get(
  "/:id",
  getQuizForAttempt
);


// ==========================================
// SUBMIT QUIZ
// ==========================================

router.post(
  "/:id/submit",
  submitQuiz
);


module.exports = router;