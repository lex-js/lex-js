// gettext
// todo

function _(m){return m}

function log(m){
    if (config.logging) {
        if (m.length > config.log_max_length)
            m = m.substr(0,config.log_max_length);
        console.log(m);
    }
}

var Parser = {
    parseLine: function (line) {
        // Transforms the byte array into a list of objects.
        // Each object is exactly 1 character on the screen.
        var r = [], font = 0, command = false, underline = false;

        for (var x = 0; x < line.length; x++) {
            var char = line[x];
            if (command) {
                switch (char) {
                    case config.parser.underline_false:
                        underline = false;
                        break;
                    case config.parser.underline_true:
                        underline = true;
                        break;
                    case config.parser.empty_line:
                        return r;
                        break;
                    default:
                        if (typeof config.parser.fonts[char] !== 'undefined') {
                            font = config.parser.fonts[char];
                        }
                        break;
                }
                command = 0;
            } else {
                if (char === 255) {
                    command = true;
                } else {
                    r.push({
                        char: char,
                        underline: underline,
                        font: font,
                    });
                }
            }
        }
        return r;
    },

    getLineNumberBytes: function (n, width) {
        var r = '                    ';
        var arr = [];
        n = n+'';

        r = r.substr(0, width - n.length);
        r += n;
        for (var i = 0; i < r.length; i++) {
            if (r[i] == ' ') {
                // space
                arr.push(32);
            } else {
                // number by ASCII code
                arr.push(r[i] * 1 + 48);
            }
        }

        // separator
        arr.push(179);
        // space
        arr.push(32);
        return arr;
    },
}

var Coders = {
    // encoders+decoders

    Uint8ArrayToString: function (ui8arr) {
        return Array.from(ui8arr).map((b) => byteToCharCP866[b]).join('');
    },

    StringToUint8Array: function (string) {
        return Uint8Array.from(Array.from(string).map((c) => charToByteCP866[c]));
    },

    binArray2String: function (arr) {
        var len = config.max_char_code,
            r = '', arrlen = arr.length;

        while (arr.length % len) {
            arr.push(0);
        }

        for (var i = 0; i < arr.length; ) {
            var b = '';
            while (b.length < len) {
                if (typeof arr[i] == 'undefined') {
                    break;
                }
                b += arr[i];
                i++;
            }

            var c = parseInt(b, 2);
            r+= String.fromCharCode(c);
        }

        return arrlen + ':' + r;
    },

    string2BinArray: function (str) {
        var len = config.max_char_code,
            arrlen = str.substr(0, str.indexOf(':')) * 1,
            str = str.substr(str.indexOf(':') + 1), r = [], c, n;

        for (var i = 0; i < str.length; i++) {
            c = str[i].charCodeAt(0);
            n = Number(c).toString(2).split('');

            while (n.length < len) {
                n = ['0'].concat(n);
            }

            n = n.reverse();

            for (var j = n.length - 1; j >= 0; j--) {
                r.push((n[j] == '1') * 1);
            }
        }

        return r;
    },
}

