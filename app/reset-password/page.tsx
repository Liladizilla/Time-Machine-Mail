'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, supabaseConfigured } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('Checking your secure reset link…');

  useEffect(() => {
    if (!supabase) { setNotice('Password recovery is unavailable until Supabase is configured.'); setReady(true); return; }
    let active = true;
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if ((event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') && session) {
        setReady(true);
        setNotice('Choose a new password for your account.');
      }
    });
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      setReady(true);
      if (error) setNotice('Could not verify this reset link. Request a new one from sign in.');
      else if (data.session) setNotice('Choose a new password for your account.');
      else setNotice('This reset link is invalid or has expired. Return to sign in and request a fresh link.');
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);

  async function updatePassword(event: FormEvent) {
    event.preventDefault();
    if (!supabase || !password || password.length < 8 || password !== confirmation) return;
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) { setNotice(error.message); return; }
      setNotice('Password updated. Returning to your timeline…');
      window.setTimeout(() => router.replace('/'), 900);
    } catch {
      setNotice('Could not update your password because the account service could not be reached. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  }

  return <main className="reset-shell"><section className="reset-card"><span className="eyebrow">TIME MACHINE MAIL / ACCOUNT SECURITY</span><h1>Choose a new <em>password.</em></h1><p className="reset-copy">{notice}</p>{ready && supabaseConfigured && <form onSubmit={updatePassword} className="compose-form"><label>New password <input type="password" minLength={8} autoComplete="new-password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters"/></label><label>Confirm new password <input type="password" minLength={8} autoComplete="new-password" required value={confirmation} onChange={e => setConfirmation(e.target.value)} placeholder="Enter it again"/></label>{confirmation && password !== confirmation && <p className="reset-error">Passwords do not match.</p>}<button className="primary-button auth-submit" type="submit" disabled={saving || password.length < 8 || password !== confirmation}>{saving ? 'Updating…' : 'Update password'}</button></form>}<Link className="reset-back" href="/">Return to Time Machine Mail</Link></section></main>;
}
