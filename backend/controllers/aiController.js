const { askAI } = require("../services/aiService");
const { getDocument, getOwnedDocument, updateDocument } = require("../services/documentStore");
const { createExtractiveSummary, answerQuestionFromText, extractImportantDatesFromText, extractTablesFromText } = require("../services/textAnalysisService");
const { getChunks, ensureReady, rankChunks, evenlySampleChunks, hierarchicalChunks, formatChunks, sourcePages } = require("../services/documentContext");

const requireDocument = (id, userId, req, res) => {
  const requestedIds = String(req.query?.documentIds || "").split(",").map((value) => value.trim()).filter(Boolean);
  const documents = [id, ...requestedIds].filter((value, index, values) => values.indexOf(value) === index).map((documentId) => getOwnedDocument(documentId, userId)).filter(Boolean);
  const document = documents[0];
  if (!document || documents.length !== [id, ...requestedIds].filter((value, index, values) => values.indexOf(value) === index).length) {
    res.status(getDocument(id) ? 403 : 404).json({ message: getDocument(id) ? "You are not allowed to access this document." : "Selected document was not found. Please upload/select the document again." });
    return null;
  }
  const analysisDocument = documents.length > 1 ? { ...document, name: documents.map((item) => item.name).join(", "), sourceDocuments: documents } : document;
  if (analysisDocument.status !== "ready" || documents.some((item) => item.status !== "ready")) {
    res.status(409).json({ message: documents.find((item) => item.status !== "ready")?.processingError || "One or more selected documents are still processing. Please try again when all are Ready." });
    return null;
  }
  return analysisDocument;
};

const parseJson = (value) => JSON.parse(value.replace(/```json|```/gi, "").trim());

const getDocumentMetrics = (text) => {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const heading = lines.find((line) => /^(?:\d+\.|[IVXLC]+\.)\s+/.test(line) || /^[A-Z][A-Z\s/&-]{4,80}$/.test(line));
  const knowledgeUnits = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.filter((sentence) => sentence.trim().length > 35).length || 0;
  return { identifiedTopic: heading || lines[0]?.slice(0, 80) || "unknown", knowledgeUnits };
};

const logGenerationContext = (type, document, requestedCount, generatedCount) => {
  const metrics = getDocumentMetrics(evenlySampleChunks(document, 8).map((chunk) => chunk.text).join("\n"));
  console.info(`[${type} generation]`, {
    documentId: document.id,
    extractedChunkCount: document.chunkCount,
    identifiedTopic: metrics.identifiedTopic,
    knowledgeUnits: metrics.knowledgeUnits,
    requestedQuestionCount: requestedCount,
    generatedQuestionCount: generatedCount
  });
};

const chatStopWords = new Set(["what", "which", "where", "when", "how", "why", "does", "the", "a", "an", "is", "are", "in", "of", "to", "for", "this", "document"]);
const relevantChatPages = (document, question) => {
  return rankChunks(document, question, 6);
};

const quizStopWords = new Set(["what", "which", "where", "when", "how", "why", "does", "do", "is", "are", "the", "a", "an", "of", "to", "in", "on", "for", "from", "this", "that", "document", "system", "according", "following"]);
const quizTokens = (value) => (String(value).toLowerCase().match(/[a-z0-9]{3,}/g) || [])
  .filter((token) => !quizStopWords.has(token));

const tokenSimilarity = (left, right) => {
  const leftTokens = new Set(quizTokens(left));
  const rightTokens = new Set(quizTokens(right));
  if (!leftTokens.size || !rightTokens.size) return 0;
  const intersection = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  return intersection / Math.min(leftTokens.size, rightTokens.size);
};

