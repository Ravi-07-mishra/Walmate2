import AuthForm from '@/components/auth-form';

export default function SignupPage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-4">
      <AuthForm type="signup" />
    </div>
  );
}
