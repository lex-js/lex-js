import sys
from os import sep as path_separator
from os.path import abspath, relpath, realpath, basename, dirname, normpath as normalize, join as join_path, splitdrive
from pathlib import Path as file_props
from io import open as open_file
from webbrowser import open as open_browser_tab
from fnmatch import fnmatch as glob_match
from glob import glob as find_by_glob
from json import load as load_json, dumps as json_to_string
from bottle import get, request, static_file, HTTPResponse, run


external_root = None # for content_root
internal_root = None # for static assets

if getattr(sys, 'frozen', False):
    external_root = abspath(dirname(sys.executable))
    internal_root = sys._MEIPASS

else:
    internal_root = external_root = abspath(dirname(__file__))

config = load_json(
    open_file(
        join_path(external_root, "config", "config-server.json"),
        "r"
    )
)

content_root = normalize(config["content_dir"])
listen_port = config["port"]

if len(sys.argv) > 1 and file_props(sys.argv[1]).is_file():
    print("Opening file {0}".format(sys.argv[1]))
    tab_url = "http://localhost:{0}/#remote:{1}:0".format(
        listen_port,
        normalize(abspath(sys.argv[1])).replace('\\', '/')
    )
else:
    tab_url = "http://localhost:{0}".format(listen_port)


@get('/')
def index():
    return static_file('index.html', root=internal_root)


@get('/api')
def api():
    action = request.query.action

    if action == "listdir":
        path = normalize(request.query.dir)

        listing = sorted(find_by_glob("{0}{1}*".format(path, path_separator)))
        dir_list = []
        file_list = []

        for entry in listing:
            try:
                stat_info = file_props(entry).stat()
            except BaseException as e:
                # This file or directory will not be available for reading anyway
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

        return json_to_string(dir_list + file_list)

    elif action == "getfile":
        fname = abspath(normalize(request.query.file))

        if not file_props(fname).is_file():
            return HTTPResponse(status=404)

        lowername = fname.lower()
        for glob in config["allowed_files"]:
            if glob_match(lowername, glob):
                try:
                    fd = open(fname, 'rb')
                    response = HTTPResponse(status=200)
                    response.body = fd.read()
                    fd.close()
                    response.set_header("Cache-Control", "no-cache, no-store, must-revalidate")
                    response.set_header("Pragma", "no-cache")
                    response.set_header("Expires", "0")
                    return response
                except BaseException as e:
                    pass

    return HTTPResponse(status=400)


@get('/public/<filename:path>')
def send_static(filename):
    return static_file(filename, root=join_path(internal_root, "public"))


open_browser_tab(tab_url)

try:
    print("Listening on http://localhost:{0}".format(listen_port))
    run(host='localhost', port=listen_port, quiet=True, debug=False)
except BaseException as e:
    pass
