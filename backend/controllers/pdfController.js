const Document = require("../models/Document");
const { generatePDF } = require("../utils/pdfGenerator");
const fs = require("fs");

const generateSummaryPDF = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        message: "Document not found"
      });
    }

    if (!document.summary) {
      return res.status(400).json({
        message: "Summary not generated yet"
      });
    }

    const fileName = `summary-${document._id}.pdf`;

    const filePath = await generatePDF(
      `Document Summary - ${document.originalName}`,
      document.summary,
      fileName
    );

    res.download(
      filePath,
      `summary-${document.originalName.replace(".pdf", "")}.pdf`,
      (error) => {
        if (error) {
          console.error("Download error:", error);
        }

        // Delete generated file after download
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    );

  } catch (error) {
    console.error("Summary PDF error:", error);

    res.status(500).json({
      message: "Error generating summary PDF",
      error: error.message
    });
  }
};


const generateQuestionsPDF = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        message: "Document not found"
      });
    }

    if (!document.importantQuestions || document.importantQuestions.length === 0) {
      return res.status(400).json({
        message: "Important questions not generated yet"
      });
    }

    let content = "";

    document.importantQuestions.forEach((item, index) => {
      content += `${index + 1}. ${item.question}\n`;

      content += `Importance: ${item.importance}\n`;
      content += `Type: ${item.type}\n`;
      content += `Reason: ${item.reason}\n\n`;

      content += "----------------------------------------\n\n";
    });

    const fileName = `important-questions-${document._id}.pdf`;

    const filePath = await generatePDF(
      `Important Questions - ${document.originalName}`,
      content,
      fileName
    );

    res.download(
      filePath,
      `important-questions-${document.originalName.replace(".pdf", "")}.pdf`,
      (error) => {
        if (error) {
          console.error("Download error:", error);
        }

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    );

  } catch (error) {
    console.error("Questions PDF error:", error);

    res.status(500).json({
      message: "Error generating questions PDF",
      error: error.message
    });
  }
};


const generateQuizPDF = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        message: "Document not found"
      });
    }

    if (!document.quiz || document.quiz.length === 0) {
      return res.status(400).json({
        message: "Quiz not generated yet"
      });
    }

    let content = "";

    document.quiz.forEach((item, index) => {
      content += `${index + 1}. ${item.question}\n\n`;

      item.options.forEach((option, optionIndex) => {
        content += `${String.fromCharCode(65 + optionIndex)}. ${option}\n`;
      });

      content += `\nCorrect Answer: ${item.correctAnswer}\n`;
      content += `Explanation: ${item.explanation}\n\n`;

      content += "----------------------------------------\n\n";
    });

    const fileName = `quiz-${document._id}.pdf`;

    const filePath = await generatePDF(
      `Quiz - ${document.originalName}`,
      content,
      fileName
    );

    res.download(
      filePath,
      `quiz-${document.originalName.replace(".pdf", "")}.pdf`,
      (error) => {
        if (error) {
          console.error("Download error:", error);
        }

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    );

  } catch (error) {
    console.error("Quiz PDF error:", error);

    res.status(500).json({
      message: "Error generating quiz PDF",
      error: error.message
    });
  }
};


module.exports = {
  generateSummaryPDF,
  generateQuestionsPDF,
  generateQuizPDF
};