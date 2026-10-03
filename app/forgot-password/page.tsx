  'use client';

  import { useState } from 'react';
  import Link from 'next/link';
  import { supabase } from '@/lib/supabase';
  import { useLanguage } from '@/contexts/app-context';
  import { Mail, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
  import { Button } from '@/components/ui/button';
  import { Input } from '@/components/ui/input';
  import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
  import { toast } from 'sonner';

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  export default function ForgotPasswordPage() {
    const { t, dir } = useLanguage();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMessage(null);

      const trimmedEmail = email.trim();

      if (!trimmedEmail) {
        setErrorMessage(t('auth.invalidEmail'));
        return;
      }

      if (!EMAIL_REGEX.test(trimmedEmail)) {
        setErrorMessage(t('auth.invalidEmail'));
        return;
      }

      if (loading) return; // Prevent repeated clicks

      setLoading(true);

      try {
        const redirectUrl = `${window.location.origin}/reset-password`;

        const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
          redirectTo: redirectUrl,
        });

        if (error) {
          console.error('Password reset request error:', error.message);
        }

        // Always show success to prevent email / user enumeration
        setSubmitted(true);
        toast.success(t('auth.forgotPasswordSuccess'));
      } catch (err) {
        console.error('Unexpected reset error:', err);
        // Still display standard message safely
        setSubmitted(true);
      } finally {
        setLoading(false);
      }
    };

    const BackArrow = dir === 'rtl' ? ArrowRight : ArrowLeft;

    return (
      <div className="min-h-screen flex items-center justify-center p-4 text-[#155A82] dark:text-[#F5F7F8] dark:bg-[#111315]" dir={dir}>
        <Card className="w-full max-w-md border border-white/60 bg-white/50 backdrop-blur-[20px] shadow-[0_20px_50px_rgba(36,119,168,0.12)] text-[#155A82] dark:border-[#343A40] dark:bg-[#191C1F] dark:text-[#F5F7F8] rounded-2xl">
          <CardHeader className="text-center space-y-3 pt-8">
            <div className="h-14 w-14 rounded-2xl bg-[#2BA8A2]/15 text-[#2BA8A2] border border-[#2BA8A2]/30 dark:bg-[#10B981]/15 dark:text-[#10B981] dark:border-[#10B981]/30 mx-auto flex items-center justify-center">
              <ShieldCheck className="h-7 w-7 stroke-[1.8]" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-[#155A82] dark:text-[#F5F7F8]">{t('auth.forgotPasswordTitle')}</CardTitle>
              <CardDescription className="mt-1.5 text-sm text-[#2477A8] dark:text-[#A7ADB4]">
                {t('auth.forgotPasswordDesc')}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="pb-8">
            {submitted ? (
              <div className="space-y-5 text-center py-2">
                <div className="h-12 w-12 rounded-full bg-[#2BA8A2]/15 text-[#2BA8A2] border border-[#2BA8A2]/30 dark:bg-[#10B981]/15 dark:text-[#10B981] dark:border-[#10B981]/30 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 stroke-[1.8]" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-[#2477A8] dark:text-[#A7ADB4] leading-relaxed">
                    {t('auth.forgotPasswordSuccess')}
                  </p>
                </div>
                <div className="pt-2 flex flex-col gap-2">
                  <Button variant="outline" asChild className="w-full">
                    <Link href="/admin/login" className="flex items-center justify-center gap-2 text-[#155A82] dark:text-[#F5F7F8]">
                      <BackArrow className="h-4 w-4" />
                      {t('auth.backToLogin')}
                    </Link>
                  </Button>
                  <Button variant="ghost" asChild className="w-full text-xs text-[#2477A8]/80 hover:text-[#155A82] dark:text-[#737A82] dark:hover:text-[#F5F7F8]">
                    <Link href="/">
                      {t('auth.backToHome')}
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-sm font-medium text-[#155A82] dark:text-[#F5F7F8] block">
                    {t('admin.email')}
                  </label>
                  <div className="relative">
                    <Mail className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 h-4 w-4 text-[#2477A8]/70 dark:text-[#737A82] stroke-[1.8]" />
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      autoFocus
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder="you@example.com"
                      className="ltr:pl-10 rtl:pr-10"
                      disabled={loading}
                    />
                  </div>
                </div>

                {errorMessage && (
                  <div className="flex items-center gap-2 text-sm text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl p-3">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <Button type="submit" disabled={loading || !email.trim()} className="w-full gap-2 bg-[#2BA8A2] hover:bg-[#2BA8A2]/90 dark:bg-[#10B981] dark:hover:bg-[#22C55E] text-white shadow-sm font-semibold h-11 rounded-xl">
                  <Mail className="h-4 w-4" />
                  {loading ? t('common.loading') : t('auth.sendResetLink')}
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
            )}
          </CardContent>
        </Card>
      </div>
    );
  }
