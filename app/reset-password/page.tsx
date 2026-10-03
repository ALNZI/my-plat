'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/app-context';
import { Lock, KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft, ArrowRight, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

export default function ResetPasswordPage() {
  const { t, dir } = useLanguage();
  const router = useRouter();

  const [hasValidSession, setHasValidSession] = useState<boolean | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    // Listen to Supabase auth state changes for PASSWORD_RECOVERY or SIGNED_IN
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (event === 'PASSWORD_RECOVERY' || (session && session.user)) {
        setHasValidSession(true);
      }
    });

    // Check existing session in case the event already fired or token is cached
    const checkInitialSession = async () => {
      try {
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search);
          const code = urlParams.get('code');
          if (code) {
            const { data, error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
            if (!exchangeErr && data?.session?.user) {
              if (mounted) setHasValidSession(true);
              return;
            }
          }
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        if (session && session.user) {
          setHasValidSession(true);
        } else {
          // Give a short delay to let detectSessionInUrl parse hash/params
          setTimeout(async () => {
            if (!mounted) return;
            const { data: { session: delayedSession } } = await supabase.auth.getSession();
            if (delayedSession && delayedSession.user) {
              setHasValidSession(true);
            } else {
              setHasValidSession(false);
            }
          }, 1200);
        }
      } catch (err) {
        console.error('Session check error:', err);
        if (mounted) setHasValidSession(false);
      }
    };

    checkInitialSession();

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError(t('auth.passwordLengthError'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    setSubmitting(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(updateError.message || t('admin.passwordError'));
      } else {
        setSuccess(true);
        toast.success(t('auth.passwordResetSuccess'));
        // Automatically redirect to admin login after 3 seconds
        setTimeout(() => {
          router.push('/admin/login');
        }, 3000);
      }
    } catch (err) {
      console.error('Password reset exception:', err);
      setError(t('admin.passwordError'));
    } finally {
      setSubmitting(false);
    }
  };

  const BackArrow = dir === 'rtl' ? ArrowRight : ArrowLeft;

  // 1. Loading State while detecting recovery session
  if (hasValidSession === null) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 text-[#155A82] dark:text-[#F5F7F8] dark:bg-[#111315]" dir={dir}>
        <Card className="w-full max-w-md border border-white/60 bg-white/50 backdrop-blur-[20px] shadow-[0_20px_50px_rgba(36,119,168,0.12)] dark:border-[#343A40] dark:bg-[#191C1F] rounded-2xl">
          <CardContent className="py-12 flex flex-col items-center justify-center space-y-4">
            <div className="h-10 w-10 border-4 border-[#2BA8A2] dark:border-[#10B981] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[#2477A8] dark:text-muted-foreground">{t('common.loading')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 2. Invalid or Expired Session
  if (hasValidSession === false) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 text-[#155A82] dark:text-[#F5F7F8] dark:bg-[#111315]" dir={dir}>
        <Card className="w-full max-w-md border border-white/60 bg-white/50 backdrop-blur-[20px] shadow-[0_20px_50px_rgba(36,119,168,0.12)] text-[#155A82] dark:border-[#343A40] dark:bg-[#191C1F] dark:text-[#F5F7F8] rounded-2xl">
          <CardHeader className="text-center space-y-3 pt-8">
            <div className="h-14 w-14 rounded-2xl bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30 mx-auto flex items-center justify-center">
              <AlertCircle className="h-7 w-7 stroke-[1.8]" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-[#155A82] dark:text-[#F5F7F8]">{t('auth.resetPasswordTitle')}</CardTitle>
              <CardDescription className="mt-1.5 text-sm text-[#2477A8] dark:text-[#A7ADB4]">
                {t('auth.invalidSession')}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pb-8">
            <Button asChild className="w-full gap-2 bg-[#2BA8A2] hover:bg-[#2BA8A2]/90 dark:bg-[#10B981] dark:hover:bg-[#22C55E] text-white shadow-sm font-semibold h-11 rounded-xl">
              <Link href="/forgot-password">
                {t('auth.sendResetLink')}
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full gap-2 border-white/60 bg-white/40 dark:border-[#343A40] dark:bg-[#202428] text-[#155A82] dark:text-[#F5F7F8] hover:bg-white/60 dark:hover:bg-[#25292D] rounded-xl h-11">
              <Link href="/admin/login">
                <BackArrow className="h-4 w-4" />
                {t('auth.backToLogin')}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 3. Success State
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 text-[#155A82] dark:text-[#F5F7F8] dark:bg-[#111315]" dir={dir}>
        <Card className="w-full max-w-md border border-white/60 bg-white/50 backdrop-blur-[20px] shadow-[0_20px_50px_rgba(36,119,168,0.12)] text-[#155A82] dark:border-[#343A40] dark:bg-[#191C1F] dark:text-[#F5F7F8] rounded-2xl">
          <CardHeader className="text-center space-y-3 pt-8">
            <div className="h-14 w-14 rounded-2xl bg-[#2BA8A2]/15 text-[#2BA8A2] border border-[#2BA8A2]/30 dark:bg-[#10B981]/15 dark:text-[#10B981] dark:border-[#10B981]/30 mx-auto flex items-center justify-center">
              <CheckCircle2 className="h-7 w-7 stroke-[1.8]" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-[#155A82] dark:text-[#F5F7F8]">{t('auth.passwordResetSuccess')}</CardTitle>
              <CardDescription className="mt-1.5 text-sm text-[#2477A8] dark:text-[#A7ADB4]">
                {t('admin.passwordChanged')}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pb-8">
            <Button asChild className="w-full gap-2 bg-[#2BA8A2] hover:bg-[#2BA8A2]/90 dark:bg-[#10B981] dark:hover:bg-[#22C55E] text-white shadow-sm font-semibold h-11 rounded-xl">
              <Link href="/admin/login">
                <BackArrow className="h-4 w-4" />
                {t('auth.backToLogin')}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 4. Reset Password Form
  return (
    <div className="min-h-screen flex items-center justify-center p-4 text-[#155A82] dark:text-[#F5F7F8] dark:bg-[#111315]" dir={dir}>
      <Card className="w-full max-w-md border border-white/60 bg-white/50 backdrop-blur-[20px] shadow-[0_20px_50px_rgba(36,119,168,0.12)] text-[#155A82] dark:border-[#343A40] dark:bg-[#191C1F] dark:text-[#F5F7F8] rounded-2xl">
        <CardHeader className="text-center space-y-3 pt-8">
          <div className="h-14 w-14 rounded-2xl bg-[#2BA8A2]/15 text-[#2BA8A2] border border-[#2BA8A2]/30 dark:bg-[#10B981]/15 dark:text-[#10B981] dark:border-[#10B981]/30 mx-auto flex items-center justify-center">
            <KeyRound className="h-7 w-7 stroke-[1.8]" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-[#155A82] dark:text-[#F5F7F8]">{t('auth.resetPasswordTitle')}</CardTitle>
            <CardDescription className="mt-1.5 text-sm text-[#2477A8] dark:text-[#A7ADB4]">
              {t('auth.resetPasswordDesc')}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password */}
            <div className="space-y-1.5">
              <Label htmlFor="newPassword" className="text-sm font-medium text-[#155A82] dark:text-[#F5F7F8]">{t('auth.newPassword')}</Label>
              <div className="relative">
                <Lock className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 h-4 w-4 text-[#2477A8]/70 dark:text-[#737A82] stroke-[1.8]" />
                <Input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  required
                  minLength={8}
                  placeholder="••••••••"
                  className="ltr:pl-10 ltr:pr-10 rtl:pr-10 rtl:pl-10"
                  disabled={submitting}
                  autoFocus
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 -translate-y-1/2 ltr:right-3 rtl:left-3 text-[#2477A8]/70 dark:text-[#737A82] hover:text-[#155A82] dark:hover:text-[#F5F7F8] transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="h-4 w-4 stroke-[1.8]" /> : <Eye className="h-4 w-4 stroke-[1.8]" />}
                </button>
              </div>
              <p className="text-xs text-[#2477A8]/80 dark:text-[#737A82]">{t('auth.passwordLengthError')}</p>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-[#155A82] dark:text-[#F5F7F8]">{t('auth.confirmPassword')}</Label>
              <div className="relative">
                <Lock className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 h-4 w-4 text-[#2477A8]/70 dark:text-[#737A82] stroke-[1.8]" />
                <Input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  required
                  minLength={8}
                  placeholder="••••••••"
                  className="ltr:pl-10 ltr:pr-10 rtl:pr-10 rtl:pl-10"
                  disabled={submitting}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute top-1/2 -translate-y-1/2 ltr:right-3 rtl:left-3 text-[#2477A8]/70 dark:text-[#737A82] hover:text-[#155A82] dark:hover:text-[#F5F7F8] transition-colors p-1"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4 stroke-[1.8]" /> : <Eye className="h-4 w-4 stroke-[1.8]" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl p-3">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting || !newPassword || !confirmPassword}
              className="w-full gap-2 bg-[#2BA8A2] hover:bg-[#2BA8A2]/90 dark:bg-[#10B981] dark:hover:bg-[#22C55E] text-white shadow-sm font-semibold h-11 rounded-xl"
            >
              <Shield className="h-4 w-4 stroke-[1.8]" />
              {submitting ? t('common.loading') : t('auth.changePasswordBtn')}
            </Button>

            <div className="text-center pt-2">
              <Link
                href="/admin/login"
                className="inline-flex items-center gap-1.5 text-sm text-[#2BA8A2] dark:text-[#10B981] hover:underline"
              >
                <BackArrow className="h-3.5 w-3.5" />
                {t('auth.backToLogin')}
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
