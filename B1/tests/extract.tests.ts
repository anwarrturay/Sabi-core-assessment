import { describe, it, expect } from "vitest";
import {
  parseDoi, parseYear, parseAbstract, parseTitle, splitAuthors, normalizeText, extractMetadata,
} from "../controllers/pdf.js";
import { buildFakePaperPdf } from "./helpers.js";

describe("pure parsers", () => {
  it("extracts a DOI and strips trailing punctuation", () => {
    expect(parseDoi("See https://doi.org/10.1234/sabi.2021.0042.")).toBe("10.1234/sabi.2021.0042");
    expect(parseDoi("no identifier here")).toBeNull();
  });

  it("picks the most frequent plausible year", () => {
    expect(parseYear("published 2021, cohort from 1999, follow-up 2021")).toBe(2021);
    expect(parseYear("no year at all")).toBeNull();
    expect(parseYear("the year 3050", new Date("2026-01-01"))).toBeNull();
  });

  it("captures the abstract up to the next section heading", () => {
    const text = normalizeText("Title X Abstract: This trial reduced incidence. Introduction Malaria is common.");
    expect(parseAbstract(text)).toBe("This trial reduced incidence.");
    expect(parseAbstract("document body without that heading anywhere")).toBeNull();
  });

  it("prefers the metadata title, falls back to leading text", () => {
    expect(parseTitle("some body text Abstract ...", "Real Metadata Title")).toBe("Real Metadata Title");
    expect(parseTitle("A Study Of Something Important Abstract the rest", null)).toContain("A Study Of Something Important");
  });

  it("splits author strings on commas, semicolons and 'and'", () => {
    expect(splitAuthors("Aminata Kamara, Kwame Osei and Fatou Diallo")).toEqual([
      "Aminata Kamara", "Kwame Osei", "Fatou Diallo",
    ]);
    expect(splitAuthors(null)).toEqual([]);
  });
});

describe("extractMetadata (real unpdf round-trip)", () => {
  it("pulls title, authors, doi, year and abstract from a generated PDF", async () => {
    const meta = await extractMetadata(await buildFakePaperPdf());
    expect(meta.doi).toBe("10.1234/sabi.2021.0042");
    expect(meta.year).toBe(2021);
    expect(meta.title).toBe("Bed nets and malaria incidence in Sierra Leone");
    expect(meta.authors).toEqual(["Aminata Kamara", "Kwame Osei"]);
    expect(meta.abstract).toMatch(/cluster-randomised trial/i);
    expect(meta.abstract).not.toMatch(/Introduction/i);
  });
});