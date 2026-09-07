const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
    {
        originalName: {
            type: String,
            required: true
        },

        filePath: {
            type: String,
            required: true
        },

        extractedText: {
            type: String,
            default: ""
        },

        pageCount: {
            type: Number,
            default: 0
        },

        summary: {
            type: String,
            default: ""
        },

        importantDates: {
            type: Array,
            default: []
        },

        importantQuestions: {
            type: Array,
            default: []
        },

        quiz: {
            type: Array,
            default: []
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Document", documentSchema);