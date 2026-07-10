'use client';

import { useState } from 'react';
import { IconMailCheck } from '@tabler/icons-react';
import { useLogin } from '@/hooks';
import { ApiError } from '@/lib/api/client';
import { AuthShell } from './AuthShell';
import { SuccessPanel } from './SuccessPanel';
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [banner, setBanner] = useState<string | null>(null);

  const login = useLogin();

  function handleForgot() {
    if (!email || !emailValid(email)) {
      setErrors({ email: 'Enter a valid email first' });
      return;
    }
    setResetSent(true);
    setErrors({});
    setBanner(null);
  }

  function handleSubmit() {
    const errs: FormErrors = {};
    if (!email) errs.email = 'Enter your email';
    else if (!emailValid(email)) errs.email = 'Enter a valid email';
    if (!password) errs.password = 'Enter your password';
    setErrors(errs);
    setBanner(null);
    if (Object.keys(errs).length) return;

    login.mutate(
      { email, password },
      {
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
      },
    );
  }

  if (login.isSuccess) {
    return (
      <AuthShell showFooter={false}>
        <SuccessPanel title="Signed in" subtitle="Welcome back — taking you to your library." />
      </AuthShell>
    );
  }

  return (
    <AuthShell>
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

      <SwitchRow prompt="New to Memory Bank?" linkLabel="Create an account" href="/register" />
    </AuthShell>
  );
}
