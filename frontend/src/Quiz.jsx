import { useState } from "react";

function Quiz() {
  const [quizType, setQuizType] = useState("Multiple Choice");
  const [questionCount, setQuestionCount] = useState("5");

  return (
    <div className="docmind-quiz">

      {/* HEADER */}

      <div className="docmind-quiz-header">

        <div className="docmind-quiz-icon">
          ?
        </div>

        <div className="docmind-quiz-heading">

          <div className="docmind-quiz-eyebrow">
            AI FEATURE
          </div>

          <h1>
            Quiz
          </h1>

          <p>
            Test your understanding
          </p>

        </div>

      </div>


      {/* QUIZ CARD */}

      <div className="docmind-quiz-card">

        <h2>
          Generate Quiz
        </h2>

        <p className="docmind-quiz-description">
          Create a quiz and test your understanding of the document.
        </p>


        {/* NUMBER OF QUESTIONS */}

        <div className="docmind-quiz-field">

          <label>
            Number of Questions
          </label>

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


        {/* QUIZ TYPE */}

        <div className="docmind-quiz-field">

          <label>
            Quiz Type
          </label>

          <div className="docmind-quiz-options">

            {[
              "Multiple Choice",
              "True / False",
              "Mixed",
            ].map((type) => (

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

            ))}

          </div>

        </div>


        {/* GENERATE BUTTON */}

        <button
          type="button"
          className="docmind-quiz-generate"
        >
          ✦ Generate & Attend Quiz
        </button>

      </div>

    </div>
  );
}

export default Quiz;