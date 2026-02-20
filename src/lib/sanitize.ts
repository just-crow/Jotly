/**
 * Lightweight server-safe HTML sanitizer.
 * Strips dangerous tags/attributes without requiring a DOM (no JSDOM).
 * Used only in API routes where we construct HTML from trusted
 * sources (PDF text, mammoth output, markdown conversion).
 *
 * For client-side rendering of arbitrary user HTML, use the
 * SafeHtmlContent component (which uses browser DOMPurify).
 */
const FORBIDDEN_TAGS = ["script", "style", "iframe", "object", "embed", "form", "input", "textarea", "select", "link"];
const EVENT_ATTR_RE = /\s+on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi;

export function sanitizeHtml(html: string): string {
  let clean = html;
  // Strip forbidden tags and their content
  for (const tag of FORBIDDEN_TAGS) {
    const openClose = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, "gi");
    clean = clean.replace(openClose, "");
    const selfClose = new RegExp(`<${tag}\\b[^>]*/?>`, "gi");
    clean = clean.replace(selfClose, "");
  }
  // Strip event-handler attributes (onclick, onerror, etc.)
  clean = clean.replace(EVENT_ATTR_RE, "");
  // Strip javascript: hrefs
  clean = clean.replace(/href\s*=\s*["']?\s*javascript:/gi, 'href="');
  return clean;
}
