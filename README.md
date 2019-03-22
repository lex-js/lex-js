# lex-js

<a href="https://ci.appveyor.com/project/limitedeternity/lex-js">
  <img src="https://ci.appveyor.com/api/projects/status/github/lex-js/lex-js?retina=true" />
</a>

<br>

Lexicon was a text editor / word processor MS-DOS program that was extremely popular in the Soviet Union and Russia at the end of 1980s and in 1990s.

[Lexicon Viewer](http://www.lexview.spb.ru/) is a tool that provides read-only access to documents created in Lexicon. It exists in both Windows and UNIX versions.

lex-js is a reimplementation of Lexicon Viewer as a web application.

# Preview

![lex-js preview](preview.png)

# Features

- reading documents both from server and from local computer
- copying text contents to clipboard
- saving selected document areas as PNG
- saving files between sessions (no need to open the same file twice)
- line numbers (optional)

# Hotkeys


| Key | meaning |
|-----|---------|
| v  | toggle line numbers  |
| alt+g | go to line... |
| s | start searching |
| o | open file from local computer |
| c | open contents (list of remote files and directories) |
| up/down/left/right | scrolling |
| ctrl+up/down/left/right | scrolling |
| j/k/h/l | scrolling (vim-style) |
| pgup / pgdown | scroll one screen up/down |
| b / f | scroll one screen up/down |
| home / end | scroll to the top / bottom of the document |
| esc | reset horizontal position of the file |
| n | open this file in new tab |
| d | download selected area as PNG |
| ctrl+c | copy selected area of text to clipboard |

# Usage

1. Go to [Releases](https://github.com/lex-js/lex-js/releases)
2. Download distributive
3. Run application
