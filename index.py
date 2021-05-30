import sys
from os import sep as path_separator
from os.path import abspath, basename, dirname, join as join_path
from pathlib import Path as file_props
from threading import Timer
from io import open as open_file
from webbrowser import open as open_browser_tab
from glob import glob as find_by_glob
from bottle import get, request, static_file, HTTPResponse, run
from json import dumps as json_to_string


CONFIG = {
    "port": 64320,
}

RUNTIME = {
    "external_root": abspath(dirname(__file__)),
    "internal_root": abspath(dirname(__file__)),
    "tab_url": "http://localhost:{0}".format(CONFIG["port"]),
}


if getattr(sys, "frozen", False):
    RUNTIME["external_root"] = abspath(dirname(sys.executable))
    RUNTIME["internal_root"] = getattr(sys, "_MEIPASS")

if len(sys.argv) > 1:
    print("Opening file {0}".format(basename(abspath(sys.argv[1]))))

    RUNTIME["tab_url"] = "http://localhost:{0}/#remote:{1}:0".format(
        CONFIG["port"],
        abspath(sys.argv[1]).replace('\\', '/')
    )


@get("/")
def index():
    return static_file("index.html", root=RUNTIME["internal_root"])


@get("/api")
def api():
    try:
        action = getattr(request.query, "action")

        if action == "listdir":
            path = getattr(request.query, "dir").replace("\\", path_separator) \
                if path_separator == "/" \
                else getattr(request.query, "dir").replace("/", path_separator)

            listing = sorted(
                find_by_glob("{0}{1}*".format(
                    path,
                    path_separator if not path.endswith(path_separator) else ""
                ))
            )

            dir_list = []
            file_list = []

            for entry in listing:
                try:
                    stat_info = file_props(entry).stat()

                except OSError:
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
            fname = abspath(getattr(request.query, "file"))

            if not file_props(fname).is_file():
                return HTTPResponse(status=404)

            response = HTTPResponse(status=200)
            with open_file(fname, "rb") as fd:
                response.body = fd.read()

            response.set_header(
                "Cache-Control", "no-cache, no-store, must-revalidate")
            response.set_header("Pragma", "no-cache")
            response.set_header("Expires", "0")
            return response

        else:
            raise AttributeError("No such action")

    except AttributeError:
        return HTTPResponse(status=400)


@get("/public/<filename:path>")
def send_static(filename):
    return static_file(filename, root=join_path(RUNTIME["internal_root"], "public"))


class Call:
    def __init__(self, fn, *args, **kwargs):
        self.fn = fn
        self.args = args
        self.kwargs = kwargs

    def __call__(self):
        return self.fn(*self.args, **self.kwargs)


Timer(0.5, Call(print, "Listening on http://localhost:{0}".format(CONFIG["port"]))).start()
Timer(1, Call(open_browser_tab, RUNTIME["tab_url"])).start()
run(host="localhost", port=CONFIG["port"], quiet=True, debug=False)
