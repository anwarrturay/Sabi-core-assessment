import type { Extractor } from "../controllers/pdf.js";
import type { DocumentRepository, StoredDocument } from "./repository.js";

export interface IngestInput {
  buffer: Buffer;
  filename: string | null;
}

export interface IngestDeps {
  repo: DocumentRepository;
  extractor: Extractor;
}

export interface IngestResult {
  document: StoredDocument;
  created: boolean;
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { code?: string }).code === "P2002"
  );
}

// the function to flattened the document and return the meta data.
export async function ingestDocument(
  input: IngestInput,
  { repo, extractor }: IngestDeps,
): Promise<IngestResult> {
  const meta = await extractor(input.buffer);

  if (meta.doi) {
    const existing = await repo.findByDoi(meta.doi);
    if (existing) return { document: existing, created: false };
  }

  try {
    const document = await repo.create({
      doi: meta.doi,
      title: meta.title,
      abstract: meta.abstract,
      authors: meta.authors,
      year: meta.year,
      sourceFile: input.filename,
      rawText: meta.rawText,
    });
    return { document, created: true };
  } catch (err) {
    if (isUniqueViolation(err) && meta.doi) {
      const existing = await repo.findByDoi(meta.doi);
      if (existing) return { document: existing, created: false };
    }
    throw err;
  }
}
