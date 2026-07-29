import { redirect } from 'next/navigation';
import { GuestOnly } from '@/components/auth/RequireAuth';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { BETA_MODE } from '@/lib/beta';

export default function RegisterPage() {
  if (BETA_MODE) redirect('/login');

  return (
    <GuestOnly>
      <RegisterForm />
    </GuestOnly>
  );
}
