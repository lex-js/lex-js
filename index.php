<?php
include 'files/config-default.php';
include 'files/config-user.php';

$header = '<title>' . htmlspecialchars($config['page_title']) . '</title>
<meta name="description" content="' . htmlspecialchars($config['meta_description']) . '">
<meta name="keywords" content="' . htmlspecialchars($config['meta_keywords']) . '">
<meta name="author" content="' . htmlspecialchars($config['meta_author']) . '">';

$content = file_get_contents($config['static_page_file']);
$content = str_replace($config['static_page_file_replacement'], $header, $content);
echo $content;