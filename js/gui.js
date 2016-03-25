// gettext
// todo
function _(m){return m}

var GUIControl = {
    showGotoLinePrompt: function(){
        var userInput = prompt(_('Enter line number'), lex.screen.y)
        if(userInput == null) return;
        userInput = parseInt(userInput)
        if(isNaN(userInput)){
            alert(_('Incorrect line number!'))
            return
        }
        ScreenControl.setScrollY(userInput)
        redraw()
    },
    updateFileList: function(){
        var el = document.getElementById('file-list')
        el.innerHTML = ''
        FileControl.getFileList().map(function(filename){
            var o = document.createElement('option')
            o.textContent = filename
            el.appendChild(o)
        })
    },
    updateBottomBlock: function(){
        var y = lex.screen.y
        var l = lex.file.lines.length - 1
        l = l?l:1 // prevent division by zero 
        document.getElementById('line-number').textContent = y
        document.getElementById('line-count').textContent  = l
        document.getElementById('scroll-percentage').textContent = Math.ceil(y/(l)*100)+'%'
    },
}

var MessageControl = {
    show:function(text) {
        alert(text)    
    },
    hide:function(){

    },
    messageCallback(text, callback){
        return function(){
            MessageControl.show(text)
            if(typeof callback == 'function'){
                callback()
            }
        }
    }
}

var FileControl = {
    getFileList: function(){
        var r = []
        for(var sth in localStorage){
            if(localStorage.hasOwnProperty(sth) && sth.startsWith(config.ls_file_prefix)){
                r.push(sth.substr(config.ls_file_prefix.length))
            }
        }
        return r.sort()
    },
    saveFile: function(filename, source){
        LS.setItem(config.ls_file_prefix+filename, source,
                   function(){},
                   MessageControl.messageCallback(_('Error: can\'t save file')))
        GUIControl.updateFileList()
    },
    deleteFile: function(filename){
        localStorage.removeItem(config.ls_file_prefix+filename)
        GUIControl.updateFileList()
    },
    pushSelectedToLS: function(file){
        var reader =  new FileReader()
        reader.onload = (function(){
            return function(event){
                FileControl.saveFile(file.name, Coders.Uint8ArrayToString(event.target.result))
            };
        })(file);
        reader.readAsArrayBuffer(file);
    },
    loadSelected: function(file){
        var reader = new FileReader()
        reader.onload = (function(){
            return function(event){
                FileControl.loadFileBySource(event.target.result, redraw)
            };
        })(file);
        reader.readAsArrayBuffer(file);
    },
    getFileSource: function(filename){
        var r = LS.getItem(config.ls_file_prefix+filename)
        return Coders.StringToUint8Array(r)
    },
    loadFileByFileName: function(filename, callback){
        FileControl.loadFileBySource(FileControl.getFileSource(filename), callback)
    },
    loadFileByURL: function(url, callback){
        var req = null
        req = new XMLHttpRequest()
        req.responseType = "arraybuffer"
        req.open('GET', url, true)
        req.onreadystatechange = function() { 
            if(req.readyState == 4){
                if(req.status == 200){
                    FileControl.loadFileBySource(req.response)
                    log('File loaded: '+url)
                    if(!!callback)
                        callback(lex.file)
                }else{
                    log('Error while loading file ('+req.status+'): '+url)
                }
            }
        }
        req.send(null)
    },
    loadFileBySource: function(source, callback){
        // load file to viewer
        var source = new Uint8Array(source)
        if(config.save_file_source){
            lex.file.source = source
        }else{
            // make it empty
            lex.file.source = new Uint8Array()
        }
        lex.file.lines = [[]] // insert one empty line
        var lineBytes = []
        for(var i = 0; i < source.byteLength; i++){
            if(source[i] == 13){
                lex.file.lines.push(new Uint8Array(lineBytes))
                lineBytes = []
                i++
            }else{
                lineBytes.push(source[i])
            }
        }
        lex.file.lines.push(new Uint8Array(lineBytes))
        if(typeof callback == 'function')
            callback()
        FileControl.postLoad()
        return lex.file
    },
    postLoad: function(){
        IndexControl.rebuildIndex()
        if(lex.numbers.set){
            LineNumbersControl.addLineNumbers()
        }
        SearchControl.flush()
        ScreenControl.setDefaults()
        SelectionControl.clearSelection()
        setTimeout(redraw, 10)
    }
}

