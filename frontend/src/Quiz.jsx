import { useState } from "react";

function Quiz() {
  const [quizType, setQuizType] = useState("Multiple Choice");
  const [questionCount, setQuestionCount] = useState("5");
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [score, setScore] = useState(0);

  const questions = [
    {
      question: "What is the main purpose of document analysis?",
      options: [
        "To understand and extract useful information",
        "To delete the document",
        "To change the file format",
        "To reduce the file size",
      ],
      answer: "To understand and extract useful information",
    },
    {
      question: "Which feature can generate questions from a document?",
      options: [
        "Generate Quiz",
        "Settings",
        "Logout",
        "Upload",
      ],
      answer: "Generate Quiz",
    },
    {
      question: "What can AI extract from a document?",
      options: [
        "Important information",
        "Only images",
        "Only file names",
        "Nothing",
      ],
      answer: "Important information",
    },
    {
      question: "Which feature allows users to ask questions about a document?",
      options: [
        "Chat with Document",
        "Settings",
        "Logout",
        "Dashboard",
      ],
      answer: "Chat with Document",
    },
    {
      question: "What is a quiz used for?",
      options: [
        "Testing understanding",
        "Deleting files",
        "Changing passwords",
        "Uploading images",
      ],
      answer: "Testing understanding",
    },
    {
      question: "Which feature helps identify significant information?",
      options: [
        "Important Questions",
        "Logout",
        "Settings",
        "Upload Document",
      ],
      answer: "Important Questions",
    },
    {
      question: "Which feature can identify dates from a document?",
      options: [
        "Important Dates",
        "Chat",
        "Settings",
        "Dashboard",
      ],
      answer: "Important Dates",
    },
    {
      question: "Which feature is designed to work with tables?",
      options: [
        "Extract Tables",
        "Logout",
        "Settings",
        "Chat",
      ],
      answer: "Extract Tables",
    },
    {
      question: "What does AI-assisted document analysis help users do?",
      options: [
        "Process information faster",
        "Destroy documents",
        "Disable the application",
        "Remove all data",
      ],
      answer: "Process information faster",
    },
    {
      question: "What is the purpose of generating a quiz?",
      options: [
        "To test knowledge",
        "To rename files",
        "To delete documents",
        "To change application settings",
      ],
      answer: "To test knowledge",
    },
  ];

  const totalQuestions = Number(questionCount);
  const activeQuestions = questions.slice(0, totalQuestions);

  const handleGenerateQuiz = () => {
    setQuizStarted(true);
    setCurrentQuestion(0);
    setSelectedAnswer("");
    setScore(0);
  };

  const handleNext = () => {
    if (!selectedAnswer) return;

    const current = activeQuestions[currentQuestion];

    if (selectedAnswer === current.answer) {
      setScore((prev) => prev + 1);
    }

    setSelectedAnswer("");

    if (currentQuestion < activeQuestions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      setQuizStarted(false);
      alert(
        `Quiz completed! Your score will be calculated from ${activeQuestions.length} questions.`
      );
    }
  };

  /* QUIZ ATTEMPT SCREEN */
  if (quizStarted) {
    const question = activeQuestions[currentQuestion];

    return (
      <div className="docmind-quiz">
        <div className="docmind-quiz-header">
          <div className="docmind-quiz-icon">?</div>

          <div className="docmind-quiz-heading">
            <div className="docmind-quiz-eyebrow">AI FEATURE</div>
            <h1>Quiz</h1>
            <p>Test your understanding</p>
          </div>
        </div>

        <div className="docmind-quiz-card">
          <div style={{ marginBottom: "24px" }}>
            <h2>
              Question {currentQuestion + 1} of {activeQuestions.length}
            </h2>

            <p className="docmind-quiz-description">
              {question.question}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {question.options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setSelectedAnswer(option)}
                style={{
                  padding: "14px 16px",
                  textAlign: "left",
                  borderRadius: "10px",
                  border:
                    selectedAnswer === option
                      ? "2px solid #4f46e5"
                      : "1px solid #e5e7eb",
                  background:
                    selectedAnswer === option
                      ? "#eef2ff"
                      : "#ffffff",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                {option}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="docmind-quiz-generate"
            onClick={handleNext}
            disabled={!selectedAnswer}
            style={{
              marginTop: "24px",
              opacity: selectedAnswer ? 1 : 0.5,
              cursor: selectedAnswer ? "pointer" : "not-allowed",
            }}
          >
            {currentQuestion === activeQuestions.length - 1
              ? "Finish Quiz"
              : "Next"}
          </button>
        </div>
      </div>
    );
  }

  /* QUIZ GENERATION SCREEN */
  return (
    <div className="docmind-quiz">
      <div className="docmind-quiz-header">
        <div className="docmind-quiz-icon">?</div>

        <div className="docmind-quiz-heading">
          <div className="docmind-quiz-eyebrow">AI FEATURE</div>
          <h1>Quiz</h1>
          <p>Test your understanding</p>
        </div>
      </div>

      <div className="docmind-quiz-card">
        <h2>Generate Quiz</h2>

        <p className="docmind-quiz-description">
          Create a quiz and test your understanding of the document.
        </p>

        <div className="docmind-quiz-field">
          <label>Number of Questions</label>

          <div className="docmind-quiz-options">
            {["5", "10", "15"].map((count) => (
              <button
                key={count}
                type="button"
                className={
                  questionCount === count
                    ? "docmind-quiz-option active"
                    : "docmind-quiz-option"
                }
                onClick={() => setQuestionCount(count)}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        <div className="docmind-quiz-field">
          <label>Quiz Type</label>

          <div className="docmind-quiz-options">
            {["Multiple Choice", "True / False", "Mixed"].map(
              (type) => (
                <button
                  key={type}
                  type="button"
                  className={
                    quizType === type
                      ? "docmind-quiz-option active"
                      : "docmind-quiz-option"
                  }
                  onClick={() => setQuizType(type)}
                >
                  {type}
                </button>
              )
            )}
          </div>
        </div>

        <button
          type="button"
          className="docmind-quiz-generate"
          onClick={handleGenerateQuiz}
        >
          ✦ Generate & Attend Quiz
        </button>
      </div>
    </div>
  );
}

export default Quiz;