/**
 * Whitespace-normalized substring matching for locating a chat "chunk" back
 * inside the page text it was retrieved from.
 *
 * The backend chunker (memory-bank-service/src/services/chunker.ts) only
 * ever cuts and re-glues text at whitespace boundaries, always rejoining
 * with a single space — it never rewrites a non-whitespace character. So a
 * chunk's content is always a whitespace-collapsed, verbatim-in-order
 * substring of the page it came from, and a whitespace-normalized exact
 * match is sufficient (no fuzzy/edit-distance search needed).
 */

export interface NormalizedIndex {
  normalized: string;
  /** map[i] = index into the original `source` string of normalized[i] */
  map: number[];
}

/**
 * Collapses whitespace runs to a single space while recording, for each
 * kept character, its index in the original string — a plain
 * `replace(/\s+/g, ' ')` would break that correspondence.
 */
export function buildNormalizedIndex(source: string): NormalizedIndex {
  let normalized = '';
  const map: number[] = [];
  let inWs = false;

  for (let i = 0; i < source.length; i++) {
    const ch = source[i] as string;
    if (/\s/.test(ch)) {
      if (!inWs && normalized.length > 0) {
        normalized += ' ';
        map.push(i);
      }
      inWs = true;
    } else {
      normalized += ch;
      map.push(i);
      inWs = false;
    }
  }

  return { normalized, map };
}

/**
 * Locates `chunkContent` inside `sourceText`, returning the exclusive
 * `[start, end)` character range in the original (un-normalized)
 * `sourceText` that the chunk maps to, or `null` if not found.
 */
export function locateChunk(
  sourceText: string,
  chunkContent: string,
): { start: number; end: number } | null {
  const src = buildNormalizedIndex(sourceText);
  const chk = buildNormalizedIndex(chunkContent);

  if (chk.normalized.length === 0) return null;

  const idx = src.normalized.indexOf(chk.normalized);
  if (idx === -1) return null;

  const start = src.map[idx] as number;
  const end = (src.map[idx + chk.normalized.length - 1] as number) + 1;
  return { start, end };
}

export interface ItemRange {
  start: number;
  end: number;
}

export interface PageText {
  pageText: string;
  itemRanges: ItemRange[];
}

/**
 * Reconstructs a PDF page's text from pdf.js text-content items, mirroring
 * the backend's extractPdfPages join logic exactly (items joined with no
 * separator), while recording each item's own offset range within the
 * resulting string.
 */
export function buildPageText(items: { str: string }[]): PageText {
  let pageText = '';
  const itemRanges: ItemRange[] = [];

  for (const item of items) {
    const start = pageText.length;
    pageText += item.str;
    itemRanges.push({ start, end: pageText.length });
  }

  return { pageText, itemRanges };
}

/** Whether two half-open ranges [start, end) overlap. */
export function rangesOverlap(a: ItemRange, b: { start: number; end: number }): boolean {
  return a.end > b.start && a.start < b.end;
}
