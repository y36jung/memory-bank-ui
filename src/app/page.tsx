import { App } from '@/components/App';
import { RequireAuth } from '@/components/auth/RequireAuth';

export default function Home() {
  return (
    <RequireAuth>
      <App />
    </RequireAuth>
  );
}
