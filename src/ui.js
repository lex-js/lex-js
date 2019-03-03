module.exports = class UI {
  constructor (app) {
    this.app = app;
  }

  setWindowTitle (fileName) {
    document.title = fileName + " - " + this.app.config.app_full_name;
  }

  showGotoLinePrompt () {
    var userInput = prompt("Enter line number", this.app.scroll.y);

    if (userInput == null) return;
    userInput = parseInt(userInput);
    if (isNaN(userInput)) {
      this.app.alert("Incorrect line number!");
      return;
    }

    this.app.scroll.y = userInput;
    this.app.render.update();
  }

  async updateFileList () {
    var el = document.getElementById("file-list");

    const list = (
      await this.app.files.getFileList()
    ).sort((a, b) => {
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
  updateBottomBlock () {
    document.getElementById("line-number").textContent = this.app.scroll.y;
    document.getElementById("line-count").textContent = (
      this.app.state.file.lines.length - 1
    );
  }

  duplicateWindow () {
    window.open(document.location.href, "_blank");
  }
};
