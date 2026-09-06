const Document = require("../models/Document");
const { askAI } = require("../services/aiService");


// ===============================
// GENERATE SUMMARY
// ===============================
const generateSummary = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        message: "Document not found"
      });
    }

    const prompt = `
You are an AI document intelligence assistant.

Read the following document and create a clear, well-organized summary.

DOCUMENT:
${document.extractedText}

Create the summary using EXACTLY this structure:

1. Short Overview

Write a clear 2-4 sentence overview of the document.

2. Main Key Points

Write the most important points from the document as bullet points.

3. Important Information

List important facts, names, numbers, technical details, dates, or other information that a reader should remember.

4. Key Concepts

Explain the main concepts discussed in the document in simple language.

5. Conclusion

Give a short conclusion explaining the overall purpose or importance of the document.

IMPORTANT FORMATTING RULES:

- Use the exact section names above.
- Do NOT use Markdown symbols such as #, ##, ###, *, **, or ---.
- Use normal text headings.
- Use bullet points starting with "-".
- Keep proper spacing between sections.
- Use simple and clear English.
- Keep the summary concise but informative.
- Do not repeat the same information.
- Use ONLY information from the document.
- Do not invent or assume information.
- If some information is not available, do not make it up.

Return ONLY the summary.
`;

    const summary = await askAI(prompt);

    document.summary = summary;
    await document.save();

    res.json({
      message: "Summary generated successfully",
      summary
    });

  } catch (error) {
    console.error("Summary error:", error);

    res.status(500).json({
      message: "Error generating summary",
      error: error.message
    });
  }
};


// ===============================
// CHAT WITH DOCUMENT
// ===============================
const chatWithDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        message: "Document not found"
      });
    }

    const { question } = req.body;

    if (!question) {
      return res.status(400).json({
        message: "Please provide a question"
      });
    }

    const prompt = `
You are an AI assistant that answers questions based ONLY on the provided document.

DOCUMENT:
${document.extractedText}

USER QUESTION:
${question}

Instructions:
- Answer using information from the document.
- Do not invent information.
- If the answer is not present in the document, say:
"This information is not available in the document."
- Give a clear and concise answer.
- Use bullet points when useful.
`;

    const answer = await askAI(prompt);

    res.json({
      message: "Answer generated successfully",
      question,
      answer
    });

  } catch (error) {
    console.error("Chat error:", error);

    res.status(500).json({
      message: "Error chatting with document",
      error: error.message
    });
  }
};


// ===============================
// EXPLAIN SIMPLY
// ===============================
const explainSimply = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        message: "Document not found"
      });
    }

    const prompt = `
You are an AI tutor.

Explain the following document in very simple language so that a student can easily understand it.

DOCUMENT:
${document.extractedText}

Instructions:
- Use simple English.
- Avoid complicated words.
- Explain the main idea first.
- Break the explanation into clear sections.
- Use bullet points where useful.
- Give simple examples when appropriate.
- Do not invent information.
- Use ONLY information available in the document.

Use EXACTLY this structure:

Simple Overview

Explain the document in 2-4 simple sentences.

Main Points

- Point 1
- Point 2
- Point 3

Important Concepts

Explain the important concepts in simple language.

Easy Example

Give an easy example only when appropriate and supported by the document.

In One Sentence

Explain the entire document in one simple sentence.
`;

    const explanation = await askAI(prompt);

    res.json({
      message: "Simple explanation generated successfully",
      explanation
    });

  } catch (error) {
    console.error("Explain error:", error);

    res.status(500).json({
      message: "Error explaining document",
      error: error.message
    });
  }
};


// ===============================
// GENERATE QUIZ
// ===============================
const generateQuiz = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        message: "Document not found"
      });
    }

    const numberOfQuestions = req.body.numberOfQuestions || 5;
    const difficulty = req.body.difficulty || "medium";

    const prompt = `
You are an AI quiz generator.

Create a quiz based ONLY on the following document.

DOCUMENT:
${document.extractedText}

Generate ${numberOfQuestions} multiple-choice questions.

Difficulty:
${difficulty}

For every question provide:

1. Question
2. Four options
3. Correct answer
4. Short explanation

Rules:
- Questions must be based only on the document.
- Do not invent information.
- Each question must have exactly 4 options.
- Only one option should be correct.
- Avoid duplicate questions.
- Use simple and clear English.

Return ONLY valid JSON.

Use exactly this format:

[
  {
    "question": "Question text",
    "options": [
      "Option A",
      "Option B",
      "Option C",
      "Option D"
    ],
    "correctAnswer": "Option A",
    "explanation": "Short explanation"
  }
]
`;

    const result = await askAI(prompt);

    const cleanResult = result
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const quiz = JSON.parse(cleanResult);

    document.quiz = quiz;
    await document.save();

    res.json({
      message: "Quiz generated successfully",
      numberOfQuestions: quiz.length,
      difficulty,
      quiz
    });

  } catch (error) {
    console.error("Quiz error:", error);

    res.status(500).json({
      message: "Error generating quiz",
      error: error.message
    });
  }
};


// ===============================
// GENERATE IMPORTANT QUESTIONS
// ===============================
const generateImportantQuestions = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        message: "Document not found"
      });
    }

    const numberOfQuestions = req.body.numberOfQuestions || 10;

    const prompt = `
You are an AI exam preparation assistant.

Read the following document and identify the most important questions that a student should prepare for an examination.

DOCUMENT:
${document.extractedText}

Generate ${numberOfQuestions} important questions.

The questions should cover:
- Important concepts
- Definitions
- Key facts
- Important explanations
- Important processes
- Possible theory questions
- Important comparisons or differences

Instructions:
- Use ONLY information available in the document.
- Do not invent information.
- Avoid duplicate questions.
- Arrange questions from most important to less important.

Return ONLY valid JSON.

Use exactly this format:

[
  {
    "question": "Question text",
    "importance": "High",
    "type": "Short Answer",
    "reason": "Why this question is important"
  }
]
`;

    const result = await askAI(prompt);

    const cleanResult = result
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const importantQuestions = JSON.parse(cleanResult);

    document.importantQuestions = importantQuestions;
    await document.save();

    res.json({
      message: "Important questions generated successfully",
      numberOfQuestions: importantQuestions.length,
      questions: importantQuestions
    });

  } catch (error) {
    console.error("Important questions error:", error);

    res.status(500).json({
      message: "Error generating important questions",
      error: error.message
    });
  }
};


// ===============================
// EXTRACT IMPORTANT DATES
// ===============================
const generateImportantDates = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        message: "Document not found"
      });
    }

    const prompt = `
You are an AI document intelligence assistant.

Find ALL important dates, deadlines, schedules, events, periods, and time-related information mentioned in the following document.

DOCUMENT:
${document.extractedText}

For every date or time-related item provide:

1. Date or time
2. Event or activity
3. Description
4. Importance

Instructions:
- Use ONLY information from the document.
- Do not invent dates.
- Do not guess missing dates.
- Include deadlines, submission dates, exam dates, application dates, meeting dates, holidays, start dates, end dates, and important periods if they are present.
- Arrange the dates chronologically when possible.

Return ONLY valid JSON.

Use exactly this format:

[
  {
    "date": "15 September 2026",
    "event": "Application deadline",
    "description": "Last date to submit the application.",
    "importance": "High"
  }
]

If there are no important dates in the document, return:

[]
`;

    const result = await askAI(prompt);

    const cleanResult = result
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const importantDates = JSON.parse(cleanResult);

    document.importantDates = importantDates;
    await document.save();

    res.json({
      message: "Important dates extracted successfully",
      numberOfDates: importantDates.length,
      dates: importantDates
    });

  } catch (error) {
    console.error("Important dates error:", error);

    res.status(500).json({
      message: "Error extracting important dates",
      error: error.message
    });
  }
};


// ===============================
// EXTRACT TABLES & KEY INFORMATION
// ===============================
const extractTables = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        message: "Document not found"
      });
    }

    const prompt = `
You are an AI document intelligence assistant.

Analyze the following document and find information that can be represented clearly in tables.

DOCUMENT:
${document.extractedText}

Look for:
- Existing tables
- Comparisons
- Lists of items with properties
- Categories and their values
- Important facts that can be organized into rows and columns
- Names with related information
- Important numerical information

Create useful tables only when the information actually exists in the document.

Instructions:
- Use ONLY information from the document.
- Do not invent or assume values.
- Keep the table information accurate.
- Give each table a meaningful title.
- Use simple column names.
- If there are no useful tables or tabular information, return an empty array.

Return ONLY valid JSON.

Use exactly this format:

[
  {
    "title": "Table Title",
    "columns": [
      "Column 1",
      "Column 2",
      "Column 3"
    ],
    "rows": [
      [
        "Value 1",
        "Value 2",
        "Value 3"
      ],
      [
        "Value 4",
        "Value 5",
        "Value 6"
      ]
    ]
  }
]

Return ONLY the JSON array.
`;

    const result = await askAI(prompt);

    const cleanResult = result
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const tables = JSON.parse(cleanResult);

    res.json({
      message: "Tables extracted successfully",
      numberOfTables: tables.length,
      tables
    });

  } catch (error) {
    console.error("Table extraction error:", error);

    res.status(500).json({
      message: "Error extracting tables",
      error: error.message
    });
  }
};


// ===============================
// EXPORT CONTROLLERS
// ===============================
module.exports = {
  generateSummary,
  chatWithDocument,
  explainSimply,
  generateQuiz,
  generateImportantQuestions,
  generateImportantDates,
  extractTables
};