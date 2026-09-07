const express = require("express");

const router = express.Router();

const upload = require("../middleware/upload");

const {
    uploadDocument,
    getDocument
} = require("../controllers/documentController");

router.post(
    "/upload",
    upload.single("document"),
    uploadDocument
);

router.get(
    "/:id",
    getDocument
);

module.exports = router;