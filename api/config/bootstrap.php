<?php
declare(strict_types=1);

$externalConfigFile = dirname(__DIR__, 3) . '/alm-config/config.php';
$configFile = is_file($externalConfigFile) ? $externalConfigFile : __DIR__ . '/config.php';
if (!is_file($configFile)) {
    http_response_code(503);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'API não configurada']);
    exit;
}
$config = require $configFile;
session_name('alm_admin_session');
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
    'httponly' => true,
    'samesite' => 'Strict',
]);
session_start();
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
if (isset($_SERVER['HTTP_ORIGIN']) && $_SERVER['HTTP_ORIGIN'] === $config['app']['allowed_origin']) {
    header('Access-Control-Allow-Origin: ' . $config['app']['allowed_origin']);
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
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
function extractOpenAiOutputText(array $openAiPayload): string {
    if (isset($openAiPayload['output_text']) && is_string($openAiPayload['output_text'])) {
        return $openAiPayload['output_text'];
    }

    $outputText = '';
    foreach (($openAiPayload['output'] ?? []) as $output) {
        foreach (($output['content'] ?? []) as $content) {
            if (isset($content['text']) && is_string($content['text'])) {
                $outputText .= $content['text'];
            }
        }
    }

    return trim($outputText);
}
function addColumnIfMissing(string $table, string $column, string $definition): void {
    global $config;

    $stmt = db()->prepare('SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?');
    $stmt->execute([$config['db']['name'], $table, $column]);

    if ((int)$stmt->fetchColumn() === 0) {
        db()->exec("ALTER TABLE `{$table}` ADD COLUMN {$definition}");
    }
}
function requireAdmin(): array {
    if (empty($_SESSION['admin_user']) || !is_array($_SESSION['admin_user'])) {
        respond(['error' => 'Login administrativo obrigatório'], 401);
    }

    return $_SESSION['admin_user'];
}
set_exception_handler(function (Throwable $exception) use ($config): void {
    error_log($exception->getMessage());
    respond([
        'error' => $config['app']['debug'] ? $exception->getMessage() : 'Erro interno no servidor',
    ], 500);
});
