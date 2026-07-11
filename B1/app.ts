import express, { Application, NextFunction, Request, Response } from "express";
import multer from "multer";
import type { Extractor } from "./controllers/pdf.js";
import type { DocumentRepository } from "./documents/repository.js";
import { createDocumentsRouter } from "./routes/documents.js";

export interface AppDeps {
  repo: DocumentRepository;
  extractor: Extractor;
}

export function createApp({ repo, extractor }: AppDeps): Application {
  const app = express();
  app.use(express.json());
  app.use("/api/v1/documents", createDocumentsRouter({ repo, extractor }));

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof multer.MulterError) {
      const status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
      return res.status(status).json({ error: err.message });
    }
    console.error("Unhandled error:", err);
    return res.status(500).json({ error: "Internal server error" });
  });

  return app;
}