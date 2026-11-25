import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import * as cheerio from "cheerio";

const PUBLIC_ROOT = path.resolve(process.cwd(), "public");
const DEFAULT_TEMPLATE_REL = path.join("templates", "submission-approved-template.docx");

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Normalizes a stored filepath or full `/repository/...` URL to a relative path under `public/`.
 */
export function normalizeStoredFilepath(input?: string | null): string {
  if (!input) return "";
  let clean = input.trim();
  const repoMarker = "/repository/";
  const repoIdx = clean.indexOf(repoMarker);
  if (repoIdx !== -1) {
    clean = clean.slice(repoIdx + repoMarker.length);
  } else if (/^https?:\/\//i.test(clean)) {
    try {
      clean = new URL(clean).pathname;
    } catch {
      // keep as-is if URL parsing fails
    }
  }
  return clean.replace(/^\/+/, "");
}

/**
 * Safely resolves a relative filepath or `/repository/...` URL inside `public/`.
 */
export function resolvePublicDocxPath(filepathOrUrl?: string | null): string {
  const rel = normalizeStoredFilepath(filepathOrUrl);
  const target = rel ? path.resolve(PUBLIC_ROOT, rel) : path.resolve(PUBLIC_ROOT, DEFAULT_TEMPLATE_REL);

  if (target !== PUBLIC_ROOT && !target.startsWith(PUBLIC_ROOT + path.sep)) {
    throw new Error("Akses path dokumen tidak valid.");
  }

  return target;
}

export function getDefaultTemplatePath(): string {
  return path.resolve(PUBLIC_ROOT, DEFAULT_TEMPLATE_REL);
}

