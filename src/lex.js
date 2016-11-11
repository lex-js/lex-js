// gettext
// todo

function _(m){return m}

function log(m){
    // redefine it
    if(config.logging){
        if(m.length > config.log_max_length)
            m = m.substr(0,config.log_max_length)
        console.log(m)
    }
}

var Parser = {
    parseLine: function(line){
        // Преобразует массив байт 
        // в список объектов, соответствующих
        // одному символу на экране
        var r = []
        var font      = 0
        var command   = false
        var underline = false
        for(var x = 0; x < line.length; x++){
            var char = line[x]
            if(command){
                var t = this.switchCommand(char, underline, font)
                font = t.font
                underline = t.underline
                command = 0
            }else{
                switch(char){
                case 9:{
                    // что? [todo] разобраться с этим
                    x = Math.ceil((x/8+1)*8) 
                    break
                }
                case 255:{
                    command = true
                    break
                }
                default:{
                    r.push({
                        char: char,
                        underline: underline,
                        font: font,
                    })
                    break
                }
                }
            }
        }
        return r
    },
    getLineNumberBytes: function(n, width){
        var r = '                    '
        var arr = []
        n = n+''
        // padding
        r = r.substr(0, width - n.length)
        r += n
        for(var i = 0; i < r.length; i++){
            if(r[i] == ' '){
                // space
                arr.push(32)
            }else{
                // number
                arr.push(r[i]*1+48)
            }
        }
        // separator
        arr.push(179)
        // space
        arr.push(32)
        return arr
    },
    switchCommand: function(char, underline, font){
        // изменить состояние
        if(char == config.parser.underline_false){
            underline = false
        }
        if(char == config.parser.underline_true){
            underline = true
        }
        if(typeof config.parser.fonts[char] != 'undefined'){
            // изменить шрифт
            font = config.parser.fonts[char]
        }
        if(char == 255){
            // todo
        }
        return {
            font: font,
            underline: underline,
        }
    },
}

var Coders = {
    // encoders+decoders
    Uint8ArrayToString: function(ui8arr){
        // преобразует массив байт в стоку
        // используя кодировку ibm866
        var string = ''
        for(var i = 0, b; b = ui8arr[i]; i++){
            string += byteToCharCP866[b]
        }
        return string
    },
    StringToUint8Array: function(string){
        // преобразует строку в массив байт
        // используя кодировку ibm866
        var arr = []
        for(var i = 0, c; c = string[i]; i++){
            arr.push(charToByteCP866[c])
        }
        return new Uint8Array(arr)
    },
    num2Char: function(num){
        return String.fromCharCode(num)
    },
    char2Num: function(chr){
        return chr.charCodeAt(0)
    },
    dec2Bin: function(dec)
    {
        return Number(dec).toString(2)
    },
    bin2Dec: function(bin){
        return parseInt(bin,2)
    },
    binArray2String: function(arr){
        var len = config.max_char_code
        var r   = ''
        var arrlen = arr.length
        while(arr.length % len){
            arr.push(0)
        }
        for(var i = 0; i < arr.length; ){
            var b = ''
            while(b.length < len){
                if(typeof arr[i] == 'undefined')
                    break;
                b += arr[i]
                i++
            }
            var c = Coders.bin2Dec(b)
            r+= Coders.num2Char(c)
        }    
        return arrlen+':'+r
    },
    string2BinArray: function(str){
        var len = config.max_char_code
        var arrlen = str.substr(0,str.indexOf(':'))*1
        var str = str.substr(str.indexOf(':')+1)    
        var r = []
        for(var i = 0; i < str.length; i++){
            var c = Coders.char2Num(str[i])
            var n = Coders.dec2Bin(c).split('')
            while(n.length < len){
                n = ['0'].concat(n)
            }
            n = n.reverse()
            for(var j = n.length-1; j >= 0; j--){
                r.push((n[j] == '1')*1)
            }
        }
        return r
    },    
}

