

var config = {
	// Выводить лог
	logging: true,
	// Максимальная длина сообщения в логе [todo]
	log_max_length: 50,
	// Максимальный номер шрифта
	font_max:10,
	// Размеры шрифта
	font_width:8,
	font_height:19,
	// Шаблон имени шрифта
	font_path:'fonts/new/VGA',
	// Расширение шрифта (регистр важен)
	font_ext:'.SFN',
	// Загружать ли шрифт из исходного файла?
	load_font_from_source: false,

	// Файл, открываемый при старте, если load_file_from_source == true
	init_file:'/sample/info.txt',
	load_file_from_source: false,

	// Префекс для сохранения файлов в localStorage
	ls_file_prefix:'file_',
	// Сохранять ли все открываемые текстовые файлы в localStorage
	save_to_ls: true,

	// Цвет текста, rgba
	fg_color:[0,0,0,255],
	// Цвет фона, rgba
	bg_color:[255,255,255,255],
	// Цвет выделения
	selection_fill_color:[0,0,255,100],
	// Минимальный сдвиг при прокрутке пальцем в мобильных устройствах
	touch_x_min: 10,
	touch_y_min: 10,
	// Коэффицент скорости прокрутки в мобильных устройствах 
	touch_x_speed: 1,
	touch_y_speed: 0.5,
	// Настройки парсера. Управляющие коды, по которым происходит переключение шрифтов
	parser:{
		fonts:{
			48: 0,
			49: 1,
			50: 2,
			51: 3,
			52: 4,
			53: 5,
			54: 6,
			55: 7,
			56: 8,
			57: 9,
			205: 10,
		},
		underline_true:95,
		underline_false:46,
		command: 255,
	}
}

var lex = {
	fonts    :{},
	file     :{},
	filelist :{},
	selection:{
		set: false,
		start: false,
		x1: 0,
		y1: 0,
		x2: 0,
		y2: 0,
	},
	screen:{
		x:0,
		y:0,
		w:140,
		h:10,
	},
	numbers:{
		set: true,
		width: 0,
	},
}

