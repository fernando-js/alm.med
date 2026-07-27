<?php
return [
    'db' => [
        'host' => 'localhost',
        'name' => 'u586486438_alm',
        'user' => 'u586486438_almuser',
        'pass' => 'COLOQUE_A_SENHA_DIRETAMENTE_NA_HOSTINGER',
    ],
    'app' => [
        'allowed_origin' => 'https://alm.med.br',
        'notification_email' => 'contato@alm.med.br',
        'medication_access_code' => '',
        'admin_setup_code' => 'COLOQUE_UM_CODIGO_FORTE_PARA_CRIAR_O_PRIMEIRO_ADMIN',
        'debug' => false,
    ],
    'openai' => [
        'api_key' => 'COLOQUE_A_CHAVE_OPENAI_DIRETAMENTE_NA_HOSTINGER',
        'model' => 'gpt-5',
    ],
];
