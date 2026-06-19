import { getPayload } from 'payload';
import config from '../payload.config';

const USERS = [
  { email: 'admin@middlepoint.do', password: 'Admin123!' },
  { email: 'delivery@middlepoint.do', password: 'Delivery123!' },
  { email: 'cliente@demo.do', password: 'Cliente123!' },
];

async function resetPasswords() {
  console.log('🔑 Resetting user passwords...');
  const payload = await getPayload({ config });

  for (const { email, password } of USERS) {
    const result = await payload.find({
      collection: 'users',
      where: { email: { equals: email } },
      limit: 1,
    });

    const user = result.docs[0];
    if (!user) {
      console.log(`⚠️  User not found: ${email}`);
      continue;
    }

    await payload.update({
      collection: 'users',
      id: user.id,
      data: { password },
    });
    console.log(`✅ Password reset: ${email}`);
  }

  console.log('🎉 Done.');
  process.exit(0);
}

resetPasswords().catch((err) => {
  console.error('Reset failed:', err);
  process.exit(1);
});
