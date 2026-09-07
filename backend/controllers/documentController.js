const Document = require("../models/Document");
const { extractPDFText } = require("../services/pdfService");

const uploadDocument = async (req, res) => {

    try {

        if (!req.file) {
            return res.status(400).json({
                message: "Please upload a PDF"
            });
        }

        const result = await extractPDFText(req.file.path);

        const document = await Document.create({

            originalName: req.file.originalname,

            filePath: req.file.path,

            extractedText: result.text,

            pageCount: result.pages

        });

        res.status(201).json({

            message: "PDF uploaded successfully",

            document: {
                id: document._id,
                name: document.originalName,
                pages: document.pageCount
            }

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

        const document = await Document.findById(
            req.params.id
        );

        if (!document) {
            return res.status(404).json({
                message: "Document not found"
            });
        }

        res.json(document);

    } catch (error) {

        res.status(500).json({
            message: "Error fetching document",
            error: error.message
        });

    }

};

module.exports = {
    uploadDocument,
    getDocument
};