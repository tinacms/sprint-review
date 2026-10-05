"use client";
import { useState } from "react";
import { buildEmailHtml } from "../../lib/copy-for-email";
import { outlookUnsafe } from "../../lib/outlook-safe";

// NOTE: [23 Sep 2026] EK - execCommand is the fallback because the async Clipboard API is denied
// outside a normal Chrome tab, and Outlook needs the rich flavour a selection copy produces.
// Copying a hidden element's selection is NOT the same as copying raw source into a textarea.
const copyBySelection = (html: string) => {
  const holder = document.createElement("div");
  holder.innerHTML = html;
  holder.setAttribute("style", "position: fixed; left: -99999px; top: 0;");
  document.body.appendChild(holder);

  const range = document.createRange();
  range.selectNodeContents(holder);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);

  const copied = document.execCommand("copy");
  selection?.removeAllRanges();
  holder.remove();
  return copied;
};

export default function CopyEmailButton({ target }: { target: string }) {
  const [message, setMessage] = useState("");

  const copy = async () => {
    const source = document.getElementById(target);
    if (!source) return;

    setMessage("Building...");
    const html = await buildEmailHtml(source);
    const unsafe = outlookUnsafe(source);
    if (unsafe.length) console.warn("Outlook will not render these as the page does:", unsafe);
    const done = unsafe.length
      ? `Copied, but ${unsafe.length} things Outlook will render differently (see console)`
      : "Copied - paste with Keep source formatting";

    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([`<html><body>${html}</body></html>`], { type: "text/html" }),
        }),
      ]);
      setMessage(done);
      return;
    } catch {
      setMessage(
        copyBySelection(html) ? done : "Copy failed - use Cmd+A then Cmd+C"
      );
    }
  };

  return (
    <>
      <button type="button" className="copy-email" onClick={copy}>
        Copy for Email
      </button>
      <span className="copy-email-state">{message}</span>
    </>
  );
}
