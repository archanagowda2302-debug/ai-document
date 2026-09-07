import React, { useState } from "react";
import "./App.css";
import Quiz from "./Quiz";

const features = [
  {
    id: "summary",
    icon: "✦",
    title: "Summarize",
    desc: "Generate smart summaries from your documents",
  },
  {
    id: "chat",
    icon: "◌",
    title: "Ask Questions",
    desc: "Chat with your uploaded document",
  },
  {
    id: "quiz",
    icon: "⌁",
    title: "Generate Quiz",
    desc: "Test your knowledge from the document",
  },
  {
    id: "questions",
    icon: "?",
    title: "Important Questions",
    desc: "Find likely exam questions",
  },
  {
    id: "dates",
    icon: "◷",
    title: "Important Dates",
    desc: "Extract dates and events",
  },
  {
    id: "tables",
    icon: "▦",
    title: "Extract Tables",
    desc: "Find tables inside your document",
  },
];

function App() {
  const [page, setPage] = useState("home");
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const uploadPDF = (e) => {
    const files = Array.from(e.target.files || []);

    const pdfs = files.filter(
      (file) =>
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf")
    );

    if (!pdfs.length) {
      alert("Please upload PDF files only.");
      return;
    }

    const oversized = pdfs.filter(
      (file) => file.size > 20 * 1024 * 1024
    );

    if (oversized.length) {
      alert("Each PDF must be smaller than 20 MB.");
      return;
    }

    const newDocs = pdfs.map((file) => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + " MB",
      date: new Date().toLocaleDateString(),
      status: "Ready",
    }));

    setDocuments((prev) => [...newDocs, ...prev]);
    setSelectedDoc(newDocs[0]);
    setPage("documents");

    e.target.value = "";
  };

  const openFeature = (id) => {
    if (!selectedDoc && documents.length) {
      setSelectedDoc(documents[0]);
    }

    setPage(id);
    setSidebarOpen(false);
  };

  return (
    <div className="app">

      {/* SIDEBAR */}

      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>

        <div className="brand">

          <div className="brandIcon">
            ✦
          </div>

          <div>
            <h2>DocuMind</h2>
            <span>AI DOCUMENT INTELLIGENCE</span>
          </div>

        </div>

        <div className="menuTitle">
          WORKSPACE
        </div>

        <NavItem
          icon="⌂"
          text="Home"
          active={page === "home"}
          onClick={() => {
            setPage("home");
            setSidebarOpen(false);
          }}
        />

        <NavItem
          icon="↑"
          text="Upload Document"
          onClick={() =>
            document.getElementById("mainUpload").click()
          }
        />

        <NavItem
          icon="▤"
          text="My Documents"
          active={page === "documents"}
          onClick={() => {
            setPage("documents");
            setSidebarOpen(false);
          }}
        />

        <NavItem
          icon="◌"
          text="Chat"
          active={page === "chat"}
          onClick={() => openFeature("chat")}
        />

        <div className="menuTitle">
          AI TOOLS
        </div>

        <NavItem
          icon="✦"
          text="Features"
          active={page === "features"}
          onClick={() => {
            setPage("features");
            setSidebarOpen(false);
          }}
        />

        <NavItem
          icon="⚙"
          text="Settings"
          active={page === "settings"}
          onClick={() => {
            setPage("settings");
            setSidebarOpen(false);
          }}
        />

        <div className="sidebarBottom">

          <div className="aiMiniCard">

            <div className="aiGlow">
              ✦
            </div>

            <strong>
              AI Assistant
            </strong>

            <p>
              Transform your documents into knowledge.
            </p>

          </div>

          <div className="profile">

            <div className="avatar">
              P
            </div>

            <div>
              <strong>
                Pooja
              </strong>

              <span>
                Student Account
              </span>
            </div>

            <span>
              •••
            </span>

          </div>

        </div>

      </aside>


      {/* MOBILE OVERLAY */}

      {sidebarOpen && (
        <div
          className="overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}


      {/* MAIN */}

      <main className="main">

        {/* TOP BAR */}

        <header className="topbar">

          <button
            className="mobileMenu"
            onClick={() =>
              setSidebarOpen(!sidebarOpen)
            }
          >
            ☰
          </button>

          <div className="breadcrumb">

            Workspace

            <span>
              /
            </span>

            {page === "home"
              ? "Overview"
              : page}

          </div>

          <div className="topActions">

            <button className="iconBtn">
              ⌕
            </button>

            <button className="iconBtn">
              ◔
            </button>

            <div className="topAvatar">
              P
            </div>

          </div>

        </header>


        {/* CONTENT */}

        <div className="content">

          {/* HOME */}

          {page === "home" && (
            <Dashboard
              documents={documents}
              setPage={setPage}
              uploadPDF={uploadPDF}
              openFeature={openFeature}
              setSelectedDoc={setSelectedDoc}
            />
          )}


          {/* DOCUMENTS */}

          {page === "documents" && (
            <DocumentsPage
              documents={documents}
              uploadPDF={uploadPDF}
              setSelectedDoc={setSelectedDoc}
              setPage={setPage}
            />
          )}


          {/* FEATURES */}

          {page === "features" && (
            <FeaturesPage
              openFeature={openFeature}
            />
          )}


          {/* SUMMARY */}

          {page === "summary" && (
            <FeaturePage
              title="Document Summary"
              subtitle="Create an intelligent summary of your document."
              icon="✦"
              doc={selectedDoc}
            >
              <SummaryFeature />
            </FeaturePage>
          )}


          {/* CHAT */}

          {page === "chat" && (
            <FeaturePage
              title="Chat with Document"
              subtitle="Ask questions and get answers from your document."
              icon="◌"
              doc={selectedDoc}
            >
              <ChatFeature />
            </FeaturePage>
          )}


          {/* QUIZ */}

          {page === "quiz" && (
            <Quiz
              document={selectedDoc}
              onBack={() => setPage("home")}
            />
          )}


          {/* QUESTIONS */}

          {page === "questions" && (
            <FeaturePage
              title="Important Questions"
              subtitle="Find the most important questions from your document."
              icon="?"
              doc={selectedDoc}
            >
              <QuestionsFeature />
            </FeaturePage>
          )}


          {/* DATES */}

          {page === "dates" && (
            <FeaturePage
              title="Important Dates"
              subtitle="Automatically extract dates, events and deadlines."
              icon="◷"
              doc={selectedDoc}
            >
              <DatesFeature />
            </FeaturePage>
          )}


          {/* TABLES */}

          {page === "tables" && (
            <FeaturePage
              title="Extract Tables"
              subtitle="Detect and organize tables from your document."
              icon="▦"
              doc={selectedDoc}
            >
              <TablesFeature />
            </FeaturePage>
          )}


          {/* SETTINGS */}

          {page === "settings" && (
            <SettingsPage />
          )}

        </div>


        {/* MAIN UPLOAD */}

        <input
          id="mainUpload"
          type="file"
          accept=".pdf,application/pdf"
          multiple
          hidden
          onChange={uploadPDF}
        />

      </main>

    </div>
  );
}


/* =========================================================
   DASHBOARD
========================================================= */

function Dashboard({
  documents,
  setPage,
  uploadPDF,
  openFeature,
  setSelectedDoc,
}) {
  return (
    <>

      {/* WELCOME */}

      <section className="welcome">

        <div>

          <p className="eyebrow">
            GOOD EVENING
          </p>

          <h1>
            Welcome back, Pooja <span>✦</span>
          </h1>

          <p>
            Turn complex documents into clear, useful knowledge with AI.
          </p>

        </div>

        <button
          className="primaryBtn"
          onClick={() =>
            document.getElementById("mainUpload").click()
          }
        >
          + Upload Document
        </button>

      </section>


      {/* HERO */}

      <section className="heroUpload">

        <div className="heroText">

          <div className="heroBadge">
            ✦ AI POWERED
          </div>

          <h2>
            Your documents.
            <br />
            <span>
              Smarter.
            </span>
          </h2>

          <p>
            Upload a PDF and let DocuMind summarize,
            analyze, explain and answer questions instantly.
          </p>

          <label className="heroUploadBtn">

            <input
              type="file"
              accept=".pdf,application/pdf"
              multiple
              onChange={uploadPDF}
            />

            ↑ Upload PDF

          </label>

          <small>
            PDF files only · Maximum 20 MB
          </small>

        </div>


        <div className="heroVisual">

          <div className="orb orb1"></div>

          <div className="orb orb2"></div>

          <div className="floatingDoc">

            <div className="docTop">
              PDF
            </div>

            <div className="docLine"></div>
            <div className="docLine short"></div>
            <div className="docLine"></div>
            <div className="docLine tiny"></div>

          </div>

          <div className="floatingTag tag1">
            ✦ AI SUMMARY
          </div>

          <div className="floatingTag tag2">
            ◈ AI TOOLS
          </div>

          <div className="floatingTag tag3">
            ◌ ASK AI
          </div>

        </div>

      </section>


      {/* STATS */}

      <section className="statsGrid">

        <StatCard
          icon="▤"
          value={documents.length}
          label="Documents"
          note="Uploaded files"
        />

        <StatCard
          icon="✦"
          value="∞"
          label="AI Insights"
          note="Ready to generate"
        />

        <StatCard
          icon="◌"
          value="24/7"
          label="AI Assistant"
          note="Always available"
        />

        <StatCard
          icon="✓"
          value="100%"
          label="Secure"
          note="Your documents"
        />

      </section>


      {/* QUICK ACCESS */}

      <div className="sectionHeader">

        <div>

          <p className="eyebrow">
            QUICK ACCESS
          </p>

          <h2>
            What do you want to do?
          </h2>

        </div>

        <button
          className="textBtn"
          onClick={() => setPage("features")}
        >
          View all →
        </button>

      </div>


      <section className="featureGrid">

        {features.slice(0, 4).map((feature, index) => (

          <FeatureCard
            key={feature.id}
            feature={feature}
            index={index}
            onClick={() =>
              openFeature(feature.id)
            }
          />

        ))}

      </section>


      {/* RECENT DOCUMENTS */}

      <div className="sectionHeader documentsHeader">

        <div>

          <p className="eyebrow">
            LIBRARY
          </p>

          <h2>
            Recent documents
          </h2>

        </div>

        <button
          className="textBtn"
          onClick={() =>
            setPage("documents")
          }
        >
          View library →
        </button>

      </div>


      <section className="documentsTable">

        {documents.length === 0 ? (

          <div className="emptyDocs">

            <div className="emptyIcon">
              ▤
            </div>

            <h3>
              No documents yet
            </h3>

            <p>
              Upload your first PDF to start using AI tools.
            </p>

          </div>

        ) : (

          documents.slice(0, 5).map((doc) => (

            <div
              className="documentRow"
              key={doc.id}
            >

              <div className="pdfIcon">
                PDF
              </div>

              <div className="docInfo">

                <strong>
                  {doc.name}
                </strong>

                <span>
                  {doc.size} · {doc.date}
                </span>

              </div>

              <span className="status">
                ● {doc.status}
              </span>

              <button
                className="rowBtn"
                onClick={() => {
                  setSelectedDoc(doc);
                  setPage("summary");
                }}
              >
                Open →
              </button>

            </div>

          ))

        )}

      </section>


      {/* PROMO */}

      <section className="promo">

        <div>

          <div className="promoIcon">
            ✦
          </div>

          <h2>
            Ready to understand your documents?
          </h2>

          <p>
            Upload a document and unlock all AI-powered features.
          </p>

        </div>

        <button
          className="lightBtn"
          onClick={() =>
            document.getElementById("mainUpload").click()
          }
        >
          Get Started →
        </button>

      </section>

    </>
  );
}


/* =========================================================
   DOCUMENTS PAGE
========================================================= */

function DocumentsPage({
  documents,
  uploadPDF,
  setSelectedDoc,
  setPage,
}) {
  return (
    <div>

      <PageHeading
        eyebrow="LIBRARY"
        title="My Documents"
        subtitle="Manage all your uploaded documents."
      />

      <div className="uploadSmall">

        <label className="primaryBtn">

          + Upload PDF

          <input
            type="file"
            accept=".pdf,application/pdf"
            multiple
            hidden
            onChange={uploadPDF}
          />

        </label>

      </div>


      <div className="documentsTable full">

        {documents.length === 0 ? (

          <div className="emptyDocs">

            <div className="emptyIcon">
              ▤
            </div>

            <h3>
              Your library is empty
            </h3>

            <p>
              Upload a PDF to get started.
            </p>

          </div>

        ) : (

          documents.map((doc) => (

            <div
              className="documentRow"
              key={doc.id}
            >

              <div className="pdfIcon">
                PDF
              </div>

              <div className="docInfo">

                <strong>
                  {doc.name}
                </strong>

                <span>
                  {doc.size} · Uploaded {doc.date}
                </span>

              </div>

              <span className="status">
                ● Ready
              </span>

              <div className="rowActions">

                <button
                  className="rowBtn"
                  onClick={() => {
                    setSelectedDoc(doc);
                    setPage("summary");
                  }}
                >
                  Analyze
                </button>

                <button
                  className="rowBtn"
                  onClick={() => {
                    setSelectedDoc(doc);
                    setPage("chat");
                  }}
                >
                  Chat
                </button>

                <button
                  className="rowBtn"
                  onClick={() => {
                    setSelectedDoc(doc);
                    setPage("quiz");
                  }}
                >
                  Quiz
                </button>

              </div>

            </div>

          ))

        )}

      </div>

    </div>
  );
}


/* =========================================================
   FEATURES PAGE
========================================================= */

function FeaturesPage({ openFeature }) {
  return (
    <div>

      <PageHeading
        eyebrow="AI TOOLKIT"
        title="All Features"
        subtitle="Everything you need to understand your documents."
      />

      <section className="allFeatureGrid">

        {features.map((feature, index) => (

          <FeatureCard
            key={feature.id}
            feature={feature}
            index={index}
            onClick={() =>
              openFeature(feature.id)
            }
          />

        ))}

      </section>

    </div>
  );
}


/* =========================================================
   FEATURE PAGE
========================================================= */

function FeaturePage({
  title,
  subtitle,
  icon,
  doc,
  children,
}) {
  return (
    <div>

      <div className="featureHeroHeading">

        <div className="featureBigIcon">
          {icon}
        </div>

        <div>

          <p className="eyebrow">
            AI FEATURE
          </p>

          <h1>
            {title}
          </h1>

          <p>
            {subtitle}
          </p>

          {doc && (

            <div className="selectedDoc">

              <span>
                PDF
              </span>

              {doc.name}

            </div>

          )}

        </div>

      </div>

      {children}

    </div>
  );
}


/* =========================================================
   SUMMARY
========================================================= */

function SummaryFeature() {
  const [type, setType] = useState("Key Points");
  const [generated, setGenerated] = useState(false);

  return (
    <div className="toolBox">

      <h3>
        Generate Summary
      </h3>

      <p className="toolDescription">
        Choose how you want the document summarized.
      </p>

      <label>
        Summary Type
      </label>

      <div className="optionGrid">

        {["Short", "Detailed", "Key Points"].map((item) => (

          <button
            key={item}
            className={
              type === item
                ? "option active"
                : "option"
            }
            onClick={() => setType(item)}
          >
            {item}
          </button>

        ))}

      </div>

      <button
        className="primaryBtn wide"
        onClick={() => setGenerated(true)}
      >
        ✦ Generate Summary
      </button>

      {generated && (

        <ResultBox title={`${type} Summary`}>

          <p>
            This is where the AI-generated summary will
            appear after connecting the frontend with
            your backend API.
          </p>

          <p>
            The document content will be analyzed and the
            important information will be displayed here.
          </p>

          <div className="resultActions">

            <button className="secondaryBtn">
              ↓ Download Summary PDF
            </button>

            <button
              className="secondaryBtn"
              onClick={() => setGenerated(false)}
            >
              ↻ Regenerate
            </button>

          </div>

        </ResultBox>

      )}

    </div>
  );
}


/* =========================================================
   CHAT
========================================================= */

function ChatFeature() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const ask = () => {

    if (!question.trim()) {
      alert("Please enter a question.");
      return;
    }

    setAnswer(
      "AI answer will appear here after connecting the Chat API with your backend."
    );
  };

  return (
    <div className="toolBox">

      <h3>
        Ask your document
      </h3>

      <textarea
        placeholder="Ask anything about this document..."
        value={question}
        onChange={(e) =>
          setQuestion(e.target.value)
        }
      />

      <button
        className="primaryBtn wide"
        onClick={ask}
      >
        ◌ Ask AI
      </button>

      {answer && (

        <ResultBox title="AI Answer">

          <p>
            {answer}
          </p>

          <div className="resultActions">

            <button
              className="secondaryBtn"
              onClick={() =>
                navigator.clipboard?.writeText(answer)
              }
            >
              ⧉ Copy Answer
            </button>

            <button
              className="secondaryBtn"
              onClick={() => {
                setQuestion("");
                setAnswer("");
              }}
            >
              + Ask Another Question
            </button>

          </div>

        </ResultBox>

      )}

    </div>
  );
}


