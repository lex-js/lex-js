import sys
from os import sep as path_separator
from os.path import abspath, expanduser, basename, dirname, join as join_path
from pathlib import Path as file_props
from io import open as open_file
from webbrowser import open as open_browser_tab
from fnmatch import fnmatch as glob_match
from glob import glob as find_by_glob
from json import load as load_json, dumps as json_to_string
from bottle import get, request, static_file, HTTPResponse, run

RUNTIME_CONFIG = {
    "external_root": None,
    "internal_root": None,
    "content_root": None,
    "tab_url": None,
    "file_is_opened_from_cli": False,
}

if getattr(sys, 'frozen', False):
    RUNTIME_CONFIG["external_root"] = abspath(dirname(sys.executable))
    RUNTIME_CONFIG["internal_root"] = sys._MEIPASS

else:
    RUNTIME_CONFIG["internal_root"] = RUNTIME_CONFIG["external_root"] = abspath(
        dirname(__file__))

CONFIG_FILE = load_json(
    open_file(
        join_path(RUNTIME_CONFIG["external_root"],
                  "config", "config-server.json"),
        "r"
    )
)

if len(sys.argv) > 1 and file_props(sys.argv[1]).is_file():
    print("Opening file {0}".format(sys.argv[1]))
    RUNTIME_CONFIG["file_is_opened_from_cli"] = True

    RUNTIME_CONFIG["tab_url"] = "http://localhost:{0}/#remote:{1}:0".format(
        CONFIG_FILE["port"],
        abspath(sys.argv[1]).replace('\\', '/')
    )
else:
    RUNTIME_CONFIG["tab_url"] = "http://localhost:{0}".format(
        CONFIG_FILE["port"])


if CONFIG_FILE["content_dir"] == ":drive:":
    RUNTIME_CONFIG["content_root"] = abspath(path_separator)
elif CONFIG_FILE["content_dir"] == ":home:":
    RUNTIME_CONFIG["content_root"] = expanduser("~")
else:
    RUNTIME_CONFIG["content_root"] = abspath(
        CONFIG_FILE["content_dir"].replace("../", "").lstrip("/"))


@get('/')
def index():
    return static_file('index.html', root=RUNTIME_CONFIG["internal_root"])


@get('/api')
def api():
    action = request.query.action

    if action == "listdir":
        path = join_path(RUNTIME_CONFIG["content_root"], request.query.dir.replace(
            "../", "").lstrip("/"))

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
        fname = None
        if RUNTIME_CONFIG["file_is_opened_from_cli"]:
            fname = abspath(request.query.file)
            RUNTIME_CONFIG["file_is_opened_from_cli"] = False

        else:
            fname = join_path(
                RUNTIME_CONFIG["content_root"], request.query.file.lstrip("/"))

        if not file_props(fname).is_file():
            return HTTPResponse(status=404)

        for glob in CONFIG_FILE["allowed_files"]:
            if glob_match(fname.lower(), glob):
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
    return static_file(filename, root=join_path(RUNTIME_CONFIG["internal_root"], "public"))


open_browser_tab(RUNTIME_CONFIG["tab_url"])

try:
    print("Listening on http://localhost:{0}".format(CONFIG_FILE["port"]))
    run(host='localhost', port=CONFIG_FILE["port"], quiet=True, debug=False)
except BaseException:
    pass
