import absolutize from "./absolutize.js";
import reduce from "./reduce.js";

const commandsMap = {Z: "Z", M: "M", L: "L", C: "C", Q: "Q", A: "A", H: "H", V: "V", S: "S", T: "T", z: "Z", m: "m", l: "l", c: "c", q: "q", a: "a", h: "h", v: "v", s: "s", t: "t"};

export default function parse(string, {normalize = false} = {}) {
  if (!(string += "") || string.length === 0) return [];
  const pathData = [];

  let currentIndex = 0;
  let endIndex = string.length;
  let prevCommand = null;

  skipOptionalSpaces();

  function parseSegment() {
    var char = string[currentIndex];
    var command = commandsMap[char] ? commandsMap[char] : null;

    if (command === null) {
      // Possibly an implicit command. Not allowed if this is the first command.
      if (prevCommand === null) {
        return null;
      }

      // Check for remaining coordinates in the current command.
      if (
        (char === "+" || char === "-" || char === "." || (char >= "0" && char <= "9")) && prevCommand !== "Z"
      ) {
        if (prevCommand === "M") {
          command = "L";
        }
        else if (prevCommand === "m") {
          command = "l";
        }
        else {
          command = prevCommand;
        }
      }
      else {
        command = null;
      }

      if (command === null) {
        return null;
      }
    }
    else {
      currentIndex += 1;
    }

    prevCommand = command;

    var values = null;
    var cmd = command.toUpperCase();

    if (cmd === "H" || cmd === "V") {
      values = [parseNumber()];
    }
    else if (cmd === "M" || cmd === "L" || cmd === "T") {
      values = [parseNumber(), parseNumber()];
    }
    else if (cmd === "S" || cmd === "Q") {
      values = [parseNumber(), parseNumber(), parseNumber(), parseNumber()];
    }
    else if (cmd === "C") {
      values = [
        parseNumber(),
        parseNumber(),
        parseNumber(),
        parseNumber(),
        parseNumber(),
        parseNumber()
      ];
    }
    else if (cmd === "A") {
      values = [
        parseNumber(),
        parseNumber(),
        parseNumber(),
        parseArcFlag(),
        parseArcFlag(),
        parseNumber(),
        parseNumber()
      ];
    }
    else if (cmd === "Z") {
      skipOptionalSpaces();
      values = [];
    }

    if (values === null || values.indexOf(null) >= 0) {
      // Unknown command or known command with invalid values
      return null;
    }
    else {
      return {type: command, values: values};
    }
  }

  function hasMoreData() {
    return currentIndex < endIndex;
  }

  function peekSegmentType() {
    var char = string[currentIndex];
    return commandsMap[char] ? commandsMap[char] : null;
  }

  function initialCommandIsMoveTo() {
    // If the path is empty it is still valid, so return true.
    if (!hasMoreData()) {
      return true;
    }

    var command = peekSegmentType();
    // Path must start with moveTo.
    return command === "M" || command === "m";
  }

  function isCurrentSpace() {
    var char = string[currentIndex];
    return char <= " " && (char === " " || char === "\n" || char === "\t" || char === "\r" || char === "\f");
  }

  function skipOptionalSpaces() {
    while (currentIndex < endIndex && isCurrentSpace()) {
      currentIndex += 1;
    }

    return currentIndex < endIndex;
  }

  function skipOptionalSpacesOrDelimiter() {
    if (
      currentIndex < endIndex &&
      !isCurrentSpace() &&
      string[currentIndex] !== ","
    ) {
      return false;
    }

    if (skipOptionalSpaces()) {
      if (currentIndex < endIndex && string[currentIndex] === ",") {
        currentIndex += 1;
        skipOptionalSpaces();
      }
    }
    return currentIndex < endIndex;
  }

  // Parse a number from an SVG path. This very closely follows genericParseNumber(...) from
  // Source/core/svg/SVGParserUtilities.cpp.
  // Spec: http://www.w3.org/TR/SVG11/single-page.html#paths-PathDataBNF
  function parseNumber() {
    var exponent = 0;
    var integer = 0;
    var frac = 1;
    var decimal = 0;
    var sign = 1;
    var expsign = 1;
    var startIndex = currentIndex;

    skipOptionalSpaces();

    // Read the sign.
    if (currentIndex < endIndex && string[currentIndex] === "+") {
      currentIndex += 1;
    }
    else if (currentIndex < endIndex && string[currentIndex] === "-") {
      currentIndex += 1;
      sign = -1;
    }

    if (
      currentIndex === endIndex ||
      (
        (string[currentIndex] < "0" || string[currentIndex] > "9") &&
        string[currentIndex] !== "."
      )
    ) {
      // The first character of a number must be one of [0-9+-.].
      return null;
    }

    // Read the integer part, build right-to-left.
    var startIntPartIndex = currentIndex;

    while (
      currentIndex < endIndex &&
      string[currentIndex] >= "0" &&
      string[currentIndex] <= "9"
    ) {
      currentIndex += 1; // Advance to first non-digit.
    }

    if (currentIndex !== startIntPartIndex) {
      var scanIntPartIndex = currentIndex - 1;
      var multiplier = 1;

      while (scanIntPartIndex >= startIntPartIndex) {
        integer += multiplier * (string[scanIntPartIndex] - "0");
        scanIntPartIndex -= 1;
        multiplier *= 10;
      }
    }

    // Read the decimals.
    if (currentIndex < endIndex && string[currentIndex] === ".") {
      currentIndex += 1;

      // There must be a least one digit following the .
      if (
        currentIndex >= endIndex ||
        string[currentIndex] < "0" ||
        string[currentIndex] > "9"
      ) {
        return null;
      }

      while (
        currentIndex < endIndex &&
        string[currentIndex] >= "0" &&
        string[currentIndex] <= "9"
      ) {
        frac *= 10;
        decimal += (string.charAt(currentIndex) - "0") / frac;
        currentIndex += 1;
      }
    }

    // Read the exponent part.
    if (
      currentIndex !== startIndex &&
      currentIndex + 1 < endIndex &&
      (string[currentIndex] === "e" || string[currentIndex] === "E") &&
      (string[currentIndex + 1] !== "x" && string[currentIndex + 1] !== "m")
    ) {
      currentIndex += 1;

      // Read the sign of the exponent.
      if (string[currentIndex] === "+") {
        currentIndex += 1;
      }
      else if (string[currentIndex] === "-") {
        currentIndex += 1;
        expsign = -1;
      }

      // There must be an exponent.
      if (
        currentIndex >= endIndex ||
        string[currentIndex] < "0" ||
        string[currentIndex] > "9"
      ) {
        return null;
      }

      while (
        currentIndex < endIndex &&
        string[currentIndex] >= "0" &&
        string[currentIndex] <= "9"
      ) {
        exponent *= 10;
        exponent += (string[currentIndex] - "0");
        currentIndex += 1;
      }
    }

    var number = integer + decimal;
    number *= sign;

    if (exponent) {
      number *= Math.pow(10, expsign * exponent);
    }

    if (startIndex === currentIndex) {
      return null;
    }

    skipOptionalSpacesOrDelimiter();

    return number;
  }

  function parseArcFlag() {
    if (currentIndex >= endIndex) {
      return null;
    }

    var flag = null;
    var flagChar = string[currentIndex];

    currentIndex += 1;

    if (flagChar === "0") {
      flag = 0;
    }
    else if (flagChar === "1") {
      flag = 1;
    }
    else {
      return null;
    }

    skipOptionalSpacesOrDelimiter();
    return flag;
  }

  if (initialCommandIsMoveTo()) {
    while (hasMoreData()) {
      const pathSeg = parseSegment();
      if (pathSeg === null) break;
      pathData.push(pathSeg);
    }
  }

  return normalize ? reduce(absolutize(pathData)) : pathData;
}
