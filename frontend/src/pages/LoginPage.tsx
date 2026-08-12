import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout';
import { LoginForm } from '@/components/auth/LoginForm';
import { APP_NAME } from '@/lib/constants';

/**
 * Sign-in page — shared split-screen shell (imagery + stats band) around the
 * login form.
 */
export function LoginPage() {
  return (
    <AuthSplitLayout
      heading="Welcome back"
      subheading={`Sign in to continue to ${APP_NAME} and pick up where your Nest left off.`}
    >
      <LoginForm />
    </AuthSplitLayout>
  );
}
