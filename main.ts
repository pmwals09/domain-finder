import https from "https";
import fs from "fs";
import * as fsp from "fs/promises";
import path from "path";
import * as childProcess from "child_process";
import { Trie } from "./Trie";

const tempFolderName = "namefiles";
const tempFolderPath = path.resolve(__dirname, tempFolderName);

main();

async function main() {
  // get the files
  await setup();
  const [t, dictionary] = await Promise.all([
    buildDomainTrie(),
    buildDictionary(),
  ]);

  const matches = new Set<string>();
  const percents = new Set<number>();

  for (let i = 0; i < dictionary.length; i++) {
    for (let j = i; j < dictionary.length; j++) {
      const word = dictionary[i].toLowerCase();
      const anotherWord = dictionary[j].toLowerCase();
      const options = [
        word,
        word + anotherWord,
        anotherWord + word,
        word + "-" + anotherWord,
        anotherWord + "-" + word,
      ];
      options.forEach((option) => {
        if (t.contains(option)) {
          matches.add(option);
        }
      });

      logPercentComplete({
        i,
        j,
        percents,
        dictionaryLength: dictionary.length,
      });
    }
  }

  console.log(matches);
  const matchStr = Array.from(matches).join("\n");
  fs.writeFileSync(path.resolve(__dirname, "..", "domainNames.txt"), matchStr);

  await fsp.rm(tempFolderPath, { recursive: true });
}

async function setup() {
  if (!fs.existsSync(tempFolderPath)) await fsp.mkdir(tempFolderPath);
}

async function buildDomainTrie() {
  return new Promise<Trie>((resolve, reject) => {
    getLatest().then((domainsRes) => {
      const domains = domainsRes.flat().filter((ea) => {
        return (
          !ea.match(/.*\d.*/) &&
          [".com", ".sh", ".dev"].some((suffix) => ea.endsWith(suffix))
        );
      });
      console.log(domains);
      const t = new Trie();

      domains.forEach((domain) => {
        t.insert(domain.toLowerCase().split(".")[0]);
      });

      resolve(t);
    });
  });
}

async function buildDictionary() {
  return new Promise<string[]>((resolve, reject) => {
    fsp
      .readFile("/usr/share/dict/words", {
        encoding: "utf8",
      })
      .then((dictionaryRes) => {
        const maxLength = 7;
        const dictionary = dictionaryRes
          .split("\n")
          .filter((ea) => ea.length < maxLength && ea.length > 2);
        resolve(dictionary);
      });
  });
}

function logPercentComplete({
  i,
  dictionaryLength,
  j,
  percents,
}: {
  i: number;
  dictionaryLength: number;
  j: number;
  percents: Set<number>;
}) {
  const percentDone = Math.round(
    ((i * dictionaryLength + j) / (dictionaryLength * dictionaryLength)) * 100
  );
  if (!percents.has(percentDone)) {
    console.log("percentDone: ", percentDone);
    percents.add(percentDone);
  }
}

async function getLatest() {
  const promises = [
    getDropCatch(),
    getNameCheap(),
    getNameJet(),
    // getSnapNames(),
  ];
  return Promise.all(promises);
}

function padValToTwoPlaces(val: number): string {
  return val < 10 ? `0${val}` : val.toString();
}

function formatDate(date: Date): string {
  const month = padValToTwoPlaces(date.getMonth());
  const day = padValToTwoPlaces(date.getDate());
  const year = padValToTwoPlaces(date.getFullYear());
  return `${year}${month}${day}`;
}

async function getSnapNames(): Promise<string[]> {
  const address =
    "https://www.snapnames.com/file_dl.sn?file=snpdeletinglist.zip";
  return new Promise((resolve, reject) => {
    const date = new Date();
    const startRange = formatDate(date);
    const endDate = new Date(date.valueOf());
    endDate.setDate(endDate.getDate() + 1);
    const endRange = formatDate(endDate);
    const filename = `snapnames_${startRange}-${endRange}`;
    const ext = "zip";
    const newFilePath = path.resolve(
      tempFolderPath, filename + "." + ext
    );
    const file = fs.createWriteStream(newFilePath);

    https.get(address, (res) => {
      console.log("statusCode", res.statusCode);
      console.log("headers", res.headers);

      res.pipe(file);

      res.on("end", () => {
        childProcess.exec(
          `unzip ${filename}.${ext}`,
          { cwd: tempFolderPath },
          (err) => {
            if (err) reject(err);
            else {
              fs.readFile(
                tempFolderPath + "/snpdeletinglist.txt",
                { encoding: "utf8" },
                (err, data: string) => {
                  if (err) reject(err);
                  else {
                    console.log(data);
                    // resolve(data.split("\n").map((ea) => ea.split(" ")[0]));
                  }
                }
              );
            }
          }
        );
      });
    });
  });
}

async function getNameJet(): Promise<string[]> {
  const basepath = "https://www.namejet.com/download/";
  const today = new Date();
  today.setDate(today.getDate() + 1);
  const dayNum = today.getDate();
  const day = dayNum < 10 ? `0${dayNum}` : dayNum.toString();
  const date = `${today.getMonth() + 1}-${day}-${today.getFullYear()}`;

  return new Promise((resolve, reject) => {
    let data = "";
    const address = basepath + date + ".txt";
    https.get(address, (res) => {
      console.log("statusCode", res.statusCode);
      console.log("headers", res.headers);
      res.on("data", (d) => {
        data += d;
      });

      res.on("end", () => {
        const filename = `namejet_${date}.txt`;
        fs.writeFile(path.resolve(tempFolderPath, filename), data, (err) => {
          if (err) reject(err);
          else {
            resolve(data.split("\n"));
          }
        });
      });
    });
  });
}

async function getDropCatch(): Promise<string[]> {
  const address =
    "https://www.dynadot.com/market/auction/auctions.csv?timezone=PST";
  const filename = "dropcatch.csv";
  return new Promise((resolve, reject) => {
    https.get(address, (res) => {
      let data = "";
      console.log("statusCode", res.statusCode);
      console.log("headers", res.headers);

      res.on("data", (d) => {
        data += d;
      });

      res.on("end", () => {
        fs.writeFile(tempFolderPath + "/" + filename, data, () => {
          const names = data.split("\r\n").map((ea) => {
            return ea.split(",")[0];
          });
          names.shift();
          resolve(names);
        });
      });
    });
  });
}

async function getNameCheap(): Promise<string[]> {
  const address =
    "https://nc-aftermarket-www-production.s3.amazonaws.com/public/Namecheap_Market_Sales.csv";
  const filename = "namecheap.csv";
  return new Promise((resolve, reject) => {
    https
      .get(address, (res) => {
        let data = "";
        console.log("statusCode", res.statusCode);
        console.log("headers", res.headers);

        res.on("data", (d) => {
          data += d;
        });

        res.on("end", () => {
          fs.writeFile(tempFolderPath + "/" + filename, data, () => {
            const names = data.split("\r\n").map((ea) => {
              return ea.split(",")[0];
            });
            names.shift();
            resolve(names);
          });
        });
      })
      .on("error", (e) => {
        console.error(e);
      });
  });
}

function parseCsv(csvTxt: string) {
  let rows = csvTxt.split("\n");
  if (rows[0].endsWith("\r")) {
    rows = rows.map((ea) => ea.slice(0, -1));
  }
}
