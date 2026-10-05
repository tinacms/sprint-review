import { colour, CONTENT_WIDTH, SHEET_WIDTH } from "../components/email/theme";

// The sheet is built from react-email primitives with every style inline, so its markup already is
// the email. Copying only has to drop the page's editing hooks, fix column widths and embed images.

const readAsDataUri = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

// Outlook cannot render SVG, so the logos are redrawn as PNGs at twice their displayed size.
const rasterise = (image: HTMLImageElement, width: number, height: number) => {
  const canvas = document.createElement("canvas");
  canvas.width = width * 2;
  canvas.height = height * 2;
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
};

const toDataUri = async (image: HTMLImageElement, width: number, height: number) => {
  if (/\.svg(\?|$)/i.test(image.src)) {
    const png = rasterise(image, width, height);
    if (png) return png;
  }
  const response = await fetch(image.src);
  return readAsDataUri(await response.blob());
};

const whenLoaded = (image: HTMLImageElement) =>
  image.complete && image.naturalWidth
    ? Promise.resolve()
    : new Promise<void>((resolve) => {
        image.addEventListener("load", () => resolve(), { once: true });
        image.addEventListener("error", () => resolve(), { once: true });
        setTimeout(resolve, 10000);
      });

// NOTE: [27 Sep 2026] EK - The one place the copy reads the page: column widths. Outlook desktop lays
// tables out in Word, which sizes unsized columns to their content and breaks words to squeeze them
// (ESTIM / ATE). Writing the browser's widths onto every column makes Word draw the page's layout.
const freezeColumnWidths = (source: HTMLElement, clone: HTMLElement) => {
  // Measure at the email's own width, not however narrow the window happens to be.
  const { maxWidth } = source.style;
  source.style.maxWidth = "none";
  const clonedTables = Array.from(clone.querySelectorAll("table"));
  Array.from(source.querySelectorAll("table")).forEach((table, index) => {
    // The widest row with no spanning cells defines the columns; single-cell layout rows have none.
    const row = Array.from(table.rows)
      .filter((candidate) => Array.from(candidate.cells).every((cell) => cell.colSpan === 1))
      .sort((a, b) => b.cells.length - a.cells.length)[0];
    if (!row || row.cells.length < 2 || !row.getBoundingClientRect().width) return;
    const target = clonedTables[index]?.rows[row.rowIndex];
    // The whole cell, padding included: given only the text width, Outlook desktop still broke a
    // header (PERSO / N). border-box keeps browsers from adding the padding a second time.
    Array.from(row.cells).forEach((cell, column) => {
      const width = Math.round(cell.getBoundingClientRect().width);
      const copy = target?.cells[column];
      if (!copy) return;
      copy.setAttribute("width", String(width));
      copy.style.width = `${width}px`;
      copy.style.boxSizing = "border-box";
    });
  });
  source.style.maxWidth = maxWidth;
};

export async function buildEmailHtml(source: HTMLElement) {
  const clone = source.cloneNode(true) as HTMLElement;
  freezeColumnWidths(source, clone);

  clone.querySelectorAll('[data-copy="skip"]').forEach((element) => element.remove());
  clone.querySelectorAll<HTMLElement>('[data-copy="only"]').forEach((element) => {
    element.style.display = "block";
  });

  const originalImages = Array.from(source.querySelectorAll("img"));
  const clonedImages = Array.from(clone.querySelectorAll("img"));
  await Promise.all(
    originalImages.map(async (image, index) => {
      const target = clonedImages[index];
      await whenLoaded(image);
      // Word sizes an image by its attributes, so a figure gets the column width and its true
      // height; a logo keeps the size it was authored at.
      // A pasted signature's image is often sized only by CSS, and its hidden holder measures 0.
      const styled = /px$/.test(image.style.width) ? parseFloat(image.style.width) : 0;
      const signatureImage = image.closest('[data-copy="only"]') ? image.naturalWidth : 0;
      const authored = Number(image.getAttribute("width")) || styled || signatureImage || CONTENT_WIDTH;
      const width = Math.min(authored, CONTENT_WIDTH);
      const height = image.naturalWidth
        ? Math.round((image.naturalHeight * width) / image.naturalWidth)
        : Number(image.getAttribute("height")) || 0;
      target.setAttribute("width", String(width));
      target.setAttribute("height", String(height));
      target.style.width = `${width}px`;
      target.style.height = `${height}px`;
      try {
        target.setAttribute("src", await toDataUri(image, width, height));
      } catch {
        // An image the browser cannot read back (another origin, no CORS) stays linked, not embedded.
      }
    })
  );

  [clone, ...Array.from(clone.querySelectorAll("*"))].forEach((element) => {
    element.removeAttribute("class");
    element.removeAttribute("id");
    element.removeAttribute("data-tina-field");
    element.removeAttribute("data-copy");
    element.removeAttribute("data-id");
  });

  // Outlook ignores `margin: 0 auto`, so centring is a full-width table with an aligned cell.
  return `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse; background-color: ${colour.paper};"><tbody><tr><td align="center" style="padding: 24px 12px;"><table cellpadding="0" cellspacing="0" border="0" align="center" width="${SHEET_WIDTH}" style="border-collapse: collapse; width: ${SHEET_WIDTH}px;"><tbody><tr><td>${clone.outerHTML}</td></tr></tbody></table></td></tr></tbody></table>`;
}
