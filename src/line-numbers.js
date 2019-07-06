/* global module */

module.exports = class LineNumbers {
  constructor(app) {
    this.app = app;
  }

  remove() {
    const { config, state, render, search, scroll, screen } = this.app;

    for (var i = 0; i < state.file.lines.length; i++) {
      state.file.lines[i] = new Uint8Array(
        Array.prototype.slice
          .call(state.file.lines[i], state.numbers.width + 2)
      );
    }
    state.index.maxlen -= state.numbers.width + config.line_numbers_padding;
    state.numbers.set = false;
    state.numbers.width = 0;
    search.close();
    screen.update();
    scroll.update();
    render.update();
  }

  add() {
    const { config, state, render, search, parser, scroll, screen } = this.app;

    state.numbers.width = (state.file.lines.length + "").length + 1;
    state.numbers.set = true;

    for (var i = 0; i < state.file.lines.length; i++) {
      state.file.lines[i] = new Uint8Array(
        parser
          .getLineNumberBytes(i, state.numbers.width)
          .concat(Array.prototype.slice.call(state.file.lines[i]))
      );
    }

    state.index.maxlen += state.numbers.width + config.line_numbers_padding;
  }

  toggle() {
    const { state } = this.app;

    if (state.numbers.set) {
      this.remove();
    } else {
      this.add();
    }
  }
};
