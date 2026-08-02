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

Para usar o Git Deploy da Hostinger sem acessar o servidor, publique uma branch pronta para produção.

```bash
npm install
npm run deploy:hostinger
```

Esse comando cria/atualiza a branch local `hostinger-deploy` com somente:

- `index.html`
- `assets/`
- `favicon.svg`
- `.htaccess`
- `api/`

Depois envie a branch:

```bash
git push origin hostinger-deploy
```

No hPanel da Hostinger, configure o Git Deploy usando:

- Branch: `hostinger-deploy`
- Root directory / caminho de instalação: `public_html`

Assim a Hostinger publica exatamente o conteúdo final na raiz do site, sem criar `public_html/public_html` e sem expor os arquivos de desenvolvimento do projeto.

Configuração inicial:

1. Crie um banco MySQL e importe `api/database/schema.sql`.
2. No servidor, crie uma pasta `alm-config` no mesmo nível de `public_html`.
3. Copie `public_html/api/config/config.example.php` para `alm-config/config.php` e informe senha do banco, chave OpenAI e demais configurações nesse arquivo externo. O backend procura primeiro por esse arquivo persistente fora do `public_html`.
4. Se a hospedagem não permitir criar `alm-config`, use o fallback `public_html/api/config/config.php`.
5. Para usar a conferência de medicamentos em `/medicamentos`, informe `openai.api_key`. Se quiser restringir o acesso, preencha também `app.medication_access_code`; se ficar vazio, a ferramenta não exigirá código.
6. Para criar o primeiro acesso médico/secretária, preencha `app.admin_setup_code` com um código forte, acesse `/admin`, clique em `Primeiro admin` e cadastre nome, e-mail e senha. Depois do primeiro admin, novos cadastros por setup ficam bloqueados; se quiser, deixe `admin_setup_code` vazio no servidor.
7. A página pública `/pre-avaliacao` não exige login do paciente. Ela salva/atualiza o paciente por CPF e cria uma nova avaliação pré-anestésica para cada envio.
8. O painel `/admin` exige login e mostra pacientes, avaliações, minutas geradas pela OpenAI e usuários da equipe. Apenas perfil `admin` cria novos usuários; perfil `secretaria` revisa a lista de avaliações.
9. Para avisos por WhatsApp via UAZAPI, configure `whatsapp.enabled`, `whatsapp.base_url`, `whatsapp.token` e `whatsapp.team_numbers` no `alm-config/config.php`. As mensagens automáticas não incluem CPF, medicamentos, endereço ou laudo.
10. Quando a equipe clicar em `Revisado e avisar`, o sistema marca a avaliação como revisada e envia ao paciente um link temporário de status em `/paciente/acesso`, sem exibir dados clínicos.
11. A conferência de medicamentos e a minuta de APA são apoio à triagem: não substituem avaliação médica, protocolo institucional ou orientação individualizada do anestesiologista/cirurgião/médico prescritor.
12. Não versionar nem compartilhar `config.php`.
