import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const LoginPage = () => {
  useDocumentTitle('Login');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading, error } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <div className="hero min-h-screen bg-sky-50">
      <div className="hero-content flex-col lg:flex-row-reverse w-full max-w-7xl">
        {/* Right side - Image Grid */}
        <div className="hidden lg:flex lg:w-1/2 gap-3">
          {/* Column 1 */}
          <div className="flex-1 grid grid-cols-1 gap-3">
            <div className="h-48 rounded-3xl overflow-hidden shadow-lg">
              <img
                src="/flight1.jpg"
                alt="Travel 1"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="h-56 rounded-3xl overflow-hidden shadow-lg">
              <img
                src="/flight2.avif"
                alt="Travel 2"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="h-40 rounded-3xl overflow-hidden shadow-lg">
              <img
                src="/flight3.jpg"
                alt="Travel 3"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          {/* Column 2 */}
          <div className="flex-1 grid grid-cols-1 gap-3">
            <div className="h-56 rounded-3xl overflow-hidden shadow-lg">
              <img
                src="/flight4.webp"
                alt="Travel 4"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="h-40 rounded-3xl overflow-hidden shadow-lg">
              <img
                src="/flight5.jpg"
                alt="Travel 5"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="h-48 rounded-3xl overflow-hidden shadow-lg">
              <img
                src="/flight6.jpg"
                alt="Travel 6"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Left side - Login Form */}
        <div className="lg:w-1/2">
          <div className="text-center lg:text-left mb-8">
            <h1 className="text-5xl font-bold">Login now!</h1>
            <p className="py-6">
              Access your bookings, manage your profile, and more.
            </p>
          </div>
          <div className="card bg-white w-full max-w-sm mx-auto shadow-2xl border border-gray-200">
          <form className="card-body" onSubmit={handleSubmit}>
            {error && (
              <div className="alert alert-error">
                <span>{error}</span>
              </div>
            )}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                placeholder="email"
                className="input input-bordered"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Password</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="password"
                  className="input input-bordered w-full pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  disabled={loading}
                >
                  {showPassword ? (
                    <FaEyeSlash className="h-5 w-5" />
                  ) : (
                    <FaEye className="h-5 w-5" />
                  )}
                </button>
              </div>
              <label className="label">
                <Link to="/forgot-password" className="label-text-alt link link-hover">
                  Forgot password?
                </Link>
              </label>
            </div>
            <div className="form-control mt-6">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </div>
            <div className="text-center mt-4">
              <span className="text-sm">
                Don't have an account?{' '}
                <Link to="/register" className="link link-primary">
                  Register
                </Link>
              </span>
            </div>
          </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
