const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");

const chunkDirectory = path.join(__dirname, "../data/document-chunks");
const MAX_CHUNK_CHARACTERS = 12000;
const OVERLAP_CHARACTERS = 800;

fs.mkdirSync(chunkDirectory, { recursive: true });

const createChunks = (pages, documentId, documentName) => {
  const chunks = [];
  let current = null;

  pages.forEach((page) => {
    const text = String(page.text || "").trim();
    if (!text) return;

    if (!current) {
      current = { documentId, documentName, chunkId: randomUUID(), pageStart: page.page, pageEnd: page.page, text: "" };
    }

    const candidate = current.text ? `${current.text}\n${text}` : text;
    if (current.text && candidate.length > MAX_CHUNK_CHARACTERS) {
      chunks.push(current);
      const overlap = current.text.slice(-OVERLAP_CHARACTERS);
      current = { documentId, documentName, chunkId: randomUUID(), pageStart: page.page, pageEnd: page.page, text: overlap };
    }

    current.text = current.text ? `${current.text}\n${text}` : text;
    current.pageEnd = page.page;
  });

  if (current?.text) chunks.push(current);
  return chunks;
};

const writeChunks = (documentId, chunks) => {
  const filePath = path.join(chunkDirectory, `${documentId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(chunks), "utf8");
  return filePath;
};

const readChunks = (filePath) => {
  if (!filePath || !fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
};

module.exports = { createChunks, writeChunks, readChunks, MAX_CHUNK_CHARACTERS };
