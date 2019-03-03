const { saveAs } = require("file-saver");

module.exports = class Export {
  constructor(app) {
    this.app = app;
    this.saveAs = saveAs;
  }

  // get canvas for rectangle area
  makeCanvas(x1, x2, y1, y2) {
    var config = this.app.config,
      state = this.app.state,
      w = x2 - x1,
      h = y2 - y1,
      rw = w * config.font_width,
      rh = h * config.font_height;

    // create new temporary canvas
    var canvas = document.createElement("canvas");
    canvas.width = rw;
    canvas.height = rh;
    var context = canvas.getContext("2d"),
      imageData = context.createImageData(rw, rh); // eslint-disable-line no-unused-vars

    // fill context with default color
    // (otherwise it remains transparent)
    context.fillStyle =
      "rgba(" +
      config.bg_color[0] +
      "," +
      config.bg_color[1] +
      "," +
      config.bg_color[2] +
      "," +
      config.bg_color[3] +
      ")";
    context.fillRect(0, 0, rw, rh);

    // loop through chars
    for (var y = y1; y < y2 && y < state.file.lines.length; y++) {
      var line = state.file.lines[y];

      // TODO: remove
      if (typeof line == "undefined") break;

      line = this.app.parser.parseLine(line);
      for (var x = x1; x < line.length && x < x2; x++) {
        var char = line[x].char,
          underline = line[x].underline,
          font = line[x].font;
        if (state.fonts[font].bitmaps[char]) {
          context.putImageData(
            state.fonts[font].bitmaps[char],
            (x - x1) * config.font_width,
            (y - y1) * config.font_height
          );
          if (underline) {
            this.app.render.underlineChar(char, font, x - x1, y - y1, context);
          }
        }
      }
    }
    return canvas;
  }

  // exports selection to PNG file
  toPNG() {
    if (!this.app.state.selection.set) return;
    var s = this.app.state.selection;
    var canvas = this.makeCanvas(
      Math.min(s.x1, s.x2),
      Math.max(s.x1, s.x2),
      Math.min(s.y1, s.y2),
      Math.max(s.y1, s.y2)
    );

    canvas.toBlob(blob => {
      this.saveAs(blob, this.exportFileName());
    });

    if (this.app.config.export_clear_selection) this.app.selection.clear();
  }

  // construct export file name
  // TODO: add line number in file name
  exportFileName(ext) {
    const state = this.app.state;

    return (
      this.app.config.export_png_file_name_prefix +
      (state.file.name ? state.file.name : "local")
        .trim()
        .replace(/[^a-z0-9]/gi, "_") // TODO: include alphabets other than latin
        .replace(/_{2,}/gi, "_") +
      ".png"
    );
  }
};
