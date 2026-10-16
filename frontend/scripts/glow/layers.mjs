// layers.mjs <file.svg> <scale> <shape.png> <rest.png> [rest-blur-factor]
//
// Renders an exported glow in two transparent layers: its first blurred shape
// WITHOUT the blur, and everything else as exported (with the other blurs
// multiplied by the factor). Prints the canvas and pixel sizes as JSON.
import fs from "node:fs";
import { chromium } from "playwright-core";

const [file, scale, shapeOut, restOut, restBlur = "1"] = process.argv.slice(2);
const svg = fs.readFileSync(file, "utf8");
const [, W, H] = svg
  .match(/<svg[^>]*width="([\d.]+)"[^>]*height="([\d.]+)"/)
  .map(Number);
const w = Math.round(W * Number(scale));
const h = Math.round(H * Number(scale));

const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({
  viewport: { width: w, height: h },
  deviceScaleFactor: 1,
});
const page = await context.newPage();
await page.setContent(
  `<html><body style="margin:0;background:transparent">${svg}</body></html>`,
);
const clip = { x: 0, y: 0, width: w, height: h };

const others = await page.evaluate(
  ([w, h]) => {
    const root = document.querySelector("svg");
    root.style.cssText = `display:block;width:${w}px;height:${h}px`;
    const [shape, ...rest] = root.querySelectorAll("g[filter]");
    Object.assign(window, { shape, rest });
    shape.removeAttribute("filter");
    for (const g of rest) g.style.display = "none";
    return rest.length;
  },
  [w, h],
);
await page.screenshot({ path: shapeOut, omitBackground: true, clip });

await page.evaluate((factor) => {
  window.shape.style.display = "none";
  for (const g of window.rest) {
    g.style.display = "";
    const id = g.getAttribute("filter").match(/#([^)]+)/)[1];
    const blur = document.getElementById(id).querySelector("feGaussianBlur");
    const deviation = Number(blur.getAttribute("stdDeviation")) * factor;
    blur.setAttribute("stdDeviation", String(deviation));
  }
}, Number(restBlur));
await page.screenshot({ path: restOut, omitBackground: true, clip });

console.log(JSON.stringify({ W, H, w, h, others }));
await browser.close();
