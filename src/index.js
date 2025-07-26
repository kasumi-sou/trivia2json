import * as cheerio from "cheerio";
import axios from "axios";
import * as fs from 'node:fs';

const base = "http://trivia.air-be.net/trivia.php?si=1&so=0&pn=";

const pages = 21

let data = []

for(let i = 1; i <= pages; i++) {
  const url = `${base}${i}`

  const { data: body } = await axios.get(url)
  const $ = cheerio.load(body);

  $("tr").each((i, elem) => {
    if (i != 0) {
      const num = $(elem).children("td.no").text().trim().replace("No.", "");
      const title = $(elem).children("td.title").text().trim();
      const hee = $(elem).children("td.number").text().trim().replace("へぇ", "");
      const brain = $(elem).children("td.brain").text().trim();
      const day = $(elem).children("td.day").text().trim();

      // console.log(num + "/" + title + "/" + hee + "/" + brain + "/" + day);

      const record = {
        "no": num,
        "title": title,
        "hee": hee,
        "brain": brain,
        "day": day
      }

      data.push(record);
      
    }
  })
}

fs.writeFileSync("trivia.json", JSON.stringify(data, null, 2));

console.log(data);

