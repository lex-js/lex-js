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
	try{
	    document.getElementById('line-number').textContent = lex.screen.y
	    document.getElementById('line-count').textContent =	lex.file.lines.length
	    document.getElementById('scroll-percentage').textContent =	Math.ceil(lex.screen.y/(lex.file.lines.length)*100)+'%'
	}catch(e){}
    },
}

var LS = {
    // обертка над localStorage
    setItem:function(name, val, success_callback, error_callback){
	try{
	    localStorage.setItem(name,val)
	    if(typeof success_callback == 'function')
		success_callback()
	}catch(e){
	    if(typeof error_callback == 'function')
		error_callback()
	}
    },
    getItem:function(name){
	try{
	    return localStorage.getItem(name)
	}catch(e){
	    
	}
    }
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
	if(lex.numbers.set){
	    LineNumbersControl.addLineNumbers()
	}
	IndexControl.rebuildIndex()
	SearchControl.flush()
	ScreenControl.setDefaults()
	SelectionControl.clearSelection()
	setTimeout(redraw, 10)
    }
}



function initMousetrap(){
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
    }
    for(var k in t){
	if(t.hasOwnProperty(k)){
	    Mousetrap.bind(k,t[k])
	    Mousetrap(document.getElementById('file-select')).bind(k,t[k])
	}
    }
    // escape from search field with <esc>
    Mousetrap(document.getElementById('search-field')).bind('esc', SearchControl.deactivateSearchField)
    Mousetrap(document.getElementById('search-field')).bind('enter', SearchControl.searchNext)
    Mousetrap(document.getElementById('search-field')).bind('shift+enter', SearchControl.searchPrevious)
    Mousetrap(document.getElementById('search-field')).bind('backspace', function(){
	if(document.getElementById('search-field').value==''){
	    SearchControl.deactivateSearchField()
	}
    })
}

function canvasMouseMove(event){
    if(lex.selection.start){
	var selStartRealX = (event.pageX - document.getElementById('canvas').getBoundingClientRect().left)
	var selStartRealY = (event.pageY - document.getElementById('canvas').getBoundingClientRect().top)
	lex.selection.x2 = lex.screen.x + Math.round(selStartRealX/config.font_width)
	lex.selection.y2 = lex.screen.y + Math.round(selStartRealY/config.font_height)
	if(lex.selection.x2 != lex.selection.x1 &&
	   lex.selection.y1 != lex.selection.y2){
	    lex.selection.set = true
	}else{
	    lex.selection.set = false
	}
	redraw()
    }
}

function eventsInit(){
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
    window.addEventListener('DOMMouseScroll', wheel, false);
    window.addEventListener('touchstart', TouchControl.handleStart, false);
    window.addEventListener('touchmove', TouchControl.handleMove, false);
    window.addEventListener('touchend', TouchControl.handleEnd, false);
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
	console.log(files)
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
			FileControl.saveFile(theFile.name, Coders.Uint8ArrayToString(new Uint8Array(event.target.result)))
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
}

function canvasInit(){
    document.getElementById('canvas').addEventListener('mousedown',function(event){
	var selStartRealX = (event.pageX - document.getElementById('canvas').getBoundingClientRect().left)
	var selStartRealY = (event.pageY - document.getElementById('canvas').getBoundingClientRect().top)
	lex.selection.x1 = lex.screen.x + Math.round(selStartRealX/config.font_width)
	lex.selection.y1 = lex.screen.y + Math.round(selStartRealY/config.font_height)
	lex.selection.start = true
	lex.selection.set = false
	redraw()
	event.preventDefault();
    })
    document.getElementById('canvas').addEventListener('mousemove',canvasMouseMove)
    document.getElementById('canvas').addEventListener('mouseup',function(event){
	canvasMouseMove(event);
	try{
	    // catching "Discontiguous selection is not supported" error in chromium
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
    activateSearchField:function(){
	lex.search.active = true
	var el = document.getElementById('search-field')
	var el2 = document.getElementById('block-search')
	el2.style['z-index'] = 11;
	setTimeout(function(){document.getElementById('search-field').focus()},10)
	redraw()
    },
    deactivateSearchField:function(){
	lex.search.active = false
	var el = document.getElementById('search-field')
	var el2 = document.getElementById('block-search')
	el2.style['z-index'] = 0;
	document.getElementById('search-field').blur()
	redraw()
    },
    clearSearchField:function(){
	var el = document.getElementById('search-field')
	el.value = ''
	redraw()
    },
    findAll: function(searchStr, str, caseSensitive) {
	var startIndex = 0, searchStrLen = searchStr.length;
	var index, indices = [];
	if (!caseSensitive) {
	    str = str.toLowerCase();
	    searchStr = searchStr.toLowerCase();
	}
	while ((index = str.indexOf(searchStr, startIndex)) > -1) {
	    indices.push(index);
	    startIndex = index + searchStrLen;
	}
	return indices;
    },
    performSearchByString: function(){
	lex.search.results = this.performSearchByFunction(
	    function(line){
		// array to return
		var r = []
		// search string
		var val = document.getElementById('search-field').value
		if(!val)
		    return []
		var indexes = SearchControl.findAll(val, line, true)
		for(var i = 0; i < indexes.length; i++){
		    r.push({
			status: true,
			start : indexes[i],
			length: val.length,
			end   : indexes[i] + val.length,
		    })
		}
		return r
	    }
	)
    },
    updateSearchBlock: function(){
	var number = (lex.search.results.length==0)?0:(lex.search.active_entry_number+1)
	var total  = number?lex.search.results.length:0
	document.getElementById('search-number').textContent = number
	document.getElementById('search-total').textContent = total
    },
    performSearch: function(){
	if(lex.search.regexp == false){
	    SearchControl.performSearchByString()
	}else{
	    this.performSearchByRegExp()
	}
	SearchControl.updateSearchBlock()
	redraw()
    },
    performSearchByRegExp: function(){
    },
    performSearchByFunction: function(f){
	// Возможно создание других режимов поиска
	var ls = lex.index.lines
	var ln = ls.length
	var r = []
	for(var i = 0; i < ln; i++){
	    r = r.concat(f(ls[i]).map(function(o){
		o.line = i; return o;
	    }))
	}
	return r
    },
    jumpToIndex: function(index){
	if(index < lex.search.results.length - 1){
	    lex.search.active_entry_number = index
	}
	if(!lex.search.results[index]){
	    lex.search.active_entry_number = lex.search.results.length - 1
	    return
	}
	if(lex.search.results[index].line < lex.screen.y){
	    ScreenControl.setScrollY(lex.search.results[index].line)
	    redraw()
	}
	if(lex.search.results[index].line > lex.screen.y + lex.screen.h){
	    ScreenControl.setScrollY(lex.search.results[index].line)
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
    }
}