for(var i = 0; i <= config.font_max; i++){
	lex.fonts[i] = {bitmaps:{}}
}
function log(m){
	// redefine it
	if(config.logging){
		if(m.length > config.log_max_length)
			m = m.substr(0,config.log_max_length)
		console.log(m)
	}
}
function pass(){
	// use as empty callback
}
function Uint8Array2BinArray(arr){
	var padding = "00000000"
	var str_result = ''
	var arr_result  = []
	for(var i = 0; i < arr.byteLength; i++){
		var bin_str = (arr[i] >>> 0).toString(2)
		var padded  = padding.substring(0, padding.length - bin_str.length) + bin_str
		str_result += padded
	}
	for(var i = 0; i < str_result.length; i++){
		arr_result.push(str_result[i]=='1')
	}
	return arr_result
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

var DrawControl = {
	setFontBGColor: function(bg_color){
		config.bg_color = bg_color
		redraw()
	},
	setFontFGColor: function(fg_color){
		config.fg_color = fg_color
		redraw()
	},
	HEXColorToArray: function(color){
		var r = [0,0,0,255]
		if(!this.isHEXColor(color)) return r
			color = color.substr(1)
		if(color.length == 3){
			r = [
			(parseInt(color[0], 16))*16,
			(parseInt(color[1], 16))*16,
			(parseInt(color[2], 16))*16,
			255
			]
		}else if(color.length == 6){
			r = [
			parseInt((color[0]+color[1]), 16)+1,
			parseInt((color[2]+color[3]), 16)+1,
			parseInt((color[4]+color[5]), 16)+1,
			255
			]			
		}	
		return r
	},
	isHEXColor: function(maybe_color){
		if(!typeof maybe_color == 'string') return false;
		if(!maybe_color[0] == '#') return false;
		maybe_color = maybe_color.substr(1)
		if(maybe_color.length ==  3){
			return true
		}else if(maybe_color.length == 6){
			return true
		}else{
			return false
		}
	},
	makeImageData: function(){
		if(config.load_font_from_source && !FontControl.fontsLoaded()) return false;
		var t, w, h, canvas, context, data, fg, bg, u, char
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
				var shift = w*h*charCode
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
						t_imageData.data[((w * y) + x) * 4]     = u[0]
						t_imageData.data[((w * y) + x) * 4 + 1] = u[1]
						t_imageData.data[((w * y) + x) * 4 + 2] = u[2]
						t_imageData.data[((w * y) + x) * 4 + 3] = u[3]
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
				if(imgData1.data[i+j] == config.fg_color[j] || imgData2.data[i+j] == config.fg_color[j]){
					imgData3.data[i+j] = config.fg_color[j]
				}else{
					imgData3.data[i+j] = config.bg_color[j]
				}
			}
		}
		context.putImageData(imgData3,x*config.font_width,y*config.font_height);
	},
	redrawCanvas: function(context){
		context.fillStyle= 'rgba('+config.bg_color[0]+','+config.bg_color[1]+','+config.bg_color[2]+','+config.bg_color[3]+')'
		context.fillRect(0, 0, lex.screen.w*config.font_width, lex.screen.h*config.font_height)
		for(var y = 0; y < lex.screen.h && y < lex.file.lines.length; y++){
			var line = lex.file.lines[y + lex.screen.y]
			if(typeof line == 'undefined') break;
			line = Parser.parseLine(line)
			for(var x = 0; x < line.length; x++){
				var char      = line[x].char
				var underline = line[x].underline
				var font      = line[x].font
				if(lex.fonts[font].bitmaps[char]){
					context.putImageData(lex.fonts[font].bitmaps[char], (x - lex.screen.x)*config.font_width, y*config.font_height)
					if(underline){
						DrawControl.underlineChar(char, font, x - lex.screen.x, y, context)
					}
				}
			}
		}
	},
	redrawSelection: function(context){
		if(lex.selection.set){
			var t = config.selection_fill_color
			context.fillStyle = 'rgba('+t[0]+','+t[1]+','+t[2]+','+(t[3]/255)+')'
			var xs = (lex.selection.x1 - lex.screen.x)*config.font_width 
			var ys = (lex.selection.y1 - lex.screen.y)*config.font_height
			var ws = (lex.selection.x2 - lex.selection.x1)*config.font_width
			var hs = (lex.selection.y2 - lex.selection.y1)*config.font_height	
			context.fillRect(xs, ys, ws, hs)
		}
	},
	redrawAll(){
		var canvas = document.getElementById('canvas')
		var context = canvas.getContext('2d')
		GUIControl.updateBottomBlock()
		DrawControl.redrawCanvas(context)
		DrawControl.redrawSelection(context)
	}
}

var redraw = DrawControl.redrawAll

function getSelectionText(){
	// получение выделенного текста
	var minX = Math.min(lex.selection.x1, lex.selection.x2)
	var minY = Math.min(lex.selection.y1, lex.selection.y2)
	var maxX = Math.max(lex.selection.x1, lex.selection.x2)
	var maxY = Math.max(lex.selection.y1, lex.selection.y2)

	var ret  = []
	for(var y = minY; y < maxY && y < lex.file.lines.length; y++){
		var parsed = Parser.parseLine(lex.file.lines[y])
		var line = []
		for(var x = minX; x < parsed.length && x < maxX; x++){
			line.push(parsed[x].char)
		}
		ret.push(FileControl.Uint8ArrayToString(new Uint8Array(line)))
	}
	return ret.join('\n')
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
			js_output += 'lex.fonts['+fontNumber+'].source = ['
			for(var i = 0; i < source.length; i++){
				js_output += source[i]?1:0
				if(i != source.length - 1)
					js_output += ','
			}
			js_output += '];\n'
		}
		this.donwloadFontFile(js_output)
	},
	donwloadFontFile: function(fontSrc){
		// Создает файл, загружаемый из браузера
		var blob = new Blob([fontSrc], {type: "text/plain;charset=utf-8"});
		saveAs(blob, "fonts.js");
	},
	outputFonts: function(){
		for(var f = 48; f <= 57; f++){
			r = [255,f]
			for(var i = 0; i < 255; i++){
				r.push(i)
			}
			lex.file.lines[f-48] = new Uint8Array(r)
		}
		redraw()
	}
}

