// Styles Outlook's paste filter drops, observed on a real paste into Outlook web on 26 Sep 2026.
// Anything here renders on the page but not in the email, so the sheet must not use it.
const DROPPED_EVERYWHERE = ["text-transform", "text-decoration-color"];
const DROPPED_ON_INLINE = ["padding", "margin", "white-space"];
const INLINE_TAGS = new Set(["SPAN", "A", "STRONG", "EM", "B", "I"]);

export function outlookUnsafe(root: HTMLElement) {
  const problems: string[] = [];
  [root, ...Array.from(root.querySelectorAll<HTMLElement>("[style]"))].forEach((element) => {
    const properties = Array.from(element.style);
    const inline = INLINE_TAGS.has(element.tagName);
    // A shorthand like `underline` or `margin: 0` also writes default longhands, which lose nothing.
    const meaningful = (property: string) =>
      !/^(|initial|currentcolor|0|0px|normal|none)$/i.test(element.style.getPropertyValue(property).trim());
    const bad = properties.filter(
      (property) =>
        meaningful(property) &&
        (DROPPED_EVERYWHERE.includes(property) ||
          (inline && DROPPED_ON_INLINE.some((prefix) => property.startsWith(prefix))))
    );
    if (bad.length) {
      problems.push(`${element.tagName} "${(element.textContent ?? "").trim().slice(0, 30)}": ${bad.join(", ")}`);
    }
  });
  return problems;
}
