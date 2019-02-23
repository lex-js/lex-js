// Do not edit this file!
// To change a value, use "config.js"
// placed in the project's root.

// Не изменяйте этот файл!
// Чтобы поменять значение, создайте файл
// config.js в корне проекта и замените нужные
// свойства объекта config в нем
var config = {
  /* Application */

  // App name used in page title
  // Название программы (используется в заголовке страницы)
  app_full_name: "Lex.js",

  /* Fonts */

  // Number of last font
  // Номер последнего шрифта
  font_max: 10,

  // Font dimensions
  // Размеры шрифта
  font_width: 8,
  font_height: 19,

  // Font path prefix
  // Префикс имени шрифта
  font_path: "/public/fonts/VGA",

  // Icons path
  // Префикс URL до иконок
  icon_path: "/public/icons/",

  // Font path suffix
  // Расширение шрифта (регистр важен)
  font_ext: ".SFN",

  // Load fonts from source (.SFN) files?
  // If set to true, fonts from `new/` will be used
  // If set to false, compiled fonts from fonts.js will be used.
  // Загружать ли шрифт из исходного файла?
  // true : используются шрифты из new/
  // false: используется fonts.js
  load_font_from_source: false,

  /* Appearance */

  // Show line numbers by default when opening new file?
  // Отображать номера строк при открытии нового файла?
  show_line_numbers: true,

  // Font color, RGBA
  // Цвет текста, RGBA
  fg_color: [0, 0, 0, 255],

    // Font path suffix
    // Расширение шрифта (регистр важен)
    font_ext: '.SFN',

    // Load fonts from source (.SFN) files?
    // If set to true, fonts from `new/` will be used
    // If set to false, compiled fonts from fonts.js will be used.
    // Загружать ли шрифт из исходного файла?
    // true : используются шрифты из new/
    // false: используется fonts.js
    load_font_from_source: false,


    /* Appearance */

    // Show line numbers by default when opening new file?
    // Отображать номера строк при открытии нового файла?
    show_line_numbers: true,

    // Font color, RGBA
    // Цвет текста, RGBA
    fg_color: [0, 0, 0, 255],

    // Background color, RGBA
    // Цвет фона, RGBA
    bg_color: [255, 255, 255, 255],

    // Background color of selection, RGBA
    // Цвет выделения
    selection_fill_color: [0, 0, 255, 100],

    // Background color of highlighted search results
    // Цвет результатов поиска
    search_fill_color: [255, 255, 0, 100],

    // Background color of focused search result
    // Цвет активного результата поиска
    search_active_fill_color: [0, 255, 0, 100],

    // Maximum overscroll length (in screen sizes)
    // e.g 0.5 means only half of the screen height is visible if the file
    // is scrolled to the end.
    // Размер области экрана, на которую можно проскроллить после достижения
    // конца файла (относительно высоты экрана экрана)
    max_overscroll: 0.3,

    // Minimum count of columns always shown on the screen (determines how much
    // can file be scrolled horizontally)
    // Минимальный отступ по х (определяет, сколько столбцов всегда показаны на
    // экране)
    max_x_scroll: 2,

    // How many spaces is inserted after each line number
    // Ширина отступа после номеров строки
    line_numbers_padding: 2,

    // Scrolling acceleration coefficent when ctrl key is pressed
    // Множитель скорости прокрутки при нажатом ctrl
    ctrl_scroll_k: 8,


    /* Settings for mobile devices */

    // URL of .css for mobile devices
    // URL CSS-стиля для мобильных устройств
    mobile_style_url: 'css/mobile.css',

    // Minimal shift for scrolling in mobile devices (in pixels)
    // Минимальный сдвиг при прокрутке пальцем в мобильных устройствах
    touch_x_min: 10,
    touch_y_min: 10,

    // Коэффицент скорости прокрутки в мобильных устройствах
    touch_x_speed: 1,
    touch_y_speed: 0.5,

    // Расстояния, на которые нужно проскроллить в мобильных устройствах,
    // чтобы изменить видимость панели сверху.
    hide_top_bar_delta: 10,
    show_top_bar_delta: 10,


    /* Greeting file */

    // Load greeting file from source?
    // Загружать ли файл приветствия из исходника?
    load_greeting_file_from_source: true,

    // Greeting file URL, used if load_file_from_source is set to `true`
    // Файл, открываемый при старте, если load_file_from_source == true
    greeting_file:'/public/startPage/info.txt',


    /* Files */

    // URL to retrieve directory listings from server
    // URL для получения листинга директории с сервера
    content_list_url: '/api?action=listdir&dir=',

    // URL prefix pointing to directory on server where actual files are stored
    // Префикс URL указывающий на директорию, где хранятся файлы
    content_real_path: '/api?action=getfile&file=',


    /* PNG exporting */

    // PNG filename prefix
    // Префикс имени файлы
    export_png_file_name_prefix: 'lex_',

    // Filename postfix (no extension)
    // Суффикс имени файла (без расширения)
    export_png_file_name_suffix: '.',

    // Clear selection after exporting file?
    // Очищать выделение после сохранения файла?
    export_clear_selection: true,

    /* Parser settings */

    // Escape codes used to switch fonts and decorations (viz. underlining)
    // Номера управляющих байт, переключающих шрифты и подчёркивание
    parser: {
        fonts: {
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
        underline_true: 95,
        underline_false: 46,
        empty_line: 232,
        command: 255
    },

    /* Other */

    // URIHash shows current scroll position and file info.
    // Update delay specifies how much time should pass between last user interaction
    // and actual address bar update.
    // URIHash отображает текущую позицию прокрутки и путь к файлу.
    // Этот параметр определяет, сколько времени должно пройти после последнего действия
    // пользователя и обновления адресной строки.
    uri_hash_update_delay: 500,

    // Save file source on memory? (use for debugging)
    // Хранить ли source файла в памяти? (для отладки)
    save_file_source: false,

    // Prefix for filenames in localStorage
    // Префекс для сохранения файлов в localStorage
    ls_file_prefix: "file_",

    // Save all files opened locally to localStorage?
    // Сохранять ли все открываемые пользователем с компьютера
    // текстовые файлы в localStorag?
    save_to_ls: !!localStorage,

    // Search function
    // Smart search can handle newlines properly (even if words are splitted
    // among lines by hyphen)
    // 0 = dummy function, returns nothing
    // 1 = simple case-sensitive search (not implemented)
    // 2 = simple case-insensitive search (not implemented)
    // 3 = smart case-sensitive search
    // 4 = smart case-insensitive search
    // Default = 4
    search_function: 4,

    // Logging to console.
    // Выводить сообщения в console
    logging: true,

    // Run tests on startup
    // Запускать тесты
    perform_test: false
};
