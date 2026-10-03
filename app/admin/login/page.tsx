'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth, useLanguage } from '@/contexts/app-context';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const { signIn, session, loading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && session) router.push('/admin');
  }, [session, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    console.info('[Admin Login] submitting credentials', {
      pathname: window.location.pathname,
      hasEmail: !!email,
      hasPassword: !!password,
    });

    try {
      const { error } = await signIn(email, password);

      console.info('[Admin Login] signIn response', {
        pathname: window.location.pathname,
        error: error ?? null,
      });

      if (error) {
        toast.error(error);
        return;
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.info('[Admin Login] post-login session check', {
        pathname: window.location.pathname,
        hasSession: !!sessionData?.session,
        hasUser: !!sessionData?.session?.user,
        userId: sessionData?.session?.user?.id ?? null,
        sessionError: sessionError?.message ?? null,
      });

      if (sessionData?.session?.user) {
        toast.success(t('admin.dashboard'));
        router.push('/admin');
        return;
      }

      toast.error('Login succeeded but the session was not available yet. Please try again.');
    } catch (error) {
      console.error('[Admin Login] login flow crashed', error);
      toast.error('Unexpected login error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 text-[#155A82] dark:text-[#F5F7F8] dark:bg-[#111315]">
      <Card className="w-full max-w-md border border-white/60 bg-white/50 backdrop-blur-[20px] shadow-[0_20px_50px_rgba(36,119,168,0.12)] text-[#155A82] dark:border-[#343A40] dark:bg-[#191C1F] dark:text-[#F5F7F8] rounded-2xl">
        <CardHeader className="text-center space-y-4 pt-8">
          <div className="h-16 w-16 rounded-2xl bg-[#2BA8A2]/15 border border-[#2BA8A2]/30 dark:bg-[#10B981]/15 dark:border-[#10B981]/30 mx-auto flex items-center justify-center text-[#2BA8A2] dark:text-[#10B981]">
            <Shield className="h-8 w-8 stroke-[1.8]" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-[#155A82] dark:text-[#F5F7F8]">{t('admin.login')}</CardTitle>
            <CardDescription className="mt-2 text-[#2477A8] dark:text-[#A7ADB4]">{t('admin.dashboard')}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-[#155A82] dark:text-[#F5F7F8] mb-1.5 block">{t('admin.email')}</label>
              <div className="relative">
                <Mail className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 h-4 w-4 text-[#2477A8]/70 dark:text-[#737A82] stroke-[1.8]" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="ltr:pl-10 rtl:pr-10"
                  placeholder="admin@example.com"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-[#155A82] dark:text-[#F5F7F8] mb-1.5 block">{t('admin.password')}</label>
              <div className="relative">
                <Lock className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 h-4 w-4 text-[#2477A8]/70 dark:text-[#737A82] stroke-[1.8]" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="ltr:pl-10 rtl:pr-10 pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 -translate-y-1/2 ltr:right-3 rtl:left-3 text-[#2477A8]/70 dark:text-[#737A82] hover:text-[#155A82] dark:hover:text-[#F5F7F8] transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="h-4 w-4 stroke-[1.8]" /> : <Eye className="h-4 w-4 stroke-[1.8]" />}
                </button>
              </div>
            </div>
            <Button type="submit" disabled={submitting} className="w-full bg-[#2BA8A2] hover:bg-[#2BA8A2]/90 dark:bg-[#10B981] dark:hover:bg-[#22C55E] text-white shadow-sm font-semibold h-11 rounded-xl">
              {submitting ? t('common.loading') : t('admin.login')}
            </Button>

            <div className="text-center pt-2">
              <Link
                href="/forgot-password"
                className="text-sm text-[#2BA8A2] dark:text-[#10B981] hover:underline transition-colors"
              >
                {t('admin.forgotPassword')}
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
