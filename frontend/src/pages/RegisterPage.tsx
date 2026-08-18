import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout';
import { RegisterForm } from '@/components/auth/RegisterForm';

/**
 * Account creation page — shared split-screen shell (imagery + stats band)
 * around the registration form.
 */
export function RegisterPage() {
  return (
    <AuthSplitLayout heading="Create your account">
      <RegisterForm />
    </AuthSplitLayout>
  );
}
