module.exports = class MobileUI {
  constructor (app) {
    this.app = app;
  }

  openMenu (showRemote) {
    this.setFileList(showRemote);
    document.getElementById('mobile-menu').style.display = 'block';
  }

  /** Set mobile UI file list contents
   */

  // TODO: move showRemote somewhere else
  async setFileList (showRemote = true) {
    var elem = document.getElementById('mobile-file-list');
    const list = await this.app.files.getFileList();

    // remove old entries
    elem.innerHTML = list.length ? ""
      : '<span id="no-local-files-warning">No local files</span>';

    // If no local files found, show remote list instead.
    if (!list.length && showRemote) {
      this.closeMenu();
      this.app.contentBrowser.show();
      return;
    }

    // cycle through file names and create appropriate elements
    list.forEach(fileName => {
      const container = document.createElement('div');
      container.className = 'mobile-file-item mobile-menu-item';

      const name = document.createElement('span');
      name.textContent = fileName;
      name.title = `Load ${fileName}`;
      name.className = 'mobile-file-name';
      name.addEventListener(
        'click',
        () => {
          this.app.files.loadLocal(fileName);
          this.closeMenu();
        }
      );

      const deleteFile = document.createElement('div');
      deleteFile.className = 'mobile-icon large mobile-delete-file';
      deleteFile.id = 'mobile-delete-file';
      deleteFile.title = `Delete ${fileName}`;
      deleteFile.addEventListener('click', () => {
        this.app.files.deleteFile(fileName);
        container.remove();
      });

      elem.appendChild(container);
      container.appendChild(name);
      container.appendChild(deleteFile);
    });
  }

  closeMenu () {
    document.getElementById('mobile-menu').style.display = 'none';
    this.app.render.update();
  }

  // Show/hide menu when scrolling up/down
  showMenu () {
    document.getElementById('mobile-menu-open').style.top = 0;
    document.getElementById('block-top').style.top = 0;
  }

  hideMenu () {
    document.getElementById('mobile-menu-open').style.top = '-100px';
    document.getElementById('block-top').style.top = '-100px';
  }
};