var DrawControl = {
    setFontBGColor: function (bg_color) {
        config.bg_color = bg_color;
        DrawControl.redrawAll();
    },

    setFontFGColor: function (fg_color) {
        config.fg_color = fg_color;
        DrawControl.redrawAll();
    },

    makeImageData: function () {
        if (config.load_font_from_source && !lex.fonts.every((f) => !!f.source)) {
            return false;
        }
        var t, w, h, canvas, context, data, fg, bg, u, char, pos, imageData;
        w = config.font_width;
        h = config.font_height;
        fg = config.fg_color;
        bg = config.bg_color;
        canvas = document.getElementById('canvas-tmp');
        canvas.width = w;
        canvas.height = h;
        context = canvas.getContext('2d');
        imageData = context.getImageData(0, 0, w, h);
        data = imageData.data;

        for (var fontNumber = 0; fontNumber <= config.font_max; fontNumber++) {
            var buff = lex.fonts[fontNumber].source;
            for (var charCode = 0; charCode < 256; charCode++) {
                var shift = w * h * charCode,
                    char  = String.fromCharCode(charCode),
                    t_imageData = context.createImageData(imageData);

                for (var y = 0; y < h; y++) {
                    for (var x = 0; x < w; x++) {
                        u = !!buff[shift + y * w + x] ? fg : bg;
                        pos = (w * y + x) * 4;
                        t_imageData.data[pos]     = u[0];
                        t_imageData.data[pos + 1] = u[1];
                        t_imageData.data[pos + 2] = u[2];
                        t_imageData.data[pos + 3] = u[3];
                    }
                }

                lex.fonts[fontNumber].bitmaps[charCode] = t_imageData;
            }
        }
        return true
    },

    underlineChar: function (char, font, x, y, context) {
        // смешивание битмапов символа _ и char
        // (имитация подчеркивания)
        var imgData1 = lex.fonts[4].bitmaps[95]; // "_"
        var imgData2 = lex.fonts[font].bitmaps[char];
        var imgData3 = context.createImageData(imgData1);
        for (var i = 0; i < imgData1.data.length; i += 4) {
            for (var j = 0; j < 4; j++) {
                // обход r, g, b, a
                if (imgData1.data[i+j] == config.fg_color[j] ||
                    imgData2.data[i+j] == config.fg_color[j]){
                    imgData3.data[i+j] = config.fg_color[j];
                } else {
                    imgData3.data[i+j] = config.bg_color[j];
                }
            }
        }

        context.putImageData(imgData3, x * config.font_width, y * config.font_height);
    },

    redrawCanvas: function (context) {
        var w  = lex.screen.w,
            h  = lex.screen.h,
            rw = w * config.font_width,
            rh = h * config.font_height,
            sx = lex.screen.x,
            sy = lex.screen.y,
            ls = lex.file.lines,
            l  = ls.length;

        context.fillStyle = 'rgba('+
            config.bg_color[0]+','+
            config.bg_color[1]+','+
            config.bg_color[2]+','+
            config.bg_color[3]+')';
        context.fillRect(0, 0, rw, rh);

        for (var y = 0; y < h && y < l; y++) {
            var line = ls[y + sy];
            if (typeof line == 'undefined') {
                break;
            }
            line = Parser.parseLine(line);
            for (var x = 0; x < line.length; x++) {
                var char      = line[x].char;
                var underline = line[x].underline;
                var font      = line[x].font;
                if (lex.fonts[font].bitmaps[char]) {
                    context.putImageData(lex.fonts[font].bitmaps[char],
                                         (x - sx) * config.font_width,
                                         y * config.font_height);
                    if (underline) {
                        DrawControl.underlineChar(char, font, x - sx, y, context);
                    }
                }
            }
        }
    },

    redrawSelection: function (context) {
        if (lex.selection.set) {
            var t = config.selection_fill_color;
            context.fillStyle = 'rgba(' + t[0] + ',' + t[1] + ',' + t[2] + ',' + (t[3] / 255) + ')';
            context.fillRect((lex.selection.x1 - lex.screen.x) * config.font_width,
                             (lex.selection.y1 - lex.screen.y) * config.font_height,
                             (lex.selection.x2 - lex.selection.x1) * config.font_width,
                             (lex.selection.y2 - lex.selection.y1) * config.font_height);
        }
    },

    redrawSearchResults: function (context) {
        if (lex.search.active == true) {
            var rs = lex.search.results;
            for (var i = 0; i < rs.length; i++) {
                var tr = rs[i];
                for (var j = 0; j < tr.length; j++) {
                    var r = tr[j];
                    if (r.line >= lex.screen.y && r.line <= lex.screen.y + lex.screen.h) {
                        var t = config['search_' + ((i == lex.search.active_entry_number) ? 'active_' : '')
                                     + 'fill_color'];
                        context.fillStyle = 'rgba(' + t[0] + ',' + t[1] + ',' + t[2] + ',' + (t[3] / 255) + ')';
                        context.fillRect((r.start - lex.screen.x) * config.font_width,
                                         (r.line - lex.screen.y) * config.font_height,
                                         r.length * config.font_width, config.font_height);
                    }
                }
            }
        }
    },

    redrawAll: function () {
        var canvas = document.getElementById('canvas');
        var context = canvas.getContext('2d');
        GUIControl.updateBottomBlock();
        DrawControl.redrawCanvas(context);
        DrawControl.redrawSelection(context);
        DrawControl.redrawSearchResults(context);
    }
}

