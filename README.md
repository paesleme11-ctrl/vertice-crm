# Vértice CRM · painéis por função

Aplicação estática publicada no GitHub Pages e conectada ao Firebase Authentication e ao Cloud Firestore do projeto `vertice-crm-da863`.

## Páginas

- `cliente.html?c=slug-do-cliente`: entrada do cliente. Cada empresa pode receber seu slug próprio em `accounts/{uid}.slug`; o slug identifica a URL, mas não autentica ninguém.
- `admin.html`: painel administrativo de consulta, protegido pelo UID allowlisted nas regras (login com e-mail e senha, sem segundo fator).
- `index.html`: encaminha para `cliente.html`.

## Allowlist do administrador

O único UID autorizado no painel de consulta é `EzMhP4jlu2apWPdmwSgmmHFZkA73`. A restrição está tanto no front-end quanto nas Firestore Rules. O UID pode aparecer no código e nas regras públicas; ele não é senha nem segredo e, sozinho, não autentica uma sessão.

Não é necessário usar Node.js, Admin SDK ou custom claim `admin=true` para este administrador único. Para trocar o administrador, substitua o UID em `app.js` e em `firestore.rules` e publique ambos os arquivos. Não abra permissões de escrita para contas.

O painel permite consultar somente metadados de `accounts` (nome, status, plano, validade e slug), com páginas de 50 itens e contagem agregada. Não lê `users/{uid}/clients` nem `interactions`, e não oferece ações para alterar ou excluir contas.

## Isolamento dos clientes

O Firebase Auth fornece o UID autenticado. O cliente sempre lê e grava em `users/{auth.currentUser.uid}/clients` e `users/{auth.currentUser.uid}/interactions`; não aceita UID informado pela URL. As Rules comparam o UID do caminho ao UID autenticado e exigem conta ativa em `accounts/{uid}`. O cliente A não consegue acessar dados do cliente B, mesmo alterando a URL ou o JavaScript local.

`slugs/{slug}` guarda somente nome público e marca, nunca UID. A correspondência entre slug e proprietário continua sendo validada por `accounts/{uid}.slug` nas regras.

## Operações manuais enquanto o projeto fica no Spark

Cloud Functions não estão implantadas. Portanto, não há provisionamento de clientes, bloqueio server-side de cadastro via `beforeUserCreated`, link de primeiro acesso pelo Admin SDK, suspensão com `revokeRefreshTokens`, exclusão recursiva ou auditoria administrativa. Faça essas operações manualmente pelo Firebase Console em ambiente confiável. O HTML público nunca recebe credencial administrativa.

A tela de login não oferece cadastro. Sem blocking function, isso não impede chamadas diretas para criar usuário no Firebase Auth; porém, contas sem `accounts/{uid}` ativo não passam pelas regras nem acessam os dados do CRM.

## Firebase e segurança

- Firestore padrão em `southamerica-east1` (São Paulo).
- Authentication por e-mail e senha.
- Follow-ups como string `yyyy-mm-dd` no fuso `America/Sao_Paulo`.
- Listas paginadas; contadores do dashboard usam agregações Firestore.
- App Check ainda precisa ser registrado e iniciado no app antes de ativar enforcement.
- GitHub Pages não permite configurar cabeçalhos HTTP de resposta. A CSP está na página; use Firebase Hosting/outro host para HSTS, X-Frame-Options, X-Content-Type-Options e Permissions-Policy.
- Restrinja a API key pública do Firebase aos domínios e APIs necessários. Nunca publique segredo do Admin SDK.

## Publicação

Repositório público: `paesleme11-ctrl/vertice-crm`.
Site: `https://paesleme11-ctrl.github.io/vertice-crm/`.
Mantenha `paesleme11-ctrl.github.io` autorizado no Firebase Authentication. Envie `admin.html`, `cliente.html`, `index.html`, `app.js`, `firestore.rules`, `firestore.indexes.json`, `.nojekyll` e este README para a branch `main`. Depois, publique o conteúdo atualizado de `firestore.rules` também em **Firestore → Regras** no Console do Firebase.