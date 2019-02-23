<?php
include 'config-default.php';

if (!file_exists('config-server.json')) {
    echo "config-server.json does not exist!";
    die(500);
}

$config = json_decode(file_get_contents('config-server.json'));

if ($config == null) {
    echo "config-server.json is invalid!";
    die(500);
}

$config = (object) array_merge((array) $default_config, (array) $config);
