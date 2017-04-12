var GUIControl = {

    setWindowTitle: function (fileName) {
        document.title = fileName + ' - ' + config.app_full_name;
    },

    showGotoLinePrompt: function () {
        var userInput = prompt(_('Enter line number'), lex.screen.y);

        if (userInput == null) return;
        userInput = parseInt(userInput);
        if (isNaN(userInput)) {
            alert(_('Incorrect line number!'));
            return;
        }
        ScreenControl.setScrollY(userInput);
        DrawControl.redrawAll();
    },

    updateFileList: function () {
        var el = document.getElementById('file-list');

        FileControl.getFileList( function (arr) {
            el.innerHTML = '';
            // case-insensitive sorting
            arr = arr.sort(function (a, b) {
                return a.toLowerCase().localeCompare(b.toLowerCase());
            });
            arr.map(function (filename) {
                var o = document.createElement('option');
                o.textContent = filename;
                el.appendChild(o);
            });
        })
    },

    updateBottomBlock: function () {
        var y = lex.screen.y;
        var l = lex.file.lines.length - 1;
        l = l ? l : 1 // prevent division by zero
        document.getElementById('line-number').textContent = y;
        document.getElementById('line-count').textContent  = l;
        document.getElementById('scroll-percentage').textContent = Math.ceil(y / l * 100) + '%';
    },
}

var Content = {

    show: function () {
        lex.content_list.active = true;

        this.update(this.load, function (err) {
            if (err instanceof Error) {
                console.log(err);
            } else if (err) {
                alert('Can\'t get directory hierarchy from server: error ' + err);
            } else if (err == 0) {
                alert("[Can't parse response JSON] You should set up the webserver with PHP support to use content listing.");
            }
        });

        document.getElementById('content-list-container').style.display = 'block';
    },

    hide: function () {
        lex.content_list.active = false;
        document.getElementById('content-list-container').style.display = 'none';
    },

    toggle: function () {
        Content[lex.content_list.active ? 'hide' : 'show']();
    },

    update: function (callback, err_callback) {
        document.getElementById('content-list').textContent = 'Loading...';

        var req = new XMLHttpRequest();
        var url = config.content_list_url + lex.content_list.path;

        req.open('GET', url, true);
        req.onreadystatechange = function () {
            if (req.readyState == 4) {
                if (req.status == 200) {
                    var r = [];
                    try {
                        r = JSON.parse(req.responseText);
                        callback(r);
                    } catch (e) {
                        console.log(e);
                        err_callback(0);
                    }
                }
            }
        }

        req.send();
    },

    load: function (list) {

        var content_list = document.getElementById('content-list');
        content_list.innerHTML = '';

        var table = document.createElement('table');
        table.id = 'content-list-table';

        if (lex.content_list.path.length) {
            list = [{ type: 'parent' }].concat(list);
        }

        var that = this;

        function addEntry (sth) {

            var tr = document.createElement('tr');

            // Push icon (image url will be set later).
            var icon_td = document.createElement('td');
            var icon_img = document.createElement('img');
            icon_img.src = 'css/icons/' + { directory: 'folder',
                                            parent: 'up',
                                            file: 'file' }[sth.type] + '.png';
            icon_img.className = 'content-list-icon';
            icon_td.appendChild(icon_img);
            icon_td.style.width = '22px';
            tr.appendChild(icon_td);

            var name_td = document.createElement('td');
            tr.appendChild(name_td);

            // sth.type is 'directory' | 'file' | 'parent'
            if (['directory', 'file'].includes(sth.type)) {

                // Name
                name_td.textContent = sth.name;

                // Modification time
                if (!isMobile()) {
                    var mod_td = document.createElement('td');
                    mod_td.className = 'file-list-mod-time';
                    mod_td.textContent = new Date(sth.modified * 1000).toISOString().slice(0, 16).replace(/T/,' ');
                    tr.appendChild(mod_td);
                }
            } else {
                name_td.textContent = '..';
            }

            if (sth.type === 'directory') {

                tr.onclick = ((filename) => function () {
                    lex.content_list.path += '/' + filename;

                    if (lex.content_list.path[0] === '/') {
                        lex.content_list.path = lex.content_list.path.slice(1);
                    }
                    console.log(lex.content_list.path);
                    Content.show();
                })(sth.name);

            } else if (sth.type === 'file') {

                tr.onclick = ((filename) => function () {
                    var url = config.content_real_path + lex.content_list.path + '/' + filename;
                    FileControl.loadFileByURL(url, lex.content_list.path + '/' + filename, function () {
                        GUIControl.setWindowTitle(filename);
                        lex.file.name = filename;
                        Content.hide();
                    });
                })(sth.name);

            } else {
                tr.onclick = function () {
                    lex.content_list.path = lex.content_list.path.split('/').slice(0, -1).join('/');
                    Content.show();
                }
            }

            table.appendChild(tr);
        }

        list.forEach(addEntry);
        content_list.appendChild(table);
    }
}

