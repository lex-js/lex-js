<?php

include 'include/config.php';

function sanitize($dir) {
    $dirs = explode(DIRECTORY_SEPARATOR, $dir);

    $dirs = array_values(array_filter($dirs, function ($dirname) {
        return ($dirname != '.' && $dirname != '..' && $dirname != '');
    }));

    $path = $_SERVER['DOCUMENT_ROOT'] . DIRECTORY_SEPARATOR .
            implode(DIRECTORY_SEPARATOR, $dirs);
    return $path;
}

function directoryList ($content_dir, $dir, $allowed_exts) {
    $path = sanitize($content_dir . DIRECTORY_SEPARATOR . $dir);

    if(!is_dir($path))
    {
        die(500);
    }

    $contents = scandir($path);

    // To store results
    $files = array();
    $directories  = array();

    foreach($contents as $key => $filename)
    {
        $fullpath = $path . DIRECTORY_SEPARATOR . $filename;
        $ext = strtolower(pathinfo($fullpath, PATHINFO_EXTENSION));

        if(!is_dir($fullpath))
        {
            if(empty($allowed_exts) ||
               in_array($ext, $allowed_exts))
            {
                $files[] = Array(
                    'name'     => $filename,
                    'type'     => 'file',
                    'modified' => filemtime($fullpath),
                    'size'     => filesize($fullpath)
                );
            }
        } else if ($filename != "." && $filename != "..")
        {
            $directories[] = Array(
                'name' => $filename,
                'type' => 'directory',
                'modified' => filemtime($fullpath),
            );
        }
    }

    return array_merge($directories, $files);
}

switch ($_REQUEST['action'])
{
case 'listdir':
    $list = directoryList($config->content_dir, $_REQUEST['dir'], $config->allowed_exts);
    echo json_encode($list);
    break;

case 'getfile':
    $file = sanitize($config->content_dir . DIRECTORY_SEPARATOR . $_REQUEST['file']);
    if (file_exists($file)) {
        echo file_get_contents($file);
    } else {
        die(500);
    }
    break;

default:
    echo 'incorrect action';
    break;
}

?>
