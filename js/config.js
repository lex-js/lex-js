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
    // true : используются шрифты из new/
    // false: используется fonts.js
    load_font_from_source: false,

    // Запускать тесты
    perform_test: true,

    // Файл, открываемый при старте, если load_file_from_source == true
    init_file:'/sample/info.txt',
    load_file_from_source: false,

    // Префекс для сохранения файлов в localStorage
    ls_file_prefix:'file_',
    // Сохранять ли все открываемые текстовые файлы в localStorage
    save_to_ls: true,

    // Часть области экрана, на которую можно 
    // проскроллить после достижения конца файла
    max_overscroll: 0.3,
    // Минимальный отступ по х (количество столбцов на экране)
    max_x_scroll: 4,
    // Скорость прокрутки при нажатом ctrl
    ctrl_scroll_k: 8,
    // Цвет текста, rgba
    fg_color:[0,0,0,255],
    // Цвет фона, rgba
    bg_color:[255,255,255,255],
    // Цвет выделения
    selection_fill_color:[0,0,255,100],
    // Цвет результатов поиска
    search_fill_color:[255,255,0,100],
    // Цвет активного результата поиска
    search_active_fill_color:[0,255,0,100],

    // Минимальный сдвиг при прокрутке пальцем в мобильных устройствах
    touch_x_min: 10,
    touch_y_min: 10,
    // Коэффицент скорости прокрутки в мобильных устройствах 
    touch_x_speed: 1,
    touch_y_speed: 0.5,

    // just don't modify it
    max_char_code: 8,
    
    // Настройки парсера. Управляющие коды, по которым происходит переключение шрифтов и режимов
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
    index:{
	lines:[],
    },
    search:{
	active: false,
	regexp: false,
	string: "",
	results:[],
        active_entry_number:0,
    },
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
