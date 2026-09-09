const { getDocument, getOwnedDocument } = require("../services/documentStore");

const getQuizForAttempt = (req, res) => {
  const document = getOwnedDocument(req.params.id, req.user.id);
  if (!document) return res.status(getDocument(req.params.id) ? 403 : 404).json({ message: getDocument(req.params.id) ? "You are not allowed to access this document." : "Document not found." });
  if (!document.quiz.length) return res.status(400).json({ message: "Quiz has not been generated yet." });
  res.json({ documentId: document.id, documentName: document.name, numberOfQuestions: document.quiz.length, quiz: document.quiz.map(({ question, options }, index) => ({ id: index + 1, question, options })) });
};

const submitQuiz = (req, res) => {
  const document = getOwnedDocument(req.params.id, req.user.id);
  if (!document) return res.status(getDocument(req.params.id) ? 403 : 404).json({ message: getDocument(req.params.id) ? "You are not allowed to access this document." : "Document not found." });
  const { answers } = req.body;
  if (!Array.isArray(answers) || answers.length !== document.quiz.length) return res.status(400).json({ message: `Please provide answers for all ${document.quiz.length} questions.` });
  const results = document.quiz.map((question, index) => ({ questionNumber: index + 1, question: question.question, selectedAnswer: answers[index] || "", correctAnswer: question.correctAnswer, isCorrect: Boolean(answers[index]) && answers[index] === question.correctAnswer, explanation: question.explanation }));
  const score = results.filter((item) => item.isCorrect).length;
  const percentage = Math.round((score / results.length) * 100);
  res.json({ message: "Quiz submitted successfully", result: { score, totalQuestions: results.length, percentage, performance: percentage >= 75 ? "Very Good" : percentage >= 50 ? "Good" : "Keep Practicing" }, results });
};

module.exports = { getQuizForAttempt, submitQuiz };
