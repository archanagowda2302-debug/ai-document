const { readChunks } = require("./chunkService");
const { createExtractiveSummary } = require("./textAnalysisService");

const stopWords = new Set(["what", "which", "where", "when", "how", "why", "does", "the", "a", "an", "is", "are", "in", "of", "to", "for", "this", "document", "about", "from", "with"]);
const tokens = (value) => (String(value || "").toLowerCase().match(/[a-z0-9]{3,}/g) || []).filter((token) => !stopWords.has(token));

const getChunks = (document) => {
  if (Array.isArray(document.sourceDocuments)) {
    return document.sourceDocuments.flatMap((source) => readChunks(source.chunksPath));
  }
  return readChunks(document.chunksPath);
};
const ensureReady = (document) => {
  if (Array.isArray(document.sourceDocuments)) {
    document.sourceDocuments.forEach((source) => {
      if (source.status !== "ready") throw new Error(source.processingError || `Document ${source.name} is ${source.status}.`);
    });
    return;
  }
  if (!document || document.status === "failed") throw new Error(document?.processingError || "Document processing failed.");
  if (document.status !== "ready") throw new Error("This document is still processing. Please try again when its status is Ready.");
};

const rankChunks = (document, query = "", limit = 8) => {
  ensureReady(document);
  const terms = tokens(query);
  return getChunks(document)
    .map((chunk, index) => {
      const lower = chunk.text.toLowerCase();
      const score = terms.length ? terms.reduce((total, term) => total + (lower.includes(term) ? 1 : 0), 0) : 0;
      return { ...chunk, index, score };
    })
    .filter((chunk) => !terms.length || chunk.score > 0)
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, limit);
};

const evenlySampleChunks = (document, limit = 24) => {
  ensureReady(document);
  const chunks = getChunks(document);
  if (chunks.length <= limit) return chunks;
  const selected = [];
  for (let index = 0; index < limit; index += 1) selected.push(chunks[Math.floor(index * chunks.length / limit)]);
  return selected;
};

const hierarchicalChunks = (document, sectionCount = 24) => {
  ensureReady(document);
  const chunks = getChunks(document);
  if (chunks.length <= sectionCount) return chunks;
  const sections = [];
  for (let index = 0; index < sectionCount; index += 1) {
    const start = Math.floor(index * chunks.length / sectionCount);
    const end = Math.floor((index + 1) * chunks.length / sectionCount);
    const group = chunks.slice(start, Math.max(start + 1, end));
    sections.push({
      documentId: group[0].documentId,
      documentName: group[0].documentName,
      chunkId: `section-${index + 1}`,
      pageStart: group[0].pageStart,
      pageEnd: group[group.length - 1].pageEnd,
      text: createExtractiveSummary(group.map((chunk) => chunk.text).join("\n"), "Detailed").slice(0, 2400)
    });
  }
  return sections;
};

const formatChunks = (chunks) => chunks.map((chunk) => `[${chunk.documentName} | pages ${chunk.pageStart}-${chunk.pageEnd}]\n${chunk.text}`).join("\n\n");
const sourcePages = (chunks) => chunks.map((chunk) => ({ document: chunk.documentName, pageStart: chunk.pageStart, pageEnd: chunk.pageEnd, page: chunk.pageStart === chunk.pageEnd ? chunk.pageStart : `${chunk.pageStart}-${chunk.pageEnd}` }));

module.exports = { getChunks, ensureReady, rankChunks, evenlySampleChunks, hierarchicalChunks, formatChunks, sourcePages };