var IndexControl = {
    // Индекс. Используется для поиска.
    rebuildIndex: function () {
        // clear old value
        lex.index.text = '';
        lex.index.maxlen = 0;
        for (var i = 0; i < lex.file.lines.length; i++) {
            var parsed = Parser.parseLine(lex.file.lines[i]),
                line = Coders.Uint8ArrayToString(parsed.map((c) => c.char));
            lex.index.text += line + '\n';
            if (lex.index.maxlen < line.length) {
                lex.index.maxlen = line.length;
            }
        }
    },
}

var FontControl = {
    loadFont: function (num,callback) {
        var req = null;
        req = new XMLHttpRequest();
        req.responseType = "arraybuffer";
        req.open('GET', config.font_path + num + config.font_ext, true);
        req.onreadystatechange = function () {
            if (req.readyState == 4) {
                if (req.status == 200) {
                    var source = new Uint8Array(req.response);
                    source = Uint8Array2BinArray(source);
                    lex.fonts[num] = {
                        source: source,
                        bitmaps: {},
                    };
                    log('Font loaded: '+num);
                    if(!!callback) {
                        callback(lex.fonts[num]);
                    }
                }
            }
        }
        req.send(null);
    },
}

var DevControl = {
    outputFontsToJSFile: function () {
        // Выводит все загруженные шрифты в *.js файл
        // Использовать один раз при изменении файлов исходных шрифтов
        // см. fonts/old
        var js_output = '';
        for (var fontNumber = 0; fontNumber <= config.font_max; fontNumber++) {
            var source = lex.fonts[fontNumber].source;
            js_output += 'lex.fonts['+fontNumber+'].source = Coders.string2BinArray(' +
                uneval(Coders.binArray2String(lex.fonts[fontNumber].source)) + ');\n';
        }
        this.donwloadFile('fonts.js', js_output);
    },

    outputFileToJSFile: function () {
        var js_output = 'lex.file.source = new Uint8Array([';
        for (var i = 0; i < lex.file.source.length; i++) {
            js_output += lex.file.source[i] + ',';
        }
        js_output += '])';
        this.donwloadFile('info.js', js_output);
    },

    donwloadFile: function (name, source) {
        // Создает файл, загружаемый из браузера
        var blob = new Blob([source], {type: "text/plain;charset=utf-8"});
        saveAs(blob, name);
    },

    outputFonts: function () {
        for (var f = 48; f <= 57; f++) {
            r = [255,f];
            for (var i = 0; i < 255; i++) {
                r.push(i);
            }
            lex.file.lines[f-48] = new Uint8Array(r);
        }
        IndexControl.rebuildIndex();
        DrawControl.redrawAll();
    }
}