/* =========================================================
   IMPORTANT QUESTIONS
========================================================= */

function QuestionsFeature() {
  const [count, setCount] = useState("10");
  const [generated, setGenerated] = useState(false);

  return (
    <div className="toolBox">

      <h3>
        Generate Important Questions
      </h3>

      <div className="optionGrid">

        {["5", "10", "20"].map((n) => (

          <button
            key={n}
            className={
              count === n
                ? "option active"
                : "option"
            }
            onClick={() => setCount(n)}
          >
            {n} Questions
          </button>

        ))}

      </div>

      <button
        className="primaryBtn wide"
        onClick={() => setGenerated(true)}
      >
        ? Generate Questions
      </button>

      {generated && (

        <ResultBox title="Important Questions">

          <ol className="questionList">

            {Array.from({ length: 5 }).map((_, i) => (

              <li key={i}>
                What is the importance of the
                main concept discussed in the document?
              </li>

            ))}

          </ol>

          <div className="resultActions">

            <button className="secondaryBtn">
              ↓ Download Questions PDF
            </button>

            <button
              className="secondaryBtn"
              onClick={() => setGenerated(false)}
            >
              ↻ Generate Again
            </button>

          </div>

        </ResultBox>

      )}

    </div>
  );
}


/* =========================================================
   IMPORTANT DATES
========================================================= */

