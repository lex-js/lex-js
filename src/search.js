/* global module */
module.exports = class SearchControl {
  constructor(app) {
    this.app = app;
    this.searchField = document.getElementById('search-field');
    this.container = document.getElementById('block-search');
  }

  search(text, str) {
    switch (this.app.state.search.mode) {
      case 'default':
        return this.searchDefault(text, str);
        break;
      case 'case-insensitive':
        return this.searchCaseInsensitive(text, str);
        break;
      default:
        throw "SearchControl.search: incorrect mode";
    }
  }

  searchDefault(text, str) {
    const { state, config } = this.app;

    let char,
      // Number of matching symbols
      matching = 0,
      result = [],
      blocks = [],
      lines = text.split('\n'),
      blockLength = 0,
      lineNumbersWidth = state.numbers.set ? (
        state.numbers.width + config.line_numbers_padding
      ) : 0;

    for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
      const line = lines[lineNumber];
      // Skip ' ' and '-' at the line end.
      const skipEnd = line.match(/[- ]+$/g);
      const length = skipEnd !== null ? line.length - skipEnd[0].length : line.length;
      // Skip ' ' and '-' at the line front.
      const skipStart = line.match(/^[- ]/g);
      let ix = skipStart !== null ? skipStart[0].length : 0;

      // Iterate through the current line.
      for (; ix < length; ix++) {
        char = line[ix];
        // If current character does not match the search string,
        // clear matching blocks and reset the counters.
        if (char != str[matching]) {
          blocks = [];
          matching = 0;
          blockLength = 0;
        } // We've reset the `matching` counter - hence no `else` after this block.

        // If current character matches the corresponding character of the
        // search string
        if (char == str[matching]) {
          // Add it.
          if (matching < str.length) {
            matching++;
            blockLength++;
          }

          // Check if we are done.
          if (matching == str.length) {
            // Add a block
            blocks.push({
              line: lineNumber,
              start: ix - blockLength + 1 + lineNumbersWidth,
              length: blockLength
            });
            // Save all blocks to `result`
            result.push(blocks);
            // Reset the state.
            blocks = [];
            matching = 0;
            blockLength = 0;
          }
        }
      }

      // If after the end of line we have only partial match,
      // we add a block and proceed to the next line.
      if (matching > 0) {
        blocks.push({
          line: lineNumber,
          start: ix - blockLength + lineNumbersWidth,
          length: blockLength
        });
        blockLength = 0;
      }
    }

    return result;
  }

  searchCaseInsensitive(text, str) {
    // make case-insensitive
    text = text.toLowerCase();
    str = str.toLowerCase();
    return this.searchDefault(text, str);
  }

  // DOM functions
  activateSearchField() {
    const { state } = this.app;
    state.search.active = true;
    this.container.style.display = 'block';

    setTimeout(() => {
      this.searchField.focus();
    }, 10);

    this.app.render.update();
  }

  deactivateSearchField() {
    this.app.state.search.active = false;
    this.container.style.display = 'none';
    this.searchField.blur();
  }

  clearSearchField() {
    this.searchField.value = '';
  }

  updateSearchBlock() {
    var number =
      this.app.state.search.results.length == 0 ? 0 : this.app.state.search.activeResult + 1;
    var total = number ? this.app.state.search.results.length : 0;

    document.getElementById('search-number').textContent = number;
    document.getElementById('search-total').textContent = total;
  }

  jumpToIndex(index) {
    if (index < this.app.state.search.results.length - 1) {
      this.app.state.search.activeResult = index;
    }
    if (!this.app.state.search.results[index]) {
      this.app.state.search.activeResult = this.app.state.search.results.length - 1;
      return;
    }
    this.scrollToCurrentResult();
  }

  scrollToCurrentResult() {
    var index = this.app.state.search.activeResult,
      arr = this.app.state.search.results[index];

    if (!arr) return;

    // TODO: correct minimum line number detection
    var line = arr[arr.length - 1].line - 1;
    const scrollY = this.app.scroll.y;
    if (line < scrollY || line > scrollY + this.app.screen.h / 2) {
      this.app.scroll.y = line;
      this.app.render.update();
    }
  }

  searchNext() {
    const { search } = this.app.state;

    if (search.activeResult < search.results.length - 1) {
      search.activeResult++;
    } else {
      search.activeResult = 0;
    }
    this.jumpToIndex(search.activeResult);
    this.updateSearchBlock();
  }

  searchPrevious() {
    const { search } = this.app.state;

    if (search.activeResult > 0) {
      search.activeResult--;
    } else {
      search.activeResult = search.results.length - 1;
    }

    this.jumpToIndex(search.activeResult);
    this.updateSearchBlock();
  }

  close() {
    this.app.state.search.active = false;
    this.app.state.search.activeResult = 0;
    this.app.state.search.results = [];
    this.updateSearchBlock();
    this.clearSearchField();
    this.deactivateSearchField();
  }

  // main functions
  performSearch() {
    this.performSearchByFunction();
    this.updateSearchBlock();
    this.app.render.update();
  }

  performSearchByFunction() {
    var text = this.app.state.index.text,
      str = this.searchField.value;
    this.app.state.search.results = this.search(text, str);
    this.scrollToCurrentResult();
  }

  rebuildIndex() {
    const { state, parser, coders } = this.app;

    // clear old value
    state.index.text = "";
    state.index.maxlen = 0;
    for (var i = 0; i < state.file.lines.length; i++) {
      var parsed = parser.parseLine(state.file.lines[i]),
        line = coders.Uint8ArrayToString(parsed.map(c => c.char));
      state.index.text += line + "\n";
      if (state.index.maxlen < line.length) {
        state.index.maxlen = line.length;
      }
    }
  }
};
