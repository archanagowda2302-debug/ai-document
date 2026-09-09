const { createDocument, getDocument: findAnyDocument, getOwnedDocument: findOwnedDocument, listDocumentsForUser } = require("../services/documentStore");
const { queueDocumentProcessing } = require("../services/documentProcessor");

const uploadDocument = async (req, res) => {

    try {

        const files = Array.isArray(req.files) ? req.files : req.file ? [req.file] : [];

        if (!files.length) {
            return res.status(400).json({
                message: "Please upload a PDF"
            });
        }

        const documents = files.map((file) => createDocument({
            name: file.originalname,
            filePath: file.path,
            fileSize: file.size,
            userId: req.user.id
        }));
        documents.forEach((document) => queueDocumentProcessing(document.id));

        res.status(201).json({
            message: "PDF upload accepted. Processing has started.",
            documents: documents.map(toDocumentSummary),
            document: toDocumentSummary(documents[0])
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Error uploading document",
            error: error.message
        });

    }

};

const getDocument = async (req, res) => {

    try {

        const document = findOwnedDocument(req.params.id, req.user.id);

        if (!document) {
            return res.status(findAnyDocument(req.params.id) ? 403 : 404).json({ message: findAnyDocument(req.params.id) ? "You are not allowed to access this document." : "Document not found" });
        }

        res.json(toDocumentSummary(document));

    } catch (error) {

        res.status(500).json({
            message: "Error fetching document",
            error: error.message
        });

    }

};

const getDocuments = (req, res) => {
    res.json(listDocumentsForUser(req.user.id).map(toDocumentSummary));
};

const toDocumentSummary = (document) => ({
    id: document.id,
    name: document.name,
    pages: document.pageCount,
    size: document.fileSize,
    status: document.status,
    processingError: document.processingError,
    chunkCount: document.chunkCount,
    uploadedAt: document.uploadedAt
});

module.exports = {
    uploadDocument,
    getDocument,
    getDocuments
};