var DrawControl = {
    setFontBGColor: function(bg_color){
        config.bg_color = bg_color
        DrawControl.redrawAll()
    },
    setFontFGColor: function(fg_color){
        config.fg_color = fg_color
        DrawControl.redrawAll()
    },
    makeImageData: function(){
        if(config.load_font_from_source && !FontControl.fontsLoaded()) return false;
        var t, w, h, canvas, context, data, fg, bg, u, char, pos, imageData
        w = config.font_width
        h = config.font_height
        fg = config.fg_color
        bg = config.bg_color    
        canvas  = document.getElementById('canvas-tmp')
        canvas.width  = w
        canvas.height = h
        context = canvas.getContext('2d')
        imageData = context.getImageData(0, 0, w, h)
        data = imageData.data
        for(var fontNumber = 0; fontNumber <= config.font_max; fontNumber++){
            var buff = lex.fonts[fontNumber].source
            for(var charCode = 0; charCode < 256; charCode ++){
                var shift = w * h * charCode
                var char  = String.fromCharCode(charCode)
                var t_imageData = context.createImageData(imageData)
                for(var y = 0; y < h; y++){
                    for(var x = 0; x < w; x++){
                        var t = buff[shift + y * w + x] == true
                        if(t){
                            u = fg
                        }else{
                            u = bg
                        }
                        pos = ((w * y) + x) * 4
                        t_imageData.data[pos]     = u[0]
                        t_imageData.data[pos + 1] = u[1]
                        t_imageData.data[pos + 2] = u[2]
                        t_imageData.data[pos + 3] = u[3]
                    }
                }
                lex.fonts[fontNumber].bitmaps[charCode] = t_imageData
            }
        }
        return true
    },
    underlineChar: function(char, font, x, y, context){
        // смешивание битмапов символа _ и char 
        // (имитация подчеркивания)
        var imgData1 = lex.fonts[4].bitmaps[95] // "_"
        var imgData2 = lex.fonts[font].bitmaps[char]
        var imgData3 = context.createImageData(imgData1)
        for(var i=0; i < imgData1.data.length; i+=4)
        {
            for(var j = 0; j < 4; j++){
                // обход r, g, b, a
                if(imgData1.data[i+j] == config.fg_color[j] ||
                   imgData2.data[i+j] == config.fg_color[j]){
                    imgData3.data[i+j] = config.fg_color[j]
                }else{
                    imgData3.data[i+j] = config.bg_color[j]
                }
            }
        }
        context.putImageData(imgData3,
                             x * config.font_width,
                             y * config.font_height);
    },
    redrawCanvas: function(context){
        var w  = lex.screen.w,
            h  = lex.screen.h,
            rw = w * config.font_width,
            rh = h * config.font_height,
            sx = lex.screen.x,
            sy = lex.screen.y,
            ls = lex.file.lines,
            l  = ls.length
        
        context.fillStyle = 'rgba('+
            config.bg_color[0]+','+
            config.bg_color[1]+','+
            config.bg_color[2]+','+
            config.bg_color[3]+')'
        context.fillRect(0, 0, rw, rh)

        for(var y = 0; y < h && y < l; y++){
            var line = ls[y + sy]
            if(typeof line == 'undefined') break;
            line = Parser.parseLine(line)
            for(var x = 0; x < line.length; x++){
                var char      = line[x].char
                var underline = line[x].underline
                var font      = line[x].font
                if(lex.fonts[font].bitmaps[char]){
                    context.putImageData(lex.fonts[font].bitmaps[char],
                                         (x - sx) * config.font_width, y * config.font_height)
                    if(underline){
                        DrawControl.underlineChar
                        (char, font, x - sx, y, context)
                    }
                }
            }
        }
    },
    redrawSelection: function(context){
        if(lex.selection.set){
            var t = config.selection_fill_color
            context.fillStyle = 'rgba('+
                t[0]+','+
                t[1]+','+
                t[2]+','+
                (t[3]/255)+')'
            var xs = (lex.selection.x1 - lex.screen.x) * config.font_width 
            var ys = (lex.selection.y1 - lex.screen.y) * config.font_height
            var ws = (lex.selection.x2 - lex.selection.x1) * config.font_width
            var hs = (lex.selection.y2 - lex.selection.y1) * config.font_height    
            context.fillRect(xs, ys, ws, hs)
        }
    },
    redrawSearchResults: function(context){
        if(lex.search.active == true){
            var rs = lex.search.results
            for(var i = 0; i < rs.length; i++){
                var tr = rs[i]
                for(var j = 0; j < tr.length; j++){
                    var r = tr[j]
                    if(r.line >= lex.screen.y &&
                       r.line <= lex.screen.y + lex.screen.h){
                        var t = (i == lex.search.active_entry_number)?
                            config.search_active_fill_color:
                            config.search_fill_color
                        context.fillStyle =
                            'rgba('+t[0]+','+
                            t[1]+','+
                            t[2]+','+
                            (t[3]/255)+')'
                        var ys = (r.line - lex.screen.y) * config.font_height,
                            xs = (r.start - lex.screen.x) * config.font_width,
                            hs = config.font_height,
                        ws = r.length * config.font_width
                        context.fillRect(xs, ys, ws, hs)
                    }
                }
            }
        }
    },
    redrawAll: function(){
        var canvas = document.getElementById('canvas')
        var context = canvas.getContext('2d')
        GUIControl.updateBottomBlock()
        DrawControl.redrawCanvas(context)
        DrawControl.redrawSelection(context)
        DrawControl.redrawSearchResults(context)
    }
}

