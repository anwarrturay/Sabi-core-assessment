import PDFDocument from "pdfkit";

export interface FakePaperOptions {
  title?: string;
  author?: string;
  bodyTitle?: string;
  authorsLine?: string;
  doi?: string;
  year?: number;
  abstract?: string;
}

export function buildFakePaperPdf(opts: FakePaperOptions = {}): Promise<Buffer> {
  const {
    title = "Bed nets and malaria incidence in Sierra Leone",
    author = "Aminata Kamara, Kwame Osei",
    bodyTitle = "Effect of bed nets on malaria incidence in Sierra Leone",
    authorsLine = "Aminata Kamara, Kwame Osei, Fatou Diallo",
    doi = "10.1234/sabi.2021.0042",
    year = 2021,
    abstract = "We conducted a cluster-randomised trial across 30 districts to evaluate bed net distribution. Malaria incidence fell substantially in the intervention arm.",
  } = opts;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ info: { Title: title, Author: author } });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(16).text(bodyTitle);
    doc.moveDown().fontSize(10).text(authorsLine);
    doc.moveDown().text(`https://doi.org/${doi}`);
    doc.moveDown().text("Abstract");
    doc.text(`${abstract} The study ran in ${year}.`);
    doc.moveDown().text("Introduction");
    doc.text("Malaria remains a leading cause of under-five mortality.");
    doc.end();
  });
}