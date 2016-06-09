<?php
include 'files/config-default.php';
include 'files/config-user.php';

$header = '<title>' . htmlspecialchars($config['page_title']) . '</title>
<meta name="description" content="' . htmlspecialchars($config['meta_description']) . '">
<meta name="keywords" content="' . htmlspecialchars($config['meta_keywords']) . '">
<meta name="author" content="' . htmlspecialchars($config['meta_author']) . '">';

$content = file_get_contents($config['static_page_file']);
$content = str_replace('<title>Lex.js</title>', $header, $content);
echo $content;