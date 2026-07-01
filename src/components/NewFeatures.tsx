import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, CheckCircle2, AlertTriangle, Play, Calendar, 
  Trash2, ShieldCheck, Plus, ToggleLeft, ToggleRight
} from 'lucide-react';

const api = axios.create({
  baseURL: 'http://localhost:3000',
});

// Configure API Interceptors to add Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ==========================================
// 1. DASHBOARD VIEW
// ==========================================
export const DashboardView: React.FC = () => {
  const [stats, setStats] = useState<any>({
    totalAccounts: 0,
    activeAccounts: 0,
    aiConversations: 0,
    humanConversations: 0,
    pendingApprovals: 0,
    scheduledMessages: 0,
    successRate: 100,
    failedDeliveries: 0,
    avgResponseTimeSec: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/monitoring/stats');
        setStats(res.data);
      } catch (err) {
        console.error('Failed to fetch dashboard stats', err);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const cardData = [
    { label: 'Total Accounts', value: stats.totalAccounts, icon: Users, color: '#3b82f6' },
    { label: 'Active Accounts', value: stats.activeAccounts, icon: CheckCircle2, color: '#10b981' },
    { label: 'AI Conversations', value: stats.aiConversations, icon: Play, color: '#8b5cf6' },
    { label: 'Human Chats', value: stats.humanConversations, icon: Users, color: '#f59e0b' },
    { label: 'Pending Approvals', value: stats.pendingApprovals, icon: ShieldCheck, color: '#ef4444' },
    { label: 'Scheduled Messages', value: stats.scheduledMessages, icon: Calendar, color: '#06b6d4' },
    { label: 'Success Rate', value: `${stats.successRate}%`, icon: CheckCircle2, color: '#10b981' },
    { label: 'Failed Deliveries', value: stats.failedDeliveries, icon: AlertTriangle, color: '#ef4444' },
  ];

  return (
    <div style={{ color: 'var(--text-primary)' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: '6px' }}>System Overview</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
          Real-time KPIs for centralized WhatsApp Business account orchestrations.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {cardData.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{card.label}</span>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: '8px', marginBottom: 0 }}>{card.value}</h3>
              </div>
              <div style={{
                background: `${card.color}15`,
                color: card.color,
                padding: '12px',
                borderRadius: '12px',
              }}>
                <Icon size={24} />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '24px',
      }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '8px' }}>Response Metrics</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
          Average Reply Lag: <strong style={{ color: 'var(--success)' }}>{stats.avgResponseTimeSec} seconds</strong>.
        </p>
      </div>
    </div>
  );
};

