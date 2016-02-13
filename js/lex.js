var lex = {
	fonts:{
		0:{bitmaps:{}},
		1:{bitmaps:{}},
		2:{bitmaps:{}},
		3:{bitmaps:{}},
		4:{bitmaps:{}},
		5:{bitmaps:{}},
		6:{bitmaps:{}},
		7:{bitmaps:{}},
		8:{bitmaps:{}},
		9:{bitmaps:{}},
	},
	file:{},
	filelist:{},
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
		set: false,
		width: 0,
	},

}

var config = {
	logging:true,
	log_max_length:50,
	font_max:9,
	fg_color:[0,0,0,255],
	bg_color:[255,255,255,255],
	selection_fill_color:'rgba(0,0,255,0.4)',
	font_width:8,
	font_height:19,
	font_real_width:8,
	font_real_height:19,
	font_path:'/fonts/old/',
	load_file_from_source:true,
	load_font_from_source:false,
	ls_filelist:'filelist',
	ls_file_prefix:'file_',
	save_to_ls: true,
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

function switchCommand(char, underline, font){
	switch(char){
		case 46:{
			underline = false
			break
		}
		case 95:{
			underline = true
			break
		}
		case 48:{
			font = 0
			break
		}
		case 49:{
			font = 1
			break
		}
		case 50:{
			font = 2
			break
		}
		case 51:{
			font = 3
			break
		}
		case 52:{
			font = 4
			break
		}
		case 53:{
			font = 5
			break
		}
		case 54:{
			font = 6
			break
		}
		case 55:{
			font = 7
			break
		}
		case 56:{
			font = 8
			break
		}
		case 57:{
			font = 9
			break
		}
		case 255:{
			//context.putImageData(lex.fonts[font].bitmaps[42], xc*config.font_width, yc*config.font_height)
			// font_char(0x30 + font, x + cx, y + cy, 0xFF);
			//xc += 2;
			break
		}
	}
	return {
		font: font,
		underline: underline
	}
}

function parseLine(line){
	var r = []
	var font      = 0
	var command   = false
	var underline = false
	var pos       = 0
	for(var x = 0; x < line.length; x++){
		var char = line[x]
		if(command){
			var t = switchCommand(char, underline, font)
			font = t.font
			underline = t.underline
			command = 0
		}else{
			switch(char){
				case 9:{
					x = Math.ceil((x/8+1)*8) // += 8?
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
}

function underlineChar(char, font, x, y, context){
	var imgData1 = lex.fonts[4].bitmaps[95] // _
	var imgData2 = lex.fonts[font].bitmaps[char]
	var imgData3 = context.createImageData(imgData1)
	for(var i=0; i < imgData1.data.length; i+=4)
	{
		if(imgData1.data[i] == config.fg_color[0] || imgData2.data[i] == config.fg_color[0]){
			imgData3.data[i] = config.fg_color[0]
		}else{
			imgData3.data[i] = config.bg_color[0]
		}
		if(imgData1.data[i+1] == config.fg_color[1] || imgData2.data[i+1] == config.fg_color[1]){
			imgData3.data[i+1] = config.fg_color[1]
		}else{
			imgData3.data[i+1] = config.bg_color[1]
		}
		if(imgData1.data[i+2] == config.fg_color[2] || imgData2.data[i+2] == config.fg_color[2]){
			imgData3.data[i+2] = config.fg_color[2]
		}else{
			imgData3.data[i+2] = config.bg_color[2]
		}
		if(imgData1.data[i+3] == config.fg_color[3] || imgData2.data[i+3] == config.fg_color[3]){
			imgData3.data[i+3] = config.fg_color[3]
		}else{
			imgData3.data[i+3] = config.bg_color[3]
		}
	}
	context.putImageData(imgData3,x*config.font_width,y*config.font_height);

}

function getSelectionText(){
	var minX = Math.min(lex.selection.x1, lex.selection.x2)
	var minY = Math.min(lex.selection.y1, lex.selection.y2)
	var maxX = Math.max(lex.selection.x1, lex.selection.x2)
	var maxY = Math.max(lex.selection.y1, lex.selection.y2)
	var ret  = []
	for(var y = minY; y < maxY && y < lex.file.lines.length; y++){
		var parsed = parseLine(lex.file.lines[y])
		var line = []
		for(var x = minX; x < parsed.length && x < maxX; x++){
			line.push(parsed[x].char)
		}
		ret.push(FileControl.Uint8ArrayToString(new Uint8Array(line)))
	}
	return ret.join('\n')
}

function redraw(){
	GUIControl.updateBottomBlock()
	var canvas, context, cw, ch
	cw = lex.screen.w
	ch = lex.screen.h

	canvas = document.getElementById('canvas')
	context = canvas.getContext('2d')
	context.fillStyle= 'rgba('+config.bg_color[0]+','+config.bg_color[1]+','+config.bg_color[2]+','+config.bg_color[3]+')'
	context.fillRect(0, 0, cw*config.font_width, ch*config.font_height)
	for(var y = 0; y < ch && y < lex.file.lines.length; y++){
		var line = lex.file.lines[y + lex.screen.y]
		if(typeof line == 'undefined') break;
		line = parseLine(line)
		for(var x = 0; x < line.length; x++){
			var char      = line[x].char
			var underline = line[x].underline
			var font      = line[x].font
			if(lex.fonts[font].bitmaps[char]){
				context.putImageData(lex.fonts[font].bitmaps[char], (x - lex.screen.x)*config.font_width, y*config.font_height)
				if(underline){
					underlineChar(char, font, x - lex.screen.x, y, context)
				}
			}
		}
	}
	if(lex.selection.set){
		context.fillStyle= config.selection_fill_color
		var xs = (lex.selection.x1 - lex.screen.x)*config.font_width 
		var ys = (lex.selection.y1 - lex.screen.y)*config.font_height
		var ws = (lex.selection.x2 - lex.selection.x1)*config.font_width
		var hs = (lex.selection.y2 - lex.selection.y1)*config.font_height	
		context.fillRect(xs, ys, ws, hs)
	}
}

function makeImageData(){
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
		for(var charCode = 0; charCode < 256; charCode ++){
			var shift = w*h*charCode
			var char  = String.fromCharCode(charCode)
			buff = lex.fonts[fontNumber].source

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
}

function loadFont(num,callback){
	// this function is not in use
	var req = null
	req = new XMLHttpRequest();
	req.responseType = "arraybuffer"
	req.open('GET', config.font_path+'font'+num+'.fnt', true)
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
	makeImageData()
	expandScreen()
	GUIControl.updateFileList()
}
function init(){

	initMousetrap()
	expandScreen()
	eventsInit()
	canvasInit()

	if(config.load_font_from_source){
		for(var i = 0; i <= config.font_max; i++){
		 	loadFont(i, pass)
		}
	}


	if(config.load_file_from_source){
		loadFileByURL('/sample/info.txt', postInit)
	}else{
		FileControl.loadFileBySource(lex.file.source, redraw)
	}
	postInit()
	//setTimeout(, 1000)
}


ScreenControl = {
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

function wheel(event){
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



document.addEventListener("DOMContentLoaded", init);
window.addEventListener("DOMMouseScroll", wheel, false);
window.onmousewheel = document.onmousewheel = wheel;
window.addEventListener('resize',function(){expandScreen(); redraw()})