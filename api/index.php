<?php
declare(strict_types=1);
require __DIR__ . '/config/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = preg_replace('#^/api#', '', $path) ?: '/';
if ($method === 'OPTIONS') { http_response_code(204); exit; }
if ($method === 'GET' && $path === '/health') respond(['status' => 'ok', 'app' => 'alm-api']);
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
        'max_output_tokens' => 1800,
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

    $outputText = '';
    if (isset($openAiPayload['output_text']) && is_string($openAiPayload['output_text'])) {
        $outputText = $openAiPayload['output_text'];
    } else {
        foreach (($openAiPayload['output'] ?? []) as $output) {
            foreach (($output['content'] ?? []) as $content) {
                if (($content['type'] ?? '') === 'output_text' && isset($content['text'])) {
                    $outputText .= $content['text'];
                }
            }
        }
    }

    $guidance = json_decode($outputText, true);
    if (!is_array($guidance)) {
        respond(['error' => 'A conferência retornou em formato inesperado. Tente novamente.'], 502);
    }

    respond(['data' => $guidance]);
}
if ($method === 'POST' && $path === '/pre-assessment') {
    $payload = json_decode(file_get_contents('php://input') ?: '[]', true);
    if (!is_array($payload)) {
        respond(['error' => 'Dados inválidos'], 400);
    }

    $field = static fn (string $key, int $max = 1200): string => trim(mb_substr((string)($payload[$key] ?? ''), 0, $max));
    $patientName = $field('patientName', 180);
    $whatsapp = $field('whatsapp', 60);
    $procedureName = $field('procedureName', 220);
    $consent = (bool)($payload['consent'] ?? false);

    if ($patientName === '' || $whatsapp === '' || $procedureName === '' || !$consent) {
        respond(['error' => 'Informe nome, WhatsApp, procedimento e aceite os termos.'], 422);
    }

    db()->exec("CREATE TABLE IF NOT EXISTS pre_assessment_requests (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        patient_name VARCHAR(180) NOT NULL,
        whatsapp VARCHAR(60) NOT NULL,
        email VARCHAR(190) NULL,
        city VARCHAR(120) NULL,
        surgery_date DATE NULL,
        surgeon_name VARCHAR(180) NULL,
        hospital VARCHAR(180) NULL,
        procedure_name VARCHAR(220) NOT NULL,
        allergies TEXT NULL,
        previous_surgeries TEXT NULL,
        current_medications TEXT NULL,
        known_conditions TEXT NULL,
        anesthesia_problems TEXT NULL,
        observations TEXT NULL,
        consent_accepted TINYINT(1) NOT NULL DEFAULT 1,
        consent_accepted_at DATETIME NOT NULL,
        ip_address VARCHAR(45) NULL,
        user_agent VARCHAR(255) NULL,
        status ENUM('new','contacted','archived') NOT NULL DEFAULT 'new',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_pre_assessment_status_created (status, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $surgeryDate = $field('surgeryDate', 20);
    $surgeryDate = preg_match('/^\d{4}-\d{2}-\d{2}$/', $surgeryDate) ? $surgeryDate : null;

    $stmt = db()->prepare("INSERT INTO pre_assessment_requests (
        patient_name, whatsapp, email, city, surgery_date, surgeon_name, hospital, procedure_name,
        allergies, previous_surgeries, current_medications, known_conditions, anesthesia_problems,
        observations, consent_accepted, consent_accepted_at, ip_address, user_agent
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), ?, ?)");
    $stmt->execute([
        $patientName,
        $whatsapp,
        $field('email', 190) ?: null,
        $field('city', 120) ?: null,
        $surgeryDate,
        $field('surgeonName', 180) ?: null,
        $field('hospital', 180) ?: null,
        $procedureName,
        $field('allergies') ?: null,
        $field('previousSurgeries') ?: null,
        $field('currentMedications') ?: null,
        $field('knownConditions') ?: null,
        $field('anesthesiaProblems') ?: null,
        $field('observations') ?: null,
        $_SERVER['REMOTE_ADDR'] ?? null,
        mb_substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 255),
    ]);

    $notificationEmail = $config['app']['notification_email'] ?? 'contato@alm.med.br';
    @mail(
        $notificationEmail,
        'Nova solicitação de pré-avaliação ALM',
        "Nova solicitação recebida pelo site ALM.\n\nPaciente: {$patientName}\nWhatsApp: {$whatsapp}\nProcedimento: {$procedureName}\n\nDados clínicos completos foram salvos na base da API.",
        "From: ALM Anestesia <nao-responder@alm.med.br>\r\nReply-To: {$notificationEmail}\r\nContent-Type: text/plain; charset=UTF-8"
    );

    respond(['data' => ['id' => (int)db()->lastInsertId()]]);
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
