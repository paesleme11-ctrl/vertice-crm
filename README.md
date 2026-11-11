# Vértice CRM · painel do cliente e painel administrativo

Aplicação estática para GitHub Pages, conectada ao Firebase Authentication e ao Cloud Firestore do projeto `vertice-crm-da863`.

## Duas páginas

- `cliente.html?c=slug-do-cliente`: entrada do cliente. Cada empresa recebe um slug próprio em `accounts/{uid}.slug` e pode ter um documento público `slugs/{slug}` contendo apenas nome de exibição e marca. O slug identifica a URL, mas nunca concede acesso.
- `admin.html`: entrada separada para administrador. O código exige o custom claim `admin=true` e `request.auth.token.firebase.sign_in_second_factor`. No Spark, a página mostra o estado bloqueado das operações de gestão; não há ações administrativas entre tenants no navegador.
- `index.html`: encaminha para `cliente.html`.

## Isolamento entre clientes

O Firebase Auth fornece o UID autenticado. O app sempre consulta `users/{uid}/clients` e `users/{uid}/interactions` usando `auth.currentUser.uid`; não aceita UID informado pela URL. As Firestore Rules comparam o UID da rota ao UID autenticado e consultam `accounts/{uid}` para validar status e validade. A mesma regra nega leitura e escrita nos dados de outro usuário, mesmo que alguém altere manualmente a URL ou o JavaScript local.

Cada cliente recebe a mesma página estática `cliente.html` com seu slug, por exemplo `https://paesleme11-ctrl.github.io/vertice-crm/cliente.html?c=slug-do-cliente`. O documento `slugs/{slug}` guarda somente dados públicos de marca e nome, nunca UID. O acesso aos dados privados continua sendo validado por Auth UID e pelas regras.

## Firebase configurado

- Projeto: `vertice-crm-da863`.
- Cloud Firestore padrão em `southamerica-east1` (São Paulo).
- Authentication por e-mail e senha.
- `firestore.rules` mantém leitura do documento próprio `accounts/{uid}`, nega gravações de cliente em accounts, exige conta ativa e protege o log de auditoria com MFA.
- `firestore.indexes.json` declara os índices compostos usados pelas consultas. No Console, aguarde os índices concluírem a criação antes de usar todas as telas.
- Follow-ups e datas do CRM são strings `yyyy-mm-dd` no fuso `America/Sao_Paulo`.
- Listas são paginadas; totais do dashboard usam agregações Firestore.

## Limitações do Firebase Spark

Cloud Functions não estão implantadas. Assim, criação segura de contas somente pelo Admin SDK, bloqueio server-side de cadastro via `beforeUserCreated`, suspensão com `revokeRefreshTokens`, envio de primeiro acesso via `generatePasswordResetLink`, gestão de clientes pelo admin, exclusão recursiva e auditoria administrativa ainda precisam de backend. A interface não oferece cadastro, mas isso não substitui o bloqueio da API de criação do Firebase Auth. Contas sem `accounts/{uid}` ativo não conseguem acessar os dados do CRM pelas regras.

Não use este projeto como SaaS pronto para produção multi-cliente até implantar o backend. O painel administrativo permanece separado e fechado para operações entre contas enquanto o projeto ficar no Spark.

## MFA do administrador

Antes de liberar `admin.html`, habilite o Identity Platform no projeto e configure um segundo fator de autenticação para a conta administrativa. Para usar MFA do Firebase, habilite o provedor/fator escolhido no Identity Platform (por exemplo, SMS ou TOTP, conforme disponibilidade e política do projeto), registre o fator no usuário e confirme que o token contém `firebase.sign_in_second_factor`. O front-end apenas verifica o claim para exibir a página; a autorização efetiva continua nas Rules e nas futuras Cloud Functions.

O bootstrap `admin=true` deve ocorrer fora do front-end por Admin SDK em ambiente local controlado. Nunca publique service account ou credenciais de Admin SDK neste repositório.

## App Check e Hosting

App Check ainda precisa ser registrado para o app Web, integrado ao provedor web escolhido (por exemplo, reCAPTCHA) e inicializado no cliente antes de ativar enforcement no Firestore. Não ative enforcement sem instalar e verificar o provider no app, para evitar bloquear os próprios usuários.

O GitHub Pages publica os arquivos, mas não permite configurar cabeçalhos HTTP de resposta. A CSP está na página; para HSTS, `X-Frame-Options`, `X-Content-Type-Options` e `Permissions-Policy`, use Firebase Hosting ou outro host com configuração de headers. Restrinja a API key pública do Firebase aos domínios e APIs necessários.

## GitHub Pages

O repositório público é `paesleme11-ctrl/vertice-crm`, publicado em `https://paesleme11-ctrl.github.io/vertice-crm/`. Nas configurações do Firebase Authentication, mantenha `paesleme11-ctrl.github.io` em domínios autorizados.

Nunca coloque credenciais de Admin SDK, service account, senhas de clientes ou tokens de primeiro acesso em arquivos HTML/JS ou no repositório público.
