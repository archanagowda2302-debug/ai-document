const express = require("express");

const router = express.Router();

const upload = require("../middleware/upload");
const { authenticateToken } = require("../middleware/auth");

const {
    uploadDocument,
    getDocument,
    getDocuments
} = require("../controllers/documentController");

router.get("/", authenticateToken, getDocuments);

router.post(
    "/upload",
    authenticateToken,
    upload.array("document", 20),
    uploadDocument
);

router.get(
    "/:id",
    authenticateToken,
    getDocument
);

module.exports = router;
