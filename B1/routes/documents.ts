import { Router } from "express";
import upload from "../middleware/multerConfig.js";
import type { Extractor } from "../controllers/pdf.js";
import type { DocumentRepository } from "../documents/repository.js";
import { ingestDocument } from "../documents/service.js";

// type for document router
export interface DocumentsRouterDeps {
  repo: DocumentRepository;
  extractor: Extractor;
}

// Router for creation of document.
export function createDocumentsRouter({ repo, extractor }: DocumentsRouterDeps): Router {
  const router = Router();

  router.post("/", upload.single("file"), async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'No PDF uploaded. Send multipart/form-data with a "file" field.',
        });
      }
      if (req.file.mimetype !== "application/pdf") {
        return res.status(415).json({ error: "Only application/pdf uploads are supported." });
      }

      const { document, created } = await ingestDocument(
        { buffer: req.file.buffer, filename: req.file.originalname ?? null },
        { repo, extractor }
      );

      return res.status(created ? 201 : 200).json({ created, document });
    } catch (err) {
      return next(err);
    }
  });

  return router;
}