var IndexControl = {
    // Индекс. Используется для поиска.
    rebuildIndex: function(){
        // clear old value
        lex.index.text = ''
        lex.index.maxlen = 0
        for(var i = 0; i < lex.file.lines.length; i++){
            var parsed = Parser.parseLine(lex.file.lines[i]),
                line = Coders.Uint8ArrayToString(parsed.map(
                    function(c){
                        return c.char
                    }
                ))
            lex.index.text += line+'\n'
            if(lex.index.maxlen < line.length){
                lex.index.maxlen = line.length
            }
        }
    },
}

var FontControl = {
    fontsLoaded: function(){
        for(var fontNumber = 0; fontNumber <= config.font_max; fontNumber++){
            if(!lex.fonts[fontNumber].source) 
                return false
        }
        return true;
    },
    loadFont: function(num,callback){
        var req = null
        req = new XMLHttpRequest();
        req.responseType = "arraybuffer"
        req.open('GET', config.font_path+num+config.font_ext, true)
        req.onreadystatechange = function() { 
            if(req.readyState == 4){
                if(req.status == 200){
                    var source = new Uint8Array(req.response)
                    source = Uint8Array2BinArray(source)
                    lex.fonts[num] = {
                        source:source,
                        bitmaps:{},
                    }
                    log('Font loaded: '+num)
                    if(!!callback)
                        callback(lex.fonts[num])
                }
            }
        }
        req.send( null );
    },
}

var DevControl = {
    outputFontsToJSFile: function(){
        // Выводит все загруженные шрифты в *.js файл
        // Использовать один раз при изменении файлов исходных шрифтов
        // см. fonts/old
        var js_output = ''
        for(var fontNumber = 0; fontNumber <= config.font_max; fontNumber++){
            var source = lex.fonts[fontNumber].source
            js_output += 'lex.fonts['+fontNumber+'].source = Coders.string2BinArray('+
                uneval(Coders.binArray2String(lex.fonts[fontNumber].source))+
                ');\n'
        }
        this.donwloadFile('fonts.js', js_output)
    },
    outputFileToJSFile: function(){
        var js_output = 'lex.file.source = new Uint8Array(['
        for(var i = 0; i < lex.file.source.length; i++){
            js_output += lex.file.source[i]+','
        }
        js_output += '])'
        this.donwloadFile('info.js',js_output)
    },
    donwloadFile: function(name, source){
        // Создает файл, загружаемый из браузера
        var blob = new Blob([source], {type: "text/plain;charset=utf-8"});
        saveAs(blob, name);
    },
    outputFonts: function(){
        for(var f = 48; f <= 57; f++){
            r = [255,f]
            for(var i = 0; i < 255; i++){
                r.push(i)
            }
            lex.file.lines[f-48] = new Uint8Array(r)
        }
        IndexControl.rebuildIndex()
        DrawControl.redrawAll()
    }
}

var LineNumbersControl = {
    removeLineNumbers: function(){
        for(var i = 0; i < lex.file.lines.length; i++){
            lex.file.lines[i] = new Uint8Array
            (Array.from(lex.file.lines[i]).splice(lex.numbers.width+2))
        }
        lex.index.maxlen -= lex.numbers.width + config.line_numbers_padding
        lex.numbers.set = false
        lex.numbers.width = 0
        SearchControl.flush()
        ScreenControl.checkScrollPosition()
        DrawControl.redrawAll()
    },
    addLineNumbers: function(){
        lex.numbers.width = (lex.file.lines.length+'').length+1
        lex.numbers.set = true
        for(var i = 0; i < lex.file.lines.length; i++){
            var t = new Uint8Array(
                Parser.getLineNumberBytes(
                    i, lex.numbers.width).concat(
                    Array.from(lex.file.lines[i])))
            lex.file.lines[i] = t
        }
        lex.index.maxlen += lex.numbers.width + config.line_numbers_padding
        ScreenControl.checkScrollPosition()
        SearchControl.flush()
        DrawControl.redrawAll()
    },
    toggleLineNumbers: function(){
        if(lex.numbers.set){
            this.removeLineNumbers()
        }else{
            this.addLineNumbers()
        }
    }
}