var MessageControl = {
    show: function (text) {
        alert(text);
    },

    hide: function () {
    },

    messageCallback(text, callback){
        return function () {
            MessageControl.show(text);
            if (typeof callback == 'function') {
                callback();
            }
        }
    }
}

var URIHashControl = {
    // Allow to change the hash only once per config.uri_hash_update_delay.
    // Delay is required since URL hash update is quite slow.
    set: function (newURLHash) {
        var updateFunction = (() => () => {
            if (newURLHash) {
                if (history.replaceState) {
                    history.replaceState(undefined, undefined, '#' + newURLHash);
                } else {
                    location.hash = '#' + newURLHash;
                }
            } else {
                history.pushState('', document.title, window.location.pathname);
            }
            lex.hash_timeout = null;
        })(newURLHash);

        if (lex.hash_timeout) {
            clearTimeout(lex.hash_timeout);
            lex.hash_timeout = setTimeout(updateFunction, config.uri_hash_update_delay);
        } else {
            updateFunction();
            lex.hash_timeout = setTimeout(() => {
                lex.hash_timeout = null;
            }, config.uri_hash_update_delay);
        }
    },

    update: function () {
        var newURLHash = '';
        if (!!lex.file.remote_name) {
            newURLHash = 'remote:' + lex.file.remote_name + ':' + lex.screen.y;
        } else {
            // We're in a local file
            if (!!lex.file.name) {
                newURLHash = 'local:' + lex.file.name + ':' + lex.screen.y;
            }
        }
        URIHashControl.set(newURLHash);
    },

    process: function () {
        var parsed = URIHashControl.parseHash();
        if (typeof parsed != 'undefined' && lex.screen.y != parsed.line) {
            ScreenControl.setScrollY(parsed.line);
        } else {
            URIHashControl.set(URIHashControl.getCurrent());
        }
    },

    load: function () {
        var parsed = URIHashControl.parseHash();
        if (typeof parsed != 'undefined') {
            if (parsed.type == 'remote') {
                var baseName = parsed.file.split(/[\\/]/).pop();
                FileControl.loadFileByURL(config.content_real_path + '/' + parsed.file,
                                          parsed.file, () => {
                                              GUIControl.setWindowTitle(baseName);
                                              lex.file.name = baseName;
                                              ScreenControl.setScrollY(parsed.line);
                                          });
            } else if (parsed.type == 'local') {
                FileControl.loadFileByFileName(parsed.file, () => {
                    ScreenControl.setScrollY(parsed.line);
                    URIHashControl.update();
                });
            }
        }
    },

    getCurrent: function () {
        var curHash = '';
        if (lex.file.name) {
            curHash = ((lex.file.remote_name) ?
                       'remote:'  + lex.file.remote_name : 'local:' + lex.file.name) + ':' + lex.screen.y;
        }
        return curHash;
    },

    parseHash: function (hash = location.hash) {
        var type, file, line;
        if (!hash) return;

        hash = hash.substr(1);
        type = hash.split(':')[0];
        if (!(['remote', 'local'].includes(type))) return;

        line  = hash.split(':')[hash.split(':').length - 1];
        if (!(/^(0|([1-9]\d*))$/.test(line))) return;

        file = hash.substr(type.length + 1, hash.length - line.length - type.length - 2);

        line = parseInt(line);

        return { line: line, file: file, type: type };
    },
}

