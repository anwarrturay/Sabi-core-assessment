import type { PrismaClient } from "../generated/prisma/client";

// The document input type
export interface DocumentInput {
  doi: string | null;
  title: string;
  abstract: string | null;
  authors: string[];
  year: number | null;
  sourceFile: string | null;
  rawText: string | null;
}

// The stored document extending types of documentInput.
export interface StoredDocument extends DocumentInput {
  id: string;
  createdAt: Date;
}

export interface DocumentRepository {
  findByDoi(doi: string): Promise<StoredDocument | null>;
  create(input: DocumentInput): Promise<StoredDocument>;
}

export class PrismaDocumentRepository implements DocumentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findByDoi(doi: string): Promise<StoredDocument | null> {
    return this.prisma.document.findUnique({ where: { doi } });
  }

  create(input: DocumentInput): Promise<StoredDocument> {
    return this.prisma.document.create({ data: input });
  }
}

export class InMemoryDocumentRepository implements DocumentRepository {
  private readonly byId = new Map<string, StoredDocument>();
  public createCalls = 0;

  async findByDoi(doi: string): Promise<StoredDocument | null> {
    for (const doc of this.byId.values()) {
      if (doc.doi === doi) return doc;
    }
    return null;
  }

  async create(input: DocumentInput): Promise<StoredDocument> {
    this.createCalls += 1;
    const doc: StoredDocument = {
      ...input,
      id: `mem_${this.byId.size + 1}`,
      createdAt: new Date(),
    };
    this.byId.set(doc.id, doc);
    return doc;
  }
}