var MobileUIControl = {
    openMenu: function(){
        MobileUIControl.setFileList()
        document.getElementById('mobile-menu').style['display'] = 'block'
    },
    setFileList: function(){
        var list = FileControl.getFileList(),
            elem = document.getElementById('mobile-file-list')
        // remove old entries
        elem.innerHTML = ''
        // cycle through file names and create appropriative elements
        for(var i = 0; i < list.length; i++){
            var c = document.createElement('div')
            c.className = 'mobile-file-item mobile-menu-item'
            c.textContent = list[i]
            c.addEventListener(config.mobile_click_event, function(){
                FileControl.loadFileByFileName(this.textContent)
                MobileUIControl.closeMenu()
            })
            elem.appendChild(c)
        }         
    },
    closeMenu: function(){
        document.getElementById('mobile-menu').style['display'] = 'none'
    },
}

var ExportControl = {
    exportToPNG: function(){
        // exports selection to PNG file
        if(!lex.selection.set) return;

        var s = lex.selection,
            x1 = Math.min(s.x1, s.x2),
            x2 = Math.max(s.x1, s.x2),
            y1 = Math.min(s.y1, s.y2),
            y2 = Math.max(s.y1, s.y2),
            w  = x2-x1,
            h  = y2-y1,
            rw = w * config.font_width,
            rh = h * config.font_height       

        // create new temprorary canvas
        var canvas = document.createElement('canvas')
        canvas.width  = rw
        canvas.height = rh

        var context = canvas.getContext('2d')
        var imageData = context.createImageData(rw, rh)

        // fill context with default color
        // (otherwise it remains transparent)
        context.fillStyle= 'rgba('+
            config.bg_color[0]+','+
            config.bg_color[1]+','+
            config.bg_color[2]+','+
            config.bg_color[3]+')'
        context.fillRect(0, 0, rw, rh)

        // loop through chars
        for(var y = y1; y < y2 && y < lex.file.lines.length; y++){
            var line = lex.file.lines[y]
            if(typeof line == 'undefined') break;
            line = Parser.parseLine(line)
            for(var x = x1; x < line.length && x < x2; x++){
                var char      = line[x].char,
                    underline = line[x].underline,
                    font      = line[x].font
                if(lex.fonts[font].bitmaps[char]){
                    context.putImageData
                    (lex.fonts[font].bitmaps[char],
                     (x-x1) * config.font_width,
                     (y-y1) * config.font_height)
                    if(underline){
                        DrawControl.underlineChar
                        (char, font, (x-x1), (y-y1), context)
                    }
                }
            }         
        }

        canvas.toBlob(function(blob) {
            saveAs(blob, config.export_png_file_name);
        });

        if(config.export_clear_selection)
            SelectionControl.clearSelection()
    }
}

