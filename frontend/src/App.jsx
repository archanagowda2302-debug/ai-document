
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { jsPDF } from "jspdf";
import "./App.css";
import Quiz from "./Quiz";
import { API_URL, apiRequest } from "./api";
import { useAuth } from "./authState";
import AuthScreen from "./AuthScreen";

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

const downloadTextPdf = (title, content, fileName) => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 50;
  let cursorY = 60;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(title, pageWidth / 2, cursorY, { align: "center" });
  cursorY += 28;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  const blocks = String(content || "").split(/\r?\n/).flatMap((line) => {
    if (line.startsWith("# ")) return [{ text: line.replace(/^#\s*/, ""), style: "heading" }];
    if (line.startsWith("## ")) return [{ text: line.replace(/^##\s*/, ""), style: "heading" }];
    if (line.startsWith("- ") || line.startsWith("* ")) return [{ text: `• ${line.replace(/^[-*]\s*/, "")}`, style: "bullet" }];
    if (/^\d+\.\s/.test(line)) return [{ text: line, style: "list" }];
    return [{ text: line || " ", style: "body" }];
  });

  blocks.forEach((block) => {
    const paragraphs = doc.splitTextToSize(block.text || " ", pageWidth - margin * 2);
    if (cursorY + paragraphs.length * 16 > pageHeight - margin) {
      doc.addPage();
      cursorY = 50;
    }

    doc.setFont("helvetica", block.style === "heading" ? "bold" : "normal");
    doc.setFontSize(block.style === "heading" ? 14 : 11);
    doc.text(paragraphs, margin, cursorY, { baseline: "top" });
    cursorY += paragraphs.length * (block.style === "heading" ? 18 : 15) + 6;
  });

  doc.save(fileName);
};

const documentSelectionQuery = (doc) => {
  if (!Array.isArray(doc?.documentIds) || doc.documentIds.length < 2) return "";
  return `&documentIds=${encodeURIComponent(doc.documentIds.join(","))}`;
};

function App() {
  const { user, loading: authLoading, logout } = useAuth();
  const [page, setPage] = useState("home");
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  const normalizeDocument = (item) => ({
    ...item,
    size: item.size ? `${(Number(item.size) / (1024 * 1024)).toFixed(2)} MB` : item.pages ? `${item.pages} page${item.pages === 1 ? "" : "s"}` : "PDF",
    date: new Date(item.uploadedAt).toLocaleDateString(),
    status: item.status || "uploaded"
  });

  useEffect(() => {
    if (authLoading || !user) return;
    const refreshDocuments = () => apiRequest("/api/documents").then((items) => setDocuments(items.map(normalizeDocument))).catch(() => {});
    refreshDocuments();
    const poll = window.setInterval(refreshDocuments, 3000);
    return () => window.clearInterval(poll);
  }, [authLoading, user]);

  if (authLoading) return <div />;
  if (!user) return <AuthScreen />;

  const uploadPDF = async (e) => {
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
    (file) => file.size > 1024 * 1024 * 1024
  );

  if (oversized.length) {
    alert("Each PDF must be smaller than 1 GB.");
    return;
  }

  try {
    const formData = new FormData();
    pdfs.forEach((file) => formData.append("document", file));

    const data = await new Promise((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.open("POST", `${API_URL}/api/documents/upload`);
      request.setRequestHeader("Authorization", `Bearer ${localStorage.getItem("documind_token")}`);
      request.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          pdfs.forEach((file) => setUploadProgress((previous) => ({ ...previous, [file.name]: percent })));
        }
      };
      request.onload = () => {
        const response = JSON.parse(request.responseText || "{}");
        if (request.status >= 200 && request.status < 300) resolve(response);
        else reject(new Error(response.message || `Upload failed: ${request.status}`));
      };
      request.onerror = () => reject(new Error("Network error while uploading the PDF."));
      request.send(formData);
    });

    const uploadedDocs = (data.documents || [data.document]).filter(Boolean).map(normalizeDocument);
    setDocuments((prev) => [...uploadedDocs, ...prev.filter((item) => !uploadedDocs.some((uploaded) => uploaded.id === item.id))]);
    setSelectedDoc(uploadedDocs[0] ? { ...uploadedDocs[0], documentIds: uploadedDocs.map((item) => item.id) } : null);
    setPage("documents");

    alert("PDF upload accepted. Processing will continue in the background.");
  } catch (error) {
    console.error("Upload error:", error);
    alert(
      error.message || "Failed to upload PDF. Please check whether the backend is running."
    );
  }

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

          <div className="profile" onClick={() => setProfileOpen((open) => !open)}>

            <div className="avatar">
              {(user?.name || "U").charAt(0).toUpperCase()}
            </div>

            <div>
              <strong>
                {user?.name || "User"}
              </strong>

              <span>
                {user?.email || "Account"}
              </span>
            </div>

            <span>
              •••
            </span>

            {profileOpen && (
              <div className="profileDropdown">
                <div className="profileDropdownHeader">
                  <div className="avatar small">{(user?.name || "U").charAt(0).toUpperCase()}</div>
                  <div>
                    <strong>{user?.name || "User"}</strong>
                    <small>{user?.email || ""}</small>
                  </div>
                </div>
                <button type="button">Profile</button>
                <button type="button">Settings</button>
                <button type="button" onClick={logout}>Logout</button>
              </div>
            )}

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

            <div className="topUserWrap" onClick={() => setProfileOpen((open) => !open)}>
              <div className="topAvatar">{(user?.name || "U").charAt(0).toUpperCase()}</div>
              <span className="topUserName">{user?.name || "User"}</span>
              {profileOpen && (
                <div className="profileDropdown topProfileDropdown">
                  <div className="profileDropdownHeader">
                    <div className="avatar small">{(user?.name || "U").charAt(0).toUpperCase()}</div>
                    <div>
                      <strong>{user?.name || "User"}</strong>
                      <small>{user?.email || ""}</small>
                    </div>
                  </div>
                  <button type="button">Profile</button>
                  <button type="button">Settings</button>
                  <button type="button" onClick={logout}>Logout</button>
                </div>
              )}
            </div>

          </div>

        </header>


        {/* CONTENT */}

        <div className="content">

          {/* HOME */}

          {page === "home" && (
            <Dashboard
              user={user}
              documents={documents}
              uploadProgress={uploadProgress}
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
              <SummaryFeature doc={selectedDoc} />
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
              <ChatFeature doc={selectedDoc} />
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
              <QuestionsFeature doc={selectedDoc} />
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
              <DatesFeature doc={selectedDoc} />
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
              <TablesFeature doc={selectedDoc} />
            </FeaturePage>
          )}


          {/* SETTINGS */}

          {page === "settings" && (
            <SettingsPage onLogout={logout} user={user} />
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
  user,
  documents,
  uploadProgress,
  setPage,
  uploadPDF,
  openFeature,
  setSelectedDoc,
}) {
  const activeUploads = Object.entries(uploadProgress).filter(([, progress]) => progress < 100);
  return (
    <>

      {activeUploads.length > 0 && (
        <div className="uploadProgressNotice">
          Uploading {activeUploads.length} PDF{activeUploads.length === 1 ? "" : "s"}: {activeUploads[0][1]}%
        </div>
      )}

      {/* WELCOME */}

      <section className="welcome">

        <div>

          <p className="eyebrow">
            GOOD EVENING
          </p>

          <h1>
            Welcome back, {user?.name || "User"} <span>✦</span>
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
            PDF files only · Maximum 1 GB per file
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
                ● {doc.status === "ready" ? "Ready" : doc.status === "failed" ? "Processing failed" : "Processing"}
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
                ● {doc.status === "ready" ? "Ready" : doc.status === "failed" ? "Failed" : "Processing"}
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

function SummaryFeature({ doc }) {
  const [type, setType] = useState("Key Points");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const generateSummary = async () => {
    if (!doc?.id) return alert("Please select a document first.");
    setLoading(true);
    try {
      const data = await apiRequest(`/api/ai/${doc.id}/summary?type=${encodeURIComponent(type)}${documentSelectionQuery(doc)}`);
      setSummary(data.summary);
    } catch (error) { alert(error.message); } finally { setLoading(false); }
  };
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
        onClick={generateSummary}
        disabled={loading}
      >
        ✦ Generate Summary
      </button>

      {summary && (

        <ResultBox title={`${type} Summary`}>

          <div className="ai-response"><ReactMarkdown>{summary}</ReactMarkdown></div>

          <div className="resultActions">

            <button className="secondaryBtn" onClick={() => {
              downloadTextPdf("Document Summary", summary, "DocAI-Summary.pdf");
            }}>
              ↓ Download Summary PDF
            </button>

            <button
              className="secondaryBtn"
              onClick={generateSummary}
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

function ChatFeature({ doc }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);

  const ask = async () => {
    if (!doc?.id) return alert("Please select a document first.");
    if (!question.trim()) return alert("Please enter a question.");
    setLoading(true);
    try {
      const data = await apiRequest(`/api/ai/${doc.id}/chat?documentIds=${encodeURIComponent((doc.documentIds || [doc.id]).join(","))}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question }) });
      setAnswer(data.answer);
      setSources(data.sources || []);
    } catch (error) { alert(error.message); } finally { setLoading(false); }
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
        disabled={loading}
      >
        ◌ Ask AI
      </button>

      {answer && (

        <ResultBox title="AI Answer">

          <div className="ai-response"><ReactMarkdown>{answer}</ReactMarkdown></div>
          <div className="chat-sources"><strong>Sources</strong><br />{sources.length ? `Pages ${sources.map((source) => source.page).join(", ")}` : "None"}</div>

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

function QuestionsFeature({ doc }) {
  const [count, setCount] = useState("10");
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const generateQuestions = async () => {
    if (!doc?.id) {
      alert("Please select a document first.");
      return;
    }

    setLoading(true);
    setQuestions([]);

    try {
      const data = await apiRequest(`/api/ai/${doc.id}/important-questions?documentIds=${encodeURIComponent((doc.documentIds || [doc.id]).join(","))}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numberOfQuestions: Number(count) }),
      });

      setQuestions(
        data.questions ||
        data.result ||
        data.content ||
        []
      );
    } catch (error) {
      console.error("Questions error:", error);
      alert(error.message || "Failed to generate important questions.");
    } finally {
      setLoading(false);
    }
  };

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
        onClick={generateQuestions}
        disabled={loading}
      >
        {loading ? "Generating..." : "❓ Generate Questions"}
      </button>

      {loading && (
        <p>Generating important questions...</p>
      )}

      {questions.length > 0 && (
        <ResultBox title="Important Questions">
          {Array.isArray(questions) ? (
            questions.map((question, index) => (
              <p key={index}>
                {index + 1}. {question.question || question}
              </p>
            ))
          ) : (
            <p>{questions}</p>
          )}

          <div className="resultActions">
            <button
              className="secondaryBtn"
              onClick={() => {
                const content = questions.map((item, index) => `${index + 1}. ${item.question || item}`).join("\n\n");
                downloadTextPdf("Important Questions", content, "DocAI-Important-Questions.pdf");
              }}
            >
              ↓ Download Questions PDF
            </button>

            <button
              className="secondaryBtn"
              onClick={generateQuestions}
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
   IMPORTANT DATES
========================================================= */

function DatesFeature({ doc }) {
  const [generated, setGenerated] = useState(false);
  const [dates, setDates] = useState([]);
  const [loading, setLoading] = useState(false);
  const extract = async () => {
    if (!doc?.id) return alert("Please select a document first.");
    setLoading(true);
    try { const data = await apiRequest(`/api/ai/${doc.id}/dates?documentIds=${encodeURIComponent((doc.documentIds || [doc.id]).join(","))}`); setDates(data.dates); setGenerated(true); }
    catch (error) { alert(error.message); } finally { setLoading(false); }
  };

  return (
    <div className="toolBox">

      <h3>
        Extract Important Dates
      </h3>

      <button
        className="primaryBtn wide"
        onClick={extract}
        disabled={loading}
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

            {dates.map((row, i) => (

              <div
                className="tableRow"
                key={i}
              >

                <span>
                  {row.date}
                </span>

                <span>
                  {row.event}
                </span>

                <span>
                  {row.importance}
                </span>

              </div>

            ))}

          </div>

          <div className="resultActions">

            <button className="secondaryBtn" onClick={() => {
              const content = dates.map((item) => `${item.date}: ${item.event} (${item.importance})`).join("\n");
              downloadTextPdf("Important Dates", content, "DocAI-Important-Dates.pdf");
            }}>
              ↓ Download Dates PDF
            </button>

            <button
              className="secondaryBtn"
              onClick={extract}
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

function TablesFeature({ doc }) {
  const [generated, setGenerated] = useState(false);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const extract = async () => {
    if (!doc?.id) return alert("Please select a document first.");
    setLoading(true);
    try {
      const data = await apiRequest(`/api/ai/${doc.id}/tables?documentIds=${encodeURIComponent((doc.documentIds || [doc.id]).join(","))}`);
      setTables(Array.isArray(data.tables) ? data.tables : []);
      setGenerated(true);
    }
    catch (error) { alert(error.message); } finally { setLoading(false); }
  };

  return (
    <div className="toolBox">

      <h3>
        Extract Tables
      </h3>

      <button
        className="primaryBtn wide"
        onClick={extract}
        disabled={loading}
      >
        ▦ Extract Tables
      </button>

      {generated && (

        <ResultBox title={tables.length ? "Extracted Tables" : "No Tables Found"}>

          <div className="dataTable">

            {tables.map((table, tableIndex) => (
              <div key={tableIndex}>
                <h4>{table.title || `Table ${tableIndex + 1}`}</h4>
                <div className="tableHeader">
                  {(table.columns || []).map((column, columnIndex) => <span key={columnIndex}>{column}</span>)}
                </div>
                {(table.rows || []).map((row, rowIndex) => (
                  <div className="tableRow" key={rowIndex}>
                    {row.map((cell, cellIndex) => <span key={cellIndex}>{cell}</span>)}
                  </div>
                ))}
              </div>
            ))}

          </div>

          <div className="resultActions">

            <button className="secondaryBtn" onClick={() => {
              const text = tables.map((table) => `${table.title}\n${table.columns.join(" | ")}\n${table.rows.map((row) => row.join(" | ")).join("\n")}`).join("\n\n");
              downloadTextPdf("Extracted Tables", text, "DocAI-Extracted-Tables.pdf");
            }}>
              ↓ Download Tables PDF
            </button>

            <button
              className="secondaryBtn"
              onClick={extract}
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

function SettingsPage({ onLogout, user }) {
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
            <strong>{user?.name || "Account"}</strong>
            <p>{user?.email}</p>
          </div>
          <button type="button" onClick={onLogout}>Logout</button>
        </div>

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
