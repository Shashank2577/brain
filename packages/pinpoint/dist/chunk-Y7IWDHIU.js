"use client";

// src/utils/open-file.ts
async function openFile(filePath, lineNumber) {
  const vsCodeUrl = lineNumber ? `vscode://file/${filePath}:${lineNumber}` : `vscode://file/${filePath}`;
  try {
    window.open(vsCodeUrl, "_blank");
    return;
  } catch {
  }
  try {
    await fetch("/api/open-file", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filePath, lineNumber })
    });
  } catch {
    console.warn("[pinpoint] Could not open file:", filePath);
  }
}

export {
  openFile
};
//# sourceMappingURL=chunk-Y7IWDHIU.js.map