var FileControl = {

    isLSFileName: function (filename) {
        return filename.startsWith(config.ls_file_prefix);
    },

    parseHashURL: function () {
        var hashURL = document.location.hash,
            lineNumber = 0;
        if (hashURL.lastIndexOf(':') !== -1) {

        }
    },

    LSFileNameToFileName: function (filename) {
        return filename.substr(config.ls_file_prefix.length);
    },

    getFileList: function (callback) {
        localforage.keys(function (error, value) {
            var filtered = [];
            for (var i in value) {
                var item = value[i];
                if (FileControl.isLSFileName(item)) {
                    filtered.push(FileControl.LSFileNameToFileName(item));
                }
            }
            callback(filtered);
        })
    },

    saveFile: function (filename, source) {
        localforage.setItem(config.ls_file_prefix + filename, source, function (err, value) {
            if (err) {
                alert(_('Can\'t save file'));
                console.log(err);
            } else {
                GUIControl.updateFileList();
            }
        });
    },

    deleteFile: function (filename) {
        localforage.removeItem(config.ls_file_prefix+filename, GUIControl.updateFileList);
    },

    pushSelectedToLS: function (file) {
        var reader =  new FileReader();
        reader.onload = (function () {
            return function (event) {
                FileControl.saveFile(file.name, Coders.Uint8ArrayToString(event.target.result));
            };
        })(file);
        reader.readAsArrayBuffer(file);
    },

    loadFileByFileName: function (filename, callback) {
        localforage.getItem(config.ls_file_prefix + filename, function (err, value) {
            FileControl.loadFileBySource(Coders.StringToUint8Array(value));
            GUIControl.setWindowTitle(filename);
            lex.file.name = filename;
            lex.file.remote_name = '';
            URIHashControl.update();
            if (typeof callback == 'function') {
                callback();
            }
        });
    },

    loadFileByURL: function (url, remote_name, callback) {
        var req = null;
        req = new XMLHttpRequest();
        req.responseType = "arraybuffer";
        req.open('GET', url, true);
        req.onreadystatechange = function () {
            if (req.readyState == 4) {
                if (req.status == 200) {
                    FileControl.loadFileBySource(req.response);
                    log('File loaded: ' + url);
                    lex.file.remote_name = remote_name;
                    URIHashControl.update();
                    if (typeof callback === 'function') {
                        callback();
                    }
                } else {
                    alert('Error while loading file ('+req.status+'): '+url)
                }
            }
        }
        req.send(null);
    },

    loadFileBySource: function (source, callback) {
        // load file to viewer
        var source = new Uint8Array(source);
        if (config.save_file_source) {
            lex.file.source = source;
        } else {
            // make it empty
            lex.file.source = new Uint8Array();
        }
        lex.file.lines = [[]]; // insert one empty line
        var lineBytes = [];
        for (var i = 0; i < source.byteLength; i++) {
            if (source[i] == 13) {
                lex.file.lines.push(new Uint8Array(lineBytes));
                lineBytes = [];
                i++;
            } else {
                lineBytes.push(source[i]);
            }
        }
        lex.file.lines.push(new Uint8Array(lineBytes));
        if (typeof callback == 'function')
            callback();
        FileControl.postLoad();
        return lex.file;
    },

    postLoad: function () {
        IndexControl.rebuildIndex();
        if (lex.numbers.set) {
            LineNumbersControl.addLineNumbers();
        }

        SearchControl.flush();
        lex.screen.x = 0
        lex.screen.y = 0
        URIHashControl.update();
        SelectionControl.clearSelection();

        setTimeout(DrawControl.redrawAll, 10);
    }
}

var MobileUIControl = {

    openMenu: function () {
        MobileUIControl.setFileList();
        document.getElementById('mobile-menu').style['display'] = 'block';
    },

    setFileList: function () {
        var elem = document.getElementById('mobile-file-list');
        FileControl.getFileList(function (list) {
            // remove old entries
            elem.innerHTML = ''

            // cycle through file names and create appropriative elements
            for (var i = 0; i < list.length; i++) {
                var c = document.createElement('div');
                c.className = 'mobile-file-item mobile-menu-item';

                var n = document.createElement('span');
                n.textContent = list[i];
                n.className = 'mobile-file-name';
                n.addEventListener(config.mobile_click_event, function () {
                    FileControl.loadFileByFileName(this.textContent);
                    MobileUIControl.closeMenu();
                });

                var d = document.createElement('div');
                d.className = 'mobile-icon large mobile-delete-file';
                d.id = "mobile-delete-file";
                d.title = list[i];
                d.addEventListener(config.mobile_click_event, function () {
                    var filename = this.title;
                    FileControl.deleteFile(filename);
                    this.parentNode.remove();
                });

                elem.appendChild(c);
                c.appendChild(n);
                c.appendChild(d);
            }
        });
    },

    closeMenu: function () {
        document.getElementById('mobile-menu').style['display'] = 'none';
        DrawControl.redrawAll();
    },
}

