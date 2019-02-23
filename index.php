<?php

include 'include/config.php';

$header = '<title>' . htmlspecialchars($config->page_title) . '</title>
    <meta name="description" content="' . htmlspecialchars($config->meta->description) . '">
    <meta name="keywords" content="' . htmlspecialchars(join($config->meta->keywords, ", ")) . '">
    <meta name="author" content="' . htmlspecialchars($config->meta->author) . '">';

$content = file_get_contents($config->static_page_file);
$content = str_replace($config->static_page_file_replacement, $header, $content);
echo $content;
