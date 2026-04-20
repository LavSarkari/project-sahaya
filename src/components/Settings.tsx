import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { User, Mail, Shield, Lock, CheckCircle, AlertCircle, Activity, LogOut, KeyRound, Brain, ToggleLeft, ToggleRight, Zap } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { isAdminEmail } from '../lib/utils';

export const Settings: React.FC = () => {
  const { user, profile, logout, updateUserProfile, updateUserPassword } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.name || user?.displayName || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [autopilot, setAutopilot] = useState(false);
  const [loadingAutopilot, setLoadingAutopilot] = useState(false);

  const isGoogleUser = user?.providerData?.[0]?.providerId === 'google.com';
  const isAdmin = profile?.role === 'admin' || isAdminEmail(user?.email);

  // Load autopilot setting
  useEffect(() => {
    if (!user || !isAdmin) return;
    const fetchSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'allocation'));
        if (settingsDoc.exists()) {
          setAutopilot(settingsDoc.data().autopilot || false);
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    };
    fetchSettings();
  }, [user, isAdmin]);

  const toggleAutopilot = async () => {
    setLoadingAutopilot(true);
    try {
      const newValue = !autopilot;
      await setDoc(doc(db, 'settings', 'allocation'), { autopilot: newValue }, { merge: true });
      setAutopilot(newValue);
      setSuccessMsg(`Allocation mode set to ${newValue ? 'Autopilot' : 'Manual'}.`);
    } catch (err) {
      setErrorMsg('Failed to update allocation mode.');
    }
    setLoadingAutopilot(false);
  };

  const handleSaveProfile = async () => {
    if (!displayName.trim()) return;
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await updateUserProfile({ displayName: displayName.trim() });
      setSuccessMsg('Profile updated successfully');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update profile');
    }
    setSaving(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    setSavingPassword(true);
    try {
      await updateUserPassword(newPassword);
      setSuccessMsg('Password changed successfully');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      if (err?.code === 'auth/requires-recent-login') {
        setErrorMsg('For security, please sign out and sign back in before changing your password.');
      } else {
        setErrorMsg(err?.message || 'Failed to change password');
      }
    }
    setSavingPassword(false);
  };

  const roleDisplay: Record<string, { label: string; color: string }> = {
    admin: { label: 'Administrator', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
    volunteer: { label: 'Field Volunteer', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
    reporter: { label: 'Community Reporter', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
  };

  const currentRole = roleDisplay[profile?.role || 'reporter'] || roleDisplay.reporter;

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--bg)] custom-scrollbar">
      <div className="max-w-2xl mx-auto p-6 lg:p-10 space-y-8">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-1"
        >
          <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Settings</h1>
          <p className="text-sm text-[var(--text-secondary)] font-medium">Manage your account and preferences</p>
        </motion.div>

        {/* Feedback Messages */}
        {successMsg && (
          <div className="flex items-center gap-2 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-600 dark:text-emerald-400 text-sm font-bold">
            <CheckCircle className="w-4 h-4 shrink-0" /> {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="flex items-center gap-2 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-600 dark:text-rose-400 text-sm font-bold">
            <AlertCircle className="w-4 h-4 shrink-0" /> {errorMsg}
          </div>
        )}

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 lg:p-8 space-y-6"
        >
          <div className="flex items-center gap-4 pb-6 border-b border-[var(--border)]">
            <div className="w-16 h-16 rounded-2xl bg-[var(--hover)] flex items-center justify-center text-[var(--text-secondary)] border border-[var(--border)] overflow-hidden">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">{profile?.name || user?.displayName || 'User'}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${currentRole.color}`}>
                  <Shield className="w-3 h-3 inline mr-1" />
                  {currentRole.label}
                </span>
              </div>
            </div>
          </div>

          {/* Display Name */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider block">Display Name</label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-3.5 pl-11 text-sm font-medium text-[var(--text-primary)] focus:border-[var(--accent)] outline-none transition-all"
                />
              </div>
              <button
                onClick={handleSaveProfile}
                disabled={saving || displayName === (profile?.name || user?.displayName)}
                className="px-6 bg-[var(--text-primary)] text-[var(--text-inverse)] rounded-xl text-xs font-bold uppercase tracking-wider disabled:opacity-30 hover:opacity-90 transition-all flex items-center gap-2"
              >
                {saving ? <Activity className="w-4 h-4 animate-spin" /> : 'Save'}
              </button>
            </div>
          </div>

          {/* Email (Read-only) */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-3.5 pl-11 text-sm font-medium text-[var(--text-secondary)] cursor-not-allowed opacity-60"
              />
            </div>
            <p className="text-[10px] text-[var(--text-secondary)] font-medium">Email address cannot be changed</p>
          </div>

          {/* Auth Provider */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider block">Authentication Method</label>
            <div className="p-4 bg-[var(--bg)] border border-[var(--border)] rounded-xl flex items-center gap-3">
              <KeyRound className="w-4 h-4 text-[var(--text-secondary)]" />
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {isGoogleUser ? 'Google Account' : 'Email & Password'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Change Password (Only for email/password users) */}
        {!isGoogleUser && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 lg:p-8 space-y-6"
          >
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-[var(--text-secondary)]" />
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Change Password</h3>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--text-secondary)] block">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-3.5 text-sm font-medium text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 focus:border-[var(--accent)] outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--text-secondary)] block">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-3.5 text-sm font-medium text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 focus:border-[var(--accent)] outline-none transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={savingPassword}
                className="px-8 py-3 bg-[var(--text-primary)] text-[var(--text-inverse)] rounded-xl text-xs font-bold uppercase tracking-wider disabled:opacity-50 hover:opacity-90 transition-all flex items-center gap-2"
              >
                {savingPassword ? <Activity className="w-4 h-4 animate-spin" /> : 'Update Password'}
              </button>
            </form>
          </motion.div>
        )}

        {/* Allocation Mode (Admin Only) */}
        {isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 lg:p-8 space-y-6"
          >
            <div className="flex items-center gap-3">
              <Brain className="w-5 h-5 text-[var(--accent)]" />
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Allocation Mode</h3>
            </div>

            <div className="p-4 bg-[var(--bg)] border border-[var(--border)] rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                    {autopilot ? <Zap className="w-4 h-4 text-emerald-500" /> : <Shield className="w-4 h-4 text-amber-500" />}
                    {autopilot ? 'Autopilot Active' : 'Manual Approval'}
                  </div>
                  <p className="text-[10px] text-[var(--text-secondary)] max-w-sm leading-relaxed">
                    {autopilot 
                      ? 'AI will automatically execute redeployment suggestions when confidence exceeds 85%. High-risk actions still require admin approval.'
                      : 'All AI-suggested redeployments require manual admin approval before execution. Recommended for new deployments.'}
                  </p>
                </div>
                <button
                  onClick={toggleAutopilot}
                  disabled={loadingAutopilot}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                    autopilot 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/20' 
                      : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {loadingAutopilot ? (
                    <Activity className="w-4 h-4 animate-spin" />
                  ) : autopilot ? (
                    <ToggleRight className="w-5 h-5" />
                  ) : (
                    <ToggleLeft className="w-5 h-5" />
                  )}
                  {autopilot ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>

            <p className="text-[9px] text-[var(--text-secondary)] font-medium uppercase tracking-wider">
              ⚠ Autopilot mode is experimental. Monitor allocation dashboard closely when enabled.
            </p>
          </motion.div>
        )}

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 lg:p-8"
        >
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-3 py-4 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-2xl text-sm font-bold hover:bg-rose-500/20 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </motion.div>

      </div>
    </div>
  );
};
