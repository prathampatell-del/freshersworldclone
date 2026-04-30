import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X } from 'lucide-react';
import { jobsApi } from '../../api/jobs';
import { useToast } from '../../components/ui/Toast';
import { Job } from '../../types';

const CATEGORIES = ['IT', 'Analytics', 'Finance', 'Marketing', 'HR', 'Operations', 'BPO', 'Banking', 'Teaching', 'Healthcare', 'Sales', 'Engineering'];

export function PostJob() {
  const navigate = useNavigate();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'fulltime' as Job['type'],
    category: 'IT',
    location: '',
    salary_min: '',
    salary_max: '',
    experience_min: '0',
    experience_max: '2',
    qualifications: '',
    skills_required: [] as string[],
    openings: '1',
    deadline: '',
  });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.skills_required.includes(s)) {
      set('skills_required', [...form.skills_required, s]);
      setSkillInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.category || !form.location) {
      toast('Please fill all required fields', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        salary_min: form.salary_min ? parseInt(form.salary_min) : undefined,
        salary_max: form.salary_max ? parseInt(form.salary_max) : undefined,
        experience_min: parseInt(form.experience_min),
        experience_max: parseInt(form.experience_max),
        openings: parseInt(form.openings),
        deadline: form.deadline || undefined,
      };
      const res = await jobsApi.create(payload);
      toast('Job posted successfully!');
      navigate(`/jobs/${res.data.id}`);
    } catch (e: any) {
      toast(e.response?.data?.error || 'Failed to post job', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Post a New Job</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Section title="Basic Information">
          <div className="space-y-4">
            <Field label="Job Title *" required>
              <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Junior Software Engineer" className={inputCls} />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Job Type">
                <select value={form.type} onChange={e => set('type', e.target.value)} className={inputCls}>
                  <option value="fulltime">Full Time</option>
                  <option value="internship">Internship</option>
                  <option value="walkin">Walk-in</option>
                  <option value="govt">Government</option>
                </select>
              </Field>
              <Field label="Category *" required>
                <select value={form.category} onChange={e => set('category', e.target.value)} className={inputCls}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Location *" required>
              <input value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Bangalore, Karnataka or Pan India" className={inputCls} />
            </Field>
          </div>
        </Section>

        <Section title="Salary & Experience">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Min Salary (Annual ₹)">
              <input type="number" value={form.salary_min} onChange={e => set('salary_min', e.target.value)} placeholder="e.g. 350000" className={inputCls} />
            </Field>
            <Field label="Max Salary (Annual ₹)">
              <input type="number" value={form.salary_max} onChange={e => set('salary_max', e.target.value)} placeholder="e.g. 500000" className={inputCls} />
            </Field>
            <Field label="Min Experience (years)">
              <select value={form.experience_min} onChange={e => set('experience_min', e.target.value)} className={inputCls}>
                {[0,1,2,3,4,5].map(y => <option key={y} value={y}>{y === 0 ? 'Fresher (0)' : y}</option>)}
              </select>
            </Field>
            <Field label="Max Experience (years)">
              <select value={form.experience_max} onChange={e => set('experience_max', e.target.value)} className={inputCls}>
                {[0,1,2,3,4,5].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </Field>
          </div>
        </Section>

        <Section title="Job Details">
          <div className="space-y-4">
            <Field label="Job Description *" required>
              <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={8} placeholder="Describe the role, responsibilities, and what makes it exciting..." className={`${inputCls} resize-none`} />
            </Field>
            <Field label="Qualifications">
              <input value={form.qualifications} onChange={e => set('qualifications', e.target.value)} placeholder="e.g. B.E/B.Tech in CS/IT/ECE" className={inputCls} />
            </Field>
            <Field label="Required Skills">
              <div className="flex flex-wrap gap-2 mb-2">
                {form.skills_required.map(s => (
                  <span key={s} className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-100">
                    {s}
                    <button type="button" onClick={() => set('skills_required', form.skills_required.filter(x => x !== s))}><X size={11} /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }} placeholder="Add required skill (press Enter)" className={`flex-1 ${inputCls}`} />
                <button type="button" onClick={addSkill} className="bg-blue-600 text-white px-3 rounded-lg hover:bg-blue-700 transition"><Plus size={14} /></button>
              </div>
            </Field>
          </div>
        </Section>

        <Section title="Additional Info">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Number of Openings">
              <input type="number" min={1} value={form.openings} onChange={e => set('openings', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Application Deadline">
              <input type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)} className={inputCls} />
            </Field>
          </div>
        </Section>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => navigate(-1)} className="flex-1 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="flex-1 py-3 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition disabled:opacity-60">
            {submitting ? 'Posting...' : 'Post Job'}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 transition bg-white";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