// ==========================================
// 2. MULTI-ACCOUNT VIEW
// ==========================================
export const MultiAccountView: React.FC = () => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [hours, setHours] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phoneId: '',
    accessToken: '',
    businessAccountId: '',
    verifyToken: 'whatsapp_verify_token_123',
    phoneNumber: '',
  });

  const fetchAccounts = async () => {
    try {
      const res = await api.get('/accounts');
      setAccounts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/accounts', formData);
      setShowAddForm(false);
      setFormData({
        name: '',
        phoneId: '',
        accessToken: '',
        businessAccountId: '',
        verifyToken: 'whatsapp_verify_token_123',
        phoneNumber: '',
      });
      fetchAccounts();
    } catch (err) {
      alert('Failed to add account');
    }
  };

  const handleToggleActive = async (account: any) => {
    try {
      await api.put(`/accounts/${account.id}`, { isActive: !account.isActive });
      fetchAccounts();
      if (selectedAccount?.id === account.id) {
        setSelectedAccount({ ...selectedAccount, isActive: !account.isActive });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectAccount = async (account: any) => {
    setSelectedAccount(account);
    try {
      const hoursRes = await api.get(`/accounts/${account.id}/business-hours`);
      setHours(hoursRes.data);
      const tempRes = await api.get(`/accounts/${account.id}/templates`);
      setTemplates(tempRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateHour = async (day: number, openTime: string, closeTime: string, isEnabled: boolean) => {
    try {
      await api.put(`/accounts/${selectedAccount.id}/business-hours/${day}`, { openTime, closeTime, isEnabled });
      const hoursRes = await api.get(`/accounts/${selectedAccount.id}/business-hours`);
      setHours(hoursRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: selectedAccount ? '320px 1fr' : '1fr', gap: '24px', color: 'var(--text-primary)' }}>
      {/* LEFT LIST */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0,marginRight:'20px' }}>Business Accounts</h2>
          <button onClick={() => setShowAddForm(!showAddForm)} style={{
            background: 'var(--accent)',
            border: 'none',
            borderRadius: '8px',
            padding: '6px 12px',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.8rem',
            cursor: 'pointer',
          }}>
            <Plus size={14} /> Add Account
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleAddAccount} style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}>
            <input type="text" placeholder="Account Name (e.g. Sales)" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required style={{ background: 'var(--bg-base)', border: '1px solid var(--border-color)', padding: '8px', borderRadius: '6px', color: 'inherit' }} />
            <input type="text" placeholder="Phone ID" value={formData.phoneId} onChange={e => setFormData({ ...formData, phoneId: e.target.value })} required style={{ background: 'var(--bg-base)', border: '1px solid var(--border-color)', padding: '8px', borderRadius: '6px', color: 'inherit' }} />
            <input type="text" placeholder="Access Token" value={formData.accessToken} onChange={e => setFormData({ ...formData, accessToken: e.target.value })} required style={{ background: 'var(--bg-base)', border: '1px solid var(--border-color)', padding: '8px', borderRadius: '6px', color: 'inherit' }} />
            <input type="text" placeholder="Phone Number (optional)" value={formData.phoneNumber} onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })} style={{ background: 'var(--bg-base)', border: '1px solid var(--border-color)', padding: '8px', borderRadius: '6px', color: 'inherit' }} />
            <button type="submit" style={{ background: 'var(--success)', border: 'none', padding: '8px', borderRadius: '6px', color: 'white', cursor: 'pointer', fontWeight: 600 }}>Save Account</button>
          </form>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {accounts.map(acc => (
            <div key={acc.id} onClick={() => handleSelectAccount(acc)} style={{
              background: selectedAccount?.id === acc.id ? 'var(--bg-card-selected)' : 'var(--bg-card)',
              border: `1px solid ${selectedAccount?.id === acc.id ? 'var(--accent)' : 'var(--border-color)'}`,
              borderRadius: '12px',
              padding: '16px',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>{acc.name}</h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ID: {acc.phoneId}</span>
              </div>
              <button onClick={(e) => { e.stopPropagation(); handleToggleActive(acc); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                {acc.isActive ? <ToggleRight size={28} color="var(--success)" /> : <ToggleLeft size={28} color="var(--text-secondary)" />}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT DETAIL */}
      {selectedAccount && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', marginBottom: '16px' }}>Configure Hours: {selectedAccount.name}</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {hours.map((h, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.85rem' }}>
                  <span style={{ width: '100px', fontWeight: 500 }}>{days[h.dayOfWeek]}</span>
                  <input type="time" value={h.openTime} onChange={(e) => handleUpdateHour(h.dayOfWeek, e.target.value, h.closeTime, h.isEnabled)} style={{ background: 'var(--bg-base)', border: '1px solid var(--border-color)', color: 'inherit', padding: '4px', borderRadius: '4px' }} />
                  <span>to</span>
                  <input type="time" value={h.closeTime} onChange={(e) => handleUpdateHour(h.dayOfWeek, h.openTime, e.target.value, h.isEnabled)} style={{ background: 'var(--bg-base)', border: '1px solid var(--border-color)', color: 'inherit', padding: '4px', borderRadius: '4px' }} />
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={h.isEnabled} onChange={(e) => handleUpdateHour(h.dayOfWeek, h.openTime, h.closeTime, e.target.checked)} />
                    Active
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
            <h4 style={{ margin: 0, fontSize: '1rem', marginBottom: '12px' }}>Message Templates ({templates.length})</h4>
            {templates.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>No templates registered for this account.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {templates.map((temp: any) => (
                  <div key={temp.id} style={{ background: 'var(--bg-base)', border: '1px solid var(--border-color)', padding: '10px', borderRadius: '8px' }}>
                    <strong style={{ fontSize: '0.85rem' }}>{temp.name}</strong>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>Language: {temp.language} | Category: {temp.category}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 3. APPROVAL QUEUE VIEW
// ==========================================
export const ApprovalQueueView: React.FC = () => {
  const [queue, setQueue] = useState<any[]>([]);
  const [editText, setEditText] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const fetchQueue = async () => {
    try {
      const res = await api.get('/approval/pending');
      setQueue(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleAction = async (id: number, type: 'approve' | 'reject') => {
    try {
      if (type === 'approve') {
        await api.post(`/approval/${id}/approve`, { editedText: editText });
      } else {
        await api.post(`/approval/${id}/reject`);
      }
      setSelectedItem(null);
      setEditText('');
      fetchQueue();
    } catch (err) {
      alert('Action failed');
    }
  };

  return (
    <div style={{ color: 'var(--text-primary)' }}>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '16px' }}>Human Approval Queue</h2>

      {queue.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: '12px' }}>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>No pending messages require approval! 🎉</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selectedItem ? '1fr 360px' : '1fr', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {queue.map(item => (
              <div key={item.id} onClick={() => { setSelectedItem(item); setEditText(item.messageText); }} style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '16px',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{item.phone}</span>
                    <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                      Confidence: {Math.round(item.aiConfidence * 100)}%
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{item.messageText}</p>
                </div>
              </div>
            ))}
          </div>

          {selectedItem && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Review Message</h3>
              <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={6} style={{
                background: 'var(--bg-base)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'inherit',
                padding: '10px',
                fontSize: '0.85rem',
                width: '100%',
                boxSizing: 'border-box',
              }} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => handleAction(selectedItem.id, 'approve')} style={{ flex: 1, background: 'var(--success)', border: 'none', color: 'white', padding: '8px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Approve</button>
                <button onClick={() => handleAction(selectedItem.id, 'reject')} style={{ flex: 1, background: 'var(--danger)', border: 'none', color: 'white', padding: '8px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Reject</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ==========================================
// 4. SCHEDULER VIEW
// ==========================================
export const SchedulerView: React.FC = () => {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [form, setForm] = useState({
    accountId: '',
    phone: '',
    messageText: '',
    scheduledTime: '',
  });

  const fetchSchedules = async () => {
    try {
      const res = await api.get('/scheduler');
      setSchedules(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await api.get('/accounts');
      setAccounts(res.data);
      if (res.data.length > 0) {
        setForm(f => ({ ...f, accountId: String(res.data[0].id) }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSchedules();
    fetchAccounts();
    const interval = setInterval(fetchSchedules, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.accountId) {
      alert('Please select a WhatsApp account first!');
      return;
    }

    try {
      await api.post('/scheduler', {
        ...form,
        accountId: Number(form.accountId),
        conversationId: 0,
      });
      setForm({ accountId: form.accountId, phone: '', messageText: '', scheduledTime: '' });
      fetchSchedules();
    } catch (err) {
      alert('Failed to schedule message');
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await api.delete(`/scheduler/${id}`);
      fetchSchedules();
    } catch (err) {
      console.error(err);
    }
  };

  const getAccountName = (accountId: number) => {
    const acc = accounts.find(a => a.id === accountId);
    return acc ? acc.name : `Account #${accountId}`;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: '#3b82f6',
      SENT: '#10b981',
      FAILED: '#ef4444',
      CANCELLED: '#9ca3af',
    };
    return colors[status] || 'var(--border-color)';
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      PENDING: { bg: 'rgba(59, 130, 246, 0.12)', text: '#3b82f6' },
      SENT: { bg: 'rgba(16, 185, 129, 0.12)', text: '#10b981' },
      FAILED: { bg: 'rgba(239, 68, 68, 0.12)', text: '#ef4444' },
      CANCELLED: { bg: 'rgba(156, 163, 175, 0.12)', text: '#9ca3af' },
    };
    const config = colors[status] || { bg: 'rgba(255,255,255,0.05)', text: 'inherit' };
    return (
      <span style={{
        fontSize: '0.68rem',
        fontWeight: 700,
        padding: '3px 8px',
        borderRadius: '6px',
        background: config.bg,
        color: config.text,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}>
        {status}
      </span>
    );
  };

  const inputStyle: React.CSSProperties = {
    background: 'rgba(0, 0, 0, 0.15)',
    border: '1px solid var(--border-color)',
    padding: '12px 16px',
    borderRadius: '10px',
    color: 'inherit',
    fontSize: '0.88rem',
    width: '100%',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', color: 'var(--text-primary)' }}>
      {/* TOP ADD FORM (Centered, Max Width 600px) */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{
          width: '100%',
          maxWidth: '600px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '20px',
          padding: '28px',
          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, marginBottom: '20px' }}>Schedule New Message</h3>
          
          <form onSubmit={handleSchedule} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Sender Account
              </label>
              <select 
                value={form.accountId} 
                onChange={e => setForm({ ...form, accountId: e.target.value })} 
                required 
                style={inputStyle}
              >
                <option value="">Select Account</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name} ({acc.phoneNumber || acc.phoneId})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Recipient Phone Number
              </label>
              <input type="text" placeholder="e.g. 917305568568" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required style={inputStyle} />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Message Content
              </label>
              <textarea placeholder="Write your message here..." value={form.messageText} onChange={e => setForm({ ...form, messageText: e.target.value })} required rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Schedule Date & Time
              </label>
              <input type="datetime-local" value={form.scheduledTime} onChange={e => setForm({ ...form, scheduledTime: e.target.value })} required style={inputStyle} />
            </div>

            <button 
              type="submit" 
              style={{ 
                background: 'linear-gradient(135deg, #00c6ff, #0072ff)', 
                border: 'none', 
                color: 'white', 
                padding: '14px', 
                borderRadius: '10px', 
                fontWeight: 700, 
                fontSize: '0.9rem', 
                cursor: 'pointer', 
                boxShadow: '0 4px 14px 0 rgba(0, 114, 255, 0.25)', 
                transition: 'all 0.2s',
                marginTop: '8px'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Schedule Message
            </button>
          </form>
        </div>
      </div>

      {/* BOTTOM OUTBOX GRID */}
      <div>
        <div style={{ marginBottom: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 600, margin: 0 }}>Scheduled Outbox</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
            Queue and monitor automated template and free-text broadcasts.
          </p>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '20px' 
        }}>
          {schedules.map(s => (
            <div key={s.id} style={{
              background: 'var(--bg-card)',
              borderLeft: `4px solid ${getStatusColor(s.status)}`,
              borderTop: '1px solid var(--border-color)',
              borderRight: '1px solid var(--border-color)',
              borderBottom: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '12px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div>
                {/* Card Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>{s.phone}</span>
                  {getStatusBadge(s.status)}
                </div>

                {/* Message Content Container */}
                <div style={{ 
                  background: 'rgba(0,0,0,0.12)', 
                  padding: '12px', 
                  borderRadius: '8px', 
                  fontSize: '0.82rem', 
                  color: 'var(--text-secondary)',
                  lineHeight: 1.45,
                  border: '1px solid rgba(255,255,255,0.02)',
                  minHeight: '60px',
                  marginBottom: '8px'
                }}>
                  {s.messageText}
                </div>
              </div>

              <div>
                {/* Time & Action Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={12} />
                    {new Date(s.scheduledTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                  {s.status === 'PENDING' && (
                    <button 
                      onClick={() => handleCancel(s.id)} 
                      style={{ 
                        background: 'rgba(239, 68, 68, 0.08)', 
                        border: 'none', 
                        color: 'var(--danger)', 
                        cursor: 'pointer',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'}
                    >
                      <Trash2 size={12} /> Cancel
                    </button>
                  )}
                </div>

                {/* Card Footer Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '10px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                  <span>
                    Sent via: <strong style={{ color: 'var(--text-primary)' }}>{getAccountName(s.accountId)}</strong>
                  </span>
                  <span>
                    ID: #{s.id}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 5. MONITORING VIEW
// ==========================================
export const MonitoringView: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get('/monitoring/logs');
        setLogs(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ color: 'var(--text-primary)' }}>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '16px' }}>System Activity Logs</h2>
      
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
              <th style={{ padding: '12px 16px' }}>Timestamp</th>
              <th style={{ padding: '12px 16px' }}>Action</th>
              <th style={{ padding: '12px 16px' }}>Details</th>
              <th style={{ padding: '12px 16px' }}>Latency</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, index) => (
              <tr key={index} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                  {new Date(log.createdAt).toLocaleTimeString()}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: log.action === 'ERROR' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                    color: log.action === 'ERROR' ? '#ef4444' : '#10b981',
                  }}>{log.action}</span>
                </td>
                <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{log.details}</td>
                <td style={{ padding: '12px 16px' }}>{log.durationMs > 0 ? `${log.durationMs}ms` : 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
