import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

/**
 * Password recovery page — shared split-screen shell around the multi-step
 * email-code + new-password flow.
 */
export function ForgotPasswordPage() {
  return (
    <AuthSplitLayout heading="Reset your password" subheading="Verify it's you with a code, then set a new password.">
      <ForgotPasswordForm />
    </AuthSplitLayout>
  );
}

export default ForgotPasswordPage;
