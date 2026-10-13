import React from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import ResetPassword from '../components/ResetPassword';

/** Landing page for the emailed link: /reset-password?uid=<uidb64>&token=<token>. */
const ResetPasswordPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const uidb64 = params.get('uid');
  const token = params.get('token');

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      {uidb64 && token ? (
        <ResetPassword uidb64={uidb64} token={token} onDone={() => setTimeout(() => navigate('/login'), 1500)} />
      ) : (
        <p role="alert">
          This reset link is incomplete.{' '}
          <Link to="/login" className="text-primary underline">
            Back to sign in
          </Link>
        </p>
      )}
    </div>
  );
};

export default ResetPasswordPage;
