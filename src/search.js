module.exports = class SearchControl {
  constructor(app) {
    this.app = app;
  }

  search(text, str) {
    switch (this.app.state.search.mode) {
      case "default":
        return this.searchDefault(text, str);
        break;
      case "case-insensitive":
        return this.searchCaseInsensitive(text, str);
        break;
      default:
        throw "SearchControl.search: incorrect mode";
    }
  }

  searchDefault(text, str) {
    var c,
      n = 0,
      line,
      r = [],
      tr = [],
      lines = text.split("\n"),
      tn = 0,
      lineNumbersWidth =
        this.app.state.numbers.width ||
        this.app.state.numbers.width + this.app.config.line_numbers_padding;

    // Remove ' ' & '-'
    // TODO: refactor;
    // Do not change lines at all:
    // create a new array of line lengths instead.
    for (var y = 0; y < lines.length; y++) {
      while (
        lines[y].length &&
        (lines[y].endsWith("-") || lines[y].endsWith(" "))
      ) {
        lines[y] = lines[y].slice(0, -1);
      }
    }

    for (var y = 0; y < lines.length; y++) {
      line = lines[y];
      var ix = 0;

      // затираем ' ' и '-' в начале строки
      while (ix < line.length && " -".indexOf(line[ix]) != -1) {
        ix++;
      }

      for (var x = ix; x < line.length; x++) {
        c = line[x];
        if (c != str[n]) {
          tr = []; // если очередной символ не совпал нужно сбросить
          n = 0; // счетчик символов и все предыдущие блоки
          tn = 0;
        } // Здесь не стоит else потому, что после обнуления n
        // может сразу начаться новое слово, удовлетворяющее поиску
        if (c == str[n]) {
          // очередная буква совпала
          if (n < str.length) {
            // полное совпадение короче строки, которую ищем
            n++; // добавляем один символ
            tn++;
          }
          if (n == str.length) {
            // слово найдено. Добавляем блок
            tr.push({
              line: y,
              start: x - tn + 1 + lineNumbersWidth,
              length: tn
            });
            r.push(tr); // добавляем все блоки в результат
            tr = []; // обнуляем список блоков
            n = 0; // обнуляем счетчик совпадающих символов
            tn = 0; // обнуляем счетчик совпадающих символов в текущем блоке
          }
        }
      }

      if (n) {
        // если достигнут конец строки,
        // и число совпадающих подряд символов
        // не 0, добавить блок
        tr.push({
          line: y,
          start: x - tn + lineNumbersWidth,
          length: tn
        });
        tn = 0;
      }
    }

    return r;
  }

  searchCaseInsensitive(text, str) {
    // make case-insensitive
    text = text.toLowerCase();
    str = str.toLowerCase();
    return this.searchDefault(text, str);
  }

  // DOM functions
  activateSearchField() {
    this.app.state.search.active = true;
    var el = document.getElementById("search-field");
    var el2 = document.getElementById("block-search");
    el2.style.zIndex = 11;

    setTimeout(function() {
      el.focus();
    }, 10);

    this.app.render.update();
  }

  deactivateSearchField() {
    this.app.state.search.active = false;
    var el = document.getElementById("search-field");
    var el2 = document.getElementById("block-search");
    el2.style.zIndex = 0;
    el.blur();
    this.app.render.update();
  }

  clearSearchField() {
    var el = document.getElementById("search-field");
    el.value = "";
    this.app.render.update();
  }

  updateSearchBlock() {
    var number =
      this.app.state.search.results.length == 0
        ? 0
        : this.app.state.search.activeResult + 1;
    var total = number ? this.app.state.search.results.length : 0;

    document.getElementById("search-number").textContent = number;
    document.getElementById("search-total").textContent = total;
  }

  jumpToIndex(index) {
    if (index < this.app.state.search.results.length - 1) {
      this.app.state.search.activeResult = index;
    }
    if (!this.app.state.search.results[index]) {
      this.app.state.search.activeResult =
        this.app.state.search.results.length - 1;
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
    if (
      line < this.app.state.screen.y ||
      line > this.app.state.screen.y + this.app.state.screen.h / 2
    ) {
      this.app.screen.setScrollY(line);
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

  flush() {
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
      str = document.getElementById("search-field").value;
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
