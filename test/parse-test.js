import {readdirSync, readFileSync, writeFileSync} from "fs";
import {extname, join} from "path";
import tape from "tape-await";
import parse from "../src/parse.js";

readdirSync(join("test", "input")).forEach(file => {
  if (extname(file) !== ".json") return;
  tape(`parse ${file}`, test => {
    const infile = join("test", "input", file);
    const outfile = join("test", "output", file);
    const input = JSON.parse(readFileSync(infile, "utf8"));
    let actual = parse(input.path, input.options);
    let expected;
    try {
      expected = JSON.parse(readFileSync(outfile, "utf8"));
    } catch (error) {
      if (error.code === "ENOENT") {
        console.warn(`! generating ${outfile}`);
        writeFileSync(outfile, JSON.stringify(actual, null, 2) + "\n", "utf8");
        return;
      }
      throw error;
    }
    test.deepEqual(actual, expected);
  });
});