var SelectionControl = {
    clearSelection: function(){
        lex.selection = {
            set: false,
            start: false,
            x1: 0,
            y1: 0,
            x2: 0,
            y2: 0,
        }
        DrawControl.redrawAll()
    },
    getSelectionText: function(){
        if(!lex.selection.set) return '';
        var s = lex.selection,
            x1 = Math.min(s.x1, s.x2),
            x2 = Math.max(s.x1, s.x2),
            y1 = Math.min(s.y1, s.y2),
            y2 = Math.max(s.y1, s.y2),
            ls = lex.file.lines,
            l  = ls.length
      var r = ''
      for (var y = y1; y < y2; y++) {
        // we are currently not exceeded the
        // height of file
        if (!!ls[y]) {
          var line = Parser.parseLine(ls[y]);
          for (var x = x1;
            x < x2 && x < line.length; x++) {
              if (!!line[x]) {
                r += byteToCharCP866[line[x].char]
              } else {
                r += ' '
              }
          }
          r += '\n'
        }
      }
      // remove last '\n'
      r = r.substr(0,r.length-1);
      return r
    },
}

var ScreenControl = {
    getViewportSize: function(){
        var w = window,
            d = document,
            e = d.documentElement,
            g = d.getElementsByTagName('body')[0],
            x = w.innerWidth || e.clientWidth || g.clientWidth,
            y = w.innerHeight|| e.clientHeight|| g.clientHeight
        return {w:x,h:y}
    },
    expandScreen: function(){
        // увеличить размер canvas при изменении размера окна
        var viewport = ScreenControl.getViewportSize(),
            canvas = document.getElementById('canvas')
        lex.screen.h = Math.ceil((viewport.h - 64) / config.font_height);
        lex.screen.w = Math.ceil((viewport.w) / config.font_width);
        canvas.height = Math.ceil(viewport.h - 64)
        canvas.width = Math.ceil(viewport.w)
    },
    // Контроль за положением прокрутки
    setDefaults: function(){
        lex.screen.x = 0
        lex.screen.y = 0
    },
    setScrollY:function(y){
        lex.screen.y = y
        ScreenControl.checkScrollPosition()
        DrawControl.redrawAll()
    },
    checkScrollPosition: function(){
        if(lex.screen.x > lex.index.maxlen - lex.screen.w + config.max_x_scroll){
            lex.screen.x = lex.index.maxlen - lex.screen.w + config.max_x_scroll
        }
        if(lex.screen.h > lex.file.lines.length){
            // файл не влезает в экран
            if(lex.screen.y > lex.file.lines.length - lex.screen.h){
                lex.screen.y = lex.file.lines.length - lex.screen.h
            }
        }
        var maxshift = lex.screen.h - Math.floor(lex.screen.h*config.max_overscroll)
        if(lex.screen.y > lex.file.lines.length - maxshift){
            lex.screen.y = lex.file.lines.length - maxshift
        }
        if(lex.screen.y < 0){
            lex.screen.y = 0
        }
        if(lex.screen.x < 0){
            lex.screen.x = 0
        }
    },
    scrollHomeY:function(){
        if(lex.content_tree.active) return;
        lex.screen.y = 0
        DrawControl.redrawAll()
    },
    scrollEndY:function(){
        if(lex.content_tree.active) return;
        lex.screen.y = lex.file.lines.length - lex.screen.h
        ScreenControl.checkScrollPosition()
        DrawControl.redrawAll()
    },
    scrollX:function(x){
        if(lex.content_tree.active) return;
        x = Math.round(x)
        lex.screen.x -= x
        ScreenControl.checkScrollPosition()
        DrawControl.redrawAll()
    },
    scrollY:function(y){
        if(lex.content_tree.active) return;
        y = Math.round(y)
        lex.screen.y -= y
        ScreenControl.checkScrollPosition()
        DrawControl.redrawAll()
    },
}

