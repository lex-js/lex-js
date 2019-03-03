module.exports = class UI {
  constructor(app) {
    this.app = app;
  }

  setWindowTitle(fileName) {
    document.title = fileName + " - " + this.app.config.app_full_name;
  }

  showGotoLinePrompt() {
    var userInput = prompt("Enter line number", this.app.state.screen.y);

    if (userInput == null) return;
    userInput = parseInt(userInput);
    if (isNaN(userInput)) {
      this.app.alert("Incorrect line number!");
      return;
    }
    this.app.screen.setScrollY(userInput);
    this.app.render.update();
  }

  async updateFileList() {
    var el = document.getElementById("file-list");

    const list = (await this.app.files.getFileList()).sort((a, b) => {
      return a.toLowerCase().localeCompare(b.toLowerCase());
    });

    el.innerHTML = "";
    list.forEach(filename => {
      var o = document.createElement("option");
      o.textContent = filename;
      el.appendChild(o);
    });

    // hide if no files, show otherwise
    var displayStyle = list.length ? "inline-block" : "none";
    ["file-list", "button-load", "button-delete"].forEach(e => {
      document.getElementById(e).style.display = displayStyle;
    });
  }

  // update scroll position info
  updateBottomBlock() {
    var y = this.app.state.screen.y;
    var l = this.app.state.file.lines.length - 1;
    l = l ? l : 1; // prevent division by zero
    document.getElementById("line-number").textContent = y;
    document.getElementById("line-count").textContent = l;
    document.getElementById("scroll-percentage").textContent =
      Math.ceil((y / l) * 100) + "%";
  }

  duplicateWindow() {
    window.open(document.location.href, "_blank");
  }
};