function DatesFeature() {
  const [generated, setGenerated] = useState(false);

  return (
    <div className="toolBox">

      <h3>
        Extract Important Dates
      </h3>

      <button
        className="primaryBtn wide"
        onClick={() => setGenerated(true)}
      >
        ◷ Extract Important Dates
      </button>

      {generated && (

        <ResultBox title="Important Dates">

          <div className="dataTable">

            <div className="tableHeader">
              <span>Date</span>
              <span>Event</span>
              <span>Importance</span>
            </div>

            {[
              ["12 Jan 2026", "Project Start", "High"],
              ["20 Feb 2026", "Submission", "High"],
              ["05 Mar 2026", "Review", "Medium"],
            ].map((row, i) => (

              <div
                className="tableRow"
                key={i}
              >

                <span>
                  {row[0]}
                </span>

                <span>
                  {row[1]}
                </span>

                <span>
                  {row[2]}
                </span>

              </div>

            ))}

          </div>

          <div className="resultActions">

            <button className="secondaryBtn">
              ↓ Download Dates PDF
            </button>

            <button
              className="secondaryBtn"
              onClick={() => setGenerated(false)}
            >
              ↻ Extract Again
            </button>

          </div>

        </ResultBox>

      )}

    </div>
  );
}


/* =========================================================
   TABLES
========================================================= */

