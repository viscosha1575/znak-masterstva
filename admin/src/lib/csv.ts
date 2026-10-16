/*
 * CSV for Excel as it is set up in Russia: semicolons between cells, a byte
 * order mark so that Cyrillic opens as Cyrillic, CRLF line ends.
 */

// The one cell that rightly starts with "+": a phone number, which the server
// formats itself (lib/validation.ts) and which is no formula in any spreadsheet.
const PHONE = /^\+7 \d{3} \d{3}-\d{2}-\d{2}$/;

function cell(value: string | number | null | undefined) {
  let text = value == null ? "" : String(value);
  // Applicants write these cells. A cell that starts like a formula would be
  // run by the spreadsheet on opening; the apostrophe makes it plain text.
  if (/^[=+\-@\t\r]/.test(text) && !PHONE.test(text)) text = `'${text}`;
  return /[";\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function toCsv(rows: (string | number | null | undefined)[][]) {
  return `﻿${rows.map((row) => row.map(cell).join(";")).join("\r\n")}\r\n`;
}
