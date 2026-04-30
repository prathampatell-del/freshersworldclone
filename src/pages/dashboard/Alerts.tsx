import { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, X } from 'lucide-react';
import { usersApi } from '../../api';
import { JobAlert } from '../../types';
import { useToast } from '../../components/ui/Toast';

const CATEGORIES = ['', 'IT', 'Analytics', 'Finance', 'Marketing', 'HR', 'Operations', 'Banking', 'BPO'];
const JOB_TYPES = ['', 'fulltime', 'internship', 'walkin', 'govt'];

export function Alerts() {
  const toast = useToast();
  const [alerts, setAlerts] = useState<JobAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ keywords: '', location: '', category: '', job_type: '', frequency: 'daily' });

  const load = () => {
    usersApi.alerts().then(res => setAlerts(res.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const create = async () => {
    if (!form.keywords && !form.category) {
      toast('Please enter keywords or select a category', 'error');
      return;
    }
    try {
      await usersApi.createAlert(form);
      toast('Job alert created!');
      setShowModal(false);
      setForm({ keywords: '', location: '', category: '', job_type: '', frequency: 'daily' });
      load();
    } catch {
      toast('Failed to create alert', 'error');
    }
  };

  const deleteAlert = async (id: number) => {
    await usersApi.deleteAlert(id);
    setAlerts(prev => prev.filter(a => a.id !== id));
    toast('Alert deleted', 'info');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Job Alerts</h1>
          <p className="text-sm text-gray-500 mt-0.5">Get notified when matching jobs are posted</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-600 transition">
          <Plus size={16} /> New Alert
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-xl" />)}</div>
      ) : alerts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Bell size={40} className="text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-700 mb-1">No alerts set up</h3>
          <p className="text-sm text-gray-500 mb-4">Create job alerts to get notified about matching opportunities</p>
          <button onClick={() => setShowModal(true)} className="bg-orange-500 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-orange-600 transition">
            Create First Alert
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map(alert => (
            <div key={alert.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                <Bell size={18} className="text-orange-500" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap gap-2 mb-1">
                  {alert.keywords && <span className="text-sm font-semibold text-gray-800">"{alert.keywords}"</span>}
                  {alert.category && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100">{alert.category}</span>}
                  {alert.job_type && <span className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded border border-orange-100 capitalize">{alert.job_type}</span>}
                </div>
                <div className="flex gap-3 text-xs text-gray-500">
                  {alert.location && <span>📍 {alert.location}</span>}
                  <span>🔔 {alert.frequency === 'daily' ? 'Daily' : 'Weekly'} digest</span>
                </div>
              </div>
              <button onClick={() => deleteAlert(alert.id)} className="text-gray-400 hover:text-red-500 transition p-1">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-800">Create Job Alert</h2>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Keywords</label>
                <input value={form.keywords} onChange={e => setForm(f => ({ ...f, keywords: e.target.value }))} placeholder="e.g. Java Developer, Data Analyst" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Bangalore, Delhi" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white outline-none focus:border-orange-400">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c || 'All Categories'}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
                <select value={form.job_type} onChange={e => setForm(f => ({ ...f, job_type: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white outline-none focus:border-orange-400">
                  {JOB_TYPES.map(t => <option key={t} value={t}>{t ? (t === 'fulltime' ? 'Full Time' : t === 'walkin' ? 'Walk-in' : t === 'govt' ? 'Government' : 'Internship') : 'All Types'}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                <div className="flex gap-2">
                  {['daily', 'weekly'].map(f => (
                    <button key={f} onClick={() => setForm(d => ({ ...d, frequency: f }))} className={`flex-1 py-2 rounded-lg border text-sm font-medium capitalize transition ${form.frequency === f ? 'bg-orange-500 text-white border-orange-500' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>{f}</button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium">Cancel</button>
                <button onClick={create} className="flex-1 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-semibold hover:bg-orange-600 transition">Create Alert</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
