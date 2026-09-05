import front from "@/content/books/front-matter.json";
import ch01 from "@/content/books/ch01.json";
import ch02 from "@/content/books/ch02.json";

// Public presentation only: the release-package sources remain unchanged.
const internalEditionFields = new Set(["prod_p0008", "prod_p0009", "prod_p0010"]);
const accessibleHeadings = new Set([ch01, ch02].flatMap(part =>
  part.paragraphs.filter(p => p.style === "Heading1" || p.style === "Heading2").map(p => p.id)
));
export const publicPreview = [front, ch01, ch02].map(part => ({
  ...part,
  paragraphs: part.paragraphs.filter(p => !internalEditionFields.has(p.id)).flatMap(p => {
    if (p.style !== "TOCChapter" && p.style !== "TOCSection") return [p];
    const links = p.links.filter(link => accessibleHeadings.has(link.target));
    return links.length ? [{ ...p, text: links[0].text, links }] : [];
  }),
}));
