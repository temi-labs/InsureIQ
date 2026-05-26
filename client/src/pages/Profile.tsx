import { apiFetch } from '../utils/api';
import { useState, useEffect, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Lock, Bell, Building, ClipboardCheck, Users, CheckCircle2, Palette } from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Spinner from '../components/Spinner';
import { addActivity } from '../utils/activity';
import { toast } from 'react-toastify';

export default function Profile() {
  const { user, login } = useAuth();
  const { themeColor, setThemeColor } = useTheme();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);

  // Profile State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');

  const availableColors = [
    { id: 'burgundy', name: 'Burgundy', value: '#800020' },
    { id: 'purple', name: 'Purple', value: '#8b5cf6' },
    { id: 'red', name: 'Red', value: '#ef4444' },
    { id: 'orange', name: 'Orange', value: '#EC5E24' },
  ];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Password State
  const [password, setPassword] = useState('');

  // Alerts State
  const [alerts, setAlerts] = useState({
    newClaim: true,
    claimStatus: true,
    policyExpiring: true,
    paymentDue: true
  });

  // Company State
  const [company, setCompany] = useState({
    name: '',
    email: '',
    address: '',
    billingCycle: 'Monthly',
    policyTypes: 'Health, Auto, Life, Home'
  });

  // Rules State
  const [rules, setRules] = useState({
    autoApproveBelow: 500,
    escalationThreshold: 5000,
    processDays: 7
  });

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || user.name?.split(' ')[0] || '');
      setLastName(user.lastName || user.name?.split(' ').slice(1).join(' ') || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      
      if (user.avatarUrl) {
        setAvatarUrl(user.avatarUrl);
      }
      
      if (user.settings) {
        if (user.settings.alerts) setAlerts(prev => ({ ...prev, ...user.settings?.alerts }));
        if (user.settings.company) setCompany(prev => ({ ...prev, ...user.settings?.company }));
        if (user.settings.rules) setRules(prev => ({ ...prev, ...user.settings?.rules }));
      }
    }
  }, [user]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (activeTab === 'profile' && !email) {
      toast.error('Email field is required');
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiFetch(`/api/users/${user?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          firstName, 
          lastName, 
          name: `${firstName} ${lastName}`.trim(),
          email, 
          phone, 
          avatarUrl,
          password: password || undefined,
          settings: {
            alerts,
            company,
            rules
          }
        })
      });

      if (response.ok) {
        const updatedUser = await response.json();
        
        if (user) {
          login({ ...user, ...updatedUser });
          addActivity(user.id, `Updated ${activeTab} settings`);
        }

        toast.success(`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} settings updated successfully`);
        if (activeTab === 'password') {
          setPassword('');
        }
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update settings');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'password', label: 'Password', icon: Lock },
    { id: 'alerts', label: 'Alerts', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ];

  if (user?.role === 'admin') {
    tabs.push(
      { id: 'company', label: 'Company', icon: Building },
      { id: 'rules', label: 'Rules', icon: ClipboardCheck },
      { id: 'users', label: 'Users', icon: Users }
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Personal Information</h3>
              <p className="text-sm text-gray-500">Changes here update your name across the portal.</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-3 pb-2">
                <label className="block text-sm font-medium text-gray-700">Profile Image</label>
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl overflow-hidden ring-4 ring-[var(--color-primary)]/20 border-2 border-white shadow-md bg-gray-900 object-cover">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        user?.name?.charAt(0).toUpperCase() || 'U'
                      )}
                    </div>
                  </div>
                  <div>
                    <label 
                      htmlFor="avatar-upload" 
                      className="cursor-pointer inline-flex items-center justify-center px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm"
                    >
                      Change Photo
                    </label>
                    <input 
                      id="avatar-upload" 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleImageChange}
                    />
                    <p className="mt-2 text-xs text-gray-500">JPG, PNG or GIF. Max size 2MB.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 ">
                <label className="block text-sm font-medium text-gray-700">First name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] text-sm outline-none transition-all text-gray-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Last name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] text-sm outline-none transition-all text-gray-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] text-sm outline-none transition-all text-gray-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] text-sm outline-none transition-all text-gray-900"
                />
              </div>
            </div>
          </div>
        );

      case 'password':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Change Password</h3>
              <p className="text-sm text-gray-500">Ensure your account is using a long, random password to stay secure.</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] text-sm outline-none transition-all text-gray-900"
                />
              </div>
            </div>
          </div>
        );

      case 'alerts':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Email Notifications</h3>
              <p className="text-sm text-gray-500">Choose which events trigger alerts.</p>
            </div>
            
            <div className="space-y-5">
              {[
                { id: 'newClaim', label: 'New claim submitted', desc: 'Notify when a claim is filed' },
                { id: 'claimStatus', label: 'Claim status changed', desc: 'Approved, rejected or in review' },
                { id: 'policyExpiring', label: 'Policy expiring soon', desc: '30 days before expiry' },
                { id: 'paymentDue', label: 'Payment due reminder', desc: 'Upcoming premium payments' },
              ].map(item => (
                <div key={item.id} className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{item.label}</h4>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAlerts(prev => ({ ...prev, [item.id]: !prev[item.id as keyof typeof alerts] }))}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${alerts[item.id as keyof typeof alerts] ? 'bg-[var(--color-primary)]' : 'bg-gray-200'}`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${alerts[item.id as keyof typeof alerts] ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      case 'company':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Company Details</h3>
              <p className="text-sm text-gray-500">Appears on customer-facing documents.</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1.5 ">
                <label className="block text-sm font-medium text-gray-700">Company name</label>
                <input
                  type="text"
                  value={company.name}
                  onChange={(e) => setCompany(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] text-sm outline-none transition-all text-gray-900"
                />
              </div>

              <div className="space-y-1.5 ">
                <label className="block text-sm font-medium text-gray-700">Company email</label>
                <input
                  type="email"
                  value={company.email}
                  onChange={(e) => setCompany(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] text-sm outline-none transition-all text-gray-900"
                />
              </div>

              <div className="space-y-1.5 ">
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <textarea
                  rows={2}
                  value={company.address}
                  onChange={(e) => setCompany(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] text-sm outline-none transition-all text-gray-900 resize-none"
                />
              </div>

              <div className="space-y-1.5 ">
                <label className="block text-sm font-medium text-gray-700">Billing cycle</label>
                <input
                  type="text"
                  value={company.billingCycle}
                  onChange={(e) => setCompany(prev => ({ ...prev, billingCycle: e.target.value }))}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] text-sm outline-none transition-all text-gray-900"
                />
              </div>

              <div className="space-y-1.5 ">
                <label className="block text-sm font-medium text-gray-700">Policy types</label>
                <input
                  type="text"
                  value={company.policyTypes}
                  onChange={(e) => setCompany(prev => ({ ...prev, policyTypes: e.target.value }))}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] text-sm outline-none transition-all text-gray-900"
                />
              </div>
            </div>
          </div>
        );

      case 'rules':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Claims Processing Rules</h3>
              <p className="text-sm text-gray-500">Define how claims are handled.</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Auto-approve below</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                  <select
                    value={rules.autoApproveBelow}
                    onChange={(e) => setRules(prev => ({ ...prev, autoApproveBelow: Number(e.target.value) }))}
                    className="w-full bg-white border border-gray-200 rounded-xl pl-8 pr-10 py-3 focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] text-sm outline-none transition-all text-gray-900 appearance-none"
                  >
                    <option value={500}>500</option>
                    <option value={1000}>1,000</option>
                    <option value={2000}>2,000</option>
                    <option value={0}>Disabled</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
                <p className="text-xs text-gray-500">Claims under this are auto-approved.</p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Escalation threshold</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                  <select
                    value={rules.escalationThreshold}
                    onChange={(e) => setRules(prev => ({ ...prev, escalationThreshold: Number(e.target.value) }))}
                    className="w-full bg-white border border-gray-200 rounded-xl pl-8 pr-10 py-3 focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] text-sm outline-none transition-all text-gray-900 appearance-none"
                  >
                    <option value={5000}>5,000</option>
                    <option value={10000}>10,000</option>
                    <option value={20000}>20,000</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
                <p className="text-xs text-gray-500">Claims above this need manager approval.</p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Process target (days)</label>
                <input
                  type="number"
                  value={rules.processDays}
                  onChange={(e) => setRules(prev => ({ ...prev, processDays: Number(e.target.value) }))}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] text-sm outline-none transition-all text-gray-900"
                />
                <p className="text-xs text-gray-500">Target days to resolve a claim.</p>
              </div>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Theme & Appearance</h3>
              <p className="text-sm text-gray-500">Customize the interface style.</p>
            </div>
            <div className="space-y-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Color Theme</label>
                <div className="flex gap-4">
                  {availableColors.map(color => (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => setThemeColor(color.id as any)}
                      className="flex flex-col items-center gap-2 focus:outline-none group"
                    >
                      <div 
                        className={`w-12 h-12 rounded-full border-2 transition-all flex items-center justify-center ${themeColor === color.id ? 'border-[var(--color-primary)] scale-110 shadow-sm' : 'border-transparent hover:scale-105'}`}
                        style={{ backgroundColor: color.value }}
                      >
                        {themeColor === color.id && <CheckCircle2 size={20} className="text-white" />}
                      </div>
                      <span className={`text-xs font-medium ${themeColor === color.id ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-700'}`}>
                        {color.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Layout title="Settings">
      <div className="max-w-2xl mx-auto pb-24 lg:pb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          
          {/* Scrollable Tabs */}
          <div className="overflow-x-auto p-4 border-b border-gray-100 hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div className="flex gap-2 w-max mx-auto sm:mx-0">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      if (tab.id === 'users') {
                        navigate('/admin');
                      } else {
                        setActiveTab(tab.id);
                      }
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                      isActive 
                        ? 'bg-gray-50 text-[var(--color-primary)] shadow-sm ring-1 ring-[var(--color-primary)]' 
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-5 sm:p-8">
            <form onSubmit={handleSubmit}>
              {renderContent()}

              <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] transition-colors font-medium text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? <Spinner size={16} className="text-white" /> : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  )}
                  Save
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </Layout>
  );
}
