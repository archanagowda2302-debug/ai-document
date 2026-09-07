import { useState } from "react";

function Chat({ document, onBack }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const askAI = () => {
    if (question.trim() === "") {
      alert("Please enter a question first.");
      return;
    }

    const fileName = document?.name || "your document";

    const result = `Based on the document "${fileName}", here is a sample answer.

Your question:
${question}

The uploaded document will be analyzed by the AI backend to provide an accurate answer based on its contents.

Currently, this is sample frontend data. Once the backend API is connected, the answer will come directly from the document.`;

    setAnswer(result);
  };

  const copyAnswer = async () => {
    if (!answer) {
      return;
    }

    try {
      await navigator.clipboard.writeText(answer);
      alert("Answer copied successfully!");
    } catch (error) {
      alert("Could not copy the answer.");
    }
  };

  const askAnother = () => {
    setQuestion("");
    setAnswer("");
  };

  return (
    <div className="chat-page">

      {/* Header */}
      <div className="chat-header">

        <button
          type="button"
          className="back-button"
          onClick={onBack}
        >
          ← Back to Dashboard
        </button>

        <div className="chat-title">

          <div className="chat-title-icon">
            💬
          </div>

          <div>
            <h1>Chat with Document</h1>

            <p>
              {document?.name || "No document selected"}
            </p>
          </div>

        </div>

      </div>


      {/* Question Card */}
      <div className="chat-card">

        <h2>
          💬 Ask your document
        </h2>

        <p className="chat-description">
          Ask questions about the information contained in your PDF.
        </p>


        <div className="question-area">

          <label>
            Your Question
          </label>

          <textarea
            value={question}
            onChange={(event) =>
              setQuestion(event.target.value)
            }
            placeholder="Ask something about your document..."
            rows={5}
          />

        </div>


        <button
          type="button"
          className="generate-button"
          onClick={askAI}
        >
          🤖 Ask AI
        </button>

      </div>


      {/* Answer */}
      {answer && (

        <div className="chat-answer-card">

          <div className="answer-header">

            <div className="answer-icon">
              🤖
            </div>

            <div>
              <h2>
                AI Answer
              </h2>

              <span>
                Based on your document
              </span>
            </div>

          </div>


          <div className="chat-answer">
            {answer}
          </div>


          <div className="chat-actions">

            <button
              type="button"
              className="download-button"
              onClick={copyAnswer}
            >
              📋 Copy Answer
            </button>

            <button
              type="button"
              className="regenerate-button"
              onClick={askAnother}
            >
              🔄 Ask Another Question
            </button>

          </div>

        </div>

      )}

    </div>
  );
}

export default Chat;