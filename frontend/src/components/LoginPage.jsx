import { useState } from 'react';
import { Spinner, Notice } from './ui.jsx';

/**
 * A single dedicated login form. Each role's App.jsx supplies its own
 * title/fields/submit handler — nothing here is shared behavior between
 * roles beyond layout, and each role calls a completely different login
 * endpoint (see each role's App.jsx).
 */
export default function LoginPage({ title, subtitle, idLabel, idPlaceholder, note, onSubmit }) {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onSubmit(id.trim(), password);
    } catch (err) {
      setError(err.body?.error || 'Could not sign in. Check your details and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-logo">
          <div className="login-icon">◆</div>
          <div className="login-title">{title}</div>
          <div className="login-sub">{subtitle}</div>
        </div>
        {error && <Notice tone="red">{error}</Notice>}
        <div className="field">
          <label className="label">{idLabel}</label>
          <input className="input" placeholder={idPlaceholder} value={id} onChange={(e) => setId(e.target.value)} />
        </div>
        <div className="field">
          <label className="label">Password</label>
          <input className="input" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button className="btn btn-accent btn-block" type="submit" disabled={loading}>
          {loading ? <Spinner /> : 'Sign in'}
        </button>
        <p className="login-note">{note}</p>
      </form>
    </div>
  );
}
