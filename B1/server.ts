import { prisma } from './lib/prisma.js'
import { createApp } from './app.js';
import { extractMetadata } from "./controllers/pdf.js";
import { PrismaDocumentRepository } from "./documents/repository.js";


const app = createApp({
  repo: new PrismaDocumentRepository(prisma),
  extractor: extractMetadata,
});

const port = Number(process.env.PORT ?? 3000);
const server = app.listen(port, () => {
  console.log(`B1 ingestion API listening on http://localhost:${port}`);
});

async function shutdown() {
  await prisma.$disconnect();
  server.close(() => process.exit(0));
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);