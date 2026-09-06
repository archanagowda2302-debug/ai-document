const fs = require("fs");
const pdfParse = require("pdf-parse");

const extractPDFText = async (filePath) => {
    try {
        const dataBuffer = fs.readFileSync(filePath);

        const parser = new pdfParse.PDFParse({
            data: dataBuffer
        });

        const result = await parser.getText();

        await parser.destroy();

        return {
            text: result.text,
            pages: result.total
        };

    } catch (error) {
        console.error("PDF extraction error:", error);
        throw error;
    }
};

module.exports = {
    extractPDFText
};