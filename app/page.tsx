'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownUp, CalendarClock, ChevronDown, Clock3, FileText, Inbox, LogIn, LogOut, Pencil, Plus, Search, Send, Settings2, ShieldCheck, Sparkles, Trash2, X } from 'lucide-react';
import { supabase, supabaseConfigured } from '@/lib/supabase';
import { formatTimelineDate, searchMessages, validateCompose } from '@/lib/timeline.mjs';

type Message = { id: string; user_id?: string; sender: string; recipient: string; subject: string; body: string; timeline_at: string; created_at?: string; status?: 'draft' | 'timeline_entry' };
type User = { id: string; email?: string };

const sampleMessages: Message[] = [
  { id: 'demo-1', sender: 'Ada Lovelace', recipient: 'you@example.com', subject: 'A letter from another era', body: 'Some ideas deserve to be found at the moment they belong to, even if that moment is long gone.', timeline_at: '1998-09-03T09:30:00.000Z' },
  { id: 'demo-2', sender: 'Studio North', recipient: 'you@example.com', subject: 'Project archive', body: 'The old project notes are attached to this thread for future reference.', timeline_at: '2012-02-14T14:10:00.000Z' },
  { id: 'demo-3', sender: 'Mina Okafor', recipient: 'you@example.com', subject: 'Friday plans', body: 'Coffee at four? I found a quiet place near the station.', timeline_at: '2026-10-19T08:45:00.000Z' },
  { id: 'demo-4', sender: 'You', recipient: 'team@example.com', subject: 'A thought for later', body: 'Keep this idea where it belongs in the timeline. The date is a bookmark, not a claim about delivery.', timeline_at: '2026-10-20T07:00:00.000Z' },
];

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>(sampleMessages);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  const [folder, setFolder] = useState<'timeline' | 'drafts'>('timeline');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [selected, setSelected] = useState<Message | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('Preview mode · connect Supabase to save your own timeline');
  const [authOpen, setAuthOpen] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [timelineAt, setTimelineAt] = useState('1998-09-03T09:00');
  const [saveAsDraft, setSaveAsDraft] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Message | null>(null);

  async function refreshMessages(currentUser = user) {
    if (!supabase || !currentUser) return;
    setLoading(true);
    const { data, error } = await supabase.from('messages').select('*').eq('user_id', currentUser.id).order('timeline_at', { ascending: sort === 'oldest' });
    setLoading(false);
    if (error) { setNotice(`Could not load messages: ${error.message}`); return; }
    setMessages((data ?? []) as Message[]);
  }

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) { const next = { id: data.user.id, email: data.user.email }; setUser(next); }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const next = session?.user ? { id: session.user.id, email: session.user.email } : null;
      setUser(next);
      if (next) { setNotice(`Signed in as ${next.email ?? 'your account'}`); }
      else { setMessages(sampleMessages); setNotice('Signed out · preview timeline shown'); }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => { if (user) void refreshMessages(user); }, [user, sort]);

  const visibleMessages = useMemo(() => searchMessages(messages.filter(message => folder === 'drafts' ? message.status === 'draft' : message.status !== 'draft'), query).sort((a, b) => {
    const diff = new Date(a.timeline_at).getTime() - new Date(b.timeline_at).getTime();
    return sort === 'oldest' ? diff : -diff;
  }), [messages, query, sort, folder]);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if (!(event.metaKey || event.ctrlKey) || event.altKey) return;
      if (event.key.toLowerCase() === 'n') { event.preventDefault(); setComposeOpen(true); setSelected(null); }
      if (event.key.toLowerCase() === 'k') { event.preventDefault(); searchInputRef.current?.focus(); }
    }
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  function startEditing(message: Message) {
    const date = new Date(message.timeline_at);
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setEditingId(message.id); setRecipient(message.recipient); setSubject(message.subject); setBody(message.body);
    setTimelineAt(localDate); setSaveAsDraft(message.status === 'draft'); setSelected(null); setComposeOpen(true);
  }

  async function deleteMessage(message: Message) {
    if (supabaseConfigured && !user) { setNotice('Sign in before deleting a cloud timeline entry.'); setDeleteTarget(null); setAuthOpen(true); return; }
    if (user && supabase) {
      setLoading(true);
      const { error } = await supabase.from('messages').delete().eq('id', message.id).eq('user_id', user.id);
      setLoading(false);
      if (error) { setNotice(`Delete failed: ${error.message}`); return; }
    }
    setMessages(current => current.filter(item => item.id !== message.id));
    setSelected(null); setDeleteTarget(null); setNotice('Entry deleted.');
  }

  async function handleAuth(event: FormEvent) {
    event.preventDefault();
    if (!supabase) { setNotice('Add Supabase credentials to .env.local to enable accounts.'); return; }
    setLoading(true);
    const result = authMode === 'signup'
      ? await supabase.auth.signUp({ email: authEmail, password: authPassword })
      : await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
    setLoading(false);
    if (result.error) { setNotice(result.error.message); return; }
    if (authMode === 'signup' && !result.data.session) setNotice('Check your email to confirm your account, then sign in.');
    else { setNotice('Account connected. Loading your private timeline.'); setAuthOpen(false); }
  }

  async function signOut() {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
  }

  async function handleCompose(event: FormEvent) {
    event.preventDefault();
    const input = { recipient, subject, body, timeline_at: timelineAt };
    const validation = validateCompose(input);
    if (!validation.valid) { setNotice(Object.values(validation.errors)[0]); return; }
    const entry: Message = { id: `local-${Date.now()}`, sender: user?.email ?? 'You', recipient: recipient.trim(), subject: subject.trim(), body: body.trim(), timeline_at: new Date(timelineAt).toISOString(), status: saveAsDraft ? 'draft' : 'timeline_entry' };
    if (editingId && user && supabase) {
      const { data, error } = await supabase.from('messages').update({ recipient: entry.recipient, subject: entry.subject, body: entry.body, timeline_at: entry.timeline_at, status: entry.status }).eq('id', editingId).eq('user_id', user.id).select().single();
      if (error) { setNotice(`Update failed: ${error.message}`); return; }
      setMessages(current => current.map(message => message.id === editingId ? data as Message : message));
    } else if (editingId && !supabaseConfigured) {
      setMessages(current => current.map(message => message.id === editingId ? { ...entry, id: editingId } : message));
    } else if (editingId) {
      setNotice('Sign in before updating a cloud timeline entry.'); setAuthOpen(true); return;
    } else if (user && supabase) {
      const { data, error } = await supabase.from('messages').insert({ user_id: user.id, sender: user.email ?? 'You', recipient: entry.recipient, subject: entry.subject, body: entry.body, timeline_at: entry.timeline_at, status: entry.status }).select().single();
      if (error) { setNotice(`Save failed: ${error.message}`); return; }
      setMessages(current => [data as Message, ...current]);
    } else if (!supabaseConfigured) {
      setMessages(current => [entry, ...current]);
      setNotice('Saved in this preview session only. Connect Supabase for cloud persistence.');
    } else {
      setNotice('Sign in before saving to your private cloud timeline.');
      setAuthOpen(true); return;
    }
    if (user && supabase) setNotice(saveAsDraft ? 'Draft saved to your private cloud account.' : 'Timeline entry saved to your private cloud account.');
    setFolder(saveAsDraft ? 'drafts' : 'timeline');
    setComposeOpen(false); setSelected(null); setEditingId(null); setRecipient(''); setSubject(''); setBody('');
  }

  return <main className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Clock3 size={21}/></div><div><strong>time machine</strong><span>MAIL / 0.1</span></div></div>
      <button className="compose-button" onClick={() => { setComposeOpen(true); setSelected(null); }}><Plus size={17}/> Compose <span>⌘ N</span></button>
      <div className="nav-label">WORKSPACE</div>
      <button className={`nav-item ${folder === 'timeline' ? 'active' : ''}`} onClick={() => { setFolder('timeline'); setSelected(null); }}><Inbox size={17}/> Timeline <span className="nav-count">{messages.filter(message => message.status !== 'draft').length}</span></button>
      <button className={`nav-item ${folder === 'drafts' ? 'active' : ''}`} onClick={() => { setFolder('drafts'); setSelected(null); }}><FileText size={17}/> Drafts <span className="nav-count">{messages.filter(message => message.status === 'draft').length}</span></button>
      <div className="sidebar-bottom"><div className="security-note"><ShieldCheck size={17}/><div><strong>Your timeline, yours</strong><p>Private by account. Historical date is not a delivery claim.</p></div></div>
        <button className="account-button" onClick={() => user ? void signOut() : setAuthOpen(true)}>{user ? <><div className="avatar">{(user.email ?? 'U')[0].toUpperCase()}</div><div className="account-copy"><strong>{user.email}</strong><span>Signed in · Sign out</span></div><LogOut size={16}/></> : <><div className="avatar"><LogIn size={16}/></div><div className="account-copy"><strong>Connect account</strong><span>{supabaseConfigured ? 'Sign in or create account' : 'Supabase setup needed'}</span></div><ChevronDown size={16}/></>}</button>
      </div>
    </aside>

    <section className="main-panel">
      <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <strong>{folder === 'drafts' ? 'Drafts' : 'Timeline'}</strong></div><div className="topbar-right"><span className="status-dot"/> {user ? 'CLOUD SYNC' : 'LOCAL PREVIEW'} <button className="icon-button" aria-label="Account settings" onClick={() => user ? setNotice('Account settings will be expanded in a later task.') : setAuthOpen(true)}><Settings2 size={17}/></button></div></header>
      <div className="content-wrap">
        <div className="page-heading"><div><div className="eyebrow"><Sparkles size={13}/> YOUR INBOX, OUT OF ORDER</div><h1>Every message has <em>its moment.</em></h1><p>Place a note in the past. Find it exactly where you left it.</p></div><button className="primary-button" onClick={() => { setComposeOpen(true); setSelected(null); }}><Plus size={17}/> New message</button></div>
        <div className="notice-bar"><span className="notice-icon"><ShieldCheck size={15}/></span><span>{notice}</span><button onClick={() => setNotice(user ? `Signed in as ${user.email}` : 'Preview data is temporary. Configure Supabase for private cloud storage.')} aria-label="Dismiss notice"><X size={14}/></button></div>
        <div className="toolbar"><label className="search-box"><Search size={17}/><input ref={searchInputRef} value={query} onChange={e => setQuery(e.target.value)} placeholder="Search subject, sender, recipient…"/><kbd>⌘ K</kbd></label><button className="sort-button" onClick={() => setSort(sort === 'newest' ? 'oldest' : 'newest')}><ArrowDownUp size={15}/>{sort === 'newest' ? 'Newest first' : 'Oldest first'}<ChevronDown size={14}/></button></div>
        <div className="timeline-meta"><span>{visibleMessages.length} {visibleMessages.length === 1 ? (folder === 'drafts' ? 'DRAFT' : 'MESSAGE') : (folder === 'drafts' ? 'DRAFTS' : 'MESSAGES')}</span><span>{folder === 'drafts' ? 'UNSENT DRAFTS' : 'ORDERED BY TIMELINE DATE'} <span className="meta-divider">·</span> {loading ? 'SYNCING…' : 'READY'}</span></div>
        <div className="timeline-list">
          {visibleMessages.map((message, index) => <button key={message.id} className={`message-row ${selected?.id === message.id ? 'selected' : ''}`} onClick={() => { setSelected(message); setComposeOpen(false); }}>
            <div className="timeline-track"><div className={`timeline-node ${index === 0 ? 'latest' : ''}`}/>{index < visibleMessages.length - 1 && <div className="timeline-line"/>}</div>
            <div className="date-column"><strong>{new Date(message.timeline_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</strong><span>{new Date(message.timeline_at).getFullYear()}</span></div>
            <div className="message-main"><div className="message-topline"><span className="sender">{message.sender}</span><span className="message-time">{new Date(message.timeline_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span></div><strong className="message-subject">{message.subject}</strong><p>{message.body}</p></div>
            <div className="message-end">{message.status === 'draft' ? <span className="draft-pill">DRAFT</span> : <span className="entry-pill">TIMELINE ENTRY</span>}<span className="row-arrow">↗</span></div>
          </button>)}
          {visibleMessages.length === 0 && <div className="empty-state"><Search size={23}/><strong>{folder === 'drafts' ? 'No drafts yet' : 'No messages found'}</strong><p>{folder === 'drafts' ? 'Save a message as a draft and it will wait here.' : 'Try another search or compose a new timeline entry.'}</p><button onClick={() => setQuery('')}>Clear search</button></div>}
        </div>
        <footer className="page-footer"><span><CalendarClock size={14}/> TIME IS A SORTING RULE, NOT A CLAIM OF DELIVERY.</span><span>TIME MACHINE MAIL <b>0.1.0</b></span></footer>
      </div>
    </section>

    {selected && !composeOpen && <div className="detail-backdrop" onClick={() => setSelected(null)}><section className="detail-panel" onClick={e => e.stopPropagation()}><div className="drawer-head"><span>MESSAGE DETAIL</span><button className="icon-button" onClick={() => setSelected(null)} aria-label="Close message"><X size={17}/></button></div><div className="detail-date"><CalendarClock size={17}/>{formatTimelineDate(selected.timeline_at)}</div><h2>{selected.subject}</h2><div className="detail-address"><span>FROM</span><strong>{selected.sender}</strong><span>TO</span><strong>{selected.recipient}</strong></div><div className="detail-body">{selected.body}</div><div className="detail-disclaimer"><ShieldCheck size={16}/><span>This entry is positioned by its selected timeline date. It does not indicate that an email was delivered on that date.</span></div><div className="detail-actions"><button className="sort-button" onClick={() => startEditing(selected)}><Pencil size={14}/> Edit entry</button><button className="sort-button" onClick={() => setDeleteTarget(selected)}><Trash2 size={14}/> Delete</button></div></section></div>}

    {composeOpen && <div className="modal-backdrop" onClick={() => setComposeOpen(false)}><section className="compose-modal" onClick={e => e.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">{editingId ? 'EDIT TIMELINE ENTRY' : 'CREATE A TIMELINE ENTRY'}</span><h2>{editingId ? 'Edit message' : 'Compose message'}</h2></div><button className="icon-button" onClick={() => setComposeOpen(false)} aria-label="Close composer"><X size={18}/></button></div><form onSubmit={handleCompose} className="compose-form"><label>To <input type="email" required value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="person@example.com"/></label><label>Subject <input required maxLength={250} value={subject} onChange={e => setSubject(e.target.value)} placeholder="Give this moment a subject"/></label><label className="date-field">TIMELINE DATE & TIME <span><CalendarClock size={15}/> <input type="datetime-local" required value={timelineAt} onChange={e => setTimelineAt(e.target.value)}/></span></label><textarea required maxLength={100000} value={body} onChange={e => setBody(e.target.value)} placeholder="Write a message to be found in another time…" rows={7}/><div className="composer-foot"><label className="draft-toggle"><input type="checkbox" checked={saveAsDraft} onChange={e => setSaveAsDraft(e.target.checked)}/> Save as draft</label><span className="date-note"><ShieldCheck size={14}/> Timeline date ≠ sent date</span><button className="primary-button" type="submit"><Send size={15}/>{editingId ? (saveAsDraft ? 'Update draft' : 'Update entry') : (saveAsDraft ? 'Save draft' : 'Save entry')}</button></div></form></section></div>}

    {deleteTarget && <div className="modal-backdrop" onClick={() => setDeleteTarget(null)}><section className="auth-modal" onClick={e => e.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">PERMANENT ACTION</span><h2>Delete this entry?</h2></div><button className="icon-button" onClick={() => setDeleteTarget(null)} aria-label="Cancel deletion"><X size={18}/></button></div><p className="auth-copy">This removes “{deleteTarget.subject}” from your timeline. This action cannot be undone.</p><div className="composer-foot"><button className="sort-button" onClick={() => setDeleteTarget(null)}>Cancel</button><button className="primary-button" disabled={loading} onClick={() => void deleteMessage(deleteTarget)}><Trash2 size={15}/>{loading ? 'Deleting…' : 'Delete entry'}</button></div></section></div>}

    {authOpen && <div className="modal-backdrop" onClick={() => setAuthOpen(false)}><section className="auth-modal" onClick={e => e.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">PRIVATE BY DESIGN</span><h2>{authMode === 'signin' ? 'Welcome back.' : 'Create your account.'}</h2></div><button className="icon-button" onClick={() => setAuthOpen(false)} aria-label="Close account dialog"><X size={18}/></button></div><p className="auth-copy">Your timeline belongs to you. Sign in to save and sync it securely.</p><form onSubmit={handleAuth} className="compose-form"><label>Email <input type="email" required autoComplete="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="you@example.com"/></label><label>Password <input type="password" minLength={8} required autoComplete={authMode === 'signin' ? 'current-password' : 'new-password'} value={authPassword} onChange={e => setAuthPassword(e.target.value)} placeholder="At least 8 characters"/></label><button className="primary-button auth-submit" type="submit" disabled={loading}>{loading ? 'Please wait…' : authMode === 'signin' ? 'Sign in' : 'Create account'}</button></form><button className="auth-switch" onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}>{authMode === 'signin' ? 'New here? Create an account' : 'Already have an account? Sign in'}</button>{!supabaseConfigured && <p className="setup-hint">Setup required: copy <code>.env.example</code> to <code>.env.local</code>, then add your Supabase project URL and public key.</p>}</section></div>}
  </main>;
}
