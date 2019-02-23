<?php
include 'files/config-default.php';

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

$header = '<title>' . htmlspecialchars($config->page_title) . '</title>
    <meta name="description" content="' . htmlspecialchars($config->meta->description) . '">
    <meta name="keywords" content="' . htmlspecialchars(join($config->meta->keywords, ", ")) . '">
    <meta name="author" content="' . htmlspecialchars($config->meta->author) . '">';

$content = file_get_contents($config->static_page_file);
$content = str_replace($config->static_page_file_replacement, $header, $content);
echo $content;