var ExportControl = {

    // get canvas for rectangle area
    makeCanvas: function (x1, x2, y1, y2) {
        var w = x2 - x1,
            h  = y2-y1,
            rw = w * config.font_width,
            rh = h * config.font_height;
        // create new temporary canvas
        var canvas = document.createElement('canvas');
        canvas.width  = rw;
        canvas.height = rh;
        var context = canvas.getContext('2d'),
            imageData = context.createImageData(rw, rh);

        // fill context with default color
        // (otherwise it remains transparent)
        context.fillStyle = 'rgba('+ config.bg_color[0]+','+
                            config.bg_color[1]+','+
                            config.bg_color[2]+','+
                            config.bg_color[3]+')';
        context.fillRect(0, 0, rw, rh);

        // loop through chars
        for (var y = y1; y < y2 && y < lex.file.lines.length; y++) {
            var line = lex.file.lines[y];
            if (typeof line == 'undefined') break;
            line = Parser.parseLine(line);
            for (var x = x1; x < line.length && x < x2; x++) {
                var char      = line[x].char,
                    underline = line[x].underline,
                    font      = line[x].font;
                if (lex.fonts[font].bitmaps[char]) {
                    context.putImageData(lex.fonts[font].bitmaps[char],
                                         (x-x1) * config.font_width,
                                         (y-y1) * config.font_height);
                    if (underline) {
                        DrawControl.underlineChar(char, font, (x-x1), (y-y1), context);
                    }
                }
            }
        }
        return canvas;
    },

    // exports selection to PNG file
    exportToPNG: function () {
        if (!lex.selection.set) return;
        var s = lex.selection;
        var canvas = ExportControl.makeCanvas(Math.min(s.x1, s.x2),
                                              Math.max(s.x1, s.x2),
                                              Math.min(s.y1, s.y2),
                                              Math.max(s.y1, s.y2));

        canvas.toBlob(function (blob) {
            saveAs(blob, ExportControl.exportFileName('png'));
        });
        if (config.export_clear_selection)
            SelectionControl.clearSelection();
    },

    // construct export file name
    // TODO: add line number in file name
    exportFileName: function (ext) {
        return config.export_png_file_name_prefix +
            (lex.file.name ? lex.file.name : '')
                     .trim()
                     .replace(/[^a-z0-9а-яА-Я]/gi, '_')
                     .replace(/_{2,}/gi, '_') +
               config.export_png_file_name_suffix + (ext ? ext : ext);
    },
}

