import { apiFetch } from '../utils/api';
import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User } from '../types';
import Spinner from '../components/Spinner';
import AuthLayout from '../components/AuthLayout';
import { Eye, EyeOff, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ForgotPassword() {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [userIdToReset, setUserIdToReset] = useState<string | null>(null);

  const handleVerifyEmail = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Email address is required');
      return;
    }

    setIsLoading(true);

    try {
      const res = await apiFetch('/api/users');
      const users: User[] = res.ok ? await res.json() : [];
      
      const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (foundUser) {
        setUserIdToReset(foundUser.id);
        setStep(2);
      } else {
        setError('No account found with this email address');
      }
    } catch (err) {
      setError('Failed to verify email');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newPassword || !confirmPassword) {
      setError('Both password fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!userIdToReset) {
      setError('Something went wrong, please try again later.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiFetch(`/api/users/${userIdToReset}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword })
      });

      if (response.ok) {
        setSuccess(true);
      } else {
        setError('Failed to reset password');
      }
    } catch (err) {
      setError('Failed to reset password');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mb-8 text-center sm:text-left">
        {!success && (
          <div className="hidden sm:block mb-6">
            {step === 1 ? (
              <Link to="/login" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                <ArrowLeft size={16} className="mr-1" />
                Back to login
              </Link>
            ) : (
              <button 
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors focus:outline-none"
              >
                <ArrowLeft size={16} className="mr-1" />
                Back
              </button>
            )}
          </div>
        )}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {success ? 'Password Reset Complete' : step === 1 ? 'Forgot Password?' : 'Reset Password'}
        </h2>
        <p className="text-gray-500 text-sm">
          {success 
            ? 'Your password has been changed successfully.' 
            : step === 1 
              ? 'Enter your email address to reset your password.' 
              : 'Enter your new password below.'}
        </p>
      </div>

      <div className="relative">
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={32} />
              </div>
              <Link 
                to="/login"
                className="w-full flex justify-center items-center py-3.5 px-4 rounded-lg text-white bg-[#1A1A1A] hover:bg-[#252525] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors font-medium text-sm"
              >
                Return to Login
              </Link>
            </motion.div>
          ) : step === 1 ? (
            <motion.form 
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4" 
              onSubmit={handleVerifyEmail}
            >
              {error && (
                <div className="text-red-600 text-sm font-medium bg-red-50 p-3 rounded-lg border border-red-100">
                  {error}
                </div>
              )}
              
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] text-sm outline-none transition-colors text-gray-900 font-medium placeholder:text-gray-400 placeholder:font-normal"
                  placeholder="e.g. johnfrans@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-lg text-white bg-[#1A1A1A] hover:bg-[#252525] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors font-medium text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading && <Spinner size={16} className="text-white" />}
                  Continue
                </button>
              </div>

              <div className="sm:hidden flex flex-col items-center gap-4 mt-6">
                <Link to="/login" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Back to Login</Link>
                <Link to="/" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Back to Home</Link>
              </div>
            </motion.form>
          ) : (
            <motion.form 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4" 
              onSubmit={handleResetPassword}
            >
              {error && (
                <div className="text-red-600 text-sm font-medium bg-red-50 p-3 rounded-lg border border-red-100">
                  {error}
                </div>
              )}
              
              <div className="space-y-1.5">
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">New Password</label>
                <div className="relative">
                  <input
                    id="newPassword"
                    name="newPassword"
                    type={showPassword ? "text" : "password"}
                    required
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] text-sm pr-10 outline-none transition-colors text-gray-900 font-medium placeholder:text-gray-400 placeholder:font-normal"
                    placeholder="Enter your new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none disabled:opacity-50"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm Password</label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    required
                    className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] text-sm pr-10 outline-none transition-colors text-gray-900 font-medium placeholder:text-gray-400 placeholder:font-normal"
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-lg text-white bg-[#1A1A1A] hover:bg-[#252525] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors font-medium text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading && <Spinner size={16} className="text-white" />}
                  Reset Password
                </button>
              </div>

              <div className="sm:hidden flex flex-col items-center gap-4 mt-6">
                <button type="button" onClick={() => setStep(1)} className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Back</button>
                <Link to="/" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Back to Home</Link>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </AuthLayout>
  );
}
