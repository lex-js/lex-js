/* global require module fetch preloadedFonts */
const { string2BinArray, Uint8Array2BinArray } = require('./coders');

module.exports = class FontControl {
  constructor (app) {
    this.app = app;
  }

  async loadFont (path, ix) {
    const setFont = (ix, binArray) => {
      this.app.state.fonts[ix] = {
        source: binArray,
        bitmaps: {}
      };
    };

    if (typeof preloadedFonts !== 'undefined' && preloadedFonts[ix]) {
      setFont(ix, string2BinArray(preloadedFonts[ix]));
      this.app.log(`Loaded font ${ix} from preloaded fonts`);
      return;
    }

    const response = await fetch(path);
    const buffer = await response.arrayBuffer();
    setFont(ix, Uint8Array2BinArray(new Uint8Array(buffer)));
    this.app.log(`Loaded font ${ix} from remote path ${path}`);
  }
};
