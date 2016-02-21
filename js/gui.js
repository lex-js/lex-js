function baseName(filePath){
	// get file name from url
	return filePath.replace(/^.*[\\\/]/, '')
}
// gettext
// todo
function _(m){return m}

function showGotoLinePrompt(){
	var userInput = prompt(_('Enter line number'),lex.screen.y)
	if(userInput == null) return;
	userInput = parseInt(userInput)
	if(isNaN(userInput)){
		alert(_('Incorrect line number!'))
		return
	}
	ScreenControl.setScrollY(userInput)
	redraw()
}

function getViewportSize(){
	var w = window,
	d = document,
	e = d.documentElement,
	g = d.getElementsByTagName('body')[0],
	x = w.innerWidth || e.clientWidth || g.clientWidth
	y = w.innerHeight|| e.clientHeight|| g.clientHeight
	return {w:x,h:y}
}

function expandScreen(){
	var viewport = getViewportSize()
	lex.screen.h = Math.ceil((viewport.h-64)/config.font_height);
	lex.screen.w = Math.ceil((viewport.w)/config.font_width);
	document.getElementById('canvas').height = Math.ceil(getViewportSize().h-64)
	document.getElementById('canvas').width = Math.ceil(getViewportSize().w)
}
function clearSelection(){
	lex.selection = {
		set: false,
		start: false,
		x1: 0,
		y1: 0,
		x2: 0,
		y2: 0,
	}
	redraw()
}
function getSelectionText(){
	if(!lex.screen_selection.set) return '';
	var s = lex.screen_selection
	var r = ''
	for(var y = Math.min(s.y1, s.y2) - lex.screen.y; y < Math.max(s.y1, s.y2) - lex.screen.y && y  - lex.screen.y< cache.viewport.lines.length; y++){
		if(!!cache.viewport.lines[y]){
			var line = cache.viewport.lines[y]
			for(var x = Math.min(s.x1, s.x2); x < Math.max(s.x1, s.x2) && x < line.length; x++){
				r += byteToCharCP866[line[x]]
			}
		}
		r += '\n'
	}
	r = r.substr(0,r.length-1)
	return r
}

var GUIControl = {
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
			//
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
			pass,
			MessageControl.messageCallback(_('Error: can\'t save file')))
		GUIControl.updateFileList()
	},
	deleteFile: function(filename){
		localStorage.removeItem(config.ls_file_prefix+filename)
		GUIControl.updateFileList()
	},
	pushSelectedToLS: function(file){
		var reader =  new FileReader()
		reader.onload = (function() {
			return function(event) {
				FileControl.saveFile(file.name, FileControl.Uint8ArrayToString(event.target.result))
			};
		})(file);
		reader.readAsArrayBuffer(file);
	},
	loadSelected: function(file){
		var reader = new FileReader()
		reader.onload = (function() {
			return function(event) {
				FileControl.loadFileBySource(event.target.result, redraw)
			};
		})(file);
		reader.readAsArrayBuffer(file);
	},
	Uint8ArrayToString: function(ui8arr){
		var string = ''
		for(var i = 0, b; b = ui8arr[i]; i++){
			string += byteToCharCP866[b]
		}
		return string
	},
	StringToUint8Array: function(string){
		var arr = []
		for(var i = 0, c; c = string[i]; i++){
			arr.push(charToByteCP866[c])
		}
		return new Uint8Array(arr)
	},
	getFileSource: function(filename){
		var r = LS.getItem(config.ls_file_prefix+filename)
		return FileControl.StringToUint8Array(r)
	},
	loadFileByFileName: function(filename, callback){
		FileControl.loadFileBySource(FileControl.getFileSource(filename), callback)
	},
	loadFileBySource: function(source, callback){
		// load file to viewer
		var source = new Uint8Array(source)
		lex.file.source = source
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
			addLineNumbers()
		}
		ScreenControl.setDefaults()
		clearSelection()
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
			ScreenControl.scrollX(-1)
		},
		'right':function(){
			ScreenControl.scrollX(1)
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
			ScreenControl.scrollX(1)
		},
		'д':function(){
			ScreenControl.scrollX(1)
		},
		'h':function(){
			ScreenControl.scrollX(-1)
		},
		'р':function(){
			ScreenControl.scrollX(-1)
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
			showGotoLinePrompt()
		},
		'v':function(){
			toggleLineNumbers()
		},
		'м':function(){
			toggleLineNumbers()
		},
		'esc':function(){
			lex.screen.x = 0
			clearSelection()
			redraw()
		},
	}
	for(var k in t){
		if(t.hasOwnProperty(k)){
			Mousetrap.bindGlobal(k,t[k])
		}
	}
}



function canvasMouseMove(event){
	if(lex.selection.start){
		var selStartRealX = (event.pageX - document.getElementById('canvas').getBoundingClientRect().left)
		var selStartRealY = (event.pageY - document.getElementById('canvas').getBoundingClientRect().top)
		lex.selection.x2 = lex.screen.x + Math.round(selStartRealX/config.font_width)
		lex.selection.y2 = lex.screen.y + Math.round(selStartRealY/config.font_height)
		if(lex.selection.x2 != lex.selection.x1 &&	lex.selection.y1 != lex.selection.y2){
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
	window.addEventListener("DOMMouseScroll", wheel, false);
	window.addEventListener("touchstart", TouchControl.handleStart, false);
	window.addEventListener("touchmove", TouchControl.handleMove, false);
	window.addEventListener("touchend", TouchControl.handleEnd, false);
	window.onmousewheel = document.onmousewheel = wheel;
	window.addEventListener('resize',function(){expandScreen(); redraw()})
	document.getElementById('file-select').addEventListener("change", function(evt){
		var files = evt.target.files
		var lastname = files[files.length - 1].name
		if(!config.save_to_ls){
			files = [files[files.length-1]]
		}
		for (var i = 0, f; f = files[i]; i++) {
			if (!f.type.match('text.*')) {
				continue;
			}
			var reader = new FileReader()
			reader.onload = (function(theFile) {
				return function(event){
					if(config.save_to_ls)
						FileControl.saveFile(theFile.name, FileControl.Uint8ArrayToString(new Uint8Array(event.target.result)))
					if(theFile.name == lastname){
						FileControl.loadFileBySource(new Uint8Array(event.target.result))
					}
				};
			})(f);
			reader.readAsArrayBuffer(f);
		}
	});
	document.getElementById('button-load').addEventListener("click", function(){
		var filename = document.getElementById('file-list').value
		FileControl.loadFileByFileName(filename)
	});
	document.getElementById('button-delete').addEventListener("click", function(){
		var filename = document.getElementById('file-list').value
		FileControl.deleteFile(filename)
	});
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
		var mime = "text/plain"
		var range = document.createRange();
		window.getSelection().addRange(range);
		lex.selection.start = false
	})
	document.addEventListener('copy', function(e){
		var selectionText = getSelectionText()
		if(selectionText != ''){
			e.clipboardData.setData('text/plain',selectionText);
			e.preventDefault();
			window.getSelection().removeAllRanges();
			clearSelection()
		}
	})
}