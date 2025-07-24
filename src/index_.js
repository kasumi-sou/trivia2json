/*
  Trivia List Scraper (ESM)
  ------------------------
  Scrape pages 1–21 of the トリビア一覧 list
    http://trivia.air-be.net/trivia.php?si=1&so=0&pn=1
  and produce **structured trivia data**, not just class names.

  Each record:
    {
      "number"        :  1,                       // 通し番号 (int)
      "title"         :  "ハンガー...",           // トリビア見出し
      "hee"           :  61,                      // へぇ数 (int) – 無ければ null
      "broadcast_date":  "2003-07-02",          // 放送日 YYYY-MM-DD – 無ければ null
      "brain_rank"    :  "金の脳" | null,       // 金/銀の脳等のマーク
      "page"          :  1                       // pn=1..21
    }

  Output file: trivia_list.json  (UTF‑8, pretty‑printed)

  ─────────────── Setup ───────────────
  npm init -y
  npm i axios cheerio
  # → 手動で package.json に "type":"module" を追加 (Node22+ ESM)

  Run with:
    node src/index.js
*/
import axios from "axios";
import { load } from "cheerio";
import { writeFileSync } from "fs";

const BASE = "http://trivia.air-be.net/trivia.php?si=1&so=0&pn=";
const MAX_PN = 21;
const SLEEP_MS = 100;

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchPage(pn) {
  const url = `${BASE}${pn}`;
  const { data } = await axios.get(url, {
    headers: { "User-Agent": "Mozilla/5.0 (TriviaBot)" }
  });
  return { html: data, pn };
}

function parseTrivia(html, pn) {
  const $ = load(html);
  const records = [];
  $("table.list tbody tr").each((_, trEl) => {
    const tr = $(trEl);

    // zebra colouring rows may have class "alternate" – ignore
    const numberText = tr.find("td.number, td.no").first().text().trim();
    if (!numberText) return; // skip advertisement or broken rows

    const titleText = tr.find("td.title").text().trim();

    // へぇ数または pt に数値がある列 (td.pt / td.he / td_hee?) – 先に探せるだけ
    let heeText = tr.find("td.pt, td.he, td.hee, td_hee").text().trim();
    if (heeText.endsWith("へぇ")) heeText = heeText.replace(/へぇ$/, "");

    const dayText = tr.find("td.day").text().trim();

    // 金の脳/銀の脳などを img alt から取得 (例: <img alt="金の脳" ...>)
    const brainRank = tr.find("img[alt*='脳']").attr("alt") || null;

    records.push({
      number: parseInt(numberText, 10) || null,
      title : titleText || null,
      hee   : heeText ? parseInt(heeText, 10) : null,
      broadcast_date: dayText || null,
      brain_rank: brainRank,
      page: pn
    });
  });
  return records;
}

async function main() {
  const all = [];
  for (let pn = 1; pn <= MAX_PN; pn++) {
    try {
      const { html } = await fetchPage(pn);
      const pageRecs = parseTrivia(html, pn);
      console.log(`pn=${pn}: +${pageRecs.length}`);
      all.push(...pageRecs);
    } catch (err) {
      console.error(`pn=${pn}:`, err.message);
    }
    await sleep(SLEEP_MS);
  }

  // sort by number asc just in case
  all.sort((a, b) => (a.number ?? 0) - (b.number ?? 0));

  const outPath = "trivia_list.json";
  writeFileSync(outPath, JSON.stringify(all, null, 2), "utf-8");
  console.log(`Saved ${all.length} records → ${outPath}`);
}

main();