var InitControl = {
    init: function(){
        // on document load
        InitControl.initMousetrap()
        ScreenControl.expandScreen()
        InitControl.eventsInit()
        InitControl.canvasInit()
        var is_local = document.location.protocol == 'file:'
        if(config.load_font_from_source && !is_local){
            for(var i = 0; i <= config.font_max; i++){
                FontControl.loadFont(i, function(){
                    if(DrawControl.makeImageData()){
                        redraw()
                    }
                })
            }
        }
        
        if(config.perform_test){
            TestControl.runAll()
        }
        if(isMobile()){
            InitControl.mobileInit()
            InitControl.mobileEventsInit()
        }
        if(config.load_file_from_source && !is_local){
            FileControl.loadFileByURL(config.init_file, InitControl.postInit)
        }else{
            FileControl.loadFileBySource(lex.file.source, redraw)
        }
        InitControl.postInit()
    },
    postInit: function(){
        ScreenControl.expandScreen()
        GUIControl.updateFileList()
        DrawControl.makeImageData()
    },
    eventsInit: function(){
        var wheel = function(event){
            var delta = 0;
            if(!event)
                event = window.event;
            if(event.wheelDelta){
                delta = event.wheelDelta/120;
            }else if (event.detail){ 
                delta = -event.detail/3;
            }
            if(delta){
                ScreenControl.scrollY(delta)
            }
            if (event.preventDefault)
                event.preventDefault();
            event.returnValue = false;
        }
        var canvas = document.getElementById('canvas')
        window.addEventListener('DOMMouseScroll', wheel, false);
        canvas.addEventListener('touchstart', TouchControl.handleStart, false);
        canvas.addEventListener('touchmove', TouchControl.handleMove, false);
        canvas.addEventListener('touchend', TouchControl.handleEnd, false);
        window.onmousewheel = document.onmousewheel = wheel;
        window.addEventListener('resize',function(){ScreenControl.expandScreen(); redraw()})
        document.getElementById('search-field').addEventListener('keyup', SearchControl.performSearch)
        document.getElementById('button-search').addEventListener('click', function(){
            if(lex.search.active){
                SearchControl.deactivateSearchField()
            }else{
                SearchControl.activateSearchField()
            }
        })
        document.getElementById('search-close').addEventListener('click', function(){
            SearchControl.clearSearchField()
            SearchControl.deactivateSearchField()
        })
        document.getElementById('file-list').addEventListener('change', function(evt){
            evt.target.blur()
        })
        document.getElementById('file-select').addEventListener('change', function(evt){
            // some js routine...
            var files = evt.target.files
            var lastname = files[files.length - 1].name
            if(!config.save_to_ls){
                files = [files[files.length-1]]
            }
            for (var i = 0, f; f = files[i]; i++) {
                if (!f.type.match('text.*')) {
                    continue
                }
                var reader = new FileReader()
                reader.onload = (function(theFile) {
                    return function(event){
                        if(config.save_to_ls)
                            FileControl.saveFile(theFile.name,
                                                 Coders.Uint8ArrayToString
                                                 (new Uint8Array(event.target.result)))
                        if(theFile.name == lastname){
                            FileControl.loadFileBySource(new Uint8Array(event.target.result))
                            document.activeElement.blur()
                        }
                    }
                })(f)
                reader.readAsArrayBuffer(f)
            }
        })
        document.getElementById('button-load').addEventListener("click", function(){
            var filename = document.getElementById('file-list').value
            FileControl.loadFileByFileName(filename)
        })
        document.getElementById('button-line-numbers').addEventListener("click", function(){
            LineNumbersControl.toggleLineNumbers()
        })
        document.getElementById('button-goto-line').addEventListener("click", function(){
            GUIControl.showGotoLinePrompt()
        })
        document.getElementById('button-delete').addEventListener("click", function(){
            var filename = document.getElementById('file-list').value
            FileControl.deleteFile(filename)
        })
    },
    mobileInit: function(){
        log('Running in mobile device!')

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
    mobileEventsInit: function(){
        var e = config.mobile_click_event
        var closeMenu = function(){
            // отложить закрытие меню для достижения
            // лучшего визуального эффекта
            setTimeout(MobileUIControl.closeMenu, 1000)
        }
        var arr = {
            'mobile-menu-open': MobileUIControl.openMenu,
            'mobile-open-file': function(){
                document.getElementById('file-select').click()
                closeMenu()
            },
            'mobile-toggle-lines': function(){
                LineNumbersControl.toggleLineNumbers()
                MobileUIControl.closeMenu()
            },
            'mobile-goto-line': function(){
                GUIControl.showGotoLinePrompt()
                MobileUIControl.closeMenu()
            },
        }
        for(var elId in arr){
            document.getElementById(elId).addEventListener(e, arr[elId])
        }
    },
    initMousetrap: function(){
        // Mousetrap bindings
        var t = {
            'up':function(){
                ScreenControl.scrollY(1)
            },
            'down':function(){
                ScreenControl.scrollY(-1)
            },
            'left':function(){
                ScreenControl.scrollX(1)
            },
            'right':function(){
                ScreenControl.scrollX(-1)
            },
            'ctrl+up':function(){
                ScreenControl.scrollY(1*config.ctrl_scroll_k)
            },
            'ctrl+down':function(){
                ScreenControl.scrollY(-1*config.ctrl_scroll_k)
            },
            'ctrl+left':function(){
                ScreenControl.scrollX(1*config.ctrl_scroll_k)
            },
            'ctrl+right':function(){
                ScreenControl.scrollX(-1*config.ctrl_scroll_k)
            },
            'k':function(){
                ScreenControl.scrollY(1)
            },
            'л':function(){
                ScreenControl.scrollY(1)
            },
            'j':function(){
                ScreenControl.scrollY(-1)
            },
            'о':function(){
                ScreenControl.scrollY(-1)
            },
            'l':function(){
                ScreenControl.scrollX(-1)
            },
            'д':function(){
                ScreenControl.scrollX(-1)
            },
            'h':function(){
                ScreenControl.scrollX(1)
            },
            'р':function(){
                ScreenControl.scrollX(1)
            },
            'pagedown':function(){
                ScreenControl.scrollY(-lex.screen.h+1)
            },
            'f':function(){
                ScreenControl.scrollY(-lex.screen.h+1)
            },
            'а':function(){
                ScreenControl.scrollY(-lex.screen.h+1)
            },
            'pageup':function(){
                ScreenControl.scrollY(lex.screen.h-1)
            },
            'b':function(){
                ScreenControl.scrollY(lex.screen.h-1)
            },
            'и':function(){
                ScreenControl.scrollY(lex.screen.h-1)
            },
            'end':function(){
                ScreenControl.scrollEndY()
            },
            'home':function(){
                ScreenControl.scrollHomeY()
            },
            'alt+g':function(){
                GUIControl.showGotoLinePrompt()
            },
            'v':function(){
                LineNumbersControl.toggleLineNumbers()
            },
            'м':function(){
                LineNumbersControl.toggleLineNumbers()
            },
            'esc':function(){
                lex.screen.x = 0
                SelectionControl.clearSelection()
                redraw()
            },
            'alt+f3':function(){
                SearchControl.activateSearchField();
            },
            'ы':function(){
                SearchControl.activateSearchField();
            },
            's':function(){
                SearchControl.activateSearchField();
            },
            'щ':function(){
                document.getElementById('file-select').click()
            },
            'o':function(){
                document.getElementById('file-select').click()
            },
            'd':function(){
                if(lex.selection.set){
                    ExportControl.exportToPNG()
                }
            },
            'в':function(){
                if(lex.selection.set){
                    ExportControl.exportToPNG()
                }
            },
        }
        for(var k in t){
            if(t.hasOwnProperty(k)){
                Mousetrap.bind(k,t[k])
                Mousetrap(document.getElementById('file-select')).bind(k,t[k])
            }
        }
        Mousetrap(document.getElementById('search-field')).bind('esc', function(){
            SearchControl.clearSearchField()
            SearchControl.deactivateSearchField()
        })
        Mousetrap(document.getElementById('search-field')).bind('enter', SearchControl.searchNext)
        Mousetrap(document.getElementById('search-field')).bind('shift+enter', SearchControl.searchPrevious)
        Mousetrap(document.getElementById('search-field')).bind('backspace', function(){
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
            lex.selection.x1 = lex.screen.x + Math.round(selStartRealX/config.font_width)
            lex.selection.y1 = lex.screen.y + Math.round(selStartRealY/config.font_height)
            lex.selection.start = true
            lex.selection.set = false
            redraw()
            event.preventDefault();
        })
        function canvasMouseMove(event){
            if(lex.selection.start){
                var canvas = document.getElementById('canvas'),
                    rect   = canvas.getBoundingClientRect()
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
                redraw()
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
                e.clipboardData.setData('text/plain',selectionText);
                e.preventDefault();
                window.getSelection().removeAllRanges();
                SelectionControl.clearSelection()
            }
        })
    },

}


