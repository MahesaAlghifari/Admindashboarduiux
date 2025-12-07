import React, { useState } from 'react';
import { GraduationCap, Mail, Lock, Eye, EyeOff } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

export function Login({ onLogin }: LoginProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate login
    onLogin();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#E94640] to-[#DA393C]">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="card p-8">
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 brand-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <GraduationCap className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-[#0F172A]">Sistem Admin PAUD</h2>
            <p className="text-[#64748B] mt-2">Yayasan Suci Sutjipto</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div>
              <label className="block mb-2">Email / Username</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E94640]/20 focus:border-[#E94640]"
                  placeholder="Masukkan email atau username"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E94640]/20 focus:border-[#E94640]"
                  placeholder="Masukkan password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#E94640] transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-[#E5E7EB] text-[#E94640] focus:ring-[#E94640]"
                />
                <span className="text-[#334155]">Ingat saya</span>
              </label>
              <button
                type="button"
                className="text-[#E94640] hover:underline"
              >
                Lupa Password?
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className="w-full btn-gradient py-3 rounded-lg transition-all hover:scale-[1.02]"
            >
              Masuk
            </button>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-[#F6F7F9] rounded-lg border border-[#E5E7EB]">
              <p className="text-[#64748B] mb-2">Demo Credentials:</p>
              <div className="space-y-1">
                <p className="text-[#334155]">
                  <strong>Admin:</strong> admin@paudsuci.sch.id
                </p>
                <p className="text-[#334155]">
                  <strong>Guru:</strong> rina.wulandari@paudsuci.sch.id
                </p>
                <p className="text-[#334155]">
                  <strong>Password:</strong> password123
                </p>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center mt-6 text-white/80">
          © 2024 PAUD Yayasan Suci Sutjipto. All rights reserved.
        </p>
      </div>
    </div>
  );
}
