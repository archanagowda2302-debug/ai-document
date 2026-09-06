const Document = require("../models/Document");


// ==========================================
// GET QUIZ FOR ATTENDING
// ==========================================

const getQuizForAttempt = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        message: "Document not found"
      });
    }

    // Check whether quiz has been generated
    if (!document.quiz || document.quiz.length === 0) {
      return res.status(400).json({
        message: "Quiz has not been generated yet. Please generate a quiz first."
      });
    }

    /*
      Send only questions and options.

      DO NOT send:
      - correctAnswer
      - explanation

      This prevents the student from seeing answers
      before submitting the quiz.
    */

    const quiz = document.quiz.map((question, index) => ({
      id: index + 1,
      question: question.question,
      options: question.options
    }));

    res.json({
      message: "Quiz loaded successfully",
      documentId: document._id,
      documentName: document.originalName,
      numberOfQuestions: quiz.length,
      quiz
    });

  } catch (error) {
    console.error("Get quiz error:", error);

    res.status(500).json({
      message: "Error loading quiz",
      error: error.message
    });
  }
};


// ==========================================
// SUBMIT QUIZ
// ==========================================

const submitQuiz = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        message: "Document not found"
      });
    }

    if (!document.quiz || document.quiz.length === 0) {
      return res.status(400).json({
        message: "Quiz has not been generated yet."
      });
    }

    const { answers } = req.body;

    // Check answers
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        message: "Please provide quiz answers."
      });
    }

    // Make sure every question is answered
    if (answers.length !== document.quiz.length) {
      return res.status(400).json({
        message: `Please answer all ${document.quiz.length} questions.`
      });
    }

    let score = 0;

    const results = document.quiz.map((question, index) => {

      const userAnswer = answers[index];

      const correct = userAnswer === question.correctAnswer;

      if (correct) {
        score++;
      }

      return {
        questionNumber: index + 1,
        question: question.question,
        selectedAnswer: userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect: correct,
        explanation: question.explanation
      };
    });


    // ==========================================
    // CALCULATE RESULT
    // ==========================================

    const totalQuestions = document.quiz.length;

    const percentage = Math.round(
      (score / totalQuestions) * 100
    );


    // ==========================================
    // PERFORMANCE
    // ==========================================

    let performance;

    if (percentage >= 90) {
      performance = "Excellent";
    } else if (percentage >= 75) {
      performance = "Very Good";
    } else if (percentage >= 60) {
      performance = "Good";
    } else if (percentage >= 40) {
      performance = "Needs Improvement";
    } else {
      performance = "Keep Practicing";
    }


    // ==========================================
    // RESPONSE
    // ==========================================

    res.json({
      message: "Quiz submitted successfully",

      result: {
        score,
        totalQuestions,
        percentage,
        performance
      },

      results
    });

  } catch (error) {
    console.error("Submit quiz error:", error);

    res.status(500).json({
      message: "Error submitting quiz",
      error: error.message
    });
  }
};


module.exports = {
  getQuizForAttempt,
  submitQuiz
};