var LineNumbersControl = {
    removeLineNumbers: function () {
        for (var i = 0; i < lex.file.lines.length; i++) {
            lex.file.lines[i] = new Uint8Array(Array.from(lex.file.lines[i]).splice(lex.numbers.width + 2));
        }
        lex.index.maxlen -= lex.numbers.width + config.line_numbers_padding;
        lex.numbers.set = false;
        lex.numbers.width = 0;
        SearchControl.flush();
        ScreenControl.checkScrollPosition();
        DrawControl.redrawAll();
    },

    addLineNumbers: function () {
        lex.numbers.width = (lex.file.lines.length + '').length + 1;
        lex.numbers.set = true;
        for (var i = 0; i < lex.file.lines.length; i++) {
            lex.file.lines[i] = new Uint8Array(
                Parser.getLineNumberBytes(
                    i, lex.numbers.width).concat(
                        Array.from(lex.file.lines[i])))
        }
        lex.index.maxlen += lex.numbers.width + config.line_numbers_padding;
        ScreenControl.checkScrollPosition();
        SearchControl.flush();
        DrawControl.redrawAll();
    },

    toggleLineNumbers: function () {
        if (lex.numbers.set) {
            LineNumbersControl.removeLineNumbers();
        } else {
            LineNumbersControl.addLineNumbers();
        }
    }
}

var SelectionControl = {
    clearSelection: function () {
        lex.selection = {
            set: false,
            start: false,
            x1: 0,
            y1: 0,
            x2: 0,
            y2: 0,
        };
        DrawControl.redrawAll();
    },

    copySelection: function () {
        return Object.assign({}, lex.selection);
    },

    setSelection: function (obj) {
        lex.selection = obj;
    },

    selectAll: function () {
        lex.selection.set = 1;
        lex.selection.x1 = 0;
        lex.selection.x2 = Math.max.apply(Math, lex.file.lines.map(a => a.length));
        lex.selection.y1 = 0;
        lex.selection.y2 = lex.file.lines.length;
    },

    getSelectionText: function(){
        if (!lex.selection.set) {
            return '';
        }
        var s = lex.selection,
            x1 = Math.min(s.x1, s.x2),
            x2 = Math.max(s.x1, s.x2),
            y1 = Math.min(s.y1, s.y2),
            y2 = Math.max(s.y1, s.y2),
            ls = lex.file.lines,
            l  = ls.length, r = '';

      for (var y = y1; y < y2; y++) {
        // we are currently not exceeded the
        // height of file
        if (!!ls[y]) {
          var line = Parser.parseLine(ls[y]);
          for (var x = x1; x < x2 && x < line.length; x++) {
              if (!!line[x]) {
                r += byteToCharCP866[line[x].char];
              } else {
                r += ' ';
              }
          }
          r += '\n';
        }
      }

      // remove last '\n'
      r = r.substr(0,r.length-1);
      return r;
    },
}

var ScreenControl = {
    getViewportSize: function () {
        var w = window,
            d = document,
            e = d.documentElement,
            g = d.getElementsByTagName('body')[0],
            x = w.innerWidth || e.clientWidth || g.clientWidth,
            y = w.innerHeight|| e.clientHeight|| g.clientHeight;
        return { w:x, h:y };
    },

    expandScreen: function () {
        // увеличить размер canvas при изменении размера окна
        var viewport = ScreenControl.getViewportSize(),
            canvas = document.getElementById('canvas');
        lex.screen.h = Math.ceil((viewport.h - 64) / config.font_height);
        lex.screen.w = Math.ceil((viewport.w) / config.font_width);
        canvas.height = Math.ceil(viewport.h - 64);
        canvas.width = Math.ceil(viewport.w);
    },

    setScrollY: function (y) {
        lex.screen.y = y;
        ScreenControl.checkScrollPosition();
        DrawControl.redrawAll();
        URIHashControl.update();
    },

    checkScrollPosition: function () {
        if (lex.screen.x > lex.index.maxlen - lex.screen.w + config.max_x_scroll) {
            lex.screen.x = lex.index.maxlen - lex.screen.w + config.max_x_scroll;
        }

        if (lex.screen.h > lex.file.lines.length) {
            // файл не влезает в экран
            if (lex.screen.y > lex.file.lines.length - lex.screen.h) {
                lex.screen.y = lex.file.lines.length - lex.screen.h;
            }
        }

        var maxshift = lex.screen.h - Math.floor(lex.screen.h*config.max_overscroll);

        if (lex.screen.y > lex.file.lines.length - maxshift) {
            lex.screen.y = lex.file.lines.length - maxshift;
        }

        if (lex.screen.y < 0) {
            lex.screen.y = 0;
        }

        if (lex.screen.x < 0) {
            lex.screen.x = 0;
        }
    },

    scrollHomeY: function () {
        if(lex.content_tree.active) return;
        lex.screen.y = 0;
        DrawControl.redrawAll();
        URIHashControl.update();
    },

    scrollEndY: function () {
        if (lex.content_tree.active) return;
        lex.screen.y = lex.file.lines.length - lex.screen.h;
        ScreenControl.checkScrollPosition();
        DrawControl.redrawAll();
        URIHashControl.update();
    },

    scrollX: function (x) {
        if (lex.content_tree.active) return;
        x = Math.round(x);
        lex.screen.x -= x;
        ScreenControl.checkScrollPosition();
        DrawControl.redrawAll();
    },

    scrollY: function (y) {
        if (lex.content_tree.active) return;
        y = Math.round(y);
        lex.screen.y -= y;
        ScreenControl.checkScrollPosition();
        DrawControl.redrawAll();
        URIHashControl.update();
    },
}

