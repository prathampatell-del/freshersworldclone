import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, User, Briefcase } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';

interface FormState {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirm: string;
}

type FieldErrors = Partial<Record<keyof FormState, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 6;

function validate(form: FormState): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.name.trim()) errors.name = 'Please enter your name';
  if (!form.email.trim()) errors.email = 'Email is required';
  else if (!EMAIL_RE.test(form.email)) errors.email = 'Enter a valid email';
  if (form.phone && !/^\+?\d[\d\s-]{6,15}$/.test(form.phone)) errors.phone = 'Enter a valid phone number';
  if (!form.password) errors.password = 'Password is required';
  else if (form.password.length < MIN_PASSWORD) errors.password = `Min ${MIN_PASSWORD} characters`;
  if (!form.confirm) errors.confirm = 'Please confirm your password';
  else if (form.password !== form.confirm) errors.confirm = 'Passwords do not match';
  return errors;
}

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const [role, setRole] = useState<'jobseeker' | 'employer'>(
    (searchParams.get('role') as 'jobseeker' | 'employer') || 'jobseeker'
  );
  const [form, setForm] = useState<FormState>({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const setField = (k: keyof FormState, v: string) => {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => ({ ...e, [k]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate(form);
    setErrors(validationErrors);
    if (Object.values(validationErrors).some(Boolean)) {
      toast('Please fix the highlighted fields', 'error');
      return;
    }
    setLoading(true);
    try {
      await register({ name: form.name.trim(), email: form.email.trim(), password: form.password, phone: form.phone || undefined, role });
      toast('Account created successfully!');
      navigate(role === 'employer' ? '/employer/dashboard' : '/dashboard');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        ?? 'Registration failed. Please try again.';
      toast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4 py-8">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="bg-[#ff6600] text-white font-bold px-2 py-0.5 rounded text-xl">FW</div>
            <span className="font-bold text-[#003580] text-xl">FreshersWorld</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Create Account</h1>
          <p className="text-gray-500 text-sm mt-1">Join millions of job seekers</p>
        </div>

        {/* Role toggle */}
        <div className="flex bg-gray-100 p-1 rounded-xl mb-6" role="tablist" aria-label="Account type">
          <button
            type="button"
            role="tab"
            aria-selected={role === 'jobseeker'}
            onClick={() => setRole('jobseeker')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition ${role === 'jobseeker' ? 'bg-white shadow text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <User size={16} aria-hidden="true" /> Job Seeker
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={role === 'employer'}
            onClick={() => setRole('employer')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition ${role === 'employer' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Briefcase size={16} aria-hidden="true" /> Employer
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <FieldGroup
            id="reg-name"
            label={role === 'employer' ? 'Company / Contact Name' : 'Full Name'}
            required
            error={errors.name}
          >
            <input
              id="reg-name"
              value={form.name}
              autoComplete="name"
              aria-invalid={!!errors.name}
              onChange={e => setField('name', e.target.value)}
              placeholder={role === 'employer' ? 'HR Manager / Company Name' : 'Your full name'}
              className={inputCls(errors.name)}
              autoFocus
            />
          </FieldGroup>

          <FieldGroup id="reg-email" label="Email Address" required error={errors.email}>
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              aria-invalid={!!errors.email}
              value={form.email}
              onChange={e => setField('email', e.target.value)}
              placeholder="you@example.com"
              className={inputCls(errors.email)}
            />
          </FieldGroup>

          <FieldGroup id="reg-phone" label="Phone Number" error={errors.phone}>
            <input
              id="reg-phone"
              type="tel"
              autoComplete="tel"
              aria-invalid={!!errors.phone}
              value={form.phone}
              onChange={e => setField('phone', e.target.value)}
              placeholder="10-digit mobile number"
              className={inputCls(errors.phone)}
            />
          </FieldGroup>

          <FieldGroup id="reg-password" label="Password" required error={errors.password}>
            <div className="relative">
              <input
                id="reg-password"
                type={showPw ? 'text' : 'password'}
                autoComplete="new-password"
                aria-invalid={!!errors.password}
                value={form.password}
                onChange={e => setField('password', e.target.value)}
                placeholder={`Minimum ${MIN_PASSWORD} characters`}
                className={`${inputCls(errors.password)} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPw(p => !p)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </FieldGroup>

          <FieldGroup id="reg-confirm" label="Confirm Password" required error={errors.confirm}>
            <input
              id="reg-confirm"
              type="password"
              autoComplete="new-password"
              aria-invalid={!!errors.confirm}
              value={form.confirm}
              onChange={e => setField('confirm', e.target.value)}
              placeholder="Repeat password"
              className={inputCls(errors.confirm)}
            />
          </FieldGroup>

          <p className="text-xs text-gray-400">
            By registering, you agree to our <a href="#" className="text-orange-500 hover:underline">Terms of Service</a> and <a href="#" className="text-orange-500 hover:underline">Privacy Policy</a>.
          </p>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-orange-600 transition disabled:opacity-60"
          >
            {loading ? 'Creating account...' : `Create ${role === 'employer' ? 'Employer ' : ''}Account`}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-orange-500 font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

function inputCls(error?: string) {
  return `w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-1 transition ${
    error
      ? 'border-red-400 focus:border-red-500 focus:ring-red-400'
      : 'border-gray-300 focus:border-orange-400 focus:ring-orange-400'
  }`;
}

interface FieldGroupProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

function FieldGroup({ id, label, required, error, children }: FieldGroupProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5" aria-hidden="true"> *</span>}
      </label>
      {children}
      {error && <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
