import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize HTML to prevent XSS attacks.
 * Allows safe HTML tags used in TipTap editor output while stripping
 * dangerous elements like <script>, event handlers, etc.
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      // Structure
      "h1", "h2", "h3", "h4", "h5", "h6",
      "p", "br", "hr", "div", "span",
      // Inline
      "strong", "b", "em", "i", "u", "s", "del", "mark", "sub", "sup",
      // Lists
      "ul", "ol", "li",
      // Code
      "pre", "code",
      // Links & media
      "a", "img",
      // Table
      "table", "thead", "tbody", "tr", "th", "td",
      // Block
      "blockquote", "figure", "figcaption",
    ],
    ALLOWED_ATTR: [
      "href", "src", "alt", "title", "class", "id",
      "target", "rel",
      "width", "height",
      "colspan", "rowspan",
      // Data attrs used by TipTap
      "data-type", "data-language",
    ],
    // Force all links to open safely
    ADD_ATTR: ["target"],
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form", "input", "textarea", "select"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur"],
  });
}
