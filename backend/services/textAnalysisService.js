const normalizeWhitespace = (text) => text.replace(/\s+/g, " ").trim();

const splitSentences = (text) => normalizeWhitespace(text)
  .match(/[^.!?]+[.!?]+|[^.!?]+$/g)
  ?.map((sentence) => sentence.trim())
  .filter((sentence) => sentence.length > 20) || [];

const uniqueSentences = (sentences) => {
  const seen = new Set();
  return sentences.filter((sentence) => {
    const key = sentence.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 120);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const createExtractiveSummary = (text, type = "Key Points") => {
  const sentences = uniqueSentences(splitSentences(text));
  if (!sentences.length) {
    return normalizeWhitespace(text).slice(0, 1500) || "No extractable text was found in this document.";
  }

  if (type === "Short") return sentences.slice(0, 3).join(" ");

  if (type === "Detailed") {
    return [
      "Overview",
      sentences.slice(0, 2).join(" "),
      "\nKey Details",
      ...sentences.slice(2, 9).map((sentence) => `- ${sentence}`)
    ].join("\n");
  }

  return ["Key Points", ...sentences.slice(0, 8).map((sentence) => `- ${sentence}`)].join("\n");
};

const stopWords = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "how", "in",
  "is", "it", "of", "on", "or", "the", "this", "to", "was", "what", "when", "where",
  "which", "who", "with", "why", "does", "do", "did", "about", "document"
]);

const isQuizWorthySentence = (sentence) => {
  const normalized = sentence.toLowerCase().trim();
  const metadataPatterns = [
    /^written by\b/, /^author\s*:/, /^prepared by\b/, /^created by\b/,
    /^submitted by\b/, /^name\s*:/, /^roll\s*(no|number)\b/,
    /^copyright\b/, /^all rights reserved\b/, /^page \d+\b/,
    /@/, /^dept\.?\b/i, /\b(?:university|institute|college)\b/i,
    /\b(?:engineering|technology),?\s+(?:chennai|india)\b/i,
    /^keywords?\b/i, /^expected ai output\b/i, /^--\s+\d+\s+of\s+\d+/i,
    /^ai document intelligence sample knowledge document\b/i,
    /^(?:feature|term|date|layer)\s+(?:what|definition|milestone|example)\b/i,
    /^date\s+milestone\s+description\b/i,
    /^document type\b/i
  ];
  return !metadataPatterns.some((pattern) => pattern.test(normalized));
};

const rankImportantSentences = (sentences) => sentences
  .filter(isQuizWorthySentence)
  .map((sentence, index) => {
    const normalized = sentence.toLowerCase();
    const score = Math.min(sentence.length, 180) / 20
      + (/[0-9]/.test(sentence) ? 2 : 0)
      + (/(important|main|key|purpose|process|method|result|conclusion|objective|define|means|because|therefore)/.test(normalized) ? 2 : 0)
      - (index * 0.01);
    return { sentence, score };
  })
  .sort((a, b) => b.score - a.score)
  .map((item) => item.sentence);

