import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useOrg } from '../../contexts/OrgContext';
import AuthContext from '../../contexts/AuthContext';
import { Users, ArrowRight, CheckCircle2, Layers, Compass, AlertCircle } from 'lucide-react';
import { Card, Button } from '../ui';

// New codes are 8 characters; organisations created earlier may still have 6-character codes
const MIN_LEN = 6;
const MAX_LEN = 8;

const JoinOrg = () => {
  const { org, refreshOrg }   = useOrg();
  const { currentUser, applyNewToken } = useContext(AuthContext);
  const [code,    setCode]    = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [joined,  setJoined]  = useState(null); // { name, alreadyMember }

  const handleSubmit = async e => {
    e.preventDefault();
    if (code.length < MIN_LEN) { setError(`Invite codes are ${MIN_LEN}–${MAX_LEN} letters and numbers.`); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/org/join', { inviteCode: code.trim().toUpperCase() });
      // Server returns a new token with updated orgId — apply immediately
      if (res.data.token) applyNewToken(res.data.token, res.data.user);
      await refreshOrg();
      setJoined({ name: res.data.org?.name || 'the organisation', alreadyMember: !!res.data.alreadyMember });
    } catch (err) {
      const status = err.response?.status;
      const msg    = err.response?.data?.message;
      setError(
        status === 404 ? "That invite code doesn't match any organisation. Check it with your teacher."
        : msg || "We couldn't join right now. Please try again."
      );
    } finally { setLoading(false); }
  };

  const complete = code.length >= MIN_LEN;

  // Joining is for student accounts that aren't in an organisation yet
  const blocker = currentUser && currentUser.role !== 'user'
    ? "Organisation admin and platform admin accounts can't join another organisation with an invite code. Use a student account instead."
    : currentUser?.orgId && org?.name
      ? `You're already in ${org.name}. Leave it before joining a different organisation.`
      : null;

  if (joined) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 py-10">
        <div className="w-full max-w-md animate-fade-up">
          <Card className="text-center py-10 px-6 sm:px-8">
            <span className="inline-flex items-center justify-center w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl mb-4">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white" role="status">
              {joined.alreadyMember ? `You're already in ${joined.name}` : `You've joined ${joined.name}`}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-sm mx-auto">
              {joined.alreadyMember
                ? 'Nothing else to do — your classes and assignments are where they were.'
                : 'Your teacher will add you to a batch. Your assignments will show up in My classes once they do.'}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-2 mt-6">
              <Button to="/my-classes" icon={Layers}>My classes</Button>
              <Button to="/quizzes" variant="secondary" icon={Compass}>Explore quizzes</Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 py-10">
      <div className="w-full max-w-md animate-fade-up">
        <Card padding={false}>
          <div className="p-6 sm:p-8">
            <div className="text-center mb-7">
              <span className="inline-flex items-center justify-center w-12 h-12 bg-brand-50 dark:bg-brand-500/10 rounded-2xl mb-4">
                <Users className="h-6 w-6 text-brand-600 dark:text-brand-400" aria-hidden="true" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Join an organisation</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
                Enter the invite code your teacher or admin shared with you.
              </p>
            </div>

            {blocker && (
              <p className="flex gap-2 text-sm text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg px-3 py-2.5 mb-5">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />{blocker}
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <label htmlFor="invite-code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Invite code
                </label>
                <input
                  id="invite-code"
                  value={code}
                  onChange={e => { setError(null); setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, MAX_LEN)); }}
                  maxLength={MAX_LEN}
                  placeholder="K7MP4QXR"
                  autoFocus
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  aria-describedby={error ? 'invite-code-error invite-code-hint' : 'invite-code-hint'}
                  aria-invalid={!!error}
                  className="w-full h-16 px-4 text-center text-2xl sm:text-3xl font-mono font-bold tracking-[0.4em] indent-[0.4em] uppercase
                    bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl
                    text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-700
                    focus:outline-none focus:bg-white dark:focus:bg-gray-900 focus:ring-4 focus:ring-brand-500/15 focus:border-brand-500"
                />
                <div id="invite-code-hint" className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>Letters and numbers only</span>
                  <span className={`tabular-nums font-medium ${complete ? 'text-emerald-600 dark:text-emerald-400' : ''}`} aria-live="polite">
                    {code.length} / {MAX_LEN}
                  </span>
                </div>
                {error && (
                  <p id="invite-code-error" role="alert" className="flex gap-1.5 mt-3 text-sm text-red-600 dark:text-red-400">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />{error}
                  </p>
                )}
              </div>

              <Button type="submit" size="lg" fullWidth loading={loading} disabled={!complete} iconRight={ArrowRight}>
                {loading ? 'Joining…' : 'Join organisation'}
              </Button>
            </form>
          </div>
        </Card>

        <div className="text-center mt-5 space-y-1.5 text-sm text-gray-500 dark:text-gray-400">
          <p>Don't have a code? Ask your organisation admin.</p>
          <p>
            Want to create your own?{' '}
            <Link to="/org/setup" className="font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
              Set up an organisation
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default JoinOrg;