function TablesFeature() {
  const [generated, setGenerated] = useState(false);

  return (
    <div className="toolBox">

      <h3>
        Extract Tables
      </h3>

      <button
        className="primaryBtn wide"
        onClick={() => setGenerated(true)}
      >
        ▦ Extract Tables
      </button>

      {generated && (

        <ResultBox title="Extracted Table 1">

          <div className="dataTable">

            <div className="tableHeader">
              <span>Item</span>
              <span>Description</span>
              <span>Value</span>
            </div>

            {[
              ["1", "Document Analysis", "Complete"],
              ["2", "AI Processing", "Active"],
              ["3", "Insights", "Available"],
            ].map((row, i) => (

              <div
                className="tableRow"
                key={i}
              >

                <span>
                  {row[0]}
                </span>

                <span>
                  {row[1]}
                </span>

                <span>
                  {row[2]}
                </span>

              </div>

            ))}

          </div>

          <div className="resultActions">

            <button className="secondaryBtn">
              ↓ Download Tables PDF
            </button>

            <button
              className="secondaryBtn"
              onClick={() => setGenerated(false)}
            >
              ↻ Extract Again
            </button>

          </div>

        </ResultBox>

      )}

    </div>
  );
}


/* =========================================================
   SETTINGS
========================================================= */

