# lex-js [![](https://ci.appveyor.com/api/projects/status/github/lex-js/lex-js)](https://ci.appveyor.com/project/limitedeternity/lex-js)

Lexicon was a text editor / word processor MS-DOS program that was extremely popular in the Soviet Union and Russia at the end of 1980s and in 1990s.

[Lexicon Viewer](http://www.lexview.spb.ru/) is a tool that provides read-only access to documents created in Lexicon. It exists in both Windows and UNIX versions.

lex-js is a reimplementation of Lexicon Viewer as a web application.

# Preview

![lex-js preview](preview.png)

# Features

- reading documents from both server and local computer
- copying text contents to clipboard
- saving selected document areas as PNG
- search (capable of searching in text with hyphenations - useful since hardcoded line breaks are used in lexicon)
- saving files in local browser storage (no need to open the same file twice)
- line numbers (optional)

# Hotkeys


| Key                     | meaning                                              |
|-------------------------|------------------------------------------------------|
| v                       | toggle line numbers                                  |
| alt+g                   | go to line...                                        |
| s                       | start searching                                      |
| o                       | open file from local computer                        |
| c                       | open contents (list of remote files and directories) |
| up/down/left/right      | scrolling                                            |
| ctrl+up/down/left/right | scrolling                                            |
| j/k/h/l                 | scrolling (vim-style)                                |
| pgup / pgdown           | scroll one screen up/down                            |
| b / f                   | scroll one screen up/down                            |
| home / end              | scroll to the top / bottom of the document           |
| n                       | open this file in new tab                            |
| d                       | download selected area as PNG                        |
| ctrl+c                  | copy selected area of text to clipboard              |

# Usage

## Binary release

1. Go to [Releases](https://github.com/lex-js/lex-js/releases)
2. Download distributive
3. Run the application

**BINARY VERSION IS *ONLY* FOR LOCAL USE**

Do not make ports used by the binary accessible remotely - this will basically allow anyone on the net to read arbitrary files on your machine.

Use one of the methods below to run your public instance of the app securely.

## With a webserver

If you wish to set up a public instance available for anyone on the web, use either [node-backend](https://github.com/lex-js/node-backend) or alternative legacy [php-backend](https://github.com/lex-js/php-backend).

## With no setup

If for any reason you don't want to use any of the methods above, you can still run the app by opening `index.html` from the latest "Basic" release.

However, content listing will not work, as it relies on server-side code to provide file info. Preserving local files in a browser storage may not work too, depending on how IndexedDB API is implemented in your browser.

# Compatibility

We aim to support Windows XP and Chrome 49 and above for binary releases.
