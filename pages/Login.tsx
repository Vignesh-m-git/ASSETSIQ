import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, Loader2, Eye, EyeOff, CheckCircle2, ShieldCheck, Zap, Database, Info, FileText, Check, X, HelpCircle } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Password Validation State
  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    upper: false,
    lower: false,
    number: false,
    special: false
  });
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    // Validate password in real-time
    setPasswordCriteria({
      length: password.length >= 12,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)
    });
  }, [password]);

  // Test Supabase connection on component mount
  useEffect(() => {
    const testConnection = async () => {
      console.log('=== Supabase Connection Test ===');
      console.log('SUPABASE_URL:', process.env.SUPABASE_URL || 'MISSING');
      console.log('SUPABASE_KEY:', process.env.SUPABASE_KEY ? 'SET (length: ' + process.env.SUPABASE_KEY.length + ')' : 'MISSING');

      try {
        const { data, error } = await supabase.auth.getSession();
        console.log('✓ Connection successful');
        console.log('Current session:', data.session ? 'Logged in' : 'Not logged in');
        if (error) console.error('Session error:', error);
      } catch (err) {
        console.error('✗ Connection failed:', err);
      }
    };

    testConnection();
  }, []);

  const isPasswordValid = Object.values(passwordCriteria).every(Boolean);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Client-side validation check before submission
    // Temporarily disabled to allow login with existing passwords
    // if (!isPasswordValid && process.env.SUPABASE_URL) {
    //   setError("Password does not meet complexity requirements.");
    //   setLoading(false);
    //   return;
    // }





    try {
      console.log('=== Login Attempt ===');
      console.log('Email:', email);
      console.log('Password length:', password.length);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('Login response:', { data, error });

      if (error) {
        console.error('Login error details:', error);
        throw error;
      }

      console.log('✓ Login successful!');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login failed:', err);
      setError(err.message || 'Failed to login');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white relative">

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <HelpCircle className="w-5 h-5 mr-2 text-blue-600" />
                Support & Access
              </h3>
              <button onClick={() => setShowHelpModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 text-sm text-gray-600 space-y-4">
              <p>
                <strong>Admin Access:</strong> This system is restricted to authorized personnel only.
                Self-registration is disabled.
              </p>
              <p>
                <strong>Forgot Password?</strong> Please contact your IT Systems Administrator to request a credential reset.
              </p>
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mt-4">
                <p className="text-blue-800 font-medium">System Administrator</p>
                <p className="text-blue-600 mt-1">support@assetiq.com</p>
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 text-right">
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-700 hover:bg-gray-100 text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Left Section: Login Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 relative z-10">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="flex items-center gap-2 mb-10">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Database className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900 tracking-tight">ASSETIQ</span>
          </div>

          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Welcome back</h2>
            <p className="mt-2 text-sm text-gray-600">
              Sign in to manage your IT asset intelligence platform.
            </p>
          </div>

          <div className="mt-8">
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white text-gray-900 placeholder:text-gray-400 focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-3 border"
                    placeholder="admin@company.com"
                  />
                </div>
              </div>

              <div className="relative">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 flex items-center">
                  Password
                  <div className="group relative ml-2">
                    <Info className="w-4 h-4 text-gray-400 cursor-help" />
                    {/* Password Policy Tooltip (Hover) */}
                    <div className="absolute left-6 bottom-0 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                      <p className="font-semibold mb-2">Password Requirements:</p>
                      <ul className="space-y-1">
                        <li className="flex items-center">12+ Characters</li>
                        <li className="flex items-center">Uppercase & Lowercase</li>
                        <li className="flex items-center">Number (0-9)</li>
                        <li className="flex items-center">Special Character (!@#...)</li>
                      </ul>
                    </div>
                  </div>
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white text-gray-900 placeholder:text-gray-400 focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-10 sm:text-sm border-gray-300 rounded-lg py-3 border"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                {/* Password Criteria Popover (Visible when typing) */}
                {isPasswordFocused && (
                  <div className="absolute z-20 top-full mt-2 left-0 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-3 animate-in fade-in slide-in-from-top-2">
                    <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">Security Check</p>
                    <ul className="space-y-1">
                      <RequirementItem met={passwordCriteria.length} text="At least 12 characters" />
                      <RequirementItem met={passwordCriteria.upper} text="One uppercase letter" />
                      <RequirementItem met={passwordCriteria.lower} text="One lowercase letter" />
                      <RequirementItem met={passwordCriteria.number} text="One number" />
                      <RequirementItem met={passwordCriteria.special} text="One special character" />
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded bg-white"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                    Remember me
                  </label>
                </div>


                <div className="text-sm">
                  <Link
                    to="/forgot-password"
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 p-4 border border-red-100 animate-in slide-in-from-top-2">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <ShieldCheck className="h-5 w-5 text-red-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">{error}</h3>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading || (process.env.SUPABASE_URL ? !isPasswordValid : false)}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Authenticating...
                    </span>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </div>
            </form>


          </div>

          <div className="mt-10 border-t border-gray-100 pt-6">
            <p className="text-xs text-center text-gray-400">
              &copy; {new Date().getFullYear()} ASSETIQ Inc. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Right Section: Feature Showcase */}
      <div className="hidden lg:flex lg:flex-1 relative bg-gray-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-slate-900 opacity-90"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-20"></div>

        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-blue-500 opacity-10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-indigo-500 opacity-10 blur-3xl"></div>

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-24 w-full text-white">
          <h1 className="text-4xl font-bold mb-6 leading-tight">
            Unleash the power of <br />
            <span className="text-blue-400">AI-driven Asset Intelligence</span>
          </h1>
          <p className="text-lg text-blue-100 mb-12 max-w-lg leading-relaxed">
            Transform messy HTML reports and unstructured data into clean, actionable inventory insights in seconds.
          </p>

          <div className="space-y-8">
            <div className="flex items-start">
              <div className="flex-shrink-0 p-3 bg-white/10 rounded-lg backdrop-blur-sm border border-white/10">
                <Zap className="w-6 h-6 text-yellow-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold">AssetIQ AI Assistant</h3>
                <p className="text-sm text-gray-300 mt-1">High-speed extraction logic that understands complex nested layouts.</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 p-3 bg-white/10 rounded-lg backdrop-blur-sm border border-white/10">
                <FileText className="w-6 h-6 text-green-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold">Bulk Processing</h3>
                <p className="text-sm text-gray-300 mt-1">Upload 50+ HTML reports at once and watch them convert to CSV instantly.</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 p-3 bg-white/10 rounded-lg backdrop-blur-sm border border-white/10">
                <ShieldCheck className="w-6 h-6 text-blue-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold">Secure & Reliable</h3>
                <p className="text-sm text-gray-300 mt-1">Enterprise-grade authentication powered by Supabase security protocols.</p>
              </div>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-white/10">
            <div className="flex items-center space-x-2 text-sm font-medium text-blue-200">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span>v1.0.3 Stable Release</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const RequirementItem: React.FC<{ met: boolean; text: string }> = ({ met, text }) => (
  <li className={`flex items-center text-xs ${met ? 'text-green-600' : 'text-gray-400'}`}>
    {met ? <Check className="w-3 h-3 mr-1.5" /> : <div className="w-3 h-3 mr-1.5 rounded-full border border-gray-300"></div>}
    {text}
  </li>
);

export default Login;