import * as cheerio from "cheerio";
import axios from "axios";

const base = "http://trivia.air-be.net/trivia.php?si=1&so=0&pn=";

const num = 1;

const url = `${base}${num}`

const { data: body } = await axios.get(url)
const $ = cheerio.load(body);

$("tr").each((i, elem) => {
  if (i != 0) {
    const num = $(elem).children("td.no").text().trim();
    const title = $(elem).children("td.title").text().trim();
    const hee = $(elem).children("td.number").text().trim();
    const brain = $(elem).children("td.brain").text().trim();
    const day = $(elem).children("td.day").text().trim();

    console.log(num + "/" + title + "/" + hee + "/" + brain + "/" + day);
  }
})
