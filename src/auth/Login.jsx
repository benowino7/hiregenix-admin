// src/pages/Login.jsx
import React, { useState } from 'react';
import logo from '../assets/logo.png';
import logodark from '../assets/logodark.png';
import { useTheme } from '../themes/ThemeContext';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Moon, Sun } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { BASE_URL } from '../BaseUrl';
import successMessage from '../utilities/successMessage';
import ErrorMessage from '../utilities/ErrorMessage';
import officeImg from '../assets/office.jpg';

const Login = () => {
  const { isDark, toggleTheme } = useTheme();
  const navigation = useNavigate('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [twoFactorStep, setTwoFactorStep] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [twoFACode, setTwoFACode] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.target);
    const formDatajson = Object.fromEntries(formData);
    handlePostLogin(formDatajson);
  };
  const handlePostLogin = async (formDatajson) => {
    try {
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formDatajson),
      });
      const data = await response.json();
      if (!response.ok) {
        ErrorMessage(
          data?.errors?.[0]?.message ||
          data?.message ||
          'Login failed'
        );
        setIsLoading(false);
        return;
      }

      // Check if 2FA is required
      if (data.requires2FA) {
        setTempToken(data.tempToken);
        setTwoFactorStep(true);
        setIsLoading(false);
        return;
      }

      sessionStorage.setItem('accessToken', JSON.stringify(data?.data?.token));
      sessionStorage.setItem('user', JSON.stringify(data?.data));
      setIsLoading(false);
      successMessage(data?.message || 'Login successful!');
      setTimeout(() => {
        navigation('/dashboard', { replace: true });
      }, 1000);
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    if (twoFACode.length !== 6) {
      ErrorMessage('Please enter a 6-digit code');
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/auth/verify-login-2fa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, code: twoFACode }),
      });
      const data = await response.json();
      if (!response.ok) {
        ErrorMessage(data?.message || 'Verification failed');
        setIsLoading(false);
        return;
      }
      sessionStorage.setItem('accessToken', JSON.stringify(data?.data?.token));
      sessionStorage.setItem('user', JSON.stringify(data?.data));
      setIsLoading(false);
      successMessage(data?.message || 'Login successful!');
      setTimeout(() => {
        navigation('/dashboard', { replace: true });
      }, 1000);
    } catch (error) {
      console.error('2FA verification error:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4 transition-colors duration-300 relative">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="absolute top-6 right-6 p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      <div className="w-full max-w-6xl grid md:grid-cols-2 overflow-hidden rounded-2xl shadow-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">

        {/* LEFT: Login Form */}
        <div className="p-8 md:p-12 lg:p-16 flex flex-col justify-center">
          {/* Brand */}
          <div className="mb-10 text-center md:text-left">
            <div className="inline-block">
              <img src={isDark ? logodark : logo} alt="RatchetUp" className="w-[180px] sm:w-[200px] h-auto" />
            </div>
            <p className="mt-3 text-gray-600 dark:text-gray-400">
              {twoFactorStep
                ? 'Enter the 6-digit code from your authenticator app.'
                : "Welcome back! Let's get you to your next opportunity."}
            </p>
          </div>

          {twoFactorStep ? (
            /* 2FA Verification Step */
            <form onSubmit={handleVerify2FA} className="space-y-6">
              <div>
                <label htmlFor="twoFACode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Authenticator Code
                </label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    id="twoFACode"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={twoFACode}
                    onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition text-center text-2xl tracking-[0.5em] font-mono"
                    placeholder="000000"
                    autoFocus
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading || twoFACode.length !== 6}
                className={`
                  w-full py-3.5 px-6 rounded-xl font-medium text-white flex items-center justify-center gap-2 transition-all
                  ${isLoading || twoFACode.length !== 6
                    ? 'bg-teal-400 cursor-not-allowed'
                    : 'bg-teal-500 hover:bg-teal-600 active:bg-teal-700 shadow-md hover:shadow-lg'
                  }
                `}
              >
                {isLoading ? 'Verifying...' : <>Verify & Sign In <ArrowRight size={18} /></>}
              </button>
              <button
                type="button"
                onClick={() => { setTwoFactorStep(false); setTwoFACode(''); setTempToken(''); }}
                className="w-full text-sm text-gray-500 dark:text-gray-400 hover:text-teal-500 dark:hover:text-teal-400 transition"
              >
                Back to login
              </button>
            </form>
          ) : (
          <>
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  id="email"
                  type="email"
                  name='email'
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name='password'
                  required
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className={`
                w-full py-3.5 px-6 rounded-xl font-medium text-white flex items-center justify-center gap-2 transition-all
                ${isLoading
                  ? 'bg-teal-400 cursor-not-allowed'
                  : 'bg-teal-500 hover:bg-teal-600 active:bg-teal-700 shadow-md hover:shadow-lg'
                }
              `}
            >
              {isLoading ? 'Signing in...' : <>Sign In <ArrowRight size={18} /></>}
            </button>
          </form>

          <div className="mt-8 text-center text-sm space-y-3">
            <div>
              <a href="/forgot-password" className="text-teal-600 dark:text-teal-400 hover:underline font-medium">
                Forgot your password?
              </a>
            </div>
          </div>
          </>
          )}
        </div>

        {/* RIGHT: Motivational Visual + Text */}
        <div className="hidden md:block relative bg-[#FAFBFC] dark:bg-gray-900 overflow-hidden">
          {/* Background image with overlay */}
          <div className="absolute inset-0">
            <img
              src={officeImg}
              alt="Motivated professional in modern office"
              className="w-full h-full object-cover opacity-30 dark:opacity-20"
            />
            <div className="absolute inset-0 bg-white/80 dark:bg-gray-950/80" />
          </div>

          {/* Content overlay */}
          <div className="relative h-full flex flex-col justify-center px-12 lg:px-16 text-center">
            <div className="max-w-md mx-auto">
              <h2 className="text-3xl lg:text-4xl font-bold mb-6 text-gray-900 dark:text-white leading-tight">
                Your dream job in Dubai is waiting
              </h2>
              <p className="text-lg text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
                One login away from new opportunities, career growth, and a brighter future.
              </p>
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-teal-500/10 dark:bg-teal-600/20 rounded-full text-teal-600 dark:text-teal-400 font-medium">
                <span>✨</span> Start your journey today
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;