var TouchControl = {
    // Мобильные устройства
    ongoingTouches: [],
    scrollBuffer: {
        x: 0,
        y: 0,
    },
    handleStart: function(event) {
        event.preventDefault();
        var touches = event.changedTouches;        
        for (var i = 0; i < touches.length; i++) {
            TouchControl.ongoingTouches.push(TouchControl.copyTouch(touches[i]));
        }
    },
    handleMove: function(event){
        event.preventDefault();
        var touches = event.changedTouches
        for (var i = 0; i < touches.length; i++) {
            var idx = TouchControl.ongoingTouchIndexById(touches[i].identifier)
            var deltaX = touches[i].pageX - TouchControl.ongoingTouches[idx].pageX
            var deltaY = touches[i].pageY - TouchControl.ongoingTouches[idx].pageY
            TouchControl.scrollBuffer.x += deltaX
            TouchControl.scrollBuffer.y += deltaY
            if (idx >= 0) {
                TouchControl.ongoingTouches.splice(idx, 1, TouchControl.copyTouch(touches[i]));
            } else {
                log("can't figure out which touch to continue");
            }
            if(Math.abs(TouchControl.scrollBuffer.y) > config.touch_y_min){
                ScreenControl.scrollY
                (TouchControl.scrollBuffer.y * config.touch_y_speed / config.touch_y_min)
                TouchControl.scrollBuffer.y = 0
            }
            if(Math.abs(TouchControl.scrollBuffer.x) > config.touch_x_min){
                ScreenControl.scrollX
                (TouchControl.scrollBuffer.x * config.touch_x_speed / config.touch_x_min)
                TouchControl.scrollBuffer.x = 0
            }
        }
    },
    handleEnd: function(event) {
        event.preventDefault();
        var touches = event.changedTouches;
        for (var i = 0; i < touches.length; i++) {
            var idx = TouchControl.ongoingTouchIndexById
            (touches[i].identifier);
            if (idx >= 0) {
                TouchControl.ongoingTouches.splice(idx, 1)
            } else {
                log("can't figure out which touch to end");
            }
        }
    },
    ongoingTouchIndexById: function(idToFind) {
        for (var i = 0; i < TouchControl.ongoingTouches.length; i++) {
            var id = TouchControl.ongoingTouches[i].identifier;
            if (id == idToFind) {
                return i;
            }
        }
        return -1;
    },
    copyTouch: function(touch) {
        return {
            identifier: touch.identifier,
            pageX: touch.pageX,
            pageY: touch.pageY
        };
    },
}

var TestControl = {
    testArrayDecoders: function(){
        function checkEquality(a,b){
            if(a.length != b.length){
                TestControl.logTestResult(a)
                TestControl.logTestResult(b)
                return false
            }
            for(var i = 0; i < a.length; i++){
                if(a[i] != b[i]){
                    TestControl.logTestResult(a)
                    TestControl.logTestResult(b)
                    return false
                }
            }
            return true
        }
        var result = [
            [0],
            [1],
            [0,1],
            [1,0],
            [0,0,0],
            [0,0,1],
            [1,0,1],
            [1,1,1],
            [0,1,1,1],
            [0,0,0,0,0,0,0,0],
            [1,0,1,1,0,1,1,0,1,0,0,1,1,0,1,1,1,1,1,0,0,0,1,1,0,1,0,1,1,0],
            [1,0,1,0,1,1,0,1,0,0,1,1,0,1,1,1,1,1,0,0,0,1,1,0,1,0,1,1,0],
            [1,0,0,0,0,1,0,1,1,0,1,0,0,1,1,0,1,1,1,1,1,0,0,0,1,1,0,1,0,1,1,0],
        ].map(function(arr){
            if(!checkEquality(arr,
                              Coders.string2BinArray(Coders.binArray2String(arr)))){
                TestControl.logTestResult('array decoders test failed')
            }
        })
    },
    testNumCharDecoders: function(){
        for(var i = 0; i < 10000; i++){
            if(Coders.char2Num(Coders.num2Char(i)) != i){
                TestControl.logTestResult('char decoders test failed!')
                return
            }
        }
    },
    testPNGExporting: function(){
        lex.selection.x1 = 0
        lex.selection.x2 = 4
        lex.selection.y1 = 0
        lex.selection.y2 = 4
        lex.selection.set = true
        DrawControl.redrawAll()
        ExportControl.exportToPNG()
    },
    logTestResult: function(result){
        console.log(result)
    },
    LS2LFMigrationReset2LS: function(){
        localStorage.clear()
        localforage.clear()
        localStorage.setItem(config.ls_file_prefix+'test1', 'test 1')
        localStorage.setItem(config.ls_file_prefix+'test2', 'test 2')
    },
    LS2LFTest: function(){
        TestControl.LS2LFMigrationReset2LS()
        InitControl.checkLSAPIVersion()
        setTimeout(function(){
            FileControl.getFileList(function(list){
                if(list[0] != 'test'){
                    TestControl.logTestResult('ls2lf test failed')
                }
            })
        },1000)
    },
    runAll: function(){
        TestControl.testNumCharDecoders()
        TestControl.testArrayDecoders()        
    },
}

