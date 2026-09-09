const multer = require("multer");
const fs = require("fs");
const path = require("path");

const uploadDirectory = path.join(__dirname, "../uploads");
fs.mkdirSync(uploadDirectory, { recursive: true });
const storage = multer.diskStorage({
    destination: uploadDirectory,
    filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`)
});

const fileFilter = (req, file, cb) => {

    if (file.mimetype === "application/pdf") {
        cb(null, true);
    } else {
        cb(new Error("Only PDF files are allowed"), false);
    }

};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 1024,
        files: 20,
        parts: 25
    }
});

module.exports = upload;
