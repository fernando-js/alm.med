<?php
declare(strict_types=1);
require __DIR__ . '/config/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = preg_replace('#^/api#', '', $path) ?: '/';
if ($method === 'OPTIONS') { http_response_code(204); exit; }
if ($method === 'GET' && $path === '/health') respond(['status' => 'ok', 'app' => 'alm-api']);
function ensurePreAssessmentStorage(): void {
    db()->exec("CREATE TABLE IF NOT EXISTS patients (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(180) NOT NULL,
        cpf VARCHAR(20) NOT NULL UNIQUE,
        birth_date DATE NULL,
        whatsapp VARCHAR(60) NOT NULL,
        email VARCHAR(190) NULL,
        address TEXT NULL,
        city VARCHAR(120) NULL,
        consent_accepted_at DATETIME NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_patients_name (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    db()->exec("CREATE TABLE IF NOT EXISTS pre_anesthetic_assessments (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        patient_id BIGINT UNSIGNED NOT NULL,
        surgery_date DATE NULL,
        surgeon_name VARCHAR(180) NULL,
        hospital VARCHAR(180) NULL,
        procedure_name VARCHAR(220) NOT NULL,
        anesthesia_type VARCHAR(160) NULL,
        allergies TEXT NULL,
        previous_surgeries TEXT NULL,
        current_medications TEXT NULL,
        known_conditions TEXT NULL,
        smoking TEXT NULL,
        alcohol_use TEXT NULL,
        functional_capacity TEXT NULL,
        cardiovascular_symptoms TEXT NULL,
        respiratory_symptoms TEXT NULL,
        dental_status TEXT NULL,
        exams TEXT NULL,
        anesthesia_problems TEXT NULL,
        observations TEXT NULL,
        ai_report MEDIUMTEXT NULL,
        ai_report_generated_at DATETIME NULL,
        report_status ENUM('pending','generated','failed') NOT NULL DEFAULT 'pending',
        ip_address VARCHAR(45) NULL,
        user_agent VARCHAR(255) NULL,
        status ENUM('new','awaiting_medical_review','reviewed','contacted','archived') NOT NULL DEFAULT 'awaiting_medical_review',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_pre_anesthetic_patient_created (patient_id, created_at),
        INDEX idx_pre_anesthetic_status_created (status, created_at),
        CONSTRAINT fk_pre_anesthetic_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    db()->exec("CREATE TABLE IF NOT EXISTS patient_access_tokens (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        patient_id BIGINT UNSIGNED NOT NULL,
        assessment_id BIGINT UNSIGNED NOT NULL,
        token_hash CHAR(64) NOT NULL UNIQUE,
        purpose ENUM('status') NOT NULL DEFAULT 'status',
        expires_at DATETIME NOT NULL,
        access_count INT UNSIGNED NOT NULL DEFAULT 0,
        last_accessed_at DATETIME NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_patient_access_assessment (assessment_id),
        INDEX idx_patient_access_expires (expires_at),
        CONSTRAINT fk_patient_access_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
        CONSTRAINT fk_patient_access_assessment FOREIGN KEY (assessment_id) REFERENCES pre_anesthetic_assessments(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
}

function ensureAdminStorage(): void {
    db()->exec("CREATE TABLE IF NOT EXISTS admin_users (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(190) NOT NULL UNIQUE,
        role ENUM('admin','secretaria') NOT NULL DEFAULT 'admin',
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    addColumnIfMissing('admin_users', 'role', "role ENUM('admin','secretaria') NOT NULL DEFAULT 'admin' AFTER email");
}

function createPatientAccessUrl(int $patientId, int $assessmentId): string {
    ensurePreAssessmentStorage();
    $token = bin2hex(random_bytes(32));
    $stmt = db()->prepare("INSERT INTO patient_access_tokens (patient_id, assessment_id, token_hash, expires_at) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 48 HOUR))");
    $stmt->execute([$patientId, $assessmentId, hash('sha256', $token)]);

    return siteUrl('/paciente/acesso?token=' . rawurlencode($token));
}

if ($method === 'POST' && $path === '/admin/setup') {
    global $config;
    ensureAdminStorage();
    $payload = json_decode(file_get_contents('php://input') ?: '[]', true);
    if (!is_array($payload)) respond(['error' => 'Dados inválidos'], 400);

    $adminCount = (int)db()->query('SELECT COUNT(*) FROM admin_users')->fetchColumn();
    $setupCode = trim((string)($config['app']['admin_setup_code'] ?? ''));
    if ($adminCount > 0 || $setupCode === '' || str_starts_with($setupCode, 'COLOQUE_')) {
        respond(['error' => 'Criação inicial de administrador indisponível.'], 403);
    }

    $providedCode = trim((string)($payload['setupCode'] ?? ''));
    $name = trim(mb_substr((string)($payload['name'] ?? ''), 0, 100));
    $email = trim(mb_substr((string)($payload['email'] ?? ''), 0, 190));
    $password = (string)($payload['password'] ?? '');

    if (!hash_equals($setupCode, $providedCode)) respond(['error' => 'Código de setup inválido.'], 403);
    if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 10) {
        respond(['error' => 'Informe nome, e-mail válido e senha com pelo menos 10 caracteres.'], 422);
    }

    $stmt = db()->prepare('INSERT INTO admin_users (name,email,role,password_hash) VALUES (?,?,?,?)');
    $stmt->execute([$name, $email, 'admin', password_hash($password, PASSWORD_DEFAULT)]);
    respond(['data' => ['created' => true]]);
}

if ($method === 'POST' && $path === '/admin/login') {
    ensureAdminStorage();
    $payload = json_decode(file_get_contents('php://input') ?: '[]', true);
    if (!is_array($payload)) respond(['error' => 'Dados inválidos'], 400);

    $email = trim((string)($payload['email'] ?? ''));
    $password = (string)($payload['password'] ?? '');
    $stmt = db()->prepare('SELECT id,name,email,role,password_hash FROM admin_users WHERE email=? LIMIT 1');
    $stmt->execute([$email]);
    $admin = $stmt->fetch();

    if (!$admin || !password_verify($password, $admin['password_hash'])) {
        respond(['error' => 'E-mail ou senha inválidos.'], 401);
    }

    session_regenerate_id(true);
    $_SESSION['admin_user'] = ['id' => (int)$admin['id'], 'name' => $admin['name'], 'email' => $admin['email'], 'role' => $admin['role'] ?? 'admin'];
    respond(['data' => $_SESSION['admin_user']]);
}

if ($method === 'POST' && $path === '/admin/logout') {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'] ?? '', (bool)$params['secure'], (bool)$params['httponly']);
    }
    session_destroy();
    respond(['data' => ['loggedOut' => true]]);
}

if ($method === 'GET' && $path === '/admin/session') {
    respond(['data' => ['user' => $_SESSION['admin_user'] ?? null]]);
}

if ($method === 'GET' && $path === '/admin/users') {
    requireAdminRole();
    ensureAdminStorage();
    $stmt = db()->query('SELECT id,name,email,role,created_at FROM admin_users ORDER BY created_at ASC, id ASC');
    respond(['data' => $stmt->fetchAll()]);
}

if ($method === 'POST' && $path === '/admin/users') {
    requireAdminRole();
    ensureAdminStorage();
    $payload = json_decode(file_get_contents('php://input') ?: '[]', true);
    if (!is_array($payload)) respond(['error' => 'Dados inválidos'], 400);

    $name = trim(mb_substr((string)($payload['name'] ?? ''), 0, 100));
    $email = trim(mb_substr((string)($payload['email'] ?? ''), 0, 190));
    $role = (string)($payload['role'] ?? 'secretaria');
    $password = (string)($payload['password'] ?? '');

    if (!in_array($role, ['admin', 'secretaria'], true)) {
        respond(['error' => 'Perfil inválido.'], 422);
    }
    if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 10) {
        respond(['error' => 'Informe nome, e-mail válido e senha com pelo menos 10 caracteres.'], 422);
    }

    try {
        $stmt = db()->prepare('INSERT INTO admin_users (name,email,role,password_hash) VALUES (?,?,?,?)');
        $stmt->execute([$name, $email, $role, password_hash($password, PASSWORD_DEFAULT)]);
    } catch (PDOException $exception) {
        if (($exception->errorInfo[1] ?? null) === 1062) {
            respond(['error' => 'Já existe um usuário com este e-mail.'], 409);
        }
        throw $exception;
    }

    respond(['data' => ['created' => true]]);
}

if ($method === 'GET' && $path === '/admin/pre-assessments') {
    requireAdmin();
    ensurePreAssessmentStorage();
    $stmt = db()->query("SELECT
        a.id, a.patient_id, a.procedure_name, a.surgery_date, a.hospital, a.status, a.report_status, a.created_at,
        p.name AS patient_name, p.cpf, p.birth_date, p.whatsapp, p.email, p.city
        FROM pre_anesthetic_assessments a
        INNER JOIN patients p ON p.id = a.patient_id
        ORDER BY a.created_at DESC
        LIMIT 100");
    respond(['data' => $stmt->fetchAll()]);
}

if ($method === 'GET' && preg_match('#^/admin/pre-assessments/(\d+)$#', $path, $matches)) {
    requireAdmin();
    ensurePreAssessmentStorage();
    $stmt = db()->prepare("SELECT
        a.*, p.name AS patient_name, p.cpf, p.birth_date, p.whatsapp, p.email, p.address, p.city
        FROM pre_anesthetic_assessments a
        INNER JOIN patients p ON p.id = a.patient_id
        WHERE a.id=?
        LIMIT 1");
    $stmt->execute([(int)$matches[1]]);
    $assessment = $stmt->fetch();
    $assessment ? respond(['data' => $assessment]) : respond(['error' => 'Avaliação não encontrada'], 404);
}

if ($method === 'POST' && preg_match('#^/admin/pre-assessments/(\d+)/mark-reviewed$#', $path, $matches)) {
    requireAdmin();
    ensurePreAssessmentStorage();
    $stmt = db()->prepare("SELECT a.id, a.patient_id, a.procedure_name, a.status, p.whatsapp
        FROM pre_anesthetic_assessments a
        INNER JOIN patients p ON p.id = a.patient_id
        WHERE a.id=?
        LIMIT 1");
    $stmt->execute([(int)$matches[1]]);
    $assessment = $stmt->fetch();
    if (!$assessment) respond(['error' => 'Avaliação não encontrada'], 404);

    $updateStmt = db()->prepare("UPDATE pre_anesthetic_assessments SET status='reviewed' WHERE id=?");
    $updateStmt->execute([(int)$assessment['id']]);
    $accessUrl = createPatientAccessUrl((int)$assessment['patient_id'], (int)$assessment['id']);

    $message = "ALM Anestesia: sua pré-avaliação foi revisada pela equipe médica. Acesse o status por este link temporário: {$accessUrl}";
    $sent = sendWhatsAppNotice((string)$assessment['whatsapp'], $message);

    respond(['data' => [
        'reviewed' => true,
        'whatsappSent' => $sent,
        'patientAccessUrl' => $accessUrl,
    ]]);
}

if ($method === 'GET' && $path === '/patient/status') {
    ensurePreAssessmentStorage();
    $token = trim((string)($_GET['token'] ?? ''));
    if ($token === '') respond(['error' => 'Link inválido.'], 400);

    $stmt = db()->prepare("SELECT t.id AS token_id, t.expires_at, t.access_count,
        a.id AS assessment_id, a.status, a.report_status, a.updated_at
        FROM patient_access_tokens t
        INNER JOIN pre_anesthetic_assessments a ON a.id = t.assessment_id
        WHERE t.token_hash=?
        LIMIT 1");
    $stmt->execute([hash('sha256', $token)]);
    $access = $stmt->fetch();

    if (!$access || strtotime((string)$access['expires_at']) < time() || (int)$access['access_count'] >= 10) {
        respond(['error' => 'Este link expirou. Entre em contato com a ALM Anestesia.'], 410);
    }

    $updateAccess = db()->prepare('UPDATE patient_access_tokens SET access_count=access_count+1, last_accessed_at=NOW() WHERE id=?');
    $updateAccess->execute([(int)$access['token_id']]);

    $statusLabels = [
        'awaiting_medical_review' => 'Aguardando avaliação médica final',
        'reviewed' => 'Avaliação revisada pela equipe médica',
        'contacted' => 'Contato realizado pela equipe',
        'archived' => 'Atendimento arquivado',
        'new' => 'Recebido pela equipe',
    ];

    respond(['data' => [
        'assessmentId' => (int)$access['assessment_id'],
        'status' => $access['status'],
        'statusLabel' => $statusLabels[$access['status']] ?? 'Em acompanhamento pela equipe',
        'reportStatus' => $access['report_status'],
        'updatedAt' => $access['updated_at'],
        'contactWhatsApp' => 'https://wa.me/5533987128010',
    ]]);
}

if ($method === 'POST' && $path === '/medication-guidance') {
    $payload = json_decode(file_get_contents('php://input') ?: '[]', true);
    if (!is_array($payload)) {
        respond(['error' => 'Dados inválidos'], 400);
    }

    $field = static fn (string $key, int $max = 2500): string => trim(mb_substr((string)($payload[$key] ?? ''), 0, $max));
    $medications = $field('medications', 5000);
    $professionalConsent = (bool)($payload['professionalConsent'] ?? false);

    if ($medications === '' || !$professionalConsent) {
        respond(['error' => 'Informe os medicamentos em uso e confirme a revisão profissional obrigatória.'], 422);
    }

    $configuredAccessCode = trim((string)($config['app']['medication_access_code'] ?? ''));
    if ($configuredAccessCode !== '' && !hash_equals($configuredAccessCode, $field('accessCode', 120))) {
        respond(['error' => 'Código de acesso inválido.'], 403);
    }

    $apiKey = trim((string)($config['openai']['api_key'] ?? ''));
    if ($apiKey === '' || str_starts_with($apiKey, 'COLOQUE_')) {
        respond(['error' => 'Integração OpenAI não configurada no servidor.'], 503);
    }

    if (!function_exists('curl_init')) {
        respond(['error' => 'Extensão cURL do PHP indisponível no servidor.'], 503);
    }

    $model = trim((string)($config['openai']['model'] ?? 'gpt-5')) ?: 'gpt-5';
    $caseData = [
        'medications' => $medications,
        'procedureName' => $field('procedureName', 220),
        'surgeryDate' => $field('surgeryDate', 20),
        'anesthesiaType' => $field('anesthesiaType', 160),
        'conditions' => $field('conditions', 2500),
        'observations' => $field('observations', 2500),
    ];

    $schema = [
        'type' => 'object',
        'additionalProperties' => false,
        'required' => ['riskLevel', 'riskLabel', 'summary', 'notMedicalOrder', 'medications', 'redFlags', 'nextSteps'],
        'properties' => [
            'riskLevel' => ['type' => 'string', 'enum' => ['low', 'attention', 'high']],
            'riskLabel' => ['type' => 'string'],
            'summary' => ['type' => 'string'],
            'notMedicalOrder' => ['type' => 'string'],
            'medications' => [
                'type' => 'array',
                'items' => [
                    'type' => 'object',
                    'additionalProperties' => false,
                    'required' => ['name', 'preliminaryAction', 'reason', 'timing', 'confirmWith'],
                    'properties' => [
                        'name' => ['type' => 'string'],
                        'preliminaryAction' => [
                            'type' => 'string',
                            'enum' => [
                                'geralmente manter, confirmar na avaliação',
                                'avaliar pausa ou ajuste com o anestesiologista',
                                'confirmar com cirurgião ou médico prescritor',
                                'atenção prioritária antes de orientar o paciente',
                                'informação insuficiente',
                            ],
                        ],
                        'reason' => ['type' => 'string'],
                        'timing' => ['type' => 'string'],
                        'confirmWith' => ['type' => 'string'],
                    ],
                ],
            ],
            'redFlags' => ['type' => 'array', 'items' => ['type' => 'string']],
            'nextSteps' => ['type' => 'array', 'items' => ['type' => 'string']],
        ],
    ];

    $systemPrompt = <<<'PROMPT'
Você é um assistente de apoio à triagem pré-anestésica para a equipe ALM Anestesia, em português do Brasil.
Objetivo: identificar medicamentos que podem exigir revisão, ajuste, continuidade ou possível pausa antes de cirurgia/procedimento.
Limites obrigatórios:
- Não emita prescrição, ordem final de suspensão, liberação cirúrgica ou diagnóstico.
- Sempre deixe claro que a conduta deve ser confirmada por anestesiologista, cirurgião e/ou médico prescritor.
- Seja conservador quando houver anticoagulantes, antiagregantes, insulinas, antidiabéticos, agonistas GLP-1, inibidores SGLT2, fitoterápicos, imunossupressores, anticonvulsivantes, psicotrópicos, opioides, corticoides ou medicamentos de alto risco.
- Se faltarem dose, indicação, função renal, risco trombótico, tipo de procedimento ou data, marque como informação insuficiente.
- Não invente protocolo institucional nem intervalo exato quando o contexto não permitir; peça confirmação do protocolo local.
- Oriente a equipe a não repassar a resposta ao paciente como ordem médica.
PROMPT;

    $requestBody = [
        'model' => $model,
        'input' => [
            [
                'role' => 'system',
                'content' => [
                    ['type' => 'input_text', 'text' => $systemPrompt],
                ],
            ],
            [
                'role' => 'user',
                'content' => [
                    ['type' => 'input_text', 'text' => 'Dados do caso para conferência preliminar: ' . json_encode($caseData, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)],
                ],
            ],
        ],
        'text' => [
            'format' => [
                'type' => 'json_schema',
                'name' => 'alm_medication_guidance',
                'strict' => true,
                'schema' => $schema,
            ],
            'verbosity' => 'low',
        ],
        'max_output_tokens' => 4000,
    ];

    $ch = curl_init('https://api.openai.com/v1/responses');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $apiKey,
            'Content-Type: application/json',
        ],
        CURLOPT_POSTFIELDS => json_encode($requestBody, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 40,
    ]);
    $rawResponse = curl_exec($ch);
    $curlError = curl_error($ch);
    $httpStatus = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);

    if ($rawResponse === false) {
        respond(['error' => 'Falha ao consultar a OpenAI: ' . $curlError], 502);
    }

    $openAiPayload = json_decode($rawResponse, true);
    if ($httpStatus < 200 || $httpStatus >= 300 || !is_array($openAiPayload)) {
        $apiMessage = is_array($openAiPayload) ? ($openAiPayload['error']['message'] ?? 'Resposta inválida da OpenAI.') : 'Resposta inválida da OpenAI.';
        respond(['error' => $config['app']['debug'] ? $apiMessage : 'Não foi possível gerar a conferência agora.'], 502);
    }

    if (($openAiPayload['status'] ?? '') === 'incomplete') {
        error_log('OpenAI incomplete medication guidance response: ' . json_encode($openAiPayload['incomplete_details'] ?? [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
        respond(['error' => 'A conferência ficou incompleta. Tente novamente com menos medicamentos ou menos observações.'], 502);
    }

    $outputText = '';
    if (isset($openAiPayload['output_text']) && is_string($openAiPayload['output_text'])) {
        $outputText = $openAiPayload['output_text'];
    } else {
        foreach (($openAiPayload['output'] ?? []) as $output) {
            foreach (($output['content'] ?? []) as $content) {
                if (isset($content['text']) && is_string($content['text'])) {
                    $outputText .= $content['text'];
                }
            }
        }
    }

    $jsonText = trim($outputText);
    if (preg_match('/^```(?:json)?\s*(.*?)\s*```$/s', $jsonText, $matches)) {
        $jsonText = trim($matches[1]);
    } elseif (!str_starts_with($jsonText, '{') && preg_match('/\{.*\}/s', $jsonText, $matches)) {
        $jsonText = trim($matches[0]);
    }

    $guidance = json_decode($jsonText, true);
    if (!is_array($guidance)) {
        error_log('OpenAI unexpected medication guidance output: ' . mb_substr($outputText ?: $rawResponse, 0, 2000));
        respond(['error' => 'A conferência retornou em formato inesperado. Tente novamente.'], 502);
    }

    respond(['data' => $guidance]);
}
if ($method === 'POST' && $path === '/pre-assessment') {
    $payload = json_decode(file_get_contents('php://input') ?: '[]', true);
    if (!is_array($payload)) {
        respond(['error' => 'Dados inválidos'], 400);
    }

    $field = static fn (string $key, int $max = 2500): string => trim(mb_substr((string)($payload[$key] ?? ''), 0, $max));
    if ($field('website', 200) !== '') {
        respond(['data' => [
            'id' => null,
            'reportStatus' => 'pending',
            'reviewPath' => '/apa-aguardando-avaliacao-medico-final',
        ]]);
    }

    $patientName = $field('patientName', 180);
    $whatsapp = $field('whatsapp', 60);
    $email = $field('email', 190);
    $cpf = $field('cpf', 20);
    $cpfDigits = preg_replace('/\D+/', '', $cpf) ?: '';
    $birthDate = $field('birthDate', 20);
    $address = $field('address', 500);
    $procedureName = $field('procedureName', 220);
    $consent = (bool)($payload['consent'] ?? false);

    if ($patientName === '' || $whatsapp === '' || $email === '' || $cpfDigits === '' || $birthDate === '' || $address === '' || $procedureName === '' || !$consent) {
        respond(['error' => 'Informe nome, CPF, nascimento, WhatsApp, e-mail, endereço, procedimento e aceite os termos.'], 422);
    }

    if (strlen($cpfDigits) !== 11) {
        respond(['error' => 'Informe um CPF válido com 11 dígitos.'], 422);
    }

    $birthDate = preg_match('/^\d{4}-\d{2}-\d{2}$/', $birthDate) ? $birthDate : null;
    if ($birthDate === null) {
        respond(['error' => 'Informe uma data de nascimento válida.'], 422);
    }

    ensurePreAssessmentStorage();
    db()->exec("CREATE TABLE IF NOT EXISTS submission_rate_limits (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        scope_hash CHAR(64) NOT NULL UNIQUE,
        attempts INT UNSIGNED NOT NULL DEFAULT 0,
        first_seen_at DATETIME NOT NULL,
        last_seen_at DATETIME NOT NULL,
        INDEX idx_submission_rate_first_seen (first_seen_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $rateScopes = [
        ['hash' => hash('sha256', 'pre-assessment-ip:' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown')), 'limit' => 5],
        ['hash' => hash('sha256', 'pre-assessment-cpf:' . $cpfDigits), 'limit' => 3],
    ];
    foreach ($rateScopes as $scope) {
        $stmt = db()->prepare('SELECT attempts, first_seen_at FROM submission_rate_limits WHERE scope_hash=? LIMIT 1');
        $stmt->execute([$scope['hash']]);
        $currentRate = $stmt->fetch();

        if ($currentRate && strtotime((string)$currentRate['first_seen_at']) >= time() - 3600) {
            if ((int)$currentRate['attempts'] >= $scope['limit']) {
                respond(['error' => 'Muitas tentativas em pouco tempo. Aguarde antes de enviar novamente.'], 429);
            }
            $updateRate = db()->prepare('UPDATE submission_rate_limits SET attempts=attempts+1, last_seen_at=NOW() WHERE scope_hash=?');
            $updateRate->execute([$scope['hash']]);
        } elseif ($currentRate) {
            $resetRate = db()->prepare('UPDATE submission_rate_limits SET attempts=1, first_seen_at=NOW(), last_seen_at=NOW() WHERE scope_hash=?');
            $resetRate->execute([$scope['hash']]);
        } else {
            $insertRate = db()->prepare('INSERT INTO submission_rate_limits (scope_hash, attempts, first_seen_at, last_seen_at) VALUES (?, 1, NOW(), NOW())');
            $insertRate->execute([$scope['hash']]);
        }
    }

    $surgeryDate = $field('surgeryDate', 20);
    $surgeryDate = preg_match('/^\d{4}-\d{2}-\d{2}$/', $surgeryDate) ? $surgeryDate : null;

    $patientStmt = db()->prepare("INSERT INTO patients (
        name, cpf, birth_date, whatsapp, email, address, city, consent_accepted_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    ON DUPLICATE KEY UPDATE
        id = LAST_INSERT_ID(id),
        name = VALUES(name),
        birth_date = VALUES(birth_date),
        whatsapp = VALUES(whatsapp),
        email = VALUES(email),
        address = VALUES(address),
        city = VALUES(city),
        consent_accepted_at = VALUES(consent_accepted_at)");
    $patientStmt->execute([
        $patientName,
        $cpfDigits,
        $birthDate,
        $whatsapp,
        $email,
        $address,
        $field('city', 120) ?: null,
    ]);
    $patientId = (int)db()->lastInsertId();

    $stmt = db()->prepare("INSERT INTO pre_anesthetic_assessments (
        patient_id, surgery_date, surgeon_name, hospital, procedure_name, anesthesia_type,
        allergies, previous_surgeries, current_medications, known_conditions, smoking, alcohol_use,
        functional_capacity, cardiovascular_symptoms, respiratory_symptoms, dental_status, exams,
        anesthesia_problems, observations, ip_address, user_agent
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $patientId,
        $surgeryDate,
        $field('surgeonName', 180) ?: null,
        $field('hospital', 180) ?: null,
        $procedureName,
        $field('anesthesiaType', 160) ?: null,
        $field('allergies') ?: null,
        $field('previousSurgeries') ?: null,
        $field('currentMedications') ?: null,
        $field('knownConditions') ?: null,
        $field('smoking') ?: null,
        $field('alcoholUse') ?: null,
        $field('functionalCapacity') ?: null,
        $field('cardiovascularSymptoms') ?: null,
        $field('respiratorySymptoms') ?: null,
        $field('dentalStatus') ?: null,
        $field('exams', 5000) ?: null,
        $field('anesthesiaProblems') ?: null,
        $field('observations') ?: null,
        $_SERVER['REMOTE_ADDR'] ?? null,
        mb_substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 255),
    ]);
    $assessmentId = (int)db()->lastInsertId();

    $aiReport = null;
    $reportStatus = 'pending';
    $apiKey = trim((string)($config['openai']['api_key'] ?? ''));
    if ($apiKey !== '' && !str_starts_with($apiKey, 'COLOQUE_') && function_exists('curl_init')) {
        $birthDateObject = new DateTimeImmutable($birthDate);
        $age = $birthDateObject->diff(new DateTimeImmutable('today'))->y;
        $reportData = [
            'patientName' => $patientName,
            'age' => $age,
            'surgeonName' => $field('surgeonName', 180),
            'procedureName' => $procedureName,
            'surgeryDate' => $surgeryDate,
            'hospital' => $field('hospital', 180),
            'anesthesiaType' => $field('anesthesiaType', 160),
            'allergies' => $field('allergies'),
            'previousSurgeries' => $field('previousSurgeries'),
            'currentMedications' => $field('currentMedications'),
            'knownConditions' => $field('knownConditions'),
            'smoking' => $field('smoking'),
            'alcoholUse' => $field('alcoholUse'),
            'functionalCapacity' => $field('functionalCapacity'),
            'cardiovascularSymptoms' => $field('cardiovascularSymptoms'),
            'respiratorySymptoms' => $field('respiratorySymptoms'),
            'dentalStatus' => $field('dentalStatus'),
            'exams' => $field('exams', 5000),
            'anesthesiaProblems' => $field('anesthesiaProblems'),
            'observations' => $field('observations'),
        ];
        $reportPrompt = <<<'PROMPT'
Crie uma MINUTA de avaliação pré-anestésica em português formal para revisão e assinatura médica.
Siga exatamente esta ordem de títulos:
AVALIAÇÃO PRÉ-ANESTÉSICA
ANTECEDENTES E ANAMNESE
EXAME FÍSICO
AVALIAÇÃO DA VIA AÉREA
EXAMES COMPLEMENTARES
ESTRATIFICAÇÃO PRÉ-ANESTÉSICA
ORIENTAÇÕES PRÉ-OPERATÓRIAS
PARECER

Regras obrigatórias:
- Não invente exame físico, sinais vitais, Mallampati, distâncias, ECG, RX, ecocardiograma, exames ou ausência de doença.
- Use Não informado, Não apresentado, A confirmar ou A definir quando faltar dado.
- Calcule IMC somente se peso e altura forem informados.
- Proponha ASA apenas como hipótese com base nos dados; se faltar informação, escreva ASA a confirmar.
- Não use "liberado" automaticamente. Prefira parecer condicionado à revisão médica final.
- Não prescreva suspensão de medicamento quando faltarem indicação, cirurgia, função renal ou risco trombótico.
- Inclua a assinatura:
Dr. Fernando Xavier Ferreira
Médico Anestesiologista
CRM-MG 30.746
PROMPT;
        $model = trim((string)($config['openai']['model'] ?? 'gpt-5')) ?: 'gpt-5';
        $requestBody = [
            'model' => $model,
            'input' => [
                ['role' => 'system', 'content' => [['type' => 'input_text', 'text' => $reportPrompt]]],
                ['role' => 'user', 'content' => [['type' => 'input_text', 'text' => 'Dados relatados pelo paciente para minuta de APA: ' . json_encode($reportData, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)]]],
            ],
            'text' => ['verbosity' => 'low'],
            'max_output_tokens' => 5000,
        ];

        $ch = curl_init('https://api.openai.com/v1/responses');
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $apiKey,
                'Content-Type: application/json',
            ],
            CURLOPT_POSTFIELDS => json_encode($requestBody, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 45,
        ]);
        $rawResponse = curl_exec($ch);
        $httpStatus = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        curl_close($ch);

        $openAiPayload = is_string($rawResponse) ? json_decode($rawResponse, true) : null;
        if ($httpStatus >= 200 && $httpStatus < 300 && is_array($openAiPayload) && ($openAiPayload['status'] ?? '') !== 'incomplete') {
            $aiReport = extractOpenAiOutputText($openAiPayload) ?: null;
        }
    }

    if ($aiReport) {
        $reportStatus = 'generated';
        $updateStmt = db()->prepare("UPDATE pre_anesthetic_assessments SET ai_report=?, ai_report_generated_at=NOW(), report_status='generated' WHERE id=?");
        $updateStmt->execute([$aiReport, $assessmentId]);
    } else {
        $reportStatus = 'failed';
        $updateStmt = db()->prepare("UPDATE pre_anesthetic_assessments SET report_status='failed' WHERE id=?");
        $updateStmt->execute([$assessmentId]);
    }

    $notificationEmail = $config['app']['notification_email'] ?? 'contato@alm-anestesia.com';
    $mailFromEmail = filter_var($config['app']['mail_from_email'] ?? '', FILTER_VALIDATE_EMAIL) ? $config['app']['mail_from_email'] : $notificationEmail;
    $mailFromName = trim((string)($config['app']['mail_from_name'] ?? 'ALM Anestesia')) ?: 'ALM Anestesia';
    $replyTo = filter_var($email, FILTER_VALIDATE_EMAIL) ? $email : $notificationEmail;
    $emailBody = "Nova pré-avaliação recebida pelo site ALM.\n\n"
        . "Paciente ID: {$patientId}\n"
        . "Avaliação ID: {$assessmentId}\n"
        . "Paciente: {$patientName}\n"
        . "CPF: {$cpfDigits}\n"
        . "Nascimento: {$birthDate}\n"
        . "WhatsApp: {$whatsapp}\n"
        . "E-mail: {$email}\n"
        . "Endereço: {$address}\n"
        . "Procedimento: {$procedureName}\n"
        . "Cirurgião: " . ($field('surgeonName', 180) ?: 'Não informado') . "\n"
        . "Hospital: " . ($field('hospital', 180) ?: 'Não informado') . "\n"
        . "Status do relatório OpenAI: {$reportStatus}\n\n"
        . "RELATÓRIO / MINUTA PARA REVISÃO MÉDICA FINAL\n\n"
        . ($aiReport ?: 'Relatório não gerado automaticamente. Revisar dados salvos no banco.');
    @mail(
        $notificationEmail,
        'APA aguardando avaliação médica final - ALM',
        $emailBody,
        "From: {$mailFromName} <{$mailFromEmail}>\r\nReply-To: {$replyTo}\r\nContent-Type: text/plain; charset=UTF-8"
    );

    if (!empty($config['whatsapp']['notify_team_on_submit'])) {
        $teamMessage = "ALM Anestesia: nova pré-avaliação recebida. APA #{$assessmentId}. Pré-laudo: {$reportStatus}. Aguardando avaliação médica final em " . siteUrl('/admin');
        sendTeamWhatsAppNotice($teamMessage);
    }

    if (!empty($config['whatsapp']['notify_patient_on_submit'])) {
        sendWhatsAppNotice($whatsapp, 'ALM Anestesia: recebemos seus dados para pré-avaliação. O pré-laudo aguarda avaliação médica final da equipe.');
    }

    respond(['data' => [
        'id' => $assessmentId,
        'patientId' => $patientId,
        'assessmentId' => $assessmentId,
        'reportStatus' => $reportStatus,
        'reviewPath' => '/apa-aguardando-avaliacao-medico-final',
    ]]);
}
if ($method === 'GET' && $path === '/posts') {
    $requestedLimit = (int)($_GET['limit'] ?? $_GET['per_page'] ?? 12);
    $limit = max(1, min($requestedLimit, 50));
    $page = max(1, (int)($_GET['page'] ?? 1));
    $offset = ($page - 1) * $limit;
    $queryLimit = $limit + 1;
    $searchTerm = trim((string)($_GET['q'] ?? ''));

    if ($searchTerm !== '') {
        $like = '%' . str_replace(['%', '_'], ['\\%', '\\_'], $searchTerm) . '%';
        $stmt = db()->prepare("SELECT id,title,slug,excerpt,featured_image,published_at FROM posts WHERE status='published' AND (title LIKE ? OR excerpt LIKE ? OR content LIKE ?) ORDER BY published_at DESC LIMIT {$queryLimit} OFFSET {$offset}");
        $stmt->execute([$like, $like, $like]);
    } else {
        $stmt = db()->query("SELECT id,title,slug,excerpt,featured_image,published_at FROM posts WHERE status='published' ORDER BY published_at DESC LIMIT {$queryLimit} OFFSET {$offset}");
    }
    $posts = $stmt->fetchAll();
    $hasMore = count($posts) > $limit;

    respond([
        'data' => array_slice($posts, 0, $limit),
        'meta' => [
            'page' => $page,
            'limit' => $limit,
            'has_more' => $hasMore,
        ],
    ]);
}
if ($method === 'GET' && preg_match('#^/posts/([a-z0-9-]+)$#', $path, $matches)) {
    $stmt = db()->prepare("SELECT id,title,slug,excerpt,content,featured_image,published_at FROM posts WHERE slug=? AND status='published' LIMIT 1");
    $stmt->execute([$matches[1]]);
    $post = $stmt->fetch();
    $post ? respond(['data' => $post]) : respond(['error' => 'Conteúdo não encontrado'], 404);
}
respond(['error' => 'Rota não encontrada'], 404);
