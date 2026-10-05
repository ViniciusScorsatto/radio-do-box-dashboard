import fs from "node:fs/promises";
import sharp from "sharp";
sharp.cache(false);
sharp.concurrency(1);
export async function normalizeImage(bytes) {
  const png = bytes
    .subarray(0, 8)
    .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (!png && !jpeg) throw new Error("invalid_image");
  if (png) {
    for (let offset = 8; offset + 12 <= bytes.length; ) {
      const length = bytes.readUInt32BE(offset);
      if (bytes.toString("ascii", offset + 4, offset + 8) === "acTL")
        throw new Error("image_dimensions");
      offset += length + 12;
    }
  }
  const image = sharp(bytes, {
    limitInputPixels: 1080 * 1920,
    failOn: "warning",
  });
  const metadata = await image.metadata();
  const swapped = [5, 6, 7, 8].includes(metadata.orientation);
  const width = swapped ? metadata.height : metadata.width;
  const height = swapped ? metadata.width : metadata.height;
  if (width !== 1080 || height !== 1920 || (metadata.pages || 1) !== 1)
    throw new Error("image_dimensions");
  // Decode all pixels and re-encode, stripping EXIF, profiles and trailing data.
  return image.rotate().toColourspace("srgb").png().toBuffer();
}
if (process.send) {
  process.once("message", async ({ input, output }) => {
    try {
      const bytes = await normalizeImage(await fs.readFile(input));
      if (bytes.length > 8 * 1024 * 1024) throw new Error("image_too_large");
      await fs.writeFile(output, bytes, { flag: "wx", mode: 0o600 });
      process.send({ ok: true }, () => process.exit(0));
    } catch (error) {
      const code = ["image_dimensions", "image_too_large"].includes(
        error.message,
      )
        ? error.message
        : "invalid_image";
      process.send({ ok: false, code }, () => process.exit(1));
    }
  });
}
