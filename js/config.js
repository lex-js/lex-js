var config = {
	logging:true,
	log_max_length:50,
	font_max:11,
	fg_color:[0,0,0,255],
	bg_color:[255,255,255,255],
	selection_fill_color:'rgba(0,0,255,0.4)',
	font_width:8,
	font_height:19,
	font_path:'fonts/new/VGA',
	font_ext:'.SFN',
	init_file:'sample/info.txt',
	load_file_from_source:true,
	load_font_from_source:true,
	ls_file_prefix:'file_',
	save_to_ls: true,
	touch_y_min: 10,
	touch_x_min: 10,
	touch_y_speed: 0.5,
	touch_x_speed: 1,
}

var lex = {
	fonts:{
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

for(var i = 0; i <= config.font_max; i++){
	lex.fonts[i] = {bitmaps:{}}
}