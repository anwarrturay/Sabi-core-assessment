import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { InMemoryDocumentRepository } from "../documents/repository.js";
import type { Extractor } from "../controllers/pdf.js";
import { buildFakePaperPdf } from "./helpers.js";

const stubExtractor: Extractor = async () => ({
  doi: "10.9999/dedup.test",
  title: "Stub title",
  abstract: "Stub abstract",
  authors: ["Test Author"],
  year: 2024,
  rawText: "stub raw text",
});

describe("POST /documents", () => {
  let repo: InMemoryDocumentRepository;
  beforeEach(() => { repo = new InMemoryDocumentRepository(); });

  it("creates a new document (201) then returns the existing one (200) for the same DOI", async () => {
    const app = createApp({ repo, extractor: stubExtractor });
    const pdf = await buildFakePaperPdf();

    const first = await request(app)
      .post("/documents")
      .attach("file", pdf, { filename: "paper.pdf", contentType: "application/pdf" });
    expect(first.status).toBe(201);
    expect(first.body.created).toBe(true);

    const second = await request(app)
      .post("/documents")
      .attach("file", pdf, { filename: "paper-again.pdf", contentType: "application/pdf" });
    expect(second.status).toBe(200);
    expect(second.body.created).toBe(false);
    expect(second.body.document.id).toBe(first.body.document.id);
    expect(repo.createCalls).toBe(1);
  });

  it("rejects a request with no file (400)", async () => {
    const app = createApp({ repo, extractor: stubExtractor });
    expect((await request(app).post("/documents")).status).toBe(400);
  });

  it("rejects a non-PDF upload (415)", async () => {
    const app = createApp({ repo, extractor: stubExtractor });
    const res = await request(app)
      .post("/documents")
      .attach("file", Buffer.from("hello"), { filename: "notes.txt", contentType: "text/plain" });
    expect(res.status).toBe(415);
  });
});