import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const projectId = 'vertice-crm-da863';
const email = process.argv[2]?.trim().toLowerCase();

if (!email || !email.includes('@')) {
  console.error('Uso: node scripts/bootstrap-admin.mjs email-do-admin');
  process.exit(2);
}

const app = initializeApp({
  credential: applicationDefault(),
  projectId,
});
const auth = getAuth(app);

try {
  const user = await auth.getUserByEmail(email);
  await auth.setCustomUserClaims(user.uid, {
    ...(user.customClaims ?? {}),
    admin: true,
  });
  await auth.revokeRefreshTokens(user.uid);
  console.log(`Claim admin=true atribuído a ${user.email} (${user.uid}).`);
  console.log('A sessão foi revogada. Entre novamente e conclua o cadastro TOTP em admin.html.');
} catch (error) {
  console.error(`Falha ao atribuir admin ao usuário solicitado: ${error.message}`);
  process.exitCode = 1;
}