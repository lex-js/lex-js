// Не изменяйте этот файл!
// Чтобы поменять значение, создайте файл
// config.js в корне проекта и замените нужные
// свойства объекта config в нем
var config = {
    // Выводить лог
    logging: true,
    // Максимальный номер шрифта
    font_max:10,
    // Размеры шрифта
    font_width: 8,
    font_height: 19,
    // Шаблон имени шрифта
    font_path: 'fonts/new/VGA',
    // Расширение шрифта (регистр важен)
    font_ext: '.SFN',
    // Загружать ли шрифт из исходного файла?
    // true : используются шрифты из new/
    // false: используется fonts.js
    load_font_from_source: false,
    app_full_name: 'Lex.js',

    // включать ли показ номеров строк при открытии нового файла
    show_line_numbers: true,
    mobile_style_url: 'css/mobile.css',
    // use it only for testing
    mobile_click_event: 'click',
    // Запускать тесты
    perform_test: false,

    load_file_from_source: true,
    // Файл, открываемый при старте, если load_file_from_source == true
    init_file:'/sample/info.txt',

    // Файлы, хранящиеся на сервере
    content_tree_enabled: true,
    content_list_url: 'files/filectl.php?action=list&dirs=',
    content_real_path: 'files/content/',

    // Хранить ли source файла в памяти (см. lex.file.source)
    // [true только для отладки]
    save_file_source: false,
    // Префекс для сохранения файлов в localStorage
    ls_file_prefix: 'file_',
    // Сохранять ли все открываемые текстовые файлы в localStorage
    save_to_ls: !!localStorage,

    // экспорт в PNG
    export_png_file_name_prefix: 'lex_',
    export_png_file_name_suffix: '.',
    // очищать выделение после сохранения файла?
    export_clear_selection: true,

    // экспорт в PDF
    export_pdf_jspdf_path: 'lib/jspdf.min.js',
    export_pdf_image_height: 100,

    // Часть области экрана, на которую можно
    // проскроллить после достижения конца файла
    max_overscroll: 0.3,
    // Минимальный отступ по х (количество столбцов на экране)
    max_x_scroll: 2,
    line_numbers_padding: 2,
    // Скорость прокрутки при нажатом ctrl
    ctrl_scroll_k: 8, // not implemented

    // Цвет текста, rgba
    fg_color: [0,0,0,255],
    // Цвет фона, rgba
    bg_color: [255,255,255,255],
    // Цвет выделения
    selection_fill_color: [0,0,255,100],
    // Цвет результатов поиска
    search_fill_color: [255,255,0,100],
    // Цвет активного результата поиска
    search_active_fill_color: [0,255,0,100],

    // Минимальный сдвиг при прокрутке пальцем в мобильных устройствах
    touch_x_min: 10,
    touch_y_min: 10,
    // Коэффицент скорости прокрутки в мобильных устройствах
    touch_x_speed: 1,
    touch_y_speed: 0.5,

    // just don't modify it
    max_char_code: 8,

    // search function
    // 0 = example function, returns nothing (not implemented)
    // 1 = simple case-sensitive search (not implemented)
    // 2 = simple case-insensitive search (not implemented)
    // 3 = smart case-sensitive search search (not implemented)
    // 4 = smart case-insensitive search
    // default = 4
    search_function: 4,

    // Настройки парсера.
    // Управляющие коды, по которым происходит
    // переключение шрифтов и режимов
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
    fonts: {},
    file: {
        name: '',
        lines: [[]],
    },
    filelist: {},
    index: {
        lines:[],
    },
    search: {
        active: false,
        regexp: false,
        string: "",
        results: [],
        active_entry_number:0,
    },
    selection: {
        set: false,
        start: false,
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 0,
    },
    screen: {
        x: 0,
        y: 0,
        w: 140,
        h: 10,
    },
    numbers: {
        set: config.show_line_numbers,
        width: 0,
    },
    content_tree: {
        tree: null,
        active: false
    },
    content_list: {
        path: '',
        active: false,
    },
}

for(var i = 0; i <= config.font_max; i++){
    lex.fonts[i] = {bitmaps:{}}
}
