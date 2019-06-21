import sys
from os import sep as path_separator
from os.path import abspath, basename, dirname, join as join_path
from pathlib import Path as file_props
from io import open as open_file
from webbrowser import open as open_browser_tab
from glob import glob as find_by_glob
from bottle import get, request, static_file, HTTPResponse, run
from json import dumps as json_to_string

RUNTIME = {
    "external_root": None,
    "internal_root": None,
    "tab_url": None,
}

CONFIG = {
    "port": 64320,
}

if getattr(sys, 'frozen', False):
    RUNTIME["external_root"] = abspath(dirname(sys.executable))
    RUNTIME["internal_root"] = sys._MEIPASS

else:
    RUNTIME["internal_root"] = RUNTIME["external_root"] = abspath(
        dirname(__file__))

if len(sys.argv) > 1:
    print("Opening file {0}".format(sys.argv[1]))

    RUNTIME["tab_url"] = "http://localhost:{0}/#remote:{1}:0".format(
        CONFIG["port"],
        sys.argv[1].replace('\\', '/')
    )
else:
    RUNTIME["tab_url"] = "http://localhost:{0}".format(
        CONFIG["port"])


@get('/')
def index():
    return static_file('index.html', root=RUNTIME["internal_root"])


@get('/api')
def api():
    action = request.query.action

    if action == "listdir":
        path = request.query.dir

        listing = sorted(find_by_glob("{0}{1}*".format(path, path_separator)))

        dir_list = []
        file_list = []

        for entry in listing:
            try:
                stat_info = file_props(entry).stat()
            except BaseException:
                continue

            obj = {
                "name": basename(entry),
                "modified": stat_info.st_mtime * 1000
            }

            if file_props(entry).is_file():
                obj["type"] = "file"
                obj["size"] = stat_info.st_size
                file_list.append(obj)

            else:
                obj["type"] = "directory"
                dir_list.append(obj)

        response = HTTPResponse(status=200)
        response.body = json_to_string(dir_list + file_list)
        response.set_header(
            "Cache-Control", "no-cache, no-store, must-revalidate")
        response.set_header("Pragma", "no-cache")
        response.set_header("Expires", "0")
        return response

    elif action == "getfile":
        fname = abspath(request.query.file)

        if not file_props(fname).is_file():
            return HTTPResponse(status=404)

        try:
            response = HTTPResponse(status=200)
            with open_file(fname, 'rb') as fd:
                response.body = fd.read()

            response.set_header(
                "Cache-Control", "no-cache, no-store, must-revalidate")
            response.set_header("Pragma", "no-cache")
            response.set_header("Expires", "0")
            return response
        except BaseException:
            pass

        return HTTPResponse(status=403)

    return HTTPResponse(status=400)


@get('/public/<filename:path>')
def send_static(filename):
    return static_file(filename, root=join_path(RUNTIME["internal_root"], "public"))


open_browser_tab(RUNTIME["tab_url"])

try:
    print("Listening on http://localhost:{0}".format(CONFIG["port"]))
    run(host='localhost', port=CONFIG["port"], quiet=True, debug=False)
except BaseException:
    pass
