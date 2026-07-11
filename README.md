# Sabi-core-assessment
A Project assessment for sabi-core
# Sabi Core — Software Engineer Role

My submission answers **three questions, one from each track**:

| ID | Track | Question |
|----|-------|----------|
| **A1** | AI Integration | Abstract screening assistant — a Node function that screens an abstract against supplied criteria via the OpenAI API, returns a structured `include` / `exclude` / `uncertain` decision with a one-sentence reason, and logs the tool, model version, and exact prompt for every call. |
| **F1** | Frontend | Study screener interface — a React (JSX) + Vite component for reviewing 50 studies, reading abstracts, and marking each `include` / `exclude` / `flag for discussion`, with decisions persisted in `localStorage` and full keyboard accessibility. |
| **B1** | Backend & APIs | Document ingestion endpoint — a Node + Express route that accepts a PDF upload, extracts title / abstract / authors / year, and stores it in PostgreSQL via Prisma, returning the existing record instead of a duplicate when the DOI already exists. |

Stack throughout follows the Sabi Core stack: React (JSX) + Vite, Node.js + Express + Prisma + PostgreSQL, and OpenAI for LLM calls.

## Repository layout

```
.
├── A1/          # Abstract screening assistant (Node)
├── F1/          # Study screener interface (React + Vite)
├── B1/          # Document ingestion endpoint (Express + Prisma + PostgreSQL)
└── README.md    # this file
```

Each folder is self-contained with its own `package.json`, its own `README.md` (including a short "what I'd improve with more time" note), and any mock data clearly labelled as mock. `cd` into a folder and install its dependencies before running.

## Prerequisites

- **Node.js 18+** and **npm** (`node -v`, `npm -v`)
- **A1:** an OpenAI API key with billing/credits enabled. A key alone is not enough — the account needs a positive credit balance or the API returns `429 insufficient_quota`. Create a key and add the $5 minimum at [platform.openai.com](https://platform.openai.com).
- **B1:** a running **PostgreSQL** database and its connection string in `DATABASE_URL`.

---

## A1 — Abstract Screening Assistant

Takes a research abstract and a list of inclusion/exclusion criteria, calls the OpenAI API, and returns a structured decision (`include` / `exclude` / `uncertain`) with a one-sentence reason. The model is constrained to the criteria passed in; an application-layer guard rejects any criterion the model references that was not supplied, downgrading such cases to `uncertain` for human review. Every call is recorded in an append-only audit log (`ai-audit.log.jsonl`) capturing the tool, the requested and resolved model version, the exact prompt, timing, and token usage — matching the responsible-AI requirement to record which tool, version, and prompt was used.

```bash
cd A1
npm install
```

Create `A1/.env`:

```
OPENAI_API_KEY=sk-proj-...your key...
```

Run:

```bash
npm start        # screens the sample abstract in run.mjs and prints the decision
npm run dev      # same, re-running on save (nodemon)
```

Edit the `abstract` and `criteria` at the top of `run.mjs` to screen your own content. The full audit record is appended to `A1/ai-audit.log.jsonl`.

---

## F1 — Study Screener Interface

A React (JSX) component running under Vite that lets a reviewer scroll through 50 studies, read each abstract, and mark it `include`, `exclude`, or `flag for discussion`. Decisions persist across page refreshes via `localStorage`, and the interface is fully keyboard-operable — a reviewer can move between studies and record decisions without a mouse. The 50 studies are supplied as a mock JSON file (labelled as mock).

```bash
cd F1
npm install
npm run dev      # starts the Vite dev server, typically http://localhost:5173
```

Production build (optional):

```bash
npm run build    # outputs to dist/
npm run preview  # serves the built app locally
```

**Keyboard controls:** arrow keys (or J/K) move between studies; I / E / F record include / exclude / flag on the focused study. All controls are also reachable by Tab and operable with Enter/Space.

---

## B1 — Document Ingestion Endpoint

A Node.js + Express endpoint that accepts a PDF upload, extracts the title, abstract, authors, and year from the document, and stores the result in PostgreSQL via Prisma. Ingestion is idempotent by DOI: if a document with the same DOI already exists, the existing record is returned instead of creating a duplicate. Includes tests (node:test / Vitest) covering successful extraction and the duplicate-DOI path.

```bash
cd B1
npm install
```

Create `B1/.env` with your database connection string:

```
DATABASE_URL="postgresql://user:password@localhost:5432/sabicore"
```

Set up the database schema and start the server:

```bash
npx prisma migrate dev --name init   # creates the tables from the Prisma schema
npm start                            # starts the Express server, default http://localhost:3000
```

Try it with a PDF (a sample mock PDF is included):

```bash
curl -F "file=@./mock/sample-study.pdf" http://localhost:3000/documents
```

Run the tests:

```bash
npm test
```

---

## Notes

- All generated datasets (F1's studies, B1's sample PDF) are mock data and are labelled as such in their folders.
- Files in A1 use the `.mjs` extension, so they run as ES modules regardless of the `package.json` `type` field.
- A root `.gitignore` excludes `node_modules/`, `.env`, `dist/`, and `*.log`.
