const fs = require("fs");
const { extractPDFText } = require("./pdfService");
const { createChunks, writeChunks } = require("./chunkService");
const { getDocument, updateDocument, listDocuments } = require("./documentStore");

const processDocument = async (documentId) => {
  const document = getDocument(documentId);
  if (!document) return;

  try {
    updateDocument(documentId, { status: "extracting", processingError: "" });
    const result = await extractPDFText(document.filePath);
    if (!result.text || !result.text.trim()) {
      throw new Error("This PDF appears to be scanned/image-based and does not contain extractable text.");
    }

    updateDocument(documentId, { status: "chunking", pageCount: result.pages || 0 });
    const pages = (result.pageTexts || []).map((page, index) => ({
      page: Number(page.page) || index + 1,
      text: String(page.text || "").trim()
    }));
    const chunks = createChunks(pages, document.id, document.name);
    const chunksPath = writeChunks(document.id, chunks);

    updateDocument(documentId, {
      status: "ready",
      chunksPath,
      chunkCount: chunks.length,
      pageCount: pages.length,
      processedAt: new Date().toISOString(),
      processingError: ""
    });
  } catch (error) {
    console.error(`Document processing failed for ${documentId}:`, error.message);
    updateDocument(documentId, { status: "failed", processingError: error.message });
  }
};

const queueDocumentProcessing = (documentId) => {
  setImmediate(() => processDocument(documentId));
};

const removeStoredFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
};

const resumePendingDocuments = () => {
  listDocuments().filter((document) => ["uploaded", "extracting", "chunking"].includes(document.status)).forEach((document) => queueDocumentProcessing(document.id));
};

module.exports = { processDocument, queueDocumentProcessing, removeStoredFile, resumePendingDocuments };
