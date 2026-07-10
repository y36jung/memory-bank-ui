import { GuestOnly } from '@/components/auth/RequireAuth';
import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <GuestOnly>
      <LoginForm />
    </GuestOnly>
  );
}