const normalizeQuiz = (value, quizType, documentText) => {
  const questions = Array.isArray(value) ? value : value?.questions;
  if (!Array.isArray(questions)) throw new Error("The AI returned an invalid quiz format.");

  const normalized = questions.map((item) => {
    const question = typeof item.question === "string" ? item.question.trim() : "";
    const options = Array.isArray(item.options) ? item.options.map((option) => String(option).trim()).filter(Boolean) : [];
    const rawCorrectAnswer = String(item.correctAnswer ?? item.answer ?? "").trim();
    const normalizedRawAnswer = /^(true|false)$/i.test(rawCorrectAnswer)
      ? rawCorrectAnswer[0].toUpperCase() + rawCorrectAnswer.slice(1).toLowerCase()
      : rawCorrectAnswer;
    const correctAnswer = options.find((option) => option === normalizedRawAnswer)
      || options.find((option) => option.toLowerCase() === rawCorrectAnswer.toLowerCase())
      || normalizedRawAnswer;
    const validOptionCount = quizType === "Mixed" ? options.length === 2 || options.length === 4 : options.length === (quizType === "True / False" ? 2 : 4);
    const validTrueFalse = options.length !== 2 || options.every((option) => ["True", "False"].includes(option));
    const isRetrievalQuestion = /according to the uploaded document's topic|what does it state about this point/i.test(question);
    const hasLongOption = options.some((option) => option.trim().length > 180);
    const questionSupported = quizTokens(question).some((token) => documentText.toLowerCase().includes(token));
    const answerSupported = correctAnswer === "True" || correctAnswer === "False"
      || quizTokens(correctAnswer).filter((token) => documentText.toLowerCase().includes(token)).length >= Math.min(2, quizTokens(correctAnswer).length);
    const invalidReasons = [
      !question && "missing question",
      isRetrievalQuestion && "retrieval wording",
      hasLongOption && "long option",
      !validOptionCount && "wrong option count",
      !validTrueFalse && "invalid true-false options",
      !correctAnswer && "missing answer",
      (correctAnswer && !options.includes(correctAnswer)) && "answer not in options",
      !questionSupported && "question not grounded",
      !answerSupported && "answer not grounded"
    ].filter(Boolean);
    if (invalidReasons.length) {
      throw new Error(`The AI returned an invalid quiz question (${invalidReasons.join(", ")}).`);
    }
    return {
      question,
      options,
      correctAnswer,
      explanation: String(item.explanation || correctAnswer)
    };
  });

  const questionKeys = new Set();
  normalized.forEach((item) => {
    const key = item.question.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (questionKeys.has(key)) throw new Error("The AI returned duplicate quiz questions.");
    questionKeys.add(key);
  });
  for (let index = 0; index < normalized.length; index += 1) {
    for (let nextIndex = index + 1; nextIndex < normalized.length; nextIndex += 1) {
      if (tokenSimilarity(normalized[index].question, normalized[nextIndex].question) >= 0.65) {
        throw new Error("The AI returned semantically repetitive quiz questions.");
      }
    }
  }
  if (quizType === "Mixed" && normalized.length > 1) {
    const hasMultipleChoice = normalized.some((item) => item.options.length === 4);
    const hasTrueFalse = normalized.some((item) => item.options.length === 2);
    if (!hasMultipleChoice || !hasTrueFalse) throw new Error("The AI did not return a mixed quiz.");
  }
  return normalized;
};