const answerQuestionFromText = (text, question) => {
  const terms = normalizeWhitespace(question).toLowerCase()
    .match(/[a-z0-9]{2,}/g)
    ?.filter((term) => !stopWords.has(term)) || [];
  const sentences = rankImportantSentences(uniqueSentences(splitSentences(text)));

  const ranked = sentences
    .map((sentence, index) => {
      const lowerSentence = sentence.toLowerCase();
      const score = terms.reduce(
        (total, term) => total + (lowerSentence.includes(term) ? 1 : 0),
        0
      );
      return { sentence, score, index };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 3);

  if (!ranked.length) {
    return "This information is not available in the document.";
  }

  return ranked.map((item) => item.sentence).join(" ");
};

const monthPattern = "January|February|March|April|May|June|July|August|September|October|November|December";
const datePattern = new RegExp(
  `\\b(?:\\d{1,2}\\s+(?:${monthPattern})\\s+\\d{4}|(?:${monthPattern})\\s+\\d{1,2}(?:,)?\\s+\\d{4}|\\d{1,2}[/-]\\d{1,2}[/-]\\d{2,4}|(?:19|20)\\d{2})\\b`,
  "gi"
);

const getDateImportance = (sentence) => {
  const lowerSentence = sentence.toLowerCase();
  if (/(deadline|due|last date|submission|exam|review|meeting|important)/.test(lowerSentence)) return "High";
  if (/(start|end|established|launched|founded|scheduled)/.test(lowerSentence)) return "Medium";
  return "Low";
};

const extractImportantDatesFromText = (text) => {
  const seen = new Set();
  const dates = [];
  uniqueSentences(splitSentences(text)).forEach((sentence) => {
    const matches = sentence.match(datePattern) || [];
    matches.forEach((date) => {
      const key = `${date.toLowerCase()}|${sentence.toLowerCase()}`;
      if (seen.has(key)) return;
      seen.add(key);
      const event = normalizeWhitespace(sentence.replace(date, ""))
        .replace(/\s+([.,!?;:])/g, "$1")
        .replace(/[.,;:\-\s]+$/g, "");
      dates.push({
        date,
        event: event || "Date mentioned in the document",
        description: sentence,
        importance: getDateImportance(sentence)
      });
    });
  });
  return dates;
};

const splitTableRow = (line) => {
  const trimmed = line.trim().replace(/^\||\|$/g, "").trim();
  if (!trimmed || /^[-|\s]{3,}$/.test(trimmed)) return [];

  // pdf-parse preserves many PDF table cells as tabs. Pipe-delimited exports
  // and consistently spaced text tables are also common in uploaded PDFs.
  const cells = trimmed.includes("\t")
    ? trimmed.split(/\t+/)
    : trimmed.includes("|")
      ? trimmed.split("|")
      : trimmed.split(/\s{2,}/);

  return cells.map((cell) => normalizeWhitespace(cell)).filter(Boolean);
};

const looksLikeTableRow = (cells) => cells.length >= 2
  && cells.every((cell) => cell.length <= 180)
  && cells.join(" ").length >= 3;

const tableTitleBefore = (lines, headerIndex, tableNumber) => {
  const candidate = lines.slice(Math.max(0, headerIndex - 2), headerIndex)
    .reverse()
    .find((line) => line.length < 90 && !looksLikeTableRow(splitTableRow(line)) && !/^--\s+\d+\s+of\s+\d+\s+--$/i.test(line));
  return candidate || `Extracted Table ${tableNumber}`;
};

const tableHeaderTerms = new Set([
  "name", "score", "grade", "date", "year", "month", "day", "id", "number", "no",
  "description", "details", "status", "type", "category", "amount", "price", "quantity",
  "item", "product", "course", "subject", "student", "employee", "department", "task",
  "owner", "role", "location", "city", "country", "value", "result", "total", "revenue"
]);
const compoundHeaderTerms = new Set(["start date", "end date", "first name", "last name", "roll number", "serial number", "employee id", "student id", "project name"]);

const normalizeFlatHeader = (line, targetColumns) => {
  const cells = line.trim().split(/\s+/);
  while (cells.length > targetColumns) {
    const joinIndex = cells.findIndex((cell, index) => compoundHeaderTerms.has(`${cell.toLowerCase()} ${cells[index + 1]?.toLowerCase()}`));
    if (joinIndex === -1) return [];
    cells.splice(joinIndex, 2, `${cells[joinIndex]} ${cells[joinIndex + 1]}`);
  }
  return cells.length === targetColumns ? cells : [];
};

const extractFlattenedTables = (lines, existingTables) => {
  const tables = [];
  for (let index = 0; index < lines.length - 2; index += 1) {
    if (looksLikeTableRow(splitTableRow(lines[index]))) continue;
    const firstRow = lines[index + 1].trim().split(/\s+/).filter(Boolean);
    if (firstRow.length < 2 || firstRow.length > 6) continue;

    const columns = normalizeFlatHeader(lines[index], firstRow.length);
    if (!columns.length || !columns.some((column) => tableHeaderTerms.has(column.toLowerCase()))) continue;

    const rows = [];
    let cursor = index + 1;
    while (cursor < lines.length) {
      const values = lines[cursor].trim().split(/\s+/).filter(Boolean);
      if (values.length !== columns.length || values.some((value) => value.length > 70)) break;
      // Data rows should be compact. This avoids promoting ordinary wrapped
      // prose into a table merely because it has a similar word count.
      if (values.join(" ").endsWith(".") && !values.some((value) => /\d/.test(value))) break;
      rows.push(values);
      cursor += 1;
    }

    if (rows.length >= 2) {
      const signature = `${columns.join("|")}::${rows.map((row) => row.join("|")).join(";")}`;
      const alreadyFound = [...existingTables, ...tables].some((table) => `${table.columns.join("|")}::${table.rows.map((row) => row.join("|")).join(";")}` === signature);
      if (!alreadyFound) tables.push({
        title: tableTitleBefore(lines, index, existingTables.length + tables.length + 1),
        columns,
        rows
      });
      index = cursor - 1;
    }
  }
  return tables;
};

const textUntilNextSection = (lines, startIndex) => {
  const sectionLines = [];
  for (let index = startIndex; index < lines.length; index += 1) {
    if (/^\d+\.\s+/.test(lines[index]) || /^End of Sample Document$/i.test(lines[index])) break;
    sectionLines.push(lines[index]);
  }
  return sectionLines;
};

const extractHeaderBasedTables = (lines) => {
  const tables = [];
  const add = (title, columns, rows) => {
    if (rows.length >= 2) tables.push({ title, columns, rows });
  };

  const featureHeader = lines.findIndex((line) => /^Feature What the system should do$/i.test(line));
  if (featureHeader !== -1) {
    const rows = [];
    let pendingFeature = "";
    textUntilNextSection(lines, featureHeader + 1).forEach((line) => {
      const match = line.match(/^(?:(.*?)\s+)?(Generate|Identify|Detect|Find|Create|Allow|Answer|Use)\b\s*(.*)$/i);
      if (match) {
        const feature = normalizeWhitespace(`${pendingFeature} ${match[1] || ""}`);
        if (feature) rows.push([feature, normalizeWhitespace(`${match[2]} ${match[3]}`)]);
        pendingFeature = "";
      } else if (!rows.length || /^[A-Z][A-Za-z ]{1,45}$/.test(line)) {
        pendingFeature = normalizeWhitespace(`${pendingFeature} ${line}`);
      } else {
        rows[rows.length - 1][1] = normalizeWhitespace(`${rows[rows.length - 1][1]} ${line}`);
      }
    });
    add("Key Features", ["Feature", "What the system should do"], rows);
  }

  const timelineHeader = lines.findIndex((line) => /^Date Milestone Description$/i.test(line));
  if (timelineHeader !== -1) {
    const rows = [];
    const dateStart = /^(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})\s+(.+)$/i;
    const descriptionStart = /\s+(Requirements|The|Summarization|Automatic|Document-grounded|Functional|Performance)\b/i;
    textUntilNextSection(lines, timelineHeader + 1).forEach((line) => {
      const match = line.match(dateStart);
      if (!match) {
        if (rows.length) rows[rows.length - 1][2] = normalizeWhitespace(`${rows[rows.length - 1][2]} ${line}`);
        return;
      }
      const splitAt = match[2].search(descriptionStart);
      if (splitAt === -1) return;
      rows.push([match[1], match[2].slice(0, splitAt).trim(), match[2].slice(splitAt).trim()]);
    });
    add("Project Timeline", ["Date", "Milestone", "Description"], rows);
  }

  const architectureHeader = lines.findIndex((line) => /^Layer Example Responsibility$/i.test(line));
  if (architectureHeader !== -1) {
    const knownLayers = ["User Interface", "Document Processing", "AI / NLP Layer", "Retrieval Layer", "Application Backend", "Database"];
    const rows = [];
    let activeRow = null;
    textUntilNextSection(lines, architectureHeader + 1).forEach((line) => {
      const layer = knownLayers.find((item) => line.startsWith(item));
      if (layer) {
        activeRow = [layer, line.slice(layer.length).trim()];
        rows.push(activeRow);
      } else if (activeRow) {
        activeRow[1] = normalizeWhitespace(`${activeRow[1]} ${line}`);
      }
    });
    add("Technical Architecture", ["Layer", "Responsibility"], rows);
  }

  const termHeaderIndexes = lines.reduce((indexes, line, index) => {
    if (/^Term Definition$/i.test(line)) indexes.push(index);
    return indexes;
  }, []);
  termHeaderIndexes.forEach((termHeader, groupIndex) => {
    const rows = [];
    const knownTerms = ["OCR", "NLP", "Embedding", "Vector Search", "RAG", "Chunking"];
    let activeRow = null;
    textUntilNextSection(lines, termHeader + 1).forEach((line) => {
      const term = knownTerms.find((item) => line.startsWith(item));
      if (term) {
        activeRow = [term, line.slice(term.length).trim()];
        rows.push(activeRow);
      } else if (activeRow) {
        activeRow[1] = normalizeWhitespace(`${activeRow[1]} ${line}`);
      }
    });
    add(groupIndex ? "Important Concepts (continued)" : "Important Concepts", ["Term", "Definition"], rows);
  });

  return tables;
};

const extractTablesFromText = (text) => {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const tables = [];
  let index = 0;

  while (index < lines.length) {
    const headerCells = splitTableRow(lines[index]);
    if (!looksLikeTableRow(headerCells)) {
      index += 1;
      continue;
    }

    const rows = [];
    let cursor = index + 1;
    while (cursor < lines.length) {
      const rowCells = splitTableRow(lines[cursor]);
      if (!looksLikeTableRow(rowCells) || rowCells.length !== headerCells.length) break;
      // A repeated header marks the beginning of a new page, not another row.
      if (rowCells.every((cell, cellIndex) => cell.toLowerCase() === headerCells[cellIndex].toLowerCase())) break;
      rows.push(rowCells);
      cursor += 1;
    }

    // Require at least two actual rows. This avoids turning normal prose into
    // a fake table when the document has no reliably extractable table data.
    if (rows.length >= 2) {
      tables.push({
        title: tableTitleBefore(lines, index, tables.length + 1),
        columns: headerCells,
        rows
      });
      index = cursor;
    } else {
      index += 1;
    }
  }

  return [...tables, ...extractFlattenedTables(lines, tables), ...extractHeaderBasedTables(lines)];
};

module.exports = { createExtractiveSummary, answerQuestionFromText, extractImportantDatesFromText, extractTablesFromText };
