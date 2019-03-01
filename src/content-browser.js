module.exports = class ContentBrowser {
  constructor (app) {
    this.app = app;
  }

  async show () {

    const json = await this.update().catch(err => {
      this.app.log('ContentBrowser.show', err);
      this.app.alert(
        "[Error while loading contents]: is webserver up and running?"
      );

    });

    await this.load(json);
    this.app.state.content_list.active = true;

    document.getElementById('content-list-container').style.display = 'block';
  }

  hide () {
    this.app.state.content_list.active = false;
    document.getElementById('content-list-container').style.display = 'none';
  }

  toggle () {
    this[this.app.state.content_list.active ? 'hide' : 'show']();
  }

  scrollIfNeeded (element, container) {
    if (element.offsetTop < container.scrollTop) {
      container.scrollTop = element.offsetTop;
    } else {
      var offsetBottom = element.offsetTop + element.offsetHeight;
      var scrollBottom = container.scrollTop + container.offsetHeight;
      if (offsetBottom > scrollBottom) {
        container.scrollTop = offsetBottom - container.offsetHeight;
      }
    }
  }

  // where = 'top' | 'bottom' | number
  navigate (where) {
    var trs = Array.from(document.querySelectorAll('#content-list-table > tr'));

    const setActive = el => {
      let old = document.querySelector('.content-list-active');
      if (old) {
        old.classList.remove('content-list-active');
      }
      el.classList.add('content-list-active');

      this.scrollIfNeeded(el, document.querySelector('#content-list-container'));
    };

    if (!document.querySelector('.content-list-active')) {
      setActive(trs[0]);
      return;
    }

    if ('top' === where) {
      setActive(trs[0]);
    } else if ('bottom' === where) {
      setActive(trs.pop());
    } else {
      var active = 0;
      for (var el of trs) {
        if (el.matches('.content-list-active')) {
          break;
        }
        active++;
      }

      var to = active + where;
      if (to < 0) {
        to = 0;
      } else if (to >= trs.length) {
        to = trs.length - 1;
      }

      setActive(trs[to]);
    }
  }

  async update () {
    document.getElementById('content-list').textContent = "Loading...";

    return await fetch(
        this.app.config.content_list_url +
        this.app.state.content_list.path
    ).then(
      response => response.text()
    ).then(
      text => JSON.parse(text)
    );
  }

  load (list) {
    const { ui, state, config, files } = this.app;

    var content_list = document.getElementById('content-list');
    content_list.innerHTML = '';

    var table = document.createElement('table');
    table.id = 'content-list-table';

    if (state.content_list.path.length) {
      list = [{ type: 'parent' }].concat(list);
    }

    const addEntry = sth => {
      var row = document.createElement('tr');

      const filename = sth.name;

      // Push icon (image url will be set later).
      const icon_td = document.createElement('td');
      const icon = document.createElement('div');
      icon.className = 'content-list-icon content-list-icon-' + sth.type;
      icon_td.appendChild(icon);
      icon_td.style.width = '22px';
      row.appendChild(icon_td);

      var name_td = document.createElement('td');
      row.appendChild(name_td);

      // sth.type is 'directory' | 'file' | 'parent'
      if (['directory', 'file'].includes(sth.type)) {
        // Name
        name_td.textContent = filename;

        // Select currently open file.
        if (state.content_list.path + '/' + filename == state.file.remote_name) {
          row.classList.add('content-list-active');
        }

        // Modification time
        if (!state.is_mobile) {
          var modTime = document.createElement('td');
          modTime.className = 'file-list-mod-time';
          modTime.textContent = new Date(sth.modified)
            .toISOString()
            .slice(0, 16)
            .replace(/T/, ' ');
          row.appendChild(modTime);
        }

      } else {
        name_td.textContent = '..';
      }

      if (sth.type === 'directory') {

        row.onclick = () => {
          state.content_list.path += '/' + filename;

          if (state.content_list.path[0] === '/') {
            state.content_list.path = state.content_list.path.slice(1);
          }

          this.show();
        };

      } else if (sth.type === 'file') {

        row.onclick = async () => {
          var url = config.content_real_path +
              state.content_list.path + '/' + filename;

          await files.loadRemote(
            url,
            state.content_list.path + '/' + filename
          );
          ui.setWindowTitle(filename);
          state.file.name = filename;
          this.hide();
        };

      } else {
        row.onclick = () => {
          state.content_list.path =
            state.content_list.path
            .split('/')
            .slice(0, -1)
            .join('/');
          this.show();
        };
      }

      table.appendChild(row);
    };

    list.forEach(addEntry);
    content_list.appendChild(table);
  }
};