var TipsControl = {
    clearNow: function(){
    },
    showTip: function(text){
    },
    showRandomTip: function(){
    },
}

var SearchControl = {
    searchFunctions: [
        function(){
            // function that takes nothing and returns
            // list of results, each of them containing list of
            // blocks (real positions of text that need to be
            // highlighted)
            return 
            [
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
        function(){},
        function(text, str){
            var c, n = 0,
                nb = 0,
                ne = 0,
                i = 0,
                line,
                last, skip,
                skipFlag = false,
                r = [],
                tr = [],
                lines = text.split('\n'),
                lineBeginnings = [],
                li = 0

            for(var y = 0; y < lines.length; y++){
                lineBeginnings[y] = li
                li += lines[y].length
                while(lines[y].length &&
                          (lines[y].endsWith('-') ||
                           lines[y].endsWith(' '))){
                        lines[y] = lines[y].substr(0, lines[y].length-1)
                }
            }
                
            function push(begin, end, y, x, n){
                tr.push({
                    begin: begin,
                    end: end,
                    line: y,
                    start: x-n,
                    length: n+1,
                })
            }
            for(var y = 0; y < lines.length; y++){
                line = lines[y]
                for(var x = 0; x < line.length; x++){
                    c = line[x]
                    last = x == line.length - 1 // is last char in line?
                    if(c == str[n]){
                        if(!n){
                            nb = i
                        }
                        if(n < str.length-1){

                            n++
                        }else{
                            push(nb, i, y, x, n)
                            
                            r.push(tr)
                            tr = []
                            n = 0
                        }
                    }else{
                        n = 0
                        nb = 0
                    }
                    i++
                }
                if(n){
                    push(nb, i, y, x-1, n)
                    nb = i
                }
                i++
            }
            return r
        }
    ],
    // DOM functions
    activateSearchField:function(){
        lex.search.active = true
        var el = document.getElementById('search-field')
        var el2 = document.getElementById('block-search')
        el2.style['z-index'] = 11;
        setTimeout(function(){
            el.focus()
        },10)
        redraw()
    },
    deactivateSearchField:function(){
        lex.search.active = false
        var el = document.getElementById('search-field')
        var el2 = document.getElementById('block-search')
        el2.style['z-index'] = 0;
        el.blur()
        redraw()
    },
    clearSearchField:function(){
        var el = document.getElementById('search-field')
        el.value = ''
        redraw()
    },
    updateSearchBlock: function(){
        var number = (lex.search.results.length==0)?0:(lex.search.active_entry_number+1)
        var total  = number?lex.search.results.length:0
        document.getElementById('search-number').textContent = number
        document.getElementById('search-total').textContent = total
    },
    jumpToIndex: function(index){
        if(index < lex.search.results.length - 1){
            lex.search.active_entry_number = index
        }
        if(!lex.search.results[index]){
            lex.search.active_entry_number = lex.search.results.length - 1
            return
        }
        SearchControl.scrollToCurrentResult()
    },
    scrollToCurrentResult: function(){
        var index = lex.search.active_entry_number,
            arr = lex.search.results[index]
        if(!arr) return;
        // TODO: correct minimum line number detection
        var line = arr[arr.length - 1].line - 1
        if(line < lex.screen.y || 
           line > lex.screen.y + lex.screen.h){
            ScreenControl.setScrollY(line)
            redraw()
        }
    },
    searchNext:function(){
        if(lex.search.active_entry_number < lex.search.results.length - 1){
            lex.search.active_entry_number++
        }else{
            lex.search.active_entry_number = 0
        }
        SearchControl.jumpToIndex(lex.search.active_entry_number)
        SearchControl.updateSearchBlock()
    },
    searchPrevious:function(){
        if(lex.search.active_entry_number > 0){
            lex.search.active_entry_number--
        }else{
            lex.search.active_entry_number = lex.search.results.length-1
        }
        SearchControl.jumpToIndex(lex.search.active_entry_number)
        SearchControl.updateSearchBlock()
    },
    flush: function(){
        lex.search.active = false
        lex.search.active_entry_number = 0
        lex.search.results = []
        SearchControl.updateSearchBlock()
        SearchControl.clearSearchField()
        SearchControl.deactivateSearchField()
    },
    // main functions
    performSearch: function(){
        SearchControl.performSearchByFunction()
        SearchControl.updateSearchBlock()
        redraw()
    },
    performSearchByFunction: function(){
        var text = lex.index.text,
            str  = document.getElementById('search-field').value,
            func = SearchControl.searchFunctions[config.search_function]
        lex.search.results = func(text, str)
        SearchControl.scrollToCurrentResult()
    },
}

document.addEventListener("DOMContentLoaded", InitControl.init);
