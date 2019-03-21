import sys
from os import sep as path_separator
from os.path import abspath, relpath, realpath, basename, dirname, normpath as normalize, join as join_path
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
        join_path(internal_root, "config", "config-server.json"),
        "r"
    )
)

content_root = join_path(external_root, config["content_dir"])
listen_port = config["port"]


@get('/')
def index():
    return static_file('index.html', root=internal_root)


@get('/api')
def api():
    action = request.query.action

    if action == "listdir":
        query_path = normalize(request.query.dir or ".")
        path = join_path(content_root, query_path)

        if not realpath(path).startswith(realpath(content_root) + path_separator):
            path = content_root

        dir_list = sorted(find_by_glob("{0}{1}*".format(path, path_separator)))
        dir_list_with_info = []

        for entry in dir_list:
            obj = {
                "name": basename(entry),
                "modified": file_props(entry).stat().st_mtime * 1000
            }

            if file_props(entry).is_file():
                obj["type"] = "file"
                obj["size"] = file_props(entry).stat().st_size

            else:
                obj["type"] = "directory"

            dir_list_with_info.append(obj)

        return json_to_string(dir_list_with_info)

    elif action == "getfile":
        fname = normalize(request.query.file)
        file = join_path(content_root, fname)

        if any(glob_match(file, glob) for glob in config["allowed_files"]):
            return static_file(fname, root=content_root)

        else:
            return HTTPResponse(status=404)

    else:
        return HTTPResponse(status=400)


@get('/public/<filename:path>')
def send_static(filename):
    return static_file(filename, root=join_path(internal_root, "public"))


if len(sys.argv) > 1 and file_props(sys.argv[1]).is_file():
    open_browser_tab(
        "http://localhost:{0}/#remote:{1}:0".format(listen_port, relpath(sys.argv[1], content_root)))
        
else:
    open_browser_tab("http://localhost:{0}".format(listen_port))

print("Listening on http://localhost:{0}".format(listen_port))
run(host='localhost', port=listen_port, quiet=True, debug=False)