function SettingsPage() {
  return (
    <div>

      <PageHeading
        eyebrow="SYSTEM"
        title="Settings"
        subtitle="Customize your DocuMind workspace."
      />

      <div className="settingsBox">

        <div className="settingRow">

          <div>

            <strong>
              AI Responses
            </strong>

            <p>
              Use detailed AI responses when analyzing documents.
            </p>

          </div>

          <div className="toggle active">
            ●
          </div>

        </div>


        <div className="settingRow">

          <div>

            <strong>
              Document History
            </strong>

            <p>
              Keep your recently analyzed documents available.
            </p>

          </div>

          <div className="toggle active">
            ●
          </div>

        </div>


        <div className="settingRow">

          <div>

            <strong>
              Notifications
            </strong>

            <p>
              Receive notifications when document processing is complete.
            </p>

          </div>

          <div className="toggle">
            ○
          </div>

        </div>

      </div>

    </div>
  );
}


/* =========================================================
   COMPONENTS
========================================================= */

function NavItem({
  icon,
  text,
  active,
  onClick,
}) {
  return (
    <button
      className={
        active
          ? "navItem active"
          : "navItem"
      }
      onClick={onClick}
    >
      <span>
        {icon}
      </span>

      {text}

    </button>
  );
}


function FeatureCard({
  feature,
  index,
  onClick,
}) {
  return (
    <button
      className="featureCard"
      onClick={onClick}
    >

      <div
        className={`featureIcon icon${index}`}
      >
        {feature.icon}
      </div>

      <div>

        <h3>
          {feature.title}
        </h3>

        <p>
          {feature.desc}
        </p>

      </div>

      <span className="cardArrow">
        ↗
      </span>

    </button>
  );
}


function StatCard({
  icon,
  value,
  label,
  note,
}) {
  return (
    <div className="statCard">

      <div className="statIcon">
        {icon}
      </div>

      <div>

        <strong>
          {value}
        </strong>

        <span>
          {label}
        </span>

        <small>
          {note}
        </small>

      </div>

    </div>
  );
}


function ResultBox({
  title,
  children,
}) {
  return (
    <div className="resultBox">

      <div className="resultTitle">

        <span>
          ✦
        </span>

        <h3>
          {title}
        </h3>

      </div>

      {children}

    </div>
  );
}


function PageHeading({
  eyebrow,
  title,
  subtitle,
}) {
  return (
    <div className="pageHeading">

      <p className="eyebrow">
        {eyebrow}
      </p>

      <h1>
        {title}
      </h1>

      <p>
        {subtitle}
      </p>

    </div>
  );
}


export default App;