function getLineNumberBytes(n, width){
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

}
function removeLineNumbers(){
	for(var i = 0; i < lex.file.lines.length; i++){
		lex.file.lines[i] = new Uint8Array(Array.from(lex.file.lines[i]).splice(lex.numbers.width+2))
	}
	lex.numbers.set = false
	lex.numbers.width = 0
	redraw()
}

function addLineNumbers(){
	lex.numbers.width = (lex.file.lines.length+'').length+1
	lex.numbers.set = true
	for(var i = 0; i < lex.file.lines.length; i++){
		var t = new Uint8Array(getLineNumberBytes(i,lex.numbers.width).concat(Array.from(lex.file.lines[i])))
		lex.file.lines[i] = t
	}
	redraw()
}

function toggleLineNumbers(){
	if(lex.numbers.set){
		removeLineNumbers()
	}else{
		addLineNumbers()
	}
}


function loadFileByURL(url, callback){
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
}

function postInit(){
	expandScreen()
	GUIControl.updateFileList()
	DrawControl.makeImageData()
}

function init(){
	// on document load
	initMousetrap()
	expandScreen()
	eventsInit()
	canvasInit()

	if(config.load_font_from_source){
		for(var i = 0; i <= config.font_max; i++){
			FontControl.loadFont(i, function(){
				if(DrawControl.makeImageData()){
					redraw()
				}
			})
		}
	}


	if(config.load_file_from_source){
		loadFileByURL(config.init_file, postInit)
	}else{
		FileControl.loadFileBySource(lex.file.source, redraw)
	}
	postInit()
}


ScreenControl = {
	// Контроль за положением прокрутки
	setDefaults: function(){
		lex.screen.x = 0
		lex.screen.y = 0
	},
	setScrollY:function(y){
		lex.screen.y = y
		ScreenControl.checkScrollPosition()
		redraw()
	},
	scrollEndY:function(){
		lex.screen.y = lex.file.lines.length - lex.screen.h
		ScreenControl.checkScrollPosition()
		redraw()
	},
	checkScrollPosition(){
		if(lex.screen.x > lex.screen.w - 4){
			lex.screen.x = lex.screen.w - 4
		}
		if(lex.screen.y < 0){
			lex.screen.y = 0
		}
	},
	scrollHomeY:function(){
		lex.screen.y = 0
		redraw()
	},
	scrollX:function(x){
		x = Math.round(x)
		lex.screen.x -= x
		ScreenControl.checkScrollPosition()
		redraw()
	},
	scrollY:function(y){
		y = Math.round(y)
		lex.screen.y -= y
		ScreenControl.checkScrollPosition()
		redraw()
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
		var touches = event.changedTouches;
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
				ScreenControl.scrollY(TouchControl.scrollBuffer.y * config.touch_y_speed/config.touch_y_min)
				TouchControl.scrollBuffer.y = 0
			}
			if(Math.abs(TouchControl.scrollBuffer.x) > config.touch_x_min){
				ScreenControl.scrollX(TouchControl.scrollBuffer.x * config.touch_x_speed/config.touch_x_min)
				TouchControl.scrollBuffer.x = 0
			}
		}
	},
	handleEnd: function(event) {
		event.preventDefault();
		var touches = event.changedTouches;
		for (var i = 0; i < touches.length; i++) {
			var idx = TouchControl.ongoingTouchIndexById(touches[i].identifier);
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
		return { identifier: touch.identifier, pageX: touch.pageX, pageY: touch.pageY };
	},
}


document.addEventListener("DOMContentLoaded", init);
