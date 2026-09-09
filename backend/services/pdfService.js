// pdf-parse's Node build expects this browser geometry API. Text extraction
// does not use matrix operations, so this lightweight fallback is sufficient
// on Node versions that do not expose DOMMatrix globally.
if (typeof global.DOMMatrix === "undefined") {
    global.DOMMatrix = class DOMMatrix {};
}
const pdfParse = require("pdf-parse");

const extractPDFText = async (filePath) => {
    try {
        const dataBuffer = Buffer.isBuffer(filePath) ? filePath : require("fs").readFileSync(filePath);
        const parser = new pdfParse.PDFParse({
            data: dataBuffer
        });

        const result = await parser.getText();

        await parser.destroy();

        return {
            text: result.text,
            pages: result.total,
            pageTexts: result.pages.map((page) => ({ page: page.num, text: page.text.trim() }))
        };

    } catch (error) {
        console.error("PDF extraction error:", error);
        throw error;
    }
};

module.exports = {
    extractPDFText
};