const normalizeImportantQuestions = (value) => {
  const questions = Array.isArray(value) ? value : value?.questions;
  if (!Array.isArray(questions)) throw new Error("The AI returned an invalid important-questions format.");

  const seen = new Set();
  return questions.map((item) => {
    const question = typeof item.question === "string" ? item.question.trim() : "";
    const key = question.toLowerCase().replace(/[^a-z0-9]/g, "");
    const isGeneric = /^(explain this important point|what should a student understand|discuss the significance|why is the following point important|describe the key idea|what does this document state|according to the uploaded document's topic)/i.test(question);
    if (!question || question.length > 220 || isGeneric || seen.has(key)) {
      throw new Error("The AI returned an invalid or repetitive important question.");
    }
    seen.add(key);
    return {
      question,
      importance: ["High", "Medium", "Low"].includes(item.importance) ? item.importance : "High",
      type: String(item.type || "Short Answer"),
      reason: String(item.reason || "This question tests an important fact or concept from the uploaded document.")
    };
  });
};

const generateSummary = async (req, res) => {
  const document = requireDocument(req.params.id, req.user.id, req, res);
  if (!document) return;
  const type = req.query.type || "Key Points";

  try {
    ensureReady(document);
    const summary = await askAI(`Summarize the entire document from these hierarchical page-aware sections. Every section below represents a consecutive part of the document. Cover the document from beginning to end, identify page ranges where useful, and do not invent facts. Return clean Markdown with a concise # title, ## section headings, short paragraphs, and bullets. The requested style is ${type}.\n\nDOCUMENT SECTIONS:\n${formatChunks(hierarchicalChunks(document, 24))}`);
    updateDocument(document.id, { summary });
    res.json({ message: "Summary generated successfully", summary });
  } catch (error) {
    // The fallback still uses the uploaded document's extracted text. It keeps
    // summarization useful if the external AI service is temporarily unavailable.
    console.warn("AI summary unavailable; using document-text fallback:", error.message);
    const summary = createExtractiveSummary(getChunks(document).map((chunk) => chunk.text).join("\n"), type);
    updateDocument(document.id, { summary });
    res.json({ message: "Summary generated from document text", summary, fallback: true });
  }
};

const chatWithDocument = async (req, res) => {
  const document = requireDocument(req.params.id, req.user.id, req, res);
  if (!document) return;
  const question = req.body.question?.trim();
  if (!question) return res.status(400).json({ message: "Please provide a question." });
  const relevantChunks = relevantChatPages(document, question);
  if (!relevantChunks.length) return res.json({ message: "No grounded answer found", answer: "I couldn't find this information in the uploaded document.", sources: [] });
  const pageContext = formatChunks(relevantChunks);

  try {
    const answer = await askAI(`You are answering using page-labelled document content. Use only the supplied passages. Do not use outside knowledge, invent page numbers, or add page citations to your answer; the backend will provide sources separately. Return clean Markdown with a short heading when useful, concise paragraphs, and bullet or numbered lists for multiple items. Do not wrap the response in a code fence. If the passages do not answer the question, say exactly: I couldn't find this information in the uploaded document.\n\nSOURCE PASSAGES:\n${pageContext}\n\nQUESTION:\n${question}`);
    const cleanAnswer = answer.replace(/\s*\[?pages?\s*\d+(?:\s*[-,]\s*\d+)*\]?/gi, "").trim();
    res.json({ message: "Answer generated successfully", question, answer: cleanAnswer, sources: sourcePages(relevantChunks) });
  } catch (error) {
    // Keep answers tied to the uploaded document when the external AI service
    // is unavailable instead of returning a placeholder or generic response.
    console.warn("AI chat unavailable; using document-text fallback:", error.message);
    const answer = answerQuestionFromText(relevantChunks.map((chunk) => chunk.text).join(" "), question);
    res.json({ message: "Answer generated from document text", question, answer, sources: sourcePages(relevantChunks), fallback: true });
  }
};

const explainSimply = async (req, res) => {
  try {
    const document = requireDocument(req.params.id, req.user.id, req, res);
    if (!document) return;
    ensureReady(document);
    const explanation = await askAI(`Explain the entire document in simple language using only these hierarchical page-aware sections.\n\n${formatChunks(hierarchicalChunks(document, 24))}`);
    res.json({ message: "Simple explanation generated successfully", explanation });
  } catch (error) {
    res.status(500).json({ message: "Unable to explain this document right now." });
  }
};

const generateQuiz = async (req, res) => {
  if (req.body.documentId && req.body.documentId !== req.params.id) {
    return res.status(400).json({ message: "Selected document was not found. Please upload/select the document again." });
  }

  const document = requireDocument(req.params.id, req.user.id, req, res);
  if (!document) return;
  try { ensureReady(document); } catch (error) { return res.status(409).json({ message: error.message }); }

  const numberOfQuestions = Math.min(Math.max(Number(req.body.questionCount || req.body.numberOfQuestions || 5), 1), 20);
  const quizType = req.body.quizType || "Multiple Choice";

  try {
    const formatRules = quizType === "True / False"
      ? "This is a TRUE / FALSE quiz. Every question must be one clear factual statement, every options array must be exactly [\"True\",\"False\"], and answer must be exactly \"True\" or \"False\". Do not return four options."
      : quizType === "Mixed"
        ? "This is a MIXED quiz. Alternate between multiple-choice questions with exactly 4 options and true/false questions with exactly [\"True\",\"False\"] options."
        : "This is a MULTIPLE CHOICE quiz. Every question must have exactly 4 concise options and one correct answer.";
    const documentContext = formatChunks(hierarchicalChunks(document, 24));
    const prompt = `SYSTEM:\nYou are an expert educational quiz generator grounded only in the supplied page-aware document sections. Cover different parts of the entire document, do not invent facts, and do not repeat knowledge units.\n\nDOCUMENT CONTENT:\n<<<\n${documentContext}\n>>>\n\nGenerate exactly ${numberOfQuestions} questions, or the maximum genuinely distinct number supported by the document. Quiz type: ${quizType}. ${formatRules} Return JSON only in this shape: {"questions":[{"question":"...","options":["..."],"answer":"...","explanation":"..."}]}`;
    let quiz;
    let validationError;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = parseJson(await askAI(attempt === 0 ? prompt : `${prompt}\n\nYour previous response failed validation. Return a fresh quiz with different knowledge units. Ensure every correctAnswer exactly matches one option, every multiple-choice item has 4 options, and no two questions test the same fact.`, { responseMimeType: "application/json" }));
        quiz = normalizeQuiz(response, quizType, documentContext);
        break;
      } catch (error) {
        validationError = error;
        console.warn(`Quiz validation attempt ${attempt + 1} failed:`, error.message);
      }
    }
    if (!quiz) throw validationError || new Error("The AI returned an invalid quiz.");
    if (!quiz.length) throw new Error("The document does not contain enough distinct information for a quiz.");
    updateDocument(document.id, { quiz });
    logGenerationContext("Quiz", document, numberOfQuestions, quiz.length);
    res.json({ message: "Quiz generated successfully", numberOfQuestions: quiz.length, quiz });
  } catch (error) {
    console.error("Document-grounded quiz generation failed:", error.message);
    res.status(502).json({ message: "Unable to generate a document-grounded quiz right now. Please try again later." });
  }
};

