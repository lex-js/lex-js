module.exports = class Parser {
  constructor (app) {
    this.app = app;
  }

  parseLine (line) {
    // Transforms the byte array into a list of objects.
    // Each object is exactly 1 character on the screen.
    var r = [],
        font = 0,
        command = false,
        underline = false,
        config = this.app.config;

    for (var x = 0; x < line.length; x++) {
      var char = line[x];
      if (command) {
        command = 0;

        switch (char) {
        case config.parser.underline_false:
          underline = false;
          break;
        case config.parser.underline_true:
          underline = true;
          break;
        case config.parser.empty_line:
          return r;
          break;
        default:
          if (typeof config.parser.fonts[char] !== "undefined") {
            font = config.parser.fonts[char];
          }
          break;
        }
      } else {
        if (char === 255) {
          command = true;
        } else {
          r.push({
            char: char,
            underline: underline,
            font: font
          });
        }
      }
    }
    return r;
  }

  getLineNumberBytes (num, width) {
    var r = "                    ";
    var result = [];
    num = num + "";

    r = r.substr(0, width - num.length);
    r += num;
    for (var i = 0; i < r.length; i++) {
      if (r[i] == " ") {
        // space
        result.push(32);
      } else {
        // number by ASCII code
        result.push(r[i] * 1 + 48);
      }
    }

    // separator
    result.push(179);
    // space
    result.push(32);
    return result;
  }
};
