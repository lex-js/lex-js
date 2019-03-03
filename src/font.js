const { string2BinArray, Uint8Array2BinArray } = require("./coders");

module.exports = class FontControl {
  constructor(app) {
    this.app = app;
  }

  setFont(ix, binArray) {
    this.app.state.fonts[ix] = {
      source: binArray,
      bitmaps: {}
    };
  }

  async loadFont(path, ix) {
    if (typeof preloadedFonts !== "undefined" && preloadedFonts[ix]) {
      this.setFont(ix, string2BinArray(preloadedFonts[ix]));
      this.app.log(`Loaded font ${ix} from preloaded fonts`);
      return;
    }

    const response = await fetch(path);
    const buffer = await response.arrayBuffer();
    this.setFont(ix, Uint8Array2BinArray(new Uint8Array(buffer)));
    this.app.log(`Loaded font ${ix} from remote path ${path}`);
  }
};
