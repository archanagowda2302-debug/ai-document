import { useEffect, useRef, useState } from "react";
import { apiRequest } from "./api";

function Quiz({ document }) {
  const [quizType, setQuizType] = useState("Multiple Choice"), [questionCount, setQuestionCount] = useState("5"), [started, setStarted] = useState(false), [questions, setQuestions] = useState([]), [current, setCurrent] = useState(0), [answers, setAnswers] = useState({}), [result, setResult] = useState(null), [loading, setLoading] = useState(false), [timeLeft, setTimeLeft] = useState(0);
  const submittingRef = useRef(false);
  const submitRef = useRef(() => {});
  const formatTime = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const submitQuiz = async (expired = false) => {
    if (submittingRef.current || !questions.length) return;
    submittingRef.current = true;
    setLoading(true);
    try {
      const data = await apiRequest(`/api/quiz/${document.id}/submit`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answers: questions.map((_, index) => answers[index] || "") }) });
      setResult({ ...data.result, results: data.results || data.result?.results || [], expired });
      setStarted(false);
      setTimeLeft(0);
    } catch (error) {
      submittingRef.current = false;
      alert(error.message);
    } finally { setLoading(false); }
  };
  useEffect(() => {
    submitRef.current = submitQuiz;
  });
  useEffect(() => {
    if (!started || result || timeLeft <= 0) return undefined;
    const timer = window.setInterval(() => setTimeLeft((previous) => {
      if (previous <= 1) {
        window.clearInterval(timer);
        submitRef.current(true);
        return 0;
      }
      return previous - 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [started, result]);
  const startSession = (quiz) => { setQuestions(quiz); setCurrent(0); setAnswers({}); setResult(null); setTimeLeft(quiz.length * 60); submittingRef.current = false; setStarted(true); };
  const generate = async () => { if (!document?.id) return alert("Please select a document first."); setLoading(true); try { const documentIds = document.documentIds || [document.id]; await apiRequest(`/api/ai/${document.id}/quiz?documentIds=${encodeURIComponent(documentIds.join(","))}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ documentId: document.id, questionCount: Number(questionCount), quizType }) }); const attempt = await apiRequest(`/api/quiz/${document.id}`); startSession(attempt.quiz); } catch (error) { alert(error.message); } finally { setLoading(false); } };
  const attendAgain = async () => { if (!document?.id) return; setLoading(true); try { const attempt = await apiRequest(`/api/quiz/${document.id}`); startSession(attempt.quiz); } catch (error) { alert(error.message); } finally { setLoading(false); } };
  const next = () => { if (!answers[current]) return; if (current < questions.length - 1) setCurrent(current + 1); else submitQuiz(false); };
  const previous = () => { if (current > 0 && !loading) setCurrent(current - 1); };
  const header = <div className="docmind-quiz-header"><div className="docmind-quiz-icon">?</div><div className="docmind-quiz-heading"><div className="docmind-quiz-eyebrow">AI FEATURE</div><h1>Quiz</h1><p>Test your understanding</p></div></div>;
  if (started) { const question = questions[current]; const selected = answers[current] || ""; return <div className="docmind-quiz">{header}<div className="docmind-quiz-card"><div style={{ marginBottom: "24px" }}><h2>Question {current + 1} of {questions.length}</h2><p className="docmind-quiz-description">Time: {formatTime(timeLeft)}</p><p className="docmind-quiz-description">{question.question}</p></div><div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>{question.options.map((option) => <button key={option} type="button" onClick={() => setAnswers((previousAnswers) => ({ ...previousAnswers, [current]: option }))} style={{ padding: "14px 16px", textAlign: "left", borderRadius: "10px", border: selected === option ? "2px solid #4f46e5" : "1px solid #e5e7eb", background: selected === option ? "#eef2ff" : "#ffffff", cursor: "pointer", fontSize: "14px" }}>{option}</button>)}</div>{current > 0 && <button type="button" className="docmind-quiz-generate" onClick={previous} disabled={loading} style={{ marginTop: "24px" }}>← Previous</button>}<button type="button" className="docmind-quiz-generate" onClick={next} disabled={!selected || loading} style={{ marginTop: current > 0 ? "12px" : "24px", opacity: selected ? 1 : 0.5, cursor: selected ? "pointer" : "not-allowed" }}>{loading ? "Finishing..." : current === questions.length - 1 ? "Submit Quiz" : "Next"}</button></div></div>; }
  return <div className="docmind-quiz">{header}<div className="docmind-quiz-card"><h2>Generate Quiz</h2><p className="docmind-quiz-description">Create a quiz and test your understanding of the document.</p><div className="docmind-quiz-field"><label>Number of Questions</label><div className="docmind-quiz-options">{["5", "10", "15"].map((count) => <button key={count} type="button" className={questionCount === count ? "docmind-quiz-option active" : "docmind-quiz-option"} onClick={() => setQuestionCount(count)}>{count}</button>)}</div></div><div className="docmind-quiz-field"><label>Quiz Type</label><div className="docmind-quiz-options">{["Multiple Choice", "True / False", "Mixed"].map((type) => <button key={type} type="button" className={quizType === type ? "docmind-quiz-option active" : "docmind-quiz-option"} onClick={() => setQuizType(type)}>{type}</button>)}</div></div><button type="button" className="docmind-quiz-generate" onClick={generate} disabled={loading}>{loading ? "Generating..." : "Generate & Attend Quiz"}</button>{result && <div className="docmind-quiz-description" style={{ marginTop: "24px" }}><strong>Quiz Completed</strong>{result.expired && <><br />Time's up! Your quiz has been submitted.</>}<br />Score: {result.score} / {result.totalQuestions} ({result.percentage}%)<br />{result.performance}<div style={{ marginTop: "20px", textAlign: "left" }}><strong>Answer Review</strong>{result.results.map((item) => <div key={item.questionNumber} style={{ marginTop: "16px" }}><strong>Question {item.questionNumber}</strong><p>{item.question}</p><p>Your Answer: {item.selectedAnswer || "Not answered"}</p><p>Correct Answer: {item.correctAnswer}</p><p>{item.isCorrect ? "Correct" : "Incorrect"}</p><p>Explanation: {item.explanation}</p></div>)}</div><button type="button" className="docmind-quiz-generate" onClick={attendAgain} disabled={loading} style={{ marginTop: "16px" }}>{loading ? "Loading..." : "Attend Quiz Again"}</button></div>}</div></div>;
}
export default Quiz;
