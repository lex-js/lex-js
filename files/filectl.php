<?php
include 'config-default.php';
include 'config-user.php';
function directoryTree($dir){
    $results = array();
    $files = scandir($dir);

    foreach($files as $key => $value){
        $path = ($dir . DIRECTORY_SEPARATOR . $value);
        if(!is_dir($path)) {
            $results[] = Array(
                'name' => $value,
                'type' => 'file',
                'modified' => filemtime($path),
                'size' => filesize($path)
            );
        } else if($value != "." && $value != "..") {
            $results[] = Array(
                'name' => basename($path),
                'type' => 'directory',
                'modified' => filemtime($path),
                'files' => directoryTree($path, $results)
            );
        }
    }
    return $results;
}

$action = $_REQUEST['action'];
switch($action){
    case 'tree':
        if(!is_dir($config['directory'])){
            http_response_code(500);
            die();
        }
        $files = directoryTree($config['directory'],'');
        http_response_code(200);
        echo json_encode($files);
        break;
}

?>
