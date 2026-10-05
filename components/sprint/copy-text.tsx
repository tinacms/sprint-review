"use client";
import { useState } from "react";

export default function CopyText({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const holder = document.createElement("textarea");
      holder.value = value;
      holder.setAttribute("style", "position: fixed; left: -99999px; top: 0;");
      document.body.appendChild(holder);
      holder.select();
      document.execCommand("copy");
      holder.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button type="button" className="copy-text" onClick={copy} title={value}>
      <span className="copy-text-label">{label}</span>
      <span className="copy-text-value">{value}</span>
      <span className="copy-text-state">{copied ? "copied" : "copy"}</span>
    </button>
  );
}
