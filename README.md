# Vértice CRM · painéis por função

Aplicação estática publicada no GitHub Pages e conectada ao Firebase Authentication e ao Cloud Firestore do projeto `vertice-crm-da863`.

## Endereços e separação

- `cliente.html?c=slug-do-cliente`: entrada do cliente. O slug em `accounts/{uid}.slug` identifica a URL; não é credencial.
- `admin.html`: painel administrativo de consulta, protegido por claim `admin=true` e MFA TOTP.
- `index.html`: encaminha para `cliente.html`.

O cliente sempre lê e grava em `users/{auth.currentUser.uid}/clients` e `users/{auth.currentUser.uid}/interactions`. A URL nunca fornece o UID. As regras comparam o UID autenticado com o UID do caminho e exigem uma conta ativa em `accounts/{uid}`. O cliente A não consegue acessar as subcoleções do cliente B, mesmo alterando manualmente a URL ou o JavaScript.

O admin, mesmo com MFA, consulta somente os metadados de `accounts` (nome, status, plano, validade e slug). O painel não abre `users/{uid}/clients` nem `interactions`, e não tem botões para alterar ou excluir contas. A lista é paginada em blocos de 50; o total usa uma agregação Firestore. As regras do admin permitem somente leitura de `accounts` e `auditLog`; escrita permanece negada.

## Por que o painel admin pode não abrir

É necessário cumprir os dois requisitos abaixo, separadamente:

1. O usuário precisa do custom claim `admin=true`. Criar a conta no Authentication não atribui esse claim. O script `scripts/bootstrap-admin.mjs` faz essa atribuição localmente, pelo Admin SDK, fora do front-end.
2. A conta precisa ter e-mail verificado e fator TOTP (app autenticador) cadastrado. O fluxo de `admin.html` orienta o cadastro e valida o código. Se o usuário não tiver `admin=true`, a página explica essa situação sem tentar promovê-lo.

### Bootstrap seguro do administrador

Execute uma única vez no seu computador, em uma pasta local confiável. Não coloque chave de service account, senha ou token no repositório.

1. No Firebase Console, crie (ou localize) seu usuário em **Authentication → Users** e verifique o e-mail.
2. Instale Node.js e a Google Cloud CLI. Autentique com uma conta Google que tenha permissão de administrador do Firebase no projeto:

   ```powershell
   gcloud auth application-default login
   gcloud config set project vertice-crm-da863
   npm install --no-save firebase-admin
   node scripts/bootstrap-admin.mjs seu-email@exemplo.com
   ```

3. O script preserva outros custom claims, define `admin=true` e revoga as sessões existentes para forçar um novo login. A credencial usada é a Application Default Credential local; nenhuma credencial vai para o site.
4. Habilite Identity Platform no projeto e ative TOTP como fator MFA. A documentação oficial do Firebase descreve o requisito de Identity Platform para MFA e TOTP: https://firebase.google.com/docs/auth/web/totp-mfa
5. Acesse `admin.html`, entre com esse usuário e use **Configurar app autenticador**. Guarde a chave apresentada no seu autenticador, valide o código de seis dígitos e entre novamente. Identity Platform no plano sem custo tem limite publicado de 3.000 usuários ativos por dia para a maioria dos provedores; confirme limites atuais antes de ampliar o uso.
6. Publique `firestore.rules` no Console do Firestore. Sem essa atualização, a consulta administrativa de `accounts` será negada pelas regras anteriores.

O código do painel suporta TOTP. SMS não é usado, para evitar custo de envio de mensagens no plano gratuito.

## Operações manuais enquanto o projeto fica no Spark

Cloud Functions não estão implantadas. Portanto, não há provisionamento de clientes, bloqueio server-side do cadastro com `beforeUserCreated`, geração de link de primeiro acesso pelo Admin SDK, suspensão com `revokeRefreshTokens`, exclusão recursiva ou auditoria administrativa. Faça essas operações manualmente apenas pelo Firebase Console/Admin SDK em ambiente confiável. O HTML público nunca recebe credencial administrativa.

A tela de login não oferece cadastro. O Firebase Auth ainda não tem blocking function para rejeitar chamadas públicas diretas de criação de usuário; contas sem `accounts/{uid}` ativo não passam pelas regras e não veem dados do CRM.

## Firebase e segurança

- Firestore padrão em `southamerica-east1` (São Paulo).
- Authentication por e-mail e senha.
- `slugs/{slug}` guarda só nome público e marca, sem UID.
- Datas de follow-up são strings `yyyy-mm-dd` no fuso `America/Sao_Paulo`.
- As listas são paginadas; os indicadores agregados evitam varrer todos os documentos no cliente.
- App Check ainda precisa ser registrado e iniciado no app antes de ativar enforcement.
- GitHub Pages não permite configurar cabeçalhos HTTP de resposta. A CSP está na página; use Firebase Hosting/outro host para HSTS, X-Frame-Options, X-Content-Type-Options e Permissions-Policy.
- Restrinja a API key pública do Firebase aos domínios e APIs necessários. Nunca publique segredo do Admin SDK.

## Publicação

Repositório público: `paesleme11-ctrl/vertice-crm`.
Site: `https://paesleme11-ctrl.github.io/vertice-crm/`.
Mantenha `paesleme11-ctrl.github.io` como domínio autorizado no Firebase Authentication. Envie `admin.html`, `cliente.html`, `index.html`, `app.js`, `firestore.rules`, `firestore.indexes.json`, `.nojekyll`, `README.md` e `scripts/bootstrap-admin.mjs` para a raiz/estrutura correspondente da branch `main`.