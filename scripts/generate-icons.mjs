import sharp from "sharp";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const svgBuffer = readFileSync(join(root, "public/icons/icon.svg"));

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

for (const size of sizes) {
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(join(root, `public/icons/icon-${size}.png`));
  console.log(`✓ icon-${size}.png`);
}

// Apple touch icon (180x180)
await sharp(svgBuffer)
  .resize(180, 180)
  .png()
  .toFile(join(root, "public/icons/apple-touch-icon.png"));
console.log("✓ apple-touch-icon.png");

// Favicon 32x32
await sharp(svgBuffer)
  .resize(32, 32)
  .png()
  .toFile(join(root, "public/favicon-32.png"));
console.log("✓ favicon-32.png");

console.log("\nAll icons generated!");
