<?php

include 'include/config.php';


function directoryList ($path, $dirs, $allowed_exts) {
    // Sanitize the input...
    $dirs = explode(DIRECTORY_SEPARATOR, $dirs);

    $dirs = array_values(array_filter($dirs, function ($dirname) {
        return ($dirname != '.' && $dirname != '..' && $dirname != '');
    }));

    $path = $_SERVER['DOCUMENT_ROOT'] . DIRECTORY_SEPARATOR .
            $path . DIRECTORY_SEPARATOR . implode(DIRECTORY_SEPARATOR, $dirs);

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
    $list = directoryList($config->directory, $_REQUEST['dir'], $config->allowed_exts);
    echo json_encode($list);
    break;

    default:
    echo 'incorrect action';
    break;
}

?>
