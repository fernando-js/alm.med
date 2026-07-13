# ALM Anestesia

Site institucional em React/Vite com API PHP/MySQL preparada para hospedagem compartilhada.

## Desenvolvimento

```bash
npm install
npm run dev
```

Por padrão, o front busca posts publicados em `/api/posts` e usa conteúdos estáticos como fallback quando a API ainda não está configurada. Para apontar para outro backend em desenvolvimento, defina:

```bash
VITE_API_BASE_URL=https://exemplo.com/api npm run dev
```

## Publicação na Hostinger

1. Execute `npm run build`.
2. Envie o conteúdo da pasta `dist/` para `public_html`.
3. Envie a pasta `api/` para `public_html/api/`.
4. Copie `.htaccess` para `public_html/.htaccess`.
5. Crie um banco MySQL e importe `api/database/schema.sql`.
6. Duplique `api/config/config.example.php` como `api/config/config.php` e informe somente a senha do banco. O banco `u586486438_alm` e o usuário `u586486438_almuser` já estão preenchidos.
7. Não versionar nem compartilhar `config.php`.

O backend inicial expõe somente leitura pública de posts. A autenticação administrativa deve ser adicionada antes de liberar o painel editorial.
