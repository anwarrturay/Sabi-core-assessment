import { getDocumentProxy, extractText, getMeta } from "unpdf";

export interface ExtractedMetadata {
  doi: string | null;
  title: string;
  abstract: string | null;
  authors: string[];
  year: number | null;
  rawText: string;
}


export type Extractor = (buffer: Buffer | Uint8Array) => Promise<ExtractedMetadata>;


export function normalizeText(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

export function parseDoi(text: string): string | null {
  const match = text.match(/\b10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+/i);
  if (!match) return null;
  return match[0].replace(/[.,;)]+$/, "").toLowerCase();
}

export function parseYear(text: string, now = new Date()): number | null {
  const max = now.getFullYear() + 1;
  const matches = text.match(/\b(?:19|20)\d{2}\b/g);
  if (!matches) return null;

  const counts = new Map<number, number>();
  for (const m of matches) {
    const y = Number(m);
    if (y >= 1900 && y <= max) counts.set(y, (counts.get(y) ?? 0) + 1);
  }
  if (counts.size === 0) return null;

  let best: number | null = null;
  let bestCount = -1;
  for (const [year, count] of counts) {
    if (count > bestCount) {
      best = year;
      bestCount = count;
    }
  }
  return best;
}

const SECTION_AFTER_ABSTRACT =
  /\b(introduction|background|keywords?|methods?|1[.\s]+introduction|©|references)\b/i;

export function parseAbstract(text: string): string | null {
  const idx = text.search(/\babstract\b/i);
  if (idx === -1) return null;

  let rest = text.slice(idx + "abstract".length).replace(/^[:\-\s]+/, "");
  const stop = rest.search(SECTION_AFTER_ABSTRACT);
  if (stop !== -1) rest = rest.slice(0, stop);

  const cleaned = rest.trim();
  return cleaned.length > 0 ? cleaned : null;
}

export function splitAuthors(author: string | null | undefined): string[] {
  if (!author) return [];
  return author
    .split(/,|;|\band\b|&/i)
    .map((a) => a.trim())
    .filter(Boolean);
}

export function parseTitle(text: string, metaTitle?: string | null): string {
  const meta = metaTitle?.trim();
  if (meta && !/^untitled$/i.test(meta)) return meta;

  const beforeAbstract = text.split(/\babstract\b/i)[0] ?? text;
  const words = beforeAbstract.trim().split(/\s+/).slice(0, 20).join(" ");
  return words || "Untitled document";
}

export function parseAuthors(_text: string, metaAuthor?: string | null): string[] {
  return splitAuthors(metaAuthor);
}

// The real extractor: flattened text
export const extractMetadata: Extractor = async (buffer) => {
  const data = new Uint8Array(buffer);
  const pdf = await getDocumentProxy(data);

  const [{ text: rawExtracted }, meta] = await Promise.all([
    extractText(pdf, { mergePages: true }),
    getMeta(pdf),
  ]);

  const text = normalizeText(rawExtracted);
  const info = (meta?.info ?? {}) as { Title?: string; Author?: string };

  return {
    doi: parseDoi(text),
    title: parseTitle(text, info.Title),
    abstract: parseAbstract(text),
    authors: parseAuthors(text, info.Author),
    year: parseYear(text),
    rawText: text,
  };
};