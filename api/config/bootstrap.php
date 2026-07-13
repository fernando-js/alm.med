<?php
declare(strict_types=1);

$configFile = __DIR__ . '/config.php';
if (!is_file($configFile)) {
    http_response_code(503);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'API não configurada']);
    exit;
}
$config = require $configFile;
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
if (isset($_SERVER['HTTP_ORIGIN']) && $_SERVER['HTTP_ORIGIN'] === $config['app']['allowed_origin']) {
    header('Access-Control-Allow-Origin: ' . $config['app']['allowed_origin']);
    header('Access-Control-Allow-Methods: GET, OPTIONS');
    header('Access-Control-Allow-Headers: Accept, Content-Type');
    header('Vary: Origin');
}
function db(): PDO {
    global $config;
    static $pdo;
    if (!$pdo) {
        $d = $config['db'];
        $pdo = new PDO("mysql:host={$d['host']};dbname={$d['name']};charset=utf8mb4", $d['user'], $d['pass'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, PDO::ATTR_EMULATE_PREPARES => false]);
    }
    return $pdo;
}
function respond(array $data, int $status = 200): never {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
set_exception_handler(function (Throwable $exception) use ($config): void {
    error_log($exception->getMessage());
    respond([
        'error' => $config['app']['debug'] ? $exception->getMessage() : 'Erro interno no servidor',
    ], 500);
});
