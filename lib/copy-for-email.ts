import { colour, CONTENT_WIDTH, FONT, SHEET_WIDTH } from "../components/email/theme";

// The sheet is built from react-email primitives with every style inline, so its markup already is
// the email. Copying only has to drop the page's editing hooks, fix column widths and embed images.

const readAsDataUri = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

// Outlook cannot render SVG, so the logos are redrawn as PNGs at twice their displayed size. A
// background colour is painted in first, for an image that sits on a dark band.
const rasterise = (image: HTMLImageElement, width: number, height: number, background?: string) => {
  const canvas = document.createElement("canvas");
  canvas.width = width * 2;
  canvas.height = height * 2;
  const context = canvas.getContext("2d");
  if (!context) return null;
  if (background) {
    context.fillStyle = background;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
};

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load ${src}`));
    image.src = src;
  });

const toDataUri = async (image: HTMLImageElement, width: number, height: number) => {
  const background = image.dataset.rasterBg;
  const redraw = !!background || /\.svg(\?|$)/i.test(image.src);
  if (redraw) {
    try {
      const png = rasterise(image, width, height, background);
      if (png) return png;
    } catch {
      // Drawing another origin's image taints the canvas, so it cannot be read back. The fetched copy
      // below is a blob of this origin, which can.
    }
  }
  const response = await fetch(image.src);
  const blob = await response.blob();
  // An error page that allows CORS would otherwise be embedded as the picture.
  if (!response.ok || !blob.type.startsWith("image/")) throw new Error(`${image.src} is not an image`);
  if (!redraw) return readAsDataUri(blob);
  const url = URL.createObjectURL(blob);
  try {
    return rasterise(await loadImage(url), width, height, background) ?? (await readAsDataUri(blob));
  } finally {
    URL.revokeObjectURL(url);
  }
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
};

// NOTE: [12 Oct 2026] EK - The copy reads the page at the email's own 900px, however narrow the window.
// The masthead title is redrawn from its measured box, so a squeezed one bakes a wrapped title into the email.
const atEmailWidth = <T>(source: HTMLElement, read: () => T): T => {
  const { maxWidth } = source.style;
  source.style.maxWidth = "none";
  try {
    return read();
  } finally {
    source.style.maxWidth = maxWidth;
  }
};

// Parts the email leaves out: page-only prompts, and sections or rows with nothing in them.
const LEFT_OUT = '[data-copy="skip"], [data-copy="empty"]';
const inLeftOutPart = (element: Element) => !!element.closest(LEFT_OUT);

// NOTE: [12 Oct 2026] EK - The second thing the copy reads off the page: the box of each
// [data-raster] span. Its text is redrawn as a PNG with the band colour baked in, because Outlook Web
// recolours text on a dark background. The picture takes the span's box, so the layout cannot move.
const drawText = (span: HTMLElement) => {
  const box = span.getBoundingClientRect();
  const width = Math.round(box.width);
  const height = Math.round(box.height);
  const size = Number(span.dataset.rasterSize) || 16;
  const leading = size * (Number(span.dataset.rasterLeading) || 1.2);
  const text = (span.textContent ?? "").trim();
  const canvas = document.createElement("canvas");
  canvas.width = width * 2;
  canvas.height = height * 2;
  const context = canvas.getContext("2d");
  if (!context || !width || !height) return null;
  context.scale(2, 2);
  context.fillStyle = span.dataset.rasterBg || colour.band;
  context.fillRect(0, 0, width, height);
  context.font = `${span.dataset.rasterWeight || 400} ${size}px ${FONT}`;
  context.fillStyle = span.dataset.rasterColour || "#ffffff";
  context.textBaseline = "middle";

  // Wrap where the browser did: greedily, by word, at the span's own width.
  const wanted = Math.max(1, Math.round(box.height / leading));
  const lines: string[] = [];
  if (wanted === 1) lines.push(text);
  else {
    let line = "";
    text.split(/\s+/).forEach((word) => {
      const next = line ? `${line} ${word}` : word;
      if (line && context.measureText(next).width > box.width + 1) {
        lines.push(line);
        line = word;
      } else line = next;
    });
    lines.push(line);
  }
  lines.forEach((line, index) => context.fillText(line, 0, index * leading + leading / 2));
  return { src: canvas.toDataURL("image/png"), width, height, text };
};

export async function buildEmailHtml(source: HTMLElement) {
  const clone = source.cloneNode(true) as HTMLElement;
  const originalText = Array.from(source.querySelectorAll<HTMLElement>("[data-raster]")).filter((span) => !inLeftOutPart(span));
  const pictures = atEmailWidth(source, () => {
    // Pairs tables by index, so nothing may be removed from the clone before it runs.
    freezeColumnWidths(source, clone);
    return originalText.map(drawText);
  });

  // Outermost first: a part inside one already removed is gone with it and not reported.
  const left: string[] = [];
  Array.from(clone.querySelectorAll<HTMLElement>('[data-copy="empty"]')).forEach((part) => {
    if (!clone.contains(part)) return;
    const name = part.getAttribute("data-empty-label");
    if (name && !left.includes(name)) left.push(name);
    part.remove();
  });
  clone.querySelectorAll('[data-copy="skip"]').forEach((element) => element.remove());
  clone.querySelectorAll<HTMLElement>('[data-copy="only"]').forEach((element) => {
    element.style.display = "block";
  });

  const originalImages = Array.from(source.querySelectorAll("img")).filter((image) => !inLeftOutPart(image));
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

  const clonedText = Array.from(clone.querySelectorAll<HTMLElement>("[data-raster]"));
  pictures.forEach((picture, index) => {
    if (!picture) return;
    const image = document.createElement("img");
    image.setAttribute("src", picture.src);
    image.setAttribute("alt", picture.text);
    image.setAttribute("width", String(picture.width));
    image.setAttribute("height", String(picture.height));
    image.setAttribute("style", `display: block; width: ${picture.width}px; height: ${picture.height}px;`);
    clonedText[index]?.replaceWith(image);
  });

  [clone, ...Array.from(clone.querySelectorAll("*"))].forEach((element) => {
    element.removeAttribute("class");
    element.removeAttribute("id");
    element.removeAttribute("data-tina-field");
    element.removeAttribute("data-copy");
    element.removeAttribute("data-id");
    element.removeAttribute("data-empty-label");
    Array.from(element.attributes)
      .filter((attribute) => attribute.name.startsWith("data-raster"))
      .forEach((attribute) => element.removeAttribute(attribute.name));
  });

  // Outlook ignores `margin: 0 auto`, so centring is a full-width table with an aligned cell.
  const html = `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse: collapse; background-color: ${colour.paper};"><tbody><tr><td align="center" style="padding: 20px;"><table cellpadding="0" cellspacing="0" border="0" align="center" width="${SHEET_WIDTH}" style="border-collapse: collapse; width: ${SHEET_WIDTH}px;"><tbody><tr><td>${clone.outerHTML}</td></tr></tbody></table></td></tr></tbody></table>`;
  return { html, left };
}
