<?php
include 'config-default.php';
include 'config-user.php';

function directoryTree($dir)
{
    global $config;
    $results = array();
    $files = scandir($dir);

    foreach($files as $key => $value)
    {
        $path = ($dir . DIRECTORY_SEPARATOR . $value);
        $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
        if(!is_dir($path))
        {
            if(empty($config['allowed_exts']) ||
               in_array($ext, $config['allowed_exts']))
            {
                $results[] = Array(
                    'name'     => $value,
                    'type'     => 'file',
                    'modified' => filemtime($path),
                    'size'     => filesize($path)
                );
            }
        } else if ($value != "." && $value != "..")
        {
            $results[] = Array(
                'name' => basename($path),
                'type' => 'directory',
                'modified' => filemtime($path),
                'files' => directoryTree($path) // recursive call!
                    // something bad may happen if there's a symlink to parent dir!
                    // TODO: add a recursion limit?
            );
        }
    }
    return $results;
}

function directoryList ($path, $dirs) {
    // Sanitize the input...
    $dirs = explode('/', $dirs);

    $dirs = array_values(array_filter($dirs, function ($dirname) {
       return ($dirname != '.' && $dirname != '..' && $dirname != '');
    }));

    $path = $path . DIRECTORY_SEPARATOR . implode(DIRECTORY_SEPARATOR, $dirs);

    if(!is_dir($path))
    {
        echo "not a directory";
        die(500);
    }

    $files = scandir($path);
    $results = array();

    foreach($files as $key => $filename)
    {
        $fullpath = $path . DIRECTORY_SEPARATOR . $filename;
        $ext = strtolower(pathinfo($fullpath, PATHINFO_EXTENSION));

        if(!is_dir($fullpath))
        {
            if(empty($config['allowed_exts']) ||
               in_array($ext, $config['allowed_exts']))
            {
                $results[] = Array(
                    'name'     => $filename,
                    'type'     => 'file',
                    'modified' => filemtime($fullpath),
                    'size'     => filesize($fullpath)
                );
            }
        } else if ($filename != "." && $filename != "..")
        {
            $results[] = Array(
                'name' => basename($fullpath),
                'type' => 'directory',
                'modified' => filemtime($fullpath),
            );
        }
    }

    return $results;
}

switch ($_REQUEST['action'])
{
    case 'tree':
    if (!is_dir($config['directory']))
    {
        http_response_code(500);
        die();
    }

    $tree = directoryTree($config['directory']);
    http_response_code(200);

    // Configure your webserver to use utf-8 or remove the constant if
    // something is going wrong with encodings.
    echo json_encode($tree, JSON_UNESCAPED_UNICODE);

    break;

    case 'list':
    $list = directoryList($config['directory'], $_REQUEST['dirs']);
    echo json_encode($list, JSON_UNESCAPED_UNICODE);
    break;

    default:
    echo 'incorrect action';
    break;
}

?>
