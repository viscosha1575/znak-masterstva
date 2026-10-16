/*
 * What a User-Agent header says about the visitor, reduced to the three words
 * the reports group by. The header itself is not stored.
 */

export type Agent = {
  device: "desktop" | "mobile" | "tablet";
  browser: string;
  os: string;
};

// Crawlers, link previewers, uptime checks and headless browsers. Most never
// run the site's script, so this is a second line, not the first.
const BOT =
  /bot\b|bot[/;)]|crawl|spider|slurp|preview|scan|fetch|monitor|uptime|pingdom|lighthouse|pagespeed|headless|phantomjs|puppeteer|playwright|selenium|curl|wget|python|httpclient|okhttp|go-http|java\/|axios|node-fetch|undici|facebookexternalhit|whatsapp|telegrambot|vkshare|embedly/i;

export function isBot(userAgent: string) {
  return userAgent.length < 20 || BOT.test(userAgent);
}

// Order matters: almost every browser also claims to be Chrome and Safari.
const BROWSERS: [RegExp, string][] = [
  [/YaBrowser|YaSearchBrowser|Yowser/, "Яндекс Браузер"],
  [/EdgA?\/|EdgiOS/, "Edge"],
  [/OPR\/|Opera|OPT\//, "Opera"],
  [/SamsungBrowser/, "Samsung Internet"],
  [/MiuiBrowser/, "Mi Browser"],
  [/HuaweiBrowser/, "Huawei Browser"],
  [/Firefox|FxiOS/, "Firefox"],
  [/Atom\//, "Atom"],
  [/Chrome|CriOS|Chromium/, "Chrome"],
  [/Safari/, "Safari"],
];

const SYSTEMS: [RegExp, string][] = [
  [/Windows/, "Windows"],
  [/iPhone|iPad|iPod/, "iOS"],
  [/Android/, "Android"],
  [/HarmonyOS/, "HarmonyOS"],
  [/Mac OS X|Macintosh/, "macOS"],
  [/CrOS/, "ChromeOS"],
  [/Linux|X11/, "Linux"],
];

function first(list: [RegExp, string][], userAgent: string) {
  return list.find(([pattern]) => pattern.test(userAgent))?.[1] ?? "Другое";
}

export function parseAgent(userAgent: string): Agent {
  const tablet =
    /iPad|Tablet|PlayBook|Silk/.test(userAgent) ||
    // Android tablets are the Android browsers that do not say "Mobile".
    (/Android/.test(userAgent) && !/Mobile/.test(userAgent));
  const mobile = /Mobi|iPhone|iPod|Android|Windows Phone/.test(userAgent);

  return {
    device: tablet ? "tablet" : mobile ? "mobile" : "desktop",
    browser: first(BROWSERS, userAgent),
    os: first(SYSTEMS, userAgent),
  };
}
