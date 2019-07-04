const commandsMap = {Z: "Z", M: "M", L: "L", C: "C", Q: "Q", A: "A", H: "H", V: "V", S: "S", T: "T", z: "Z", m: "m", l: "l", c: "c", q: "q", a: "a", h: "h", v: "v", s: "s", t: "t"};

export default class Source {

  constructor(string) {
    this._string = string;
    this._currentIndex = 0;
    this._endIndex = this._string.length;
    this._prevCommand = null;
    this._skipOptionalSpaces();
  }

  parseSegment() {
    var char = this._string[this._currentIndex];
    var command = commandsMap[char] ? commandsMap[char] : null;

    if (command === null) {
      // Possibly an implicit command. Not allowed if this is the first command.
      if (this._prevCommand === null) {
        return null;
      }

      // Check for remaining coordinates in the current command.
      if (
        (char === "+" || char === "-" || char === "." || (char >= "0" && char <= "9")) && this._prevCommand !== "Z"
      ) {
        if (this._prevCommand === "M") {
          command = "L";
        }
        else if (this._prevCommand === "m") {
          command = "l";
        }
        else {
          command = this._prevCommand;
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
      this._currentIndex += 1;
    }

    this._prevCommand = command;

    var values = null;
    var cmd = command.toUpperCase();

    if (cmd === "H" || cmd === "V") {
      values = [this._parseNumber()];
    }
    else if (cmd === "M" || cmd === "L" || cmd === "T") {
      values = [this._parseNumber(), this._parseNumber()];
    }
    else if (cmd === "S" || cmd === "Q") {
      values = [this._parseNumber(), this._parseNumber(), this._parseNumber(), this._parseNumber()];
    }
    else if (cmd === "C") {
      values = [
        this._parseNumber(),
        this._parseNumber(),
        this._parseNumber(),
        this._parseNumber(),
        this._parseNumber(),
        this._parseNumber()
      ];
    }
    else if (cmd === "A") {
      values = [
        this._parseNumber(),
        this._parseNumber(),
        this._parseNumber(),
        this._parseArcFlag(),
        this._parseArcFlag(),
        this._parseNumber(),
        this._parseNumber()
      ];
    }
    else if (cmd === "Z") {
      this._skipOptionalSpaces();
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

  hasMoreData() {
    return this._currentIndex < this._endIndex;
  }

  peekSegmentType() {
    var char = this._string[this._currentIndex];
    return commandsMap[char] ? commandsMap[char] : null;
  }

  initialCommandIsMoveTo() {
    // If the path is empty it is still valid, so return true.
    if (!this.hasMoreData()) {
      return true;
    }

    var command = this.peekSegmentType();
    // Path must start with moveTo.
    return command === "M" || command === "m";
  }

  _isCurrentSpace() {
    var char = this._string[this._currentIndex];
    return char <= " " && (char === " " || char === "\n" || char === "\t" || char === "\r" || char === "\f");
  }

  _skipOptionalSpaces() {
    while (this._currentIndex < this._endIndex && this._isCurrentSpace()) {
      this._currentIndex += 1;
    }

    return this._currentIndex < this._endIndex;
  }

  _skipOptionalSpacesOrDelimiter() {
    if (
      this._currentIndex < this._endIndex &&
      !this._isCurrentSpace() &&
      this._string[this._currentIndex] !== ","
    ) {
      return false;
    }

    if (this._skipOptionalSpaces()) {
      if (this._currentIndex < this._endIndex && this._string[this._currentIndex] === ",") {
        this._currentIndex += 1;
        this._skipOptionalSpaces();
      }
    }
    return this._currentIndex < this._endIndex;
  }

  // Parse a number from an SVG path. This very closely follows genericParseNumber(...) from
  // Source/core/svg/SVGParserUtilities.cpp.
  // Spec: http://www.w3.org/TR/SVG11/single-page.html#paths-PathDataBNF
  _parseNumber() {
    var exponent = 0;
    var integer = 0;
    var frac = 1;
    var decimal = 0;
    var sign = 1;
    var expsign = 1;
    var startIndex = this._currentIndex;

    this._skipOptionalSpaces();

    // Read the sign.
    if (this._currentIndex < this._endIndex && this._string[this._currentIndex] === "+") {
      this._currentIndex += 1;
    }
    else if (this._currentIndex < this._endIndex && this._string[this._currentIndex] === "-") {
      this._currentIndex += 1;
      sign = -1;
    }

    if (
      this._currentIndex === this._endIndex ||
      (
        (this._string[this._currentIndex] < "0" || this._string[this._currentIndex] > "9") &&
        this._string[this._currentIndex] !== "."
      )
    ) {
      // The first character of a number must be one of [0-9+-.].
      return null;
    }

    // Read the integer part, build right-to-left.
    var startIntPartIndex = this._currentIndex;

    while (
      this._currentIndex < this._endIndex &&
      this._string[this._currentIndex] >= "0" &&
      this._string[this._currentIndex] <= "9"
    ) {
      this._currentIndex += 1; // Advance to first non-digit.
    }

    if (this._currentIndex !== startIntPartIndex) {
      var scanIntPartIndex = this._currentIndex - 1;
      var multiplier = 1;

      while (scanIntPartIndex >= startIntPartIndex) {
        integer += multiplier * (this._string[scanIntPartIndex] - "0");
        scanIntPartIndex -= 1;
        multiplier *= 10;
      }
    }

    // Read the decimals.
    if (this._currentIndex < this._endIndex && this._string[this._currentIndex] === ".") {
      this._currentIndex += 1;

      // There must be a least one digit following the .
      if (
        this._currentIndex >= this._endIndex ||
        this._string[this._currentIndex] < "0" ||
        this._string[this._currentIndex] > "9"
      ) {
        return null;
      }

      while (
        this._currentIndex < this._endIndex &&
        this._string[this._currentIndex] >= "0" &&
        this._string[this._currentIndex] <= "9"
      ) {
        frac *= 10;
        decimal += (this._string.charAt(this._currentIndex) - "0") / frac;
        this._currentIndex += 1;
      }
    }

    // Read the exponent part.
    if (
      this._currentIndex !== startIndex &&
      this._currentIndex + 1 < this._endIndex &&
      (this._string[this._currentIndex] === "e" || this._string[this._currentIndex] === "E") &&
      (this._string[this._currentIndex + 1] !== "x" && this._string[this._currentIndex + 1] !== "m")
    ) {
      this._currentIndex += 1;

      // Read the sign of the exponent.
      if (this._string[this._currentIndex] === "+") {
        this._currentIndex += 1;
      }
      else if (this._string[this._currentIndex] === "-") {
        this._currentIndex += 1;
        expsign = -1;
      }

      // There must be an exponent.
      if (
        this._currentIndex >= this._endIndex ||
        this._string[this._currentIndex] < "0" ||
        this._string[this._currentIndex] > "9"
      ) {
        return null;
      }

      while (
        this._currentIndex < this._endIndex &&
        this._string[this._currentIndex] >= "0" &&
        this._string[this._currentIndex] <= "9"
      ) {
        exponent *= 10;
        exponent += (this._string[this._currentIndex] - "0");
        this._currentIndex += 1;
      }
    }

    var number = integer + decimal;
    number *= sign;

    if (exponent) {
      number *= Math.pow(10, expsign * exponent);
    }

    if (startIndex === this._currentIndex) {
      return null;
    }

    this._skipOptionalSpacesOrDelimiter();

    return number;
  }

  _parseArcFlag() {
    if (this._currentIndex >= this._endIndex) {
      return null;
    }

    var flag = null;
    var flagChar = this._string[this._currentIndex];

    this._currentIndex += 1;

    if (flagChar === "0") {
      flag = 0;
    }
    else if (flagChar === "1") {
      flag = 1;
    }
    else {
      return null;
    }

    this._skipOptionalSpacesOrDelimiter();
    return flag;
  }
}
