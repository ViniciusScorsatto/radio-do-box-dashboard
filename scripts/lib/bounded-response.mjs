// Count decoded bytes too: Content-Length may be missing, false, or compressed.
export async function boundedText(response, maximum = 8 * 1024 * 1024) {
  if (Number(response.headers.get("content-length")) > maximum) {
    await response.body?.cancel();
    throw new Error("source_too_large");
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of response.body ?? []) {
    size += chunk.length;
    if (size > maximum) throw new Error("source_too_large");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}
