import { useState } from "react";

function Documents({ document, onBack }) {
  const [documents, setDocuments] = useState(
    document ? [document] : []
  );

  const handleUpload = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      alert("Please upload a PDF file.");
      return;
    }

    setDocuments((previousDocuments) => [
      ...previousDocuments,
      file,
    ]);
  };

  const removeDocument = (index) => {
    setDocuments((previousDocuments) =>
      previousDocuments.filter((_, i) => i !== index)
    );
  };

  return (
    <div className="documents-page">

      <div className="documents-header">

        <button
          type="button"
          className="back-button"
          onClick={onBack}
        >
          ← Back to Dashboard
        </button>

        <div className="documents-title">

          <div className="documents-title-icon">
            📄
          </div>

          <div>
            <h1>Documents</h1>

            <p>
              Manage your uploaded PDF documents
            </p>
          </div>

        </div>

      </div>


      <div className="documents-card">

        <div className="documents-card-header">

          <div>

            <h2>
              My Documents
            </h2>

            <p>
              View and manage your uploaded documents.
            </p>

          </div>


          <label className="documents-upload-button">

            <span>＋</span>
            Upload PDF

            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleUpload}
              hidden
            />

          </label>

        </div>


        {documents.length === 0 ? (

          <div className="documents-empty">

            <div className="documents-empty-icon">
              📄
            </div>

            <h3>
              No documents yet
            </h3>

            <p>
              Upload a PDF document to get started.
            </p>

          </div>

        ) : (

          <div className="documents-list">

            {documents.map((file, index) => (

              <div
                className="document-item"
                key={`${file.name}-${index}`}
              >

                <div className="document-file-icon">
                  📄
                </div>


                <div className="document-info">

                  <h3>
                    {file.name}
                  </h3>

                  <p>
                    PDF Document
                  </p>

                </div>


                <div className="document-status-badge">
                  READY
                </div>


                <button
                  type="button"
                  className="document-delete-button"
                  onClick={() => removeDocument(index)}
                >
                  🗑
                </button>

              </div>

            ))}

          </div>

        )}

      </div>

    </div>
  );
}

export default Documents;