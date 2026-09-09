const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");

const storageDirectory = path.join(__dirname, "../data/documents");
const metadataPath = path.join(storageDirectory, "documents.json");
fs.mkdirSync(storageDirectory, { recursive: true });

const documents = new Map();
if (fs.existsSync(metadataPath)) {
  try {
    JSON.parse(fs.readFileSync(metadataPath, "utf8")).forEach((document) => documents.set(document.id, document));
  } catch (error) {
    console.error("Unable to load document metadata:", error.message);
  }
}

const persist = () => fs.writeFileSync(metadataPath, JSON.stringify([...documents.values()], null, 2), "utf8");

const createDocument = ({ name, userId, filePath, fileSize }) => {
  const document = {
    id: randomUUID(),
    name,
    userId,
    filePath,
    fileSize,
    pageCount: 0,
    chunkCount: 0,
    chunksPath: "",
    status: "uploaded",
    processingError: "",
    uploadedAt: new Date().toISOString(),
    summary: "",
    importantDates: [],
    importantQuestions: [],
    tables: [],
    quiz: []
  };
  documents.set(document.id, document);
  persist();
  return document;
};

const updateDocument = (id, updates) => {
  const document = documents.get(id);
  if (!document) return null;
  Object.assign(document, updates);
  persist();
  return document;
};

const getDocument = (id) => documents.get(id);
const getOwnedDocument = (id, userId) => {
  const document = getDocument(id);
  return document && document.userId === userId ? document : null;
};
const listDocuments = () => Array.from(documents.values())
  .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

const listDocumentsForUser = (userId) => listDocuments().filter((document) => document.userId === userId);

module.exports = { createDocument, updateDocument, getDocument, getOwnedDocument, listDocuments, listDocumentsForUser };
