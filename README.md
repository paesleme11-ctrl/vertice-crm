# Vértice CRM · versão Spark

Aplicação HTML estática para GitHub Pages, usando Firebase Authentication e Cloud Firestore do projeto `vertice-crm-da863`.

## O que está conectado

- Login e recuperação de senha por e-mail/senha. Cadastro público não aparece na interface.
- Espaço de cada cliente vinculado a `accounts/{uid}` e dados isolados em `users/{uid}/clients` e `interactions`.
- Follow-ups guardados como `yyyy-mm-dd` no fuso `America/Sao_Paulo`.
- Listagem de clientes em blocos de 50 e indicadores do dashboard por agregações Firestore, sem baixar a coleção toda para contar.
- O painel master aparece como pausado no Spark.

## Firebase já configurado

- Projeto: `vertice-crm-da863`.
- Cloud Firestore padrão, região `southamerica-east1` (São Paulo).
- Provedor E-mail/senha habilitado no Firebase Authentication.

## Limites atuais do plano Spark

As Cloud Functions necessárias para bloquear cadastro no servidor (`beforeUserCreated`), provisionar contas, suspender usuários com revogação de tokens, excluir recursivamente clientes e auditar ações não estão implantadas. Não crie contas reais pelo front. Até existir backend confiável, o painel administrativo segue desativado e o Firestore deve continuar com regras de produção restritas.

A página não oferece cadastro público; isso sozinho não impede chamadas diretas ao endpoint público do Firebase Auth. O requisito de bloquear todo cadastro do cliente só fica completo com a blocking function, que depende de Cloud Functions e billing Blaze. Não use esta versão como SaaS de produção multi-cliente enquanto esse backend não estiver disponível.

App Check ainda precisa ser registrado para o app Web, integrado com uma chave reCAPTCHA, e aplicado ao Firestore no Console do Firebase. A CSP está no HTML como meta tag; GitHub Pages não permite configurar os headers HTTP de Hosting. Para os headers `HSTS`, `X-Frame-Options`, `X-Content-Type-Options` e `Permissions-Policy`, use Firebase Hosting ou outro host que permita headers.

## Publicação no GitHub Pages

1. Crie o repositório público `vertice-crm` na conta GitHub pretendida.
2. Envie `index.html`, `firestore.rules`, `firestore.indexes.json`, `.nojekyll` e este README para a raiz da branch `main`.
3. Em **Settings → Pages**, selecione **Deploy from a branch**, `main` e `/ (root)`.
4. No Firebase Authentication, adicione `paesleme11-ctrl.github.io` aos domínios autorizados. Restrinja a chave pública da API no Google Cloud para o domínio do Pages, se aplicável.
5. O endereço esperado é `https://paesleme11-ctrl.github.io/vertice-crm/`.

## Segurança e dados

`firestore.rules` mantém o `get()` do próprio documento de conta para validar status e validade, impede alterações de conta pelo cliente, mantém `slugs/{slug}` sem UID e valida MFA em operações de leitura administrativa. O arquivo deve ser publicado no Console do Firestore antes de colocar dados reais; o banco foi criado em modo produção e continua negando acesso enquanto essas regras não forem publicadas.

Não há usuário de demonstração nem dados fictícios no banco. O Firebase API key embutido no HTML é configuração pública do SDK; aplique restrição por domínio/API. Nunca coloque credenciais de Admin SDK ou service account neste repositório público.

## Quando liberar Blaze

Implante Functions para blocking `beforeUserCreated`, provisioning somente por Admin SDK, envio controlado do primeiro acesso com `generatePasswordResetLink`, MFA para admins, suspensão com `accounts/{uid}.status` + `revokeRefreshTokens`, exclusão recursiva e `auditLog`. Ative Identity Platform e configure fatores MFA; teste que o claim `firebase.sign_in_second_factor` é exigido nas Functions e Rules. Publique os índices compostos declarados em `firestore.indexes.json`.

Os testes de Rules e Functions em `outputs/crm-firebase-fase-a/tests` ainda precisam ser executados no Emulator antes da etapa de produção.