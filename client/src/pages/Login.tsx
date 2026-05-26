import { apiFetch } from '../utils/api';
import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import Spinner from '../components/Spinner';
import AuthLayout from '../components/AuthLayout';
import { Eye, EyeOff } from 'lucide-react';

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const GithubIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
  </svg>
)

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Both fields are required');
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiFetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const user = await response.json();
        login(user);
        navigate('/dashboard');
      } else {
        const data = await response.json();
        setError(data.error || 'Invalid email or password');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mb-8 text-center sm:text-left">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Log in</h2>
        <p className="text-gray-500 text-sm">Welcome back! Please enter your details.</p>
      </div>

      <div className="flex gap-4 mb-6">
        <button
          type="button"
          className="flex-1 flex justify-center items-center gap-2.5 py-3 px-4 rounded-lg text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 transition-colors font-medium text-sm"
        >
          <GoogleIcon />
          Google
        </button>
        <button
          type="button"
          className="flex-1 flex justify-center items-center gap-2.5 py-3 px-4 rounded-lg text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 transition-colors font-medium text-sm"
        >
          <GithubIcon />
          Github
        </button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 h-px bg-gray-200"></div>
        <span className="text-gray-400 text-sm">Or</span>
        <div className="flex-1 h-px bg-gray-200"></div>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {error && (
          <div className="text-red-400 text-sm font-medium bg-red-900/20 p-3 rounded-lg border border-red-900/50">
            {error}
          </div>
        )}
        
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] text-sm outline-none transition-colors text-gray-900 font-medium placeholder:text-gray-400 placeholder:font-normal"
            placeholder="e.g. johnfrans@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] text-sm pr-10 outline-none transition-colors text-gray-900 font-medium placeholder:text-gray-400 placeholder:font-normal"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div className="flex justify-end pt-1">
            <Link to="/forgot-password" className="text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors">
              Forgot password?
            </Link>
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-lg text-white bg-[#1A1A1A] hover:bg-[#252525] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors font-medium text-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading && <Spinner size={16} className="text-white" />}
            Log In
          </button>
        </div>
        
        <div className="text-center mt-6 text-[13px] text-gray-600">
          Don't have an account? <Link to="/register" className="font-semibold text-gray-900 hover:underline">Sign up</Link>
        </div>
        
        <div className="sm:hidden text-center mt-6">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Back to Home
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}