const generateImportantQuestions = async (req, res) => {
  const document = requireDocument(req.params.id, req.user.id, req, res);
  if (!document) return;
    try { ensureReady(document); } catch (error) { return res.status(409).json({ message: error.message }); }
  const numberOfQuestions = Math.min(Math.max(Number(req.body.numberOfQuestions || 10), 1), 20);

  try {
    const response = parseJson(await askAI(`SYSTEM:\nGenerate natural, specific, meaningful study questions using ONLY the supplied hierarchical page-aware sections. Cover important concepts across the entire document, avoid generic templates, copied paragraphs, outside knowledge, and repeated questions.\n\nDOCUMENT SECTIONS:\n<<<\n${formatChunks(hierarchicalChunks(document, 24))}\n>>>\n\nGenerate ${numberOfQuestions} questions. Return JSON only as {"questions":[{"question":"...","importance":"High|Medium|Low","type":"Short Answer","reason":"..."}]}.`, { responseMimeType: "application/json" }));
    const questions = normalizeImportantQuestions(response);
    if (!questions.length) throw new Error("The document does not contain enough distinct information for important questions.");
    updateDocument(document.id, { importantQuestions: questions });
    logGenerationContext("Important questions", document, numberOfQuestions, questions.length);
    res.json({ message: "Important questions generated successfully", numberOfQuestions: questions.length, questions });
  } catch (error) {
    console.error("Document-grounded important-question generation failed:", error.message);
    res.status(502).json({ message: "Unable to generate document-grounded important questions right now. Please try again later." });
  }
};

const generateImportantDates = async (req, res) => {
  const document = requireDocument(req.params.id, req.user.id, req, res);
  if (!document) return;

  try {
    ensureReady(document);
    const dates = parseJson(await askAI(`Extract only dates, deadlines, periods, or time-related events actually stated in these hierarchical page-aware sections. Return only a JSON array of {"date":"...","event":"...","description":"...","importance":"High, Medium, or Low","page":"..."}. Never invent dates or pages.\n\nDOCUMENT SECTIONS:\n${formatChunks(hierarchicalChunks(document, 24))}`));
    if (!Array.isArray(dates)) throw new Error("Invalid dates response");
    updateDocument(document.id, { importantDates: dates });
    res.json({ message: "Important dates extracted successfully", numberOfDates: dates.length, dates });
  } catch (error) {
    console.warn("AI date extraction unavailable; using document-text fallback:", error.message);
    const dates = extractImportantDatesFromText(getChunks(document).map((chunk) => chunk.text).join("\n"));
    updateDocument(document.id, { importantDates: dates });
    res.json({ message: "Important dates extracted from document text", numberOfDates: dates.length, dates, fallback: true });
  }
};

const extractTables = async (req, res) => {
  const document = requireDocument(req.params.id, req.user.id, req, res);
  if (!document) return;

  try {
    ensureReady(document);
    const documentText = getChunks(document).map((chunk) => chunk.text).join("\n");
    const tables = extractTablesFromText(documentText);

    // This feature is intentionally conservative. It extracts only physical
    // tables preserved in the PDF text (header + matching rows); prose,
    // concepts, summaries, lists, and quiz content are never converted into
    // synthetic tables.
    updateDocument(document.id, { tables });
    res.json({
      message: tables.length ? "Tables extracted successfully" : "No extractable tables were found in this document.",
      numberOfTables: tables.length,
      tables
    });
  } catch (error) {
    console.error("Table extraction error:", error.message);
    res.status(500).json({ message: "Unable to extract tables from this document right now." });
  }
};

module.exports = { generateSummary, chatWithDocument, explainSimply, generateQuiz, generateImportantQuestions, generateImportantDates, extractTables };