var TouchControl = {
    // Мобильные устройства
    ongoingTouches: [],
    scrollBuffer: {
        x: 0,
        y: 0,
    },
    handleStart: function (event) {
        event.preventDefault();
        var touches = event.changedTouches;
        for (var i = 0; i < touches.length; i++) {
            TouchControl.ongoingTouches.push(TouchControl.copyTouch(touches[i]));
        }
    },

    handleMove: function (event) {
        event.preventDefault();
        var touches = event.changedTouches;
        for (var i = 0; i < touches.length; i++) {
            var idx = TouchControl.ongoingTouchIndexById(touches[i].identifier),
                deltaX = touches[i].pageX - TouchControl.ongoingTouches[idx].pageX,
                deltaY = touches[i].pageY - TouchControl.ongoingTouches[idx].pageY;
            TouchControl.scrollBuffer.x += deltaX;
            TouchControl.scrollBuffer.y += deltaY;
            if (idx >= 0) {
                TouchControl.ongoingTouches.splice(idx, 1, TouchControl.copyTouch(touches[i]));
            } else {
                log("can't figure out which touch to continue");
            }
            if (Math.abs(TouchControl.scrollBuffer.y) > config.touch_y_min) {
                ScreenControl.scrollY(TouchControl.scrollBuffer.y * config.touch_y_speed / config.touch_y_min);
                TouchControl.scrollBuffer.y = 0;
            }
            if (Math.abs(TouchControl.scrollBuffer.x) > config.touch_x_min) {
                ScreenControl.scrollX(TouchControl.scrollBuffer.x * config.touch_x_speed / config.touch_x_min);
                TouchControl.scrollBuffer.x = 0;
            }
        }
    },

    handleEnd: function (event) {
        event.preventDefault();
        var touches = event.changedTouches;
        for (var i = 0; i < touches.length; i++) {
            var idx = TouchControl.ongoingTouchIndexById(touches[i].identifier);
            if (idx >= 0) {
                TouchControl.ongoingTouches.splice(idx, 1);
            } else {
                log("can't figure out which touch to end");
            }
        }
    },

    ongoingTouchIndexById: function (idToFind) {
        for (var i = 0; i < TouchControl.ongoingTouches.length; i++) {
            var id = TouchControl.ongoingTouches[i].identifier;
            if (id == idToFind) {
                return i;
            }
        }
        return -1;
    },

    copyTouch: function (touch) {
        return {
            identifier: touch.identifier,
            pageX: touch.pageX,
            pageY: touch.pageY
        };
    },
}
