/* global module */

module.exports = class Render {
  constructor (app) {
    this.app = app;
    this.resetState();
  }

  resetState () {
    this.state = null;
  }

  setFontBGColor (bg_color) {
    this.app.config.bg_color = bg_color;
    this.update();
  }

  setFontFGColor (fg_color) {
    this.app.config.fg_color = fg_color;
    this.update();
  }

  makeImageData () {
    if (
      this.app.config.load_fonts_from_source &&
        !this.app.state.fonts.every(f => !!f.source) // if some fonts haven't loaded
    ) {
      return;
    }

    const { config, state } = this.app;
    const fontWidth = config.font_width;
    const fontHeight = config.font_height;
    const canvas = document.createElement('canvas');
    canvas.width = fontWidth;
    canvas.height = fontHeight;
    const context = canvas.getContext('2d');
    const imageData = context.getImageData(0, 0, fontWidth, fontHeight);

    state.fonts.forEach((font, ix) => {
      for (let charCode = 0; charCode < 256; charCode++) {
        // bit index from where the bitmap starts
        const shift = fontWidth * fontHeight * charCode;
        const charImageData = context.createImageData(imageData);
        const char = String.fromCharCode(charCode);

        for (let y = 0; y < fontHeight; y++) {
          for (let x = 0; x < fontWidth; x++) {
            const bits = (
              // extract bits corresponding to (y, x)-point
              font.source[shift + y * fontWidth + x] ?
                config.fg_color :
                config.bg_color
            );
            const pos = (fontWidth * y + x) * 4;
            // r, g, b, a
            charImageData.data[pos] = bits[0];
            charImageData.data[pos + 1] = bits[1];
            charImageData.data[pos + 2] = bits[2];
            charImageData.data[pos + 3] = bits[3];
          }
        }

        state.fonts[ix].bitmaps[charCode] = charImageData;
      }
    });
  }

  underlineChar (char, font, x, y, context) {
    const { config, state } = this.app;

    // Mixing bitmaps of  `_` and `char` to create underline effect
    var underscoreID = state.fonts[4].bitmaps[95]; // `_`
    var charID = state.fonts[font].bitmaps[char];
    var mixedID = context.createImageData(underscoreID);
    for (var i = 0; i < underscoreID.data.length; i += 4) {
      // iterate through r, g, b, a
      // TODO: stick to monochrome images and save 3 iterations?
      for (var j = 0; j < 4; j++) {
        if (
          underscoreID.data[i + j] == config.fg_color[j] ||
            charID.data[i + j] == config.fg_color[j]
        ) {
          mixedID.data[i + j] = config.fg_color[j];
        } else {
          mixedID.data[i + j] = config.bg_color[j];
        }
      }
    }

    context.putImageData(
      mixedID,
      x * config.font_width,
      y * config.font_height
    );
  }

  updateCanvas (context) {
    const { config, screen, state, parser, scroll } = this.app;

    let textWidth = screen.w,
        textHeight = screen.h,
        pixelWidth = textWidth * config.font_width,
        pixelHeight = textHeight * config.font_height,
        xShift = scroll.x,
        yShift = scroll.y,
        start = 0,
        end = textHeight;

    // Redraw only recently appeared area.
    if (this.state) {
      var { x: old_x, y: old_y } = this.state,
          x_shift = old_x - xShift,
          y_shift = old_y - yShift;

      if (Math.abs(y_shift) < textHeight) {
        var id = context.getImageData(0, 0, pixelWidth, pixelHeight);
        context.putImageData(
          id,
          x_shift * config.font_width,
          y_shift * config.font_height
        );
        if (y_shift < 0) {
          start = textHeight + y_shift;
          end = textHeight;
        } else if (y_shift > 0) {
          start = 0;
          end = y_shift;
        }
      }
    } else {
      context.fillRect(0, 0, pixelWidth, pixelHeight);
    }

    // Clear new area
    context.fillRect(
      0,
      start * config.font_height,
      pixelWidth,
      (end - start) * config.font_height
    );

    this.state = { x: xShift, y: yShift };

    const linesCount = state.file.lines.length;

    for (let y = start; y < end && y < textHeight && y + yShift < linesCount; y++) {
      let line = state.file.lines[y + yShift];
      if (typeof line == 'undefined') {
        break; // TODO: impossible?
      }

      line = parser.parseLine(line);
      for (let x = 0; x < line.length; x++) {
        let char = line[x].char;
        let underline = line[x].underline;
        let font = line[x].font;
        if (state.fonts[font].bitmaps[char]) {
          context.putImageData(
            state.fonts[font].bitmaps[char],
            (x - xShift) * config.font_width,
            y * config.font_height
          );
          if (underline) {
            this.underlineChar(char, font, x - xShift, y, context);
          }
        }
      }
    }
  }

  updateSelection (context) {
    const { config, state, scroll } = this.app;
    if (state.selection.set) {
      var t = config.selection_fill_color;
      context.fillStyle =
        'rgba(' + t[0] + ',' + t[1] + ',' + t[2] + ',' + t[3] / 255 + ')';
      context.fillRect(
        (state.selection.x1 - scroll.x) * config.font_width,
        (state.selection.y1 - scroll.y) * config.font_height,
        (state.selection.x2 - state.selection.x1) * config.font_width,
        (state.selection.y2 - state.selection.y1) * config.font_height
      );
    }
    this.resetState();
  }

  updateSearchResults (context) {
    const { screen, scroll, config, state } = this.app;
    const { search } = state;

    if (search.active == true) {
      // TODO: consider exiting the loops after the last result
      // visible on screen.
      search.results.forEach((blocks, resultIndex) => {
        blocks.forEach(block => {
          const scrollY = scroll.y; // it is a getter, not a value
          if (block.line >= scrollY && block.line <= scrollY + screen.h) {
            var style = config[
              'search_' +
                (resultIndex == search.activeResult ? 'active_' : '') +
                'fill_color'
            ];

            context.fillStyle = (
              'rgba(' + style[0] + ','
                      + style[1] + ','
                      + style[2] + ','
                      + style[3] / 255 + ')'
            );

            context.fillRect(
              (block.start - scroll.x) * config.font_width,
              (block.line - scroll.y) * config.font_height,
              block.length * config.font_width,
              config.font_height
            );
          }
        });
      });
    }

    this.resetState();
  }

  update () {
    const { config, state, ui } = this.app;
    var canvas = document.getElementById('canvas');
    var context = canvas.getContext('2d');

    context.fillStyle =
      'rgba(' +
      config.bg_color[0] +
      ',' +
      config.bg_color[1] +
      ',' +
      config.bg_color[2] +
      ',' +
      config.bg_color[3] +
      ')';

    ui.updateBottomBlock();
    this.updateCanvas(context);
    this.updateSelection(context);
    this.updateSearchResults(context);
  }
};
