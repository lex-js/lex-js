<?php
include 'config-default.php';
include 'config-user.php';

function directoryList ($path, $dirs, $allowed_exts) {
    // Sanitize the input...
    $dirs = explode(DIRECTORY_SEPARATOR, $dirs);

    $dirs = array_values(array_filter($dirs, function ($dirname) {
       return ($dirname != '.' && $dirname != '..' && $dirname != '');
    }));

    $path = $path . DIRECTORY_SEPARATOR . implode(DIRECTORY_SEPARATOR, $dirs);

    if(!is_dir($path))
    {
        echo "not a directory";
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
    case 'list':
    $list = directoryList($config['directory'], $_REQUEST['dirs'], $config['allowed_exts']);
    echo json_encode($list, JSON_UNESCAPED_UNICODE);
    break;

    default:
    echo 'incorrect action';
    break;
}

?>
