import { useState } from 'react';
import { User, MapPin, Phone, Mail, Briefcase, Plus, X, Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usersApi } from '../api';
import { useToast } from '../components/ui/Toast';

export function Profile() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    location: user?.location || '',
    experience_years: user?.experience_years || 0,
    bio: user?.bio || '',
    skills: user?.skills || [],
  });

  if (!user) return null;

  const setField = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.skills.includes(s)) {
      setField('skills', [...form.skills, s]);
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => setField('skills', form.skills.filter(s => s !== skill));

  const save = async () => {
    setSaving(true);
    try {
      await usersApi.update(form);
      await refreshUser();
      toast('Profile updated!');
      setEditing(false);
    } catch {
      toast('Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#003580] to-[#0052cc] h-28 relative">
          <div className="absolute bottom-0 left-6 transform translate-y-1/2">
            <div className="w-20 h-20 bg-orange-500 rounded-full border-4 border-white flex items-center justify-center text-white font-bold text-2xl shadow-md">
              {user.name[0].toUpperCase()}
            </div>
          </div>
          <div className="absolute bottom-3 right-4">
            {!editing ? (
              <button onClick={() => setEditing(true)} className="flex items-center gap-2 bg-white text-blue-800 px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-gray-50 transition shadow">
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setEditing(false)} className="flex items-center gap-1.5 bg-white text-gray-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition shadow">
                  <X size={14} /> Cancel
                </button>
                <button onClick={save} disabled={saving} className="flex items-center gap-1.5 bg-orange-500 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-orange-600 transition shadow disabled:opacity-60">
                  <Save size={14} /> {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="pt-14 px-6 pb-6">
          {editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Full Name" value={form.name} onChange={v => setField('name', v)} />
                <FormField label="Phone" value={form.phone} onChange={v => setField('phone', v)} />
                <FormField label="Location" value={form.location} onChange={v => setField('location', v)} placeholder="City, State" />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Experience (years)</label>
                  <select value={form.experience_years} onChange={e => setField('experience_years', parseInt(e.target.value))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400">
                    {[0,1,2,3,4,5].map(y => <option key={y} value={y}>{y === 0 ? 'Fresher (0 years)' : `${y} year${y>1?'s':''}`}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio / Summary</label>
                <textarea value={form.bio} onChange={e => setField('bio', e.target.value)} rows={3} placeholder="Tell recruiters about yourself..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.skills.map(s => (
                    <span key={s} className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-100">
                      {s}
                      <button onClick={() => removeSkill(s)} className="hover:text-red-500"><X size={11} /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={skillInput}
                    onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                    placeholder="Add a skill (press Enter)"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400"
                  />
                  <button onClick={addSkill} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 transition">
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-xl font-bold text-gray-800">{user.name}</h1>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200 capitalize mt-1">{user.role}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600 mb-4">
                <span className="flex items-center gap-2"><Mail size={14} className="text-gray-400" />{user.email}</span>
                {user.phone && <span className="flex items-center gap-2"><Phone size={14} className="text-gray-400" />{user.phone}</span>}
                {user.location && <span className="flex items-center gap-2"><MapPin size={14} className="text-gray-400" />{user.location}</span>}
                <span className="flex items-center gap-2"><Briefcase size={14} className="text-gray-400" />{user.experience_years === 0 ? 'Fresher' : `${user.experience_years} year${user.experience_years > 1 ? 's' : ''} experience`}</span>
              </div>
              {user.bio && (
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-700 text-sm mb-1 flex items-center gap-2"><User size={14} className="text-orange-500" />About</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{user.bio}</p>
                </div>
              )}
              {user.skills && user.skills.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-700 text-sm mb-2">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {user.skills.map(s => (
                      <span key={s} className="px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-100 font-medium">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {!user.skills?.length && !user.bio && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center mt-2">
                  <p className="text-sm text-amber-700">Your profile is incomplete. Add your bio and skills to attract recruiters!</p>
                  <button onClick={() => setEditing(true)} className="mt-2 text-amber-700 font-semibold text-sm hover:underline">Complete Profile →</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FormField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 transition" />
    </div>
  );
}
