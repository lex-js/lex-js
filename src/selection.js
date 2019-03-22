const { byteToCharCP866 } = require('./cp866.js');

module.exports = class SelectionControl {
  constructor (app) {
    this.app = app;
  }

  clear () {
    this.app.state.selection = {
      set: false,
      started: false,
      x1: 0,
      y1: 0,
      x2: 0,
      y2: 0
    };
  }

  getSelectionText () {
    const { state, parser } = this.app;
    if (!state.selection.set) {
      return null;
    }

    var selection = state.selection,
        x1 = Math.min(selection.x1, selection.x2),
        x2 = Math.max(selection.x1, selection.x2),
        y1 = Math.min(selection.y1, selection.y2),
        y2 = Math.max(selection.y1, selection.y2),
        lines = state.file.lines,
        result = [];

    if (x1 == x2 || y1 == y2) {
      // Selection is empty
      return null;
    }

    for (var y = y1; y < y2; y++) {
      if (!!lines[y]) {
        var line = parser.parseLine(lines[y]);
        let lineResult = '';
        for (var x = x1; x < x2 && x < line.length; x++) {
          if (!!line[x]) {
            lineResult += byteToCharCP866[line[x].char];
          } else {
            // If selection is wider than the file itself,
            // pad the text with spaces.
            lineResult += " ";
          }
        }
        result.push(lineResult);
      }
    }

    return result.join('\n');
  }
};
