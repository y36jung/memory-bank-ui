'use client';

import { useState } from 'react';
import { useRegister } from '@/hooks';
import { ApiError } from '@/lib/api/client';
import { AuthShell } from './AuthShell';
import { SuccessPanel } from './SuccessPanel';
import {
  CardHeader,
  Field,
  EyeButton,
  Checkbox,
  SubmitButton,
  SwitchRow,
  getInputStyle,
} from './form-controls';
import { emailValid, pwScore, PW_LABELS, PASSWORD_MIN_LENGTH } from './validation';

interface FormErrors {
  email?: string;
  password?: string;
  confirm?: string;
  terms?: string;
}

export function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [terms, setTerms] = useState(false);
  const [shakeTerms, setShakeTerms] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [banner, setBanner] = useState<string | null>(null);

  const register = useRegister();
  const score = pwScore(password);

  const barColors = [
    score === 1 ? 'var(--color-amber-text)' : score >= 2 ? 'var(--color-teal)' : 'var(--color-border)',
    score >= 2 ? 'var(--color-teal)' : 'var(--color-border)',
    score >= 3 ? 'var(--color-teal)' : 'var(--color-border)',
  ];

  function toggleTerms(next: boolean) {
    setTerms(next);
    if (next && errors.terms) setErrors((e) => ({ ...e, terms: undefined }));
  }

  function handleSubmit() {
    const errs: FormErrors = {};
    if (!email) errs.email = 'Enter your email';
    else if (!emailValid(email)) errs.email = 'Enter a valid email';
    if (!password) errs.password = 'Enter a password';
    else if (password.length < PASSWORD_MIN_LENGTH) errs.password = 'Use at least 8 characters';
    if (!confirm || confirm !== password) errs.confirm = "Passwords don't match";
    if (!terms) errs.terms = 'You must accept the terms to continue';
    setErrors(errs);
    setBanner(null);

    if (errs.terms) {
      setShakeTerms(true);
      setTimeout(() => setShakeTerms(false), 400);
    }
    if (Object.keys(errs).length) return;

    register.mutate(
      { email, password },
      {
        onError: (error) => {
          if (error instanceof ApiError) {
            if (error.code === 'EMAIL_TAKEN') {
              setErrors((e) => ({ ...e, email: 'An account with this email already exists.' }));
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

  if (register.isSuccess) {
    return (
      <AuthShell showFooter={false}>
        <SuccessPanel title="Account created" subtitle="Your workspace is ready to go." />
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <CardHeader title="Create your account" sub="Start indexing your documents" />

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

      <Field label="Password" error={errors.password}>
        <div className="relative">
          <input
            style={{ ...getInputStyle(!!errors.password), paddingRight: 34 }}
            type={showPw ? 'text' : 'password'}
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <EyeButton show={showPw} onToggle={() => setShowPw((v) => !v)} />
        </div>
        {password && (
          <div style={{ marginTop: 7 }}>
            <div className="flex gap-[3px]">
              {barColors.map((c, i) => (
                <div
                  key={i}
                  style={{ flex: 1, height: 3, backgroundColor: c, borderRadius: 2, transition: 'background-color .15s' }}
                />
              ))}
            </div>
            <div style={{ fontSize: 10, color: 'var(--color-text-light)', marginTop: 4 }}>
              {PW_LABELS[score]}
            </div>
          </div>
        )}
      </Field>

      <div style={{ marginBottom: 6 }}>
        <Field label="Confirm password" error={errors.confirm}>
          <input
            style={getInputStyle(!!errors.confirm)}
            type="password"
            placeholder="Re-enter your password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </Field>
      </div>

      <div className={shakeTerms ? 'animate-auth-shake' : ''}>
        <div
          className="flex items-start gap-[7px] mt-[14px] mb-[4px] cursor-pointer select-none"
          onClick={() => toggleTerms(!terms)}
        >
          <Checkbox checked={terms} error={!!errors.terms} />
          <span style={{ fontSize: 11, color: 'var(--color-text-mid)', lineHeight: 1.5 }}>
            I agree to the{' '}
            <span style={{ color: 'var(--color-teal)', cursor: 'pointer' }}>Terms of Service</span> and{' '}
            <span style={{ color: 'var(--color-teal)', cursor: 'pointer' }}>Privacy Policy</span>
          </span>
        </div>
        {errors.terms && (
          <div style={{ fontSize: 10.5, color: 'var(--color-pdf)', marginTop: 2 }}>{errors.terms}</div>
        )}
      </div>

      <SubmitButton busy={register.isPending} busyLabel="Creating account…" onClick={handleSubmit}>
        Create account
      </SubmitButton>

      <SwitchRow prompt="Already have an account?" linkLabel="Sign in" href="/login" />
    </AuthShell>
  );
}
