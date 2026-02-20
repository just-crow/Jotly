/**
 * Utilities for detecting organization email domains.
 *
 * Rule: if the email domain is NOT in the personal-provider list,
 * the user is considered part of an organization identified by that domain.
 *
 * e.g.  "mak@gmail.com"  → null (personal)
 *       "mak@mit.edu"    → "mit.edu" (org)
 *       "alice@apple.com"→ "apple.com" (org)
 */

/** Common personal / free-tier email providers that are NOT organizations. */
const PERSONAL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "yahoo.co.in",
  "ymail.com",
  "hotmail.com",
  "hotmail.co.uk",
  "hotmail.fr",
  "outlook.com",
  "outlook.fr",
  "live.com",
  "live.co.uk",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "protonmail.com",
  "protonmail.ch",
  "proton.me",
  "pm.me",
  "mail.com",
  "zoho.com",
  "zohomail.com",
  "tutanota.com",
  "tutanota.de",
  "tuta.io",
  "fastmail.com",
  "fastmail.fm",
  "hey.com",
  "inbox.com",
  "gmx.com",
  "gmx.net",
  "gmx.de",
  "web.de",
  "qq.com",
  "163.com",
  "126.com",
  "sina.com",
  "rediffmail.com",
  "rocketmail.com",
]);

/**
 * Returns the domain part of the email if it belongs to an organization,
 * or null if it is a personal / free-tier provider.
 */
export function getOrgDomain(email: string): string | null {
  const domain = email.split("@")[1]?.toLowerCase().trim();
  if (!domain) return null;
  if (PERSONAL_DOMAINS.has(domain)) return null;
  return domain;
}

/**
 * Derives a human-readable display name from a domain.
 *
 * Examples:
 *   "mit.edu"          → "MIT"
 *   "harvard.edu"      → "Harvard"
 *   "stanford.edu"     → "Stanford"
 *   "apple.com"        → "Apple"
 *   "inria.fr"         → "INRIA"
 *   "accenture.co.uk"  → "Accenture"
 */
export function getOrgDisplayName(domain: string): string {
  // Take only the SLD (e.g. "mit" from "mit.edu", "accenture" from "accenture.co.uk")
  const parts = domain.split(".");
  const sld = parts[0] ?? domain;

  // Short names (≤ 5 chars) that look like acronyms → all uppercase
  if (sld.length <= 5 && /^[a-z]+$/.test(sld)) {
    return sld.toUpperCase();
  }

  // Everything else → capitalize first letter
  return sld.charAt(0).toUpperCase() + sld.slice(1);
}

/**
 * Returns true when the email belongs to an organization (non-personal domain).
 */
export function isOrgEmail(email: string): boolean {
  return getOrgDomain(email) !== null;
}
