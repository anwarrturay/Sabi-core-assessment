# B1 — Document Ingestion Endpoint

**Track 2 · Backend & APIs**

A Node.js + Express endpoint that accepts a PDF upload, extracts the document's **title, abstract, authors, and year**, and stores the result in PostgreSQL via Prisma.

## Design highlights

- **Idempotent by DOI.** If a document with the same DOI already exists, the endpoint returns the existing record with a `200` instead of creating a duplicate; genuinely new documents are created and returned with a `201`. The DOI column is enforced `unique` at the database level, so the guarantee holds even under concurrent uploads, not just in application logic.
- **PDF extraction.** Text is pulled from the upload (using a Node PDF library) and the four fields are parsed from it, with sensible fallbacks when a field can't be located.
- **Tested.** Includes tests (node:test / Vitest) covering a successful extraction-and-store path and the duplicate-DOI path that returns the existing record.

## Run

```bash
npm install
```

Create `.env` with your database connection string:

```
DATABASE_URL="postgresql://user:password@localhost:5432/sabicore"
```

Apply the schema and start the server:

```bash
npx prisma migrate dev --name init   # creates tables from prisma/schema.prisma
npm start                            # starts Express, default http://localhost:3000
```

## Try it

A sample mock PDF is included under `mock/`:

```bash
curl -F "file=@./mock/sample-study.pdf" http://localhost:3000/documents
```

Run the tests:

```bash
npm test
```

## Mock data

`mock/sample-study.pdf` is a generated sample document for testing ingestion, clearly labelled as mock. It does not represent a real paper.

## What I'd improve with more time

PDF field extraction is inherently messy, so I'd replace the heuristic parsing with a more robust approach (structured extraction, e.g. via an LLM with a strict schema, feeding into the same idempotency check) and record a confidence flag per field so low-confidence extractions can be queued for human review. I'd also add validation and size/type limits on the upload, richer error responses, and tests for malformed or non-academic PDFs and missing-DOI documents.