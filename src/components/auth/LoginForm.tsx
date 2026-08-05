'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconMailCheck, IconLoader2 } from '@tabler/icons-react';
import { useLogin } from '@/hooks';
import { ApiError } from '@/lib/api/client';
import { BETA_MODE, DEMO_EMAIL, DEMO_PASSWORD, DEMO_LOGIN_ENABLED } from '@/lib/beta';
import { AuthShell } from './AuthShell';
import {
  CardHeader,
  Field,
  EyeButton,
  CheckRow,
  SubmitButton,
  SwitchRow,
  getInputStyle,
  linkStyle,
} from './form-controls';
import { emailValid } from './validation';

interface FormErrors {
  email?: string;
  password?: string;
}

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [showEmailLogin, setShowEmailLogin] = useState(!DEMO_LOGIN_ENABLED);

  const login = useLogin();

  useEffect(() => {
    if (login.isSuccess) router.replace('/');
  }, [login.isSuccess, router]);

  function goToEmailLogin() {
    setShowEmailLogin(true);
    setErrors({});
    setBanner(null);
  }

  function goToBetaAccess() {
    setShowEmailLogin(false);
    setErrors({});
    setBanner(null);
  }

  function handleForgot() {
    if (!email || !emailValid(email)) {
      setErrors({ email: 'Enter a valid email first' });
      return;
    }
    setResetSent(true);
    setErrors({});
    setBanner(null);
  }

  function performLogin(credentials: { email: string; password: string }) {
    login.mutate(credentials, {
      onError: (error) => {
        if (error instanceof ApiError) {
          if (error.code === 'INVALID_CREDENTIALS') {
            setBanner('Incorrect email or password.');
            return;
          }
          if (error.code === 'RATE_LIMITED') {
            setBanner('Too many attempts. Please wait a moment and try again.');
            return;
          }
        }
        setBanner('Something went wrong. Please try again.');
      },
    });
  }

  function handleSubmit() {
    const errs: FormErrors = {};
    if (!email) errs.email = 'Enter your email';
    else if (!emailValid(email)) errs.email = 'Enter a valid email';
    if (!password) errs.password = 'Enter your password';
    setErrors(errs);
    setBanner(null);
    if (Object.keys(errs).length) return;

    performLogin({ email, password });
  }

  function handleDemoLogin() {
    if (!DEMO_LOGIN_ENABLED || !DEMO_EMAIL || !DEMO_PASSWORD) return;
    setErrors({});
    setBanner(null);
    performLogin({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
  }

  if (login.isSuccess) {
    return (
      <AuthShell>
        <div className="flex flex-col items-center justify-center gap-[10px] py-[8px]">
          <IconLoader2 size={20} className="animate-auth-spin" style={{ color: 'var(--color-teal)' }} />
          <div style={{ fontSize: 12, color: 'var(--color-text-light)' }}>Signing you in…</div>
        </div>
      </AuthShell>
    );
  }

  if (DEMO_LOGIN_ENABLED && !showEmailLogin) {
    return (
      <AuthShell>
        <CardHeader title="Try Memory Bank" sub="Explore the private beta instantly" />

        {banner && (
          <div
            className="rounded-[7px] px-[10px] py-[8px] mb-[14px] text-[11px] animate-fade-in-up"
            style={{
              backgroundColor: 'var(--color-amber-bg)',
              border: '1px solid var(--color-pdf)',
              color: 'var(--color-pdf)',
            }}
          >
            {banner}
          </div>
        )}

        <SubmitButton busy={login.isPending} busyLabel="Signing in…" onClick={handleDemoLogin}>
          Continue with Beta Access
        </SubmitButton>

        <div style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--color-text-light)', marginTop: 16, lineHeight: 1.5 }}>
          Memory Bank is in private beta — new account creation is invite-only.
        </div>

        <div style={{ textAlign: 'center', marginTop: 10 }}>
          <button type="button" onClick={goToEmailLogin} style={linkStyle}>
            Have an invite? Sign in with email
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      {DEMO_LOGIN_ENABLED && (
        <button
          type="button"
          onClick={goToBetaAccess}
          style={{ ...linkStyle, display: 'block', marginBottom: 14 }}
        >
          ‹ Back to beta access
        </button>
      )}

      <CardHeader title="Welcome back" sub="Sign in to your workspace" />

      {resetSent && (
        <div
          className="flex items-center gap-[5px] rounded-[7px] px-[10px] py-[8px] mb-[14px] text-[11px] animate-fade-in-up"
          style={{
            backgroundColor: 'var(--color-teal-light)',
            border: '1px solid var(--color-teal-accent)',
            color: 'var(--color-teal-dark)',
          }}
        >
          <IconMailCheck size={13} />
          If an account exists for that email, we&apos;ve sent a reset link.
        </div>
      )}

      {banner && (
        <div
          className="rounded-[7px] px-[10px] py-[8px] mb-[14px] text-[11px] animate-fade-in-up"
          style={{
            backgroundColor: 'var(--color-amber-bg)',
            border: '1px solid var(--color-pdf)',
            color: 'var(--color-pdf)',
          }}
        >
          {banner}
        </div>
      )}

      <Field label="Email" error={errors.email}>
        <input
          style={getInputStyle(!!errors.email)}
          type="text"
          placeholder="name@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>

      <Field
        label="Password"
        error={errors.password}
        labelRight={
          <button type="button" onClick={handleForgot} style={linkStyle}>
            Forgot password?
          </button>
        }
      >
        <div className="relative">
          <input
            style={{ ...getInputStyle(!!errors.password), paddingRight: 34 }}
            type={showPw ? 'text' : 'password'}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <EyeButton show={showPw} onToggle={() => setShowPw((v) => !v)} />
        </div>
      </Field>

      <CheckRow checked={remember} onToggle={() => setRemember((v) => !v)}>
        Remember me for 30 days
      </CheckRow>

      <SubmitButton busy={login.isPending} busyLabel="Signing in…" onClick={handleSubmit}>
        Sign in
      </SubmitButton>

      {BETA_MODE ? (
        <div style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--color-text-light)', marginTop: 16, lineHeight: 1.5 }}>
          Memory Bank is in private beta — new account creation is invite-only.
        </div>
      ) : (
        <SwitchRow prompt="New to Memory Bank?" linkLabel="Create an account" href="/register" />
      )}
    </AuthShell>
  );
}