var InitControl = {

    init: function () {
        // on document load
        InitControl.initMousetrap();
        ScreenControl.expandScreen();
        InitControl.eventsInit();
        InitControl.canvasInit();

        var is_local = document.location.protocol === 'file:';

        if (config.load_font_from_source && !is_local) {
            for (var i = 0; i <= config.font_max; i++) {
                FontControl.loadFont(i, function () {
                    if (DrawControl.makeImageData()) {
                        DrawControl.redrawAll();
                    }
                });
            }
        }

        if (config.perform_test) {
            TestControl.runAll();
        }

        if (isMobile()) {
            InitControl.mobileInit();
            InitControl.mobileEventsInit();
        }

        if (typeof URIHashControl.parseHash() != 'undefined') {
            URIHashControl.load();
        } else {
            if (config.load_file_from_source && !is_local) {
                FileControl.loadFileByURL(config.init_file, '', InitControl.postInit);
            } else {
                FileControl.loadFileBySource(lex.file.source, DrawControl.redrawAll);
            }
        }

        InitControl.postInit();
    },

    postInit: function () {
        ScreenControl.expandScreen();
        GUIControl.updateFileList();
        DrawControl.makeImageData();
        DrawControl.redrawAll();
    },

    eventsInit: function () {
        var wheel = function (event) {
            var delta = 0;
            if(!event)
                event = window.event;
            if (event.wheelDelta) {
                delta = event.wheelDelta / 120;
            } else if (event.detail) {
                delta = - event.detail / 3;
            }
            if (delta) {
                ScreenControl.scrollY(delta);
            }
        }

        var canvas = document.getElementById('canvas');
        canvas.addEventListener('DOMMouseScroll', wheel, false);
        canvas.addEventListener('touchstart', TouchControl.handleStart, false);
        canvas.addEventListener('touchmove', TouchControl.handleMove, false);
        canvas.addEventListener('touchend', TouchControl.handleEnd, false);
        window.onmousewheel = document.onmousewheel = wheel;
        window.addEventListener('resize', function () { ScreenControl.expandScreen(); DrawControl.redrawAll()});
        window.addEventListener('hashchange', URIHashControl.process);
        document.getElementById('search-field').addEventListener('keyup', SearchControl.performSearch);
        document.getElementById('search-close').addEventListener('click', function () {
            SearchControl.clearSearchField();
            SearchControl.deactivateSearchField();
        });

        document.getElementById('file-list').addEventListener('change', function (evt) {
            evt.target.blur();
        });

        document.getElementById('file-select').addEventListener('change', function (evt) {
            // some js routine...
            var files = evt.target.files;
            var lastname = files[files.length - 1].name;
            if (!config.save_to_ls) {
                files = [files[files.length-1]];
            }
            for (var i = 0, f; f = files[i]; i++) {
                if (!f.type.match('text.*')) {
                    // Эта проверка нужна, т.к. не все браузеры передают
                    // правильный тип
                    // Т.е. файл любого типа с расширением txt|lex
                    // будет проходить
                    var ext = f.name.toLowerCase().split('.');
                    ext = ext[ext.length - 1];
                    if(['lhs','txt','hs','pas'].indexOf(ext) == -1)
                        continue
                }
                var reader = new FileReader();
                reader.onload = (function (theFile) {
                    return function (event) {
                        if (config.save_to_ls) {
                            var fileContent = Coders.Uint8ArrayToString(new Uint8Array(event.target.result));
                            FileControl.saveFile(theFile.name, fileContent);
                        }
                        if (theFile.name == lastname) {
                            FileControl.loadFileBySource(new Uint8Array(event.target.result));
                            GUIControl.setWindowTitle(theFile.name);
                            document.activeElement.blur();
                            lex.file.name = theFile.name;
                            lex.file.remote_name = '';
                            URIHashControl.update();
                        }
                    }
                })(f);
                reader.readAsArrayBuffer(f);
            }
        });

        document.getElementById('button-load').addEventListener("click", function () {
            var filename = document.getElementById('file-list').value;
            FileControl.loadFileByFileName(filename);
        });

        document.getElementById('button-delete').addEventListener("click", function () {
            var filename = document.getElementById('file-list').value;
            FileControl.deleteFile(filename);
        });

        document.getElementById('button-line-numbers').addEventListener("click", () => {
            Content.hide();
            LineNumbersControl.toggleLineNumbers();
        });

        document.getElementById('button-goto-line').addEventListener("click", () => {
            Content.hide();
            GUIControl.showGotoLinePrompt();
        });

        document.getElementById('button-search').addEventListener('click', function () {
            if (lex.search.active) {
                SearchControl.deactivateSearchField();
            } else {
                Content.hide();
                SearchControl.activateSearchField();
            }
        });

        document.getElementById('button-content').addEventListener('click', Content.toggle);
    },

    mobileInit: function(){
        log('Running in mobile device!');

        // remove 300ms delay for 'click' events in mobile browsers
        document.addEventListener('DOMContentLoaded', function() {
            FastClick.attach(document.body);
        }, false);

        // add mobile css
        var s = document.createElement('link')
        s.rel = 'stylesheet'
        s.type = 'text/css'
        s.href = config.mobile_style_url
        document.head.appendChild(s)
    },

    mobileEventsInit: function () {
        var closeMenu = function () {
            // отложить закрытие меню для достижения
            // лучшего визуального эффекта
            setTimeout(MobileUIControl.closeMenu, 1000);
        }

        // { id: event ... }
        var events = {
            'mobile-menu-close': MobileUIControl.closeMenu,
            'mobile-menu-open': MobileUIControl.openMenu,
            'mobile-open-file': function () {
                document.getElementById('file-select').click();
                closeMenu();
            },
            'mobile-toggle-lines': function () {
                LineNumbersControl.toggleLineNumbers();
                MobileUIControl.closeMenu();
            },
            'mobile-list-content':function () {
                MobileUIControl.closeMenu();
                Content.show();
            },
            'mobile-goto-line': function () {
                GUIControl.showGotoLinePrompt();
                MobileUIControl.closeMenu();
            },
        }

        for(var id in events) {
            document.getElementById(id).addEventListener(config.mobile_click_event, events[id]);
        }
    },

    initMousetrap: function () {
        // Mousetrap bindings
        var t = {
            'k': function () {
                ScreenControl.scrollY(1);
            },
            'л': function () {
                ScreenControl.scrollY(1);
            },
            'j': function () {
                ScreenControl.scrollY(-1);
            },
            'о': function () {
                ScreenControl.scrollY(-1);
            },
            'l': function () {
                ScreenControl.scrollX(-1);
            },
            'д': function () {
                ScreenControl.scrollX(-1);
            },
            'h': function () {
                ScreenControl.scrollX(1);
            },
            'р': function () {
                ScreenControl.scrollX(1);
            },
            'f': function () {
                ScreenControl.scrollY(-lex.screen.h+1);
            },
            'а': function () {
                ScreenControl.scrollY(-lex.screen.h+1);
            },
            'b': function () {
                ScreenControl.scrollY(lex.screen.h-1);
            },
            'и': function () {
                ScreenControl.scrollY(lex.screen.h-1);
            },
            'alt+g': function () {
                GUIControl.showGotoLinePrompt();
            },
            'v': function () {
                LineNumbersControl.toggleLineNumbers();
            },
            'м': function () {
                LineNumbersControl.toggleLineNumbers();
            },
            'esc': function () {
                lex.screen.x = 0;
                SelectionControl.clearSelection();
                Content.hide();
                DrawControl.redrawAll();
            },
            'alt+f3': function () {
                SearchControl.activateSearchField();;
            },
            'ы': function () {
                SearchControl.activateSearchField();;
            },
            's': function () {
                SearchControl.activateSearchField();;
            },
            'щ': function () {
                document.getElementById('file-select').click();
            },
            'o': function () {
                document.getElementById('file-select').click();
            },
            'd': function () {
                if (lex.selection.set) {
                    ExportControl.exportToPNG();
                }
            },
            'в': function() {
                if (lex.selection.set) {
                    ExportControl.exportToPNG();
                }
            },
            'с': Content.toggle,
            'c': Content.toggle,
            'up': function () {
                ScreenControl.scrollY(1);
            },
            'down': function () {
                ScreenControl.scrollY(-1);
            },
            'left': function () {
                ScreenControl.scrollX(1);
            },
            'right': function () {
                ScreenControl.scrollX(-1);
            },
            'ctrl+up': function () {
                ScreenControl.scrollY(1*config.ctrl_scroll_k);
            },
            'ctrl+down': function () {
                ScreenControl.scrollY(-1*config.ctrl_scroll_k);
            },
            'ctrl+left': function () {
                ScreenControl.scrollX(1*config.ctrl_scroll_k);
            },
            'ctrl+right': function () {
                ScreenControl.scrollX(-1*config.ctrl_scroll_k);
            },
            'end': ScreenControl.scrollEndY,
            'home': ScreenControl.scrollHomeY,
            'pagedown': function () {
                ScreenControl.scrollY(-lex.screen.h+1);
            },
            'pageup': function () {
                ScreenControl.scrollY(lex.screen.h-1);
            },
        }

        for (var k in t) {
            if (t.hasOwnProperty(k)) {
                Mousetrap.bind(k, t[k]);
                Mousetrap(document.getElementById('file-select')).bind(k, t[k]);
            }
        }

        var search_field = document.getElementById('search-field');
        Mousetrap(search_field).bind('esc', function () {
            SearchControl.clearSearchField();
            SearchControl.deactivateSearchField();
        });
        Mousetrap(search_field).bind('enter', SearchControl.searchNext)
        Mousetrap(search_field).bind('shift+enter', SearchControl.searchPrevious)
        Mousetrap(search_field).bind('backspace', function(){
            if(document.getElementById('search-field').value==''){
                SearchControl.deactivateSearchField()
            }
        })
    },
    canvasInit: function(){
        var canvas = document.getElementById('canvas')
        canvas.addEventListener('mousedown',function(event){
            var rect = canvas.getBoundingClientRect(),
                selStartRealX = (event.pageX - rect.left),
                selStartRealY = (event.pageY - rect.top)
            lex.selection.x1 = lex.screen.x + Math.round(selStartRealX / config.font_width)
            lex.selection.y1 = lex.screen.y + Math.round(selStartRealY / config.font_height)
            lex.selection.start = true
            lex.selection.set = false
            DrawControl.redrawAll()
            event.preventDefault();
        })
        function canvasMouseMove(event){
            if(lex.selection.start){
                var canvas = document.getElementById('canvas'),
                    rect   = canvas.getBoundingClientRect(),
                    selStartRealX = (event.pageX - rect.left),
                    selStartRealY = (event.pageY - rect.top)
                lex.selection.x2 = lex.screen.x + Math.round(selStartRealX / config.font_width)
                lex.selection.y2 = lex.screen.y + Math.round(selStartRealY / config.font_height)
                if(lex.selection.x2 != lex.selection.x1 &&
                   lex.selection.y1 != lex.selection.y2){
                    lex.selection.set = true
                }else{
                    lex.selection.set = false
                }
                DrawControl.redrawAll()
            }
        }
        canvas.addEventListener('mousemove',canvasMouseMove)
        canvas.addEventListener('mouseup',function(event){
            canvasMouseMove(event);
            try{
                // catching "Discontinuous selection is not supported" error in chromium
                var mime = "text/plain"
                var range = document.createRange();
                window.getSelection().addRange(range);
                lex.selection.start = false
            }catch(e){
                console.log(e)
            }
        })
        document.addEventListener('copy', function(e){
            var selectionText = SelectionControl.getSelectionText()
            if(selectionText != ''){
                e.clipboardData.setData('text/plain', selectionText);
                e.preventDefault();
                window.getSelection().removeAllRanges();
                SelectionControl.clearSelection()
            }
        })
    },

    preloadJS: function (src, providedName, callback) {
        if (typeof provided == 'function' ?
                              provided() :
                              (typeof window[provided] != undefined)) {
            callback()
        } else {
            var script = document.createElement('script');
            script.type = 'text/javascript'
            script.src = src
            script.onload = callback;
            document.head.appendChild(script);
        }
    }
}


