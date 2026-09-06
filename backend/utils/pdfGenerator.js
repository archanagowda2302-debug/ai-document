const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const generatePDF = (title, content, fileName) => {
  return new Promise((resolve, reject) => {
    try {
      const pdfFolder = path.join(__dirname, "../generated-pdfs");

      if (!fs.existsSync(pdfFolder)) {
        fs.mkdirSync(pdfFolder, { recursive: true });
      }

      const filePath = path.join(pdfFolder, fileName);

      const doc = new PDFDocument({
        margin: 50,
        size: "A4"
      });

      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);

      // Main PDF title
      doc
        .font("Helvetica-Bold")
        .fontSize(20)
        .text(title, {
          align: "center"
        });

      doc.moveDown(1.5);

      // Split content into lines
      const lines = content.split("\n");

      lines.forEach((line) => {
        const trimmedLine = line.trim();

        // Empty line
        if (trimmedLine === "") {
          doc.moveDown(0.5);
          return;
        }

        // Horizontal separator
        if (trimmedLine === "---") {
          doc.moveDown(0.5);

          doc
            .moveTo(50, doc.y)
            .lineTo(545, doc.y)
            .stroke();

          doc.moveDown(0.5);

          return;
        }

        // Heading: ### Heading
        if (trimmedLine.startsWith("###")) {
          const heading = trimmedLine
            .replace(/^###\s*/, "")
            .replace(/\*\*/g, "");

          doc.moveDown(0.5);

          doc
            .font("Helvetica-Bold")
            .fontSize(16)
            .text(heading);

          doc.moveDown(0.3);

          return;
        }

        // Heading: ## Heading
        if (trimmedLine.startsWith("##")) {
          const heading = trimmedLine
            .replace(/^##\s*/, "")
            .replace(/\*\*/g, "");

          doc.moveDown(0.5);

          doc
            .font("Helvetica-Bold")
            .fontSize(18)
            .text(heading);

          doc.moveDown(0.3);

          return;
        }

        // Heading: # Heading
        if (trimmedLine.startsWith("#")) {
          const heading = trimmedLine
            .replace(/^#\s*/, "")
            .replace(/\*\*/g, "");

          doc.moveDown(0.5);

          doc
            .font("Helvetica-Bold")
            .fontSize(20)
            .text(heading);

          doc.moveDown(0.3);

          return;
        }

        // Bullet point
        if (
          trimmedLine.startsWith("* ") ||
          trimmedLine.startsWith("- ")
        ) {
          const bullet = trimmedLine
            .replace(/^(\*|-)\s*/, "")
            .replace(/\*\*/g, "");

          doc
            .font("Helvetica")
            .fontSize(11)
            .text(`• ${bullet}`, {
              indent: 15,
              lineGap: 3
            });

          return;
        }

        // Numbered list
        if (/^\d+\.\s/.test(trimmedLine)) {
          const text = trimmedLine.replace(/\*\*/g, "");

          doc
            .font("Helvetica")
            .fontSize(11)
            .text(text, {
              lineGap: 4
            });

          return;
        }

        // Normal text
        const cleanText = trimmedLine.replace(/\*\*/g, "");

        doc
          .font("Helvetica")
          .fontSize(11)
          .text(cleanText, {
            lineGap: 4
          });
      });

      doc.end();

      stream.on("finish", () => {
        resolve(filePath);
      });

      stream.on("error", (error) => {
        reject(error);
      });

    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generatePDF
};