function cleanTemplatePlaceholders(
  text: string,
  replacements?: Record<string, string>
): string {
  let out = text;

  if (replacements) {
    for (const [key, val] of Object.entries(replacements)) {
      if (val !== undefined && val !== null && val !== "") {
        out = out.replace(new RegExp(`\\{${key}\\}`, "g"), val);
      }
    }
  }

  // Replace docxtemplater loop blocks so the web editor displays readable editable prompts.
  out = out
    .replace(/\{#list_consider\}[\s\S]*?\{\/list_consider\}/g, "a. Bahwa ... (isi poin menimbang)")
    .replace(/\{#list_observe\}[\s\S]*?\{\/list_observe\}/g, "1. Undang-Undang ... (isi dasar mengingat)")
    .replace(/\{#list_decide\}[\s\S]*?\{\/list_decide\}/g, "KESATU: ... (isi diktum menetapkan)");

  return out;
}

function renderRunHtml($: cheerio.CheerioAPI, runEl: any, replacements?: Record<string, string>): string {
  const $run = $(runEl);
  const rawText = $run.find("w\\:t").text();
  const hasBreak = $run.find("w\\:br").length > 0;
  const text = cleanTemplatePlaceholders(rawText, replacements);

  if (!text && !hasBreak) return "";

  let html = escapeHtml(text);
  const rPr = $run.children("w\\:rPr");
  const isBold = rPr.children("w\\:b").length > 0 && rPr.children("w\\:b").attr("w:val") !== "0";
  const isItalic = rPr.children("w\\:i").length > 0 && rPr.children("w\\:i").attr("w:val") !== "0";
  const uAttr = rPr.children("w\\:u").attr("w:val");
  const isUnderline = rPr.children("w\\:u").length > 0 && uAttr !== "none";

  if (isUnderline) html = `<u>${html}</u>`;
  if (isItalic) html = `<em>${html}</em>`;
  if (isBold) html = `<strong>${html}</strong>`;
  if (hasBreak) html += "<br>";

  return html;
}

function renderParagraphHtml(
  $: cheerio.CheerioAPI,
  pEl: any,
  replacements?: Record<string, string>
): { html: string; isListItem: boolean } {
  const $p = $(pEl);
  const pPr = $p.children("w\\:pPr");
  const styleVal = pPr.children("w\\:pStyle").attr("w:val") || "";
  const jcVal = pPr.children("w\\:jc").attr("w:val") || "";
  const isListItem = pPr.children("w\\:numPr").length > 0;

  let inner = "";
  $p.children().each((_idx, child) => {
    if (child.tagName === "w:r") {
      inner += renderRunHtml($, child, replacements);
    } else if (child.tagName === "w:hyperlink") {
      $(child)
        .children("w\\:r")
        .each((_hIdx, hRun) => {
          inner += renderRunHtml($, hRun, replacements);
        });
    }
  });

  if (!inner.trim()) {
    // Preserve blank spacing lines in templates
    return { html: "<p></p>", isListItem: false };
  }

  const align =
    jcVal === "center" || jcVal === "right" || jcVal === "left" || jcVal === "both"
      ? jcVal === "both"
        ? "justify"
        : jcVal
      : "";
  const styleAttr = align ? ` style="text-align: ${align}"` : "";

  if (isListItem) {
    return { html: `<li${styleAttr}>${inner}</li>`, isListItem: true };
  }

  if (/Heading1/i.test(styleVal)) return { html: `<h1${styleAttr}>${inner}</h1>`, isListItem: false };
  if (/Heading2/i.test(styleVal)) return { html: `<h2${styleAttr}>${inner}</h2>`, isListItem: false };
  if (/Heading3/i.test(styleVal)) return { html: `<h3${styleAttr}>${inner}</h3>`, isListItem: false };

  return { html: `<p${styleAttr}>${inner}</p>`, isListItem: false };
}

function renderTableHtml(
  $: cheerio.CheerioAPI,
  tblEl: any,
  replacements?: Record<string, string>
): string {
  const rowsHtml: string[] = [];

  $(tblEl)
    .children("w\\:tr")
    .each((_rIdx, trEl) => {
      const cellsHtml: string[] = [];
      $(trEl)
        .children("w\\:tc")
        .each((_cIdx, tcEl) => {
          const parts: string[] = [];
          $(tcEl)
            .children("w\\:p")
            .each((_pIdx, pEl) => {
              const { html } = renderParagraphHtml($, pEl, replacements);
              parts.push(html);
            });
          cellsHtml.push(`<td>${parts.join("") || "<p></p>"}</td>`);
        });
      rowsHtml.push(`<tr>${cellsHtml.join("")}</tr>`);
    });

  return `<table><tbody>${rowsHtml.join("")}</tbody></table>`;
}

/**
 * Extracts editable semantic HTML from a `.docx` file using PizZip + cheerio.
 */
export function docxToHtml(
  docxPath: string,
  replacements?: Record<string, string>
): string {
  if (!fs.existsSync(docxPath)) {
    throw new Error("Berkas template/dokumen .docx tidak ditemukan di server.");
  }

  const content = fs.readFileSync(docxPath, "binary");
  const zip = new PizZip(content);
  const docXmlFile = zip.file("word/document.xml");

  if (!docXmlFile) {
    throw new Error("Format berkas .docx tidak valid (word/document.xml tidak ditemukan).");
  }

  const $ = cheerio.load(docXmlFile.asText(), { xmlMode: true });
  const blocks: string[] = [];
  let pendingListItems: string[] = [];

  const flushList = () => {
    if (pendingListItems.length > 0) {
      blocks.push(`<ul>${pendingListItems.join("")}</ul>`);
      pendingListItems = [];
    }
  };

  $("w\\:body")
    .children()
    .each((_idx, el) => {
      if (el.tagName === "w:p") {
        const { html, isListItem } = renderParagraphHtml($, el, replacements);
        if (isListItem) {
          pendingListItems.push(html);
        } else {
          flushList();
          blocks.push(html);
        }
      } else if (el.tagName === "w:tbl") {
        flushList();
        blocks.push(renderTableHtml($, el, replacements));
      }
    });

  flushList();

  return blocks.join("\n") || "<p></p>";
}

interface TextStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

function collectRunsFromInline(
  $: cheerio.CheerioAPI,
  node: any,
  inherited: TextStyle = {}
): string[] {
  const runs: string[] = [];

  if (node.type === "text") {
    const raw = node.data ?? "";
    if (raw.length > 0) {
      const rPrParts = [
        `<w:rFonts w:ascii="Bookman Old Style" w:hAnsi="Bookman Old Style"/>`,
        `<w:sz w:val="22"/>`,
        `<w:szCs w:val="22"/>`,
      ];
      if (inherited.bold) rPrParts.push(`<w:b/>`);
      if (inherited.italic) rPrParts.push(`<w:i/>`);
      if (inherited.underline) rPrParts.push(`<w:u w:val="single"/>`);

      runs.push(
        `<w:r><w:rPr>${rPrParts.join("")}</w:rPr><w:t xml:space="preserve">${escapeXml(
          raw
        )}</w:t></w:r>`
      );
    }
    return runs;
  }

  if (node.type === "tag") {
    const tag = (node.tagName || "").toLowerCase();
    if (tag === "br") {
      runs.push(`<w:r><w:br/></w:r>`);
      return runs;
    }

    const nextStyle: TextStyle = { ...inherited };
    if (tag === "strong" || tag === "b") nextStyle.bold = true;
    if (tag === "em" || tag === "i") nextStyle.italic = true;
    if (tag === "u") nextStyle.underline = true;

    const children = $(node).contents().toArray();
    for (const child of children) {
      runs.push(...collectRunsFromInline($, child, nextStyle));
    }
  }

  return runs;
}

function extractAlign($el: cheerio.Cheerio<any>): string {
  const style = $el.attr("style") || "";
  const match = style.match(/text-align\s*:\s*(left|center|right|justify)/i);
  if (!match) return "";
  const align = match[1].toLowerCase();
  return align === "justify" ? "both" : align;
}

function buildWordParagraph(
  $: cheerio.CheerioAPI,
  el: any,
  opts: { headingLevel?: 1 | 2 | 3; listPrefix?: string; boldAll?: boolean } = {}
): string {
  const $el = $(el);
  const align = extractAlign($el);

  const pPrParts: string[] = [`<w:spacing w:after="120" w:line="276" w:lineRule="auto"/>`];
  if (align) {
    pPrParts.push(`<w:jc w:val="${align}"/>`);
  }

  const runs: string[] = [];
  if (opts.listPrefix) {
    runs.push(
      `<w:r><w:rPr><w:rFonts w:ascii="Bookman Old Style" w:hAnsi="Bookman Old Style"/><w:sz w:val="22"/></w:rPr><w:t xml:space="preserve">${escapeXml(
        opts.listPrefix
      )}</w:t></w:r>`
    );
  }

  const baseStyle: TextStyle = { bold: Boolean(opts.headingLevel || opts.boldAll) };
  for (const child of $el.contents().toArray()) {
    runs.push(...collectRunsFromInline($, child, baseStyle));
  }

  return `<w:p><w:pPr>${pPrParts.join("")}</w:pPr>${runs.join("")}</w:p>`;
}

function buildWordTable($: cheerio.CheerioAPI, tableEl: any): string {
  const rowsXml: string[] = [];

  $(tableEl)
    .find("tr")
    .each((_rIdx, trEl) => {
      const cellsXml: string[] = [];
      $(trEl)
        .children("th, td")
        .each((_cIdx, cellEl) => {
          const isHeader = (cellEl.tagName || "").toLowerCase() === "th";
          const cellParagraphs: string[] = [];
          const blockChildren = $(cellEl).children("p, h1, h2, h3, ul, ol").toArray();

          if (blockChildren.length > 0) {
            for (const block of blockChildren) {
              const bTag = (block.tagName || "").toLowerCase();
              if (bTag === "ul" || bTag === "ol") {
                $(block)
                  .children("li")
                  .each((liIdx, liEl) => {
                    const prefix = bTag === "ol" ? `${liIdx + 1}. ` : "• ";
                    cellParagraphs.push(buildWordParagraph($, liEl, { listPrefix: prefix }));
                  });
              } else {
                cellParagraphs.push(buildWordParagraph($, block, { boldAll: isHeader }));
              }
            }
          } else {
            cellParagraphs.push(buildWordParagraph($, cellEl, { boldAll: isHeader }));
          }

          cellsXml.push(
            `<w:tc><w:tcPr><w:tcBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:left w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:right w:val="single" w:sz="4" w:space="0" w:color="auto"/></w:tcBorders></w:tcPr>${
              cellParagraphs.join("") || "<w:p/>"
            }</w:tc>`
          );
        });

      if (cellsXml.length > 0) {
        rowsXml.push(`<w:tr>${cellsXml.join("")}</w:tr>`);
      }
    });

  return `<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/></w:tblPr>${rowsXml.join("")}</w:tbl>`;
}

/**
 * Generates a valid `.docx` file from HTML while preserving styles, margins, and headers/footers
 * from a base `.docx` template.
 */
export function htmlToDocx({
  html,
  baseDocxPath,
  outputFileName,
}: {
  html: string;
  baseDocxPath?: string;
  outputFileName?: string;
}): string {
  const sourcePath =
    baseDocxPath && fs.existsSync(baseDocxPath) ? baseDocxPath : getDefaultTemplatePath();

  if (!fs.existsSync(sourcePath)) {
    throw new Error("Template dasar .docx tidak ditemukan di server.");
  }

  const content = fs.readFileSync(sourcePath, "binary");
  const zip = new PizZip(content);
  const docFile = zip.file("word/document.xml");

  if (!docFile) {
    throw new Error("Template dasar .docx tidak memiliki word/document.xml.");
  }

  const originalXml = docFile.asText();
  const $doc = cheerio.load(originalXml, { xmlMode: true });
  const sectPrXml = $doc("w\\:body > w\\:sectPr").toString() || "";

  const $html = cheerio.load(`<div id="editor-root">${html || "<p></p>"}</div>`);
  const bodyNodes: string[] = [];

  $html("#editor-root")
    .children()
    .each((_idx, el) => {
      const tag = (el.tagName || "").toLowerCase();
      if (tag === "h1") {
        bodyNodes.push(buildWordParagraph($html, el, { headingLevel: 1 }));
      } else if (tag === "h2") {
        bodyNodes.push(buildWordParagraph($html, el, { headingLevel: 2 }));
      } else if (tag === "h3") {
        bodyNodes.push(buildWordParagraph($html, el, { headingLevel: 3 }));
      } else if (tag === "ul") {
        $html(el)
          .children("li")
          .each((_liIdx, liEl) => {
            bodyNodes.push(buildWordParagraph($html, liEl, { listPrefix: "• " }));
          });
      } else if (tag === "ol") {
        $html(el)
          .children("li")
          .each((liIdx, liEl) => {
            bodyNodes.push(buildWordParagraph($html, liEl, { listPrefix: `${liIdx + 1}. ` }));
          });
      } else if (tag === "table") {
        bodyNodes.push(buildWordTable($html, el));
      } else {
        bodyNodes.push(buildWordParagraph($html, el));
      }
    });

  if (bodyNodes.length === 0) {
    bodyNodes.push("<w:p/>");
  }

  $doc("w\\:body").html(`${bodyNodes.join("")}${sectPrXml}`);
  zip.file("word/document.xml", $doc.xml());

  const fileName = outputFileName || `draft-${Date.now()}.docx`;
  const targetPath = resolvePublicDocxPath(fileName);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });

  const buffer = zip.generate({
    type: "nodebuffer",
    compression: "DEFLATE",
  });
  fs.writeFileSync(targetPath, buffer);

  return fileName;
}