var SearchControl = {

    searchFunctions: [
        function(){
            // function that takes nothing and returns
            // list of results, each of them containing list of
            // blocks (real positions of text that need to be
            // highlighted)
            return [
                [
                    {
                        begin:0,
                        end: 0,
                    },
                ]
            ]
        },
        function(){},
        function(){},

        function (text, str) {
            var c, n = 0,
                line,
                r = [],
                tr = [],
                lines = text.split('\n'),
                tn = 0,
                sx = (lex.numbers.width)?(lex.numbers.width+config.line_numbers_padding):0;
            // зачистка ' ' и '-' на концах
            for (var y = 0; y < lines.length; y++) {
                while (lines[y].length &&
                       (lines[y].endsWith('-') ||
                        lines[y].endsWith(' '))) {
                            lines[y] = lines[y].slice(0, -1);
                }
            }
            for (var y = 0; y < lines.length; y++) {
                line = lines[y];
                var ix = 0;

                // затираем ' ' и '-' в начале строки
                while (ix < line.length && ' -'.indexOf(line[ix]) != -1) {
                    ix++;
                }

                for (var x = ix; x < line.length; x++) {
                    c = line[x];
                    if(c != str[n]){
                        tr = [];                      // если очередной символ не совпал нужно сбросить
                        n  = 0;                       // счетчик символов и все предыдущие блоки
                        tn = 0;
                    }                                 // Здесь не стоит else потому, что после обнуления n
                                                      // может сразу начаться новое слово, удовлетворяющее поиску
                    if (c == str[n]) {                // очередная буква совпала
                        if (n < str.length) {         // полное совпадение короче строки, которую ищем
                            n++;                      // добавляем один символ
                            tn++;
                        }
                        if (n == str.length) {        // слово найдено. Добавляем блок
                            tr.push({
                                line  : y,
                                start : x - tn + 1 + sx,
                                length: tn
                            });
                            r.push(tr);               // добавляем все блоки в результат
                            tr = [];                  // обнуляем список блоков
                            n = 0;                    // обнуляем счетчик совпадающих символов
                            tn = 0;                   // обнуляем счетчик совпадающих символов в текущем блоке
                        }
                    }
                }

                if (n) {
                    // если достигнут конец строки,
                    // и число совпадающих подряд символов
                    // не 0, добавить блок
                    tr.push({
                        line: y,
                        start: x - tn + sx,
                        length: tn
                    });
                    tn = 0;
                }
            }

            return r;
        },

        function(text, str){
            // make case-insensitive
            text = text.toLowerCase()
            str  = str.toLowerCase()
            return SearchControl.searchFunctions[3](text, str)
        },

    ],

    // DOM functions
    activateSearchField: function () {
        lex.search.active = true;
        var el = document.getElementById('search-field');
        var el2 = document.getElementById('block-search');
        el2.style['z-index'] = 11;

        setTimeout(function () {
            el.focus();
        }, 10);
        DrawControl.redrawAll();
    },

    deactivateSearchField: function () {
        lex.search.active = false;
        var el = document.getElementById('search-field');
        var el2 = document.getElementById('block-search');
        el2.style['z-index'] = 0;
        el.blur();
        DrawControl.redrawAll();
    },

    clearSearchField: function () {
        var el = document.getElementById('search-field');
        el.value = '';
        DrawControl.redrawAll();
    },

    updateSearchBlock: function () {
        var number = (lex.search.results.length==0) ?
                     0 : (lex.search.active_entry_number + 1);
        var total  = number ? lex.search.results.length : 0;

        document.getElementById('search-number').textContent = number;
        document.getElementById('search-total').textContent = total;
    },

    jumpToIndex: function (index) {
        if (index < lex.search.results.length - 1) {
            lex.search.active_entry_number = index;
        }
        if (!lex.search.results[index]) {
            lex.search.active_entry_number = lex.search.results.length - 1;
            return;
        }
        SearchControl.scrollToCurrentResult();
    },

    scrollToCurrentResult: function () {
        var index = lex.search.active_entry_number,
            arr = lex.search.results[index];

        if (!arr) return;

        // TODO: correct minimum line number detection
        var line = arr[arr.length - 1].line - 1;
        if (line < lex.screen.y ||
            line > lex.screen.y + lex.screen.h/2){
                ScreenControl.setScrollY(line);
                DrawControl.redrawAll();
        }
    },

    searchNext: function () {
        if (lex.search.active_entry_number < lex.search.results.length - 1) {
            lex.search.active_entry_number++;
        } else {
            lex.search.active_entry_number = 0;
        }
        SearchControl.jumpToIndex(lex.search.active_entry_number);
        SearchControl.updateSearchBlock();
    },

    searchPrevious: function () {
        if (lex.search.active_entry_number > 0) {
            lex.search.active_entry_number--;
        } else {
            lex.search.active_entry_number = lex.search.results.length-1;
        }
        SearchControl.jumpToIndex(lex.search.active_entry_number);
        SearchControl.updateSearchBlock();
    },

    flush: function () {
        lex.search.active = false;
        lex.search.active_entry_number = 0;
        lex.search.results = [];
        SearchControl.updateSearchBlock();
        SearchControl.clearSearchField();
        SearchControl.deactivateSearchField();
    },

    // main functions
    performSearch: function () {
        SearchControl.performSearchByFunction();
        SearchControl.updateSearchBlock();
        DrawControl.redrawAll();
    },

    performSearchByFunction: function () {
        var text = lex.index.text,
            str  = document.getElementById('search-field').value,
            func = SearchControl.searchFunctions[config.search_function];
        lex.search.results = func(text, str);
        SearchControl.scrollToCurrentResult();
    },
}

document.addEventListener("DOMContentLoaded", InitControl.init);
