import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../store/settingsStore';
import type { KbArticle, BrandPersonality, GroupAssistant } from '../store/settingsStore';
import styles from './AutomationBuilder.module.scss';
import api from '../services/api';
import {
  Zap,
  Compass,
  Brain,
  Shield,
  Smile,
  Clock,
  Send,
  Play,
  Plus,
  Trash,
  Upload,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  GripVertical,
  Settings as SettingsIcon,
  Activity,
  ClipboardCheck,
  BookOpen,
} from 'lucide-react';
import {
  DashboardView,
  MultiAccountView,
  ApprovalQueueView,
  SchedulerView,
  MonitoringView,
} from '../components/NewFeatures';

interface VisualNode {
  id: string;
  name: string;
  desc: string;
  icon: any;
  type: string;
  enabled: boolean;
  tabKey: string;
}

const AutomationBuilder: React.FC = () => {
  const {
    settings,
    kbArticles,
    personalities,
    groups,
    fetchSettings,
    updateSettings,
    fetchKb,
    saveKb,
    deleteKb,
    fetchPersonalities,
    savePersonality,
    fetchGroups,
    saveGroup,
  } = useSettingsStore();

  const location = useLocation();
  const navigate = useNavigate();

  // Selected tab based on route URL pathname
  const activeTab = location.pathname.substring(1) || 'dashboard';

  const isFullPageView = ['dashboard', 'whatsapp-accounts', 'approval-queue', 'scheduler', 'monitoring'].includes(activeTab);

  // Local UI State updated with new builder requirements
  const [nodes, setNodes] = useState<VisualNode[]>([
    { id: 'trigger', name: 'WhatsApp Trigger', desc: 'Fires on incoming webhook message events.', icon: Zap, type: 'trigger', enabled: true, tabKey: 'whatsapp-accounts' },
    { id: 'condition', name: 'Condition Node', desc: 'Evaluates escalation keywords and message types.', icon: Compass, type: 'logical', enabled: true, tabKey: 'group-assistant' },
    { id: 'business_hours', name: 'Business Hours', desc: 'Checks hours of operation and triggers autoreplies.', icon: Clock, type: 'check', enabled: true, tabKey: 'whatsapp-accounts' },
    { id: 'kb', name: 'Knowledge Base RAG', desc: 'Matches queries against uploaded PDFs and knowledge items.', icon: BookOpen, type: 'ai', enabled: true, tabKey: 'knowledge-sources' },
    { id: 'ai_personality', name: 'AI Personality', desc: 'Selects friendly, formal, or Hinglish styles.', icon: Smile, type: 'ai', enabled: true, tabKey: 'ai-personality' },
    { id: 'ai_engine', name: 'AI Generation Engine', desc: 'Generates text response using Groq or OpenAI.', icon: Brain, type: 'ai', enabled: true, tabKey: 'business-assistant' },
    { id: 'compliance', name: 'Compliance Screening', desc: 'Filters drafts for adult content, spam, or scams.', icon: Shield, type: 'check', enabled: true, tabKey: 'compliance' },
    { id: 'approval', name: 'Human Approval Gate', desc: 'Optionally holds low-confidence drafts for approval.', icon: ClipboardCheck, type: 'check', enabled: true, tabKey: 'approval-queue' },
    { id: 'delay', name: 'Smart Delay', desc: 'Inserts custom human pauses and typing simulation.', icon: Clock, type: 'delay', enabled: true, tabKey: 'delay-settings' },
    { id: 'output', name: 'WhatsApp Output', desc: 'Dispatches finalized reply packet to user.', icon: Send, type: 'output', enabled: true, tabKey: 'whatsapp-accounts' },
    { id: 'analytics', name: 'Analytics Logging', desc: 'Pushes success/failure metrics to monitoring logs.', icon: Activity, type: 'output', enabled: true, tabKey: 'monitoring' },
  ]);

  // Highlighted Node on Canvas
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Forms / Input states
  const [newKb, setNewKb] = useState<Partial<KbArticle>>({ question: '', answer: '', tags: '', isActive: true });
  const [newPers, setNewPers] = useState<Partial<BrandPersonality>>({ name: '', systemPrompt: '', greetingStyle: 'casual', emojiDensity: 'medium', languageMix: 'english', isDefault: false });
  const [newGroup, setNewGroup] = useState<Partial<GroupAssistant>>({ groupId: '', groupName: '', isEnabled: true, inactivityWaitMinutes: 5, escalationKeywords: '' });

  // Test Playground states
  const [testMessage, setTestMessage] = useState('Guaranteed 100% profit from tomorrow!');
  const [playgroundLogs, setPlaygroundLogs] = useState<{ text: string; type: string }[]>([]);
  const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'ai'; text: string }[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isPdfUploading, setIsPdfUploading] = useState(false);

  // Drag and drop sorting states
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);

  // Synchronize state and navigation triggers
  useEffect(() => {
    fetchSettings();
    fetchKb();
    fetchPersonalities();
    fetchGroups();
  }, []);

  // Update selected node highlight based on active url tab/sidebar section
  useEffect(() => {
    const matchedNode = nodes.find(n => n.tabKey === activeTab);
    if (matchedNode) {
      setSelectedNodeId(matchedNode.id);
    } else {
      setSelectedNodeId(null);
    }
  }, [activeTab, nodes]);

  // Navigate utility
  const handleTabChange = (tab: string) => {
    navigate(`/${tab}`);
  };

  // Node toggle enabled/disabled
  const handleToggleNode = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNodes(prev => prev.map(n => n.id === id ? { ...n, enabled: !n.enabled } : n));
    
    // Track update in database settings if needed
    const node = nodes.find(n => n.id === id);
    if (node) {
      const settingKey = `${id}_node_enabled`;
      const currentVal = node.enabled ? 'false' : 'true'; // inverted because of pre-map state
      updateSettings({ [settingKey]: currentVal });
    }
  };

  // Rearrange node: Move Up/Down
  const handleMoveNode = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= nodes.length) return;

    const list = [...nodes];
    const temp = list[index];
    list[index] = list[newIndex];
    list[newIndex] = temp;
    setNodes(list);
  };

  // HTML5 Native Drag & Drop handlers
  const handleDragStart = (id: string) => {
    setDraggedNodeId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetId: string) => {
    if (!draggedNodeId || draggedNodeId === targetId) return;

    const dragIdx = nodes.findIndex(n => n.id === draggedNodeId);
    const dropIdx = nodes.findIndex(n => n.id === targetId);

    const list = [...nodes];
    const [draggedNode] = list.splice(dragIdx, 1);
    list.splice(dropIdx, 0, draggedNode);

    setNodes(list);
    setDraggedNodeId(null);
  };

  // Settings helpers
  const handleSaveSetting = async (key: string, value: string) => {
    await updateSettings({ [key]: value });
  };

  // Knowledge Base Actions
  const handleAddKb = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKb.question || !newKb.answer) return;
    await saveKb({
      question: newKb.question,
      answer: newKb.answer,
      tags: newKb.tags || '',
      isActive: true
    });
    setNewKb({ question: '', answer: '', tags: '', isActive: true });
  };

  const handlePdfUpload = async (file: File) => {
    if (!file) return;
    setIsPdfUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('/settings/kb/upload-pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      alert(`Successfully uploaded PDF. Extracted and saved ${res.data.savedCount} knowledge articles.`);
      fetchKb();
    } catch (err: any) {
      alert(`Failed to parse PDF: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsPdfUploading(false);
    }
  };

  const handlePdfFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handlePdfUpload(file);
    }
  };

  const handlePdfDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === 'application/pdf') {
      handlePdfUpload(file);
    } else {
      alert('Only PDF files are supported.');
    }
  };

  // Personality Actions
  const handleAddPersonality = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPers.name || !newPers.systemPrompt) return;
    await savePersonality({
      name: newPers.name,
      systemPrompt: newPers.systemPrompt,
      greetingStyle: newPers.greetingStyle || 'casual',
      emojiDensity: newPers.emojiDensity || 'medium',
      languageMix: newPers.languageMix || 'english',
      isDefault: false
    });
    setNewPers({ name: '', systemPrompt: '', greetingStyle: 'casual', emojiDensity: 'medium', languageMix: 'english', isDefault: false });
  };

  // Whitelisted Group Actions
  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroup.groupId || !newGroup.groupName) return;
    await saveGroup({
      groupId: newGroup.groupId,
      groupName: newGroup.groupName,
      isEnabled: true,
      inactivityWaitMinutes: Number(newGroup.inactivityWaitMinutes) || 5,
      escalationKeywords: newGroup.escalationKeywords || ''
    });
    setNewGroup({ groupId: '', groupName: '', isEnabled: true, inactivityWaitMinutes: 5, escalationKeywords: '' });
  };

  // Test Playground Mock simulation dispatcher
  const handlePlaygroundSend = async () => {
    if (!testMessage.trim() || isSimulating) return;

    setIsSimulating(true);
    setPlaygroundLogs([]);
    setChatMessages([{ sender: 'user', text: testMessage }]);

    // Helper log printer
    const addLog = (text: string, type: string) => {
      setPlaygroundLogs(prev => [...prev, { text, type }]);
    };

    // Begin sequence mapping
    addLog(`[Trigger] Incoming message posted to Webhook endpoint. Content: "${testMessage}"`, 'info');

    try {
      const response = await api.post('/webhook/simulate', {
        phone: '919876543210',
        name: 'Rohan Sharma',
        text: testMessage,
        isGroup: false,
      });

      const data = response.data;
      const comp = data.compliance;

      setTimeout(() => {
        // Intent Check
        const isIntentEnabled = nodes.find(n => n.id === 'intent')?.enabled;
        if (isIntentEnabled) {
          addLog(`[Intent Node] Active. Verified opt-out status (Opt-out is active: ${!!comp.reason?.includes('opted out')}).`, 'info');
        } else {
          addLog(`[Intent Node] Bypassed. Routing logic skipped.`, 'warning');
        }

        setTimeout(() => {
          // AI Core
          const isAiEnabled = nodes.find(n => n.id === 'ai')?.enabled;
          let rawOutput = data.replies[0] || 'Default response text';
          if (isAiEnabled) {
            addLog(`[Conversation AI] Generating response. Using matching brand presets. Generated: "${rawOutput}"`, 'ai');
          } else {
            addLog(`[Conversation AI] Bypassed. Outgoing response generated via fallback logic.`, 'warning');
            rawOutput = 'Automatic Fallback response.';
          }

          setTimeout(() => {
            // Compliance Core
            const isCompEnabled = nodes.find(n => n.id === 'compliance')?.enabled;
            if (isCompEnabled) {
              addLog(`[Compliance Scan] Scored risk level of outbound content: ${comp.riskScore}/100. Category: ${comp.reason || 'None'}. Resolution action: ${comp.action}`, comp.action === 'block' ? 'error' : comp.action === 'human_review' ? 'warning' : 'success');
              if (comp.action === 'block') {
                addLog(`[Pipeline Halt] Message blocked by Compliance rules. Discarding output.`, 'error');
                setIsSimulating(false);
                return;
              }
            } else {
              addLog(`[Compliance Scan] Bypassed. Safety threshold validation skipped.`, 'warning');
            }

            setTimeout(() => {
              // Humanizer Core
              const isHumEnabled = nodes.find(n => n.id === 'humanizer')?.enabled;
              let humanizedText = rawOutput;
              if (isHumEnabled) {
                addLog(`[Humanizer] Formatted greeting tone, added emojis, and verified conversational splitter rules.`, 'success');
              } else {
                addLog(`[Humanizer] Bypassed. Formatting adjustments skipped.`, 'warning');
              }

              setTimeout(() => {
                // Delay engine simulation
                const isDelayEnabled = nodes.find(n => n.id === 'delay')?.enabled;
                if (isDelayEnabled) {
                  addLog(`[Delay Engine] Calculating queue buffers. Simulated delay of 5 seconds active.`, 'info');
                } else {
                  addLog(`[Delay Engine] Bypassed. Zero-delay outbound dispatch.`, 'warning');
                }

                setTimeout(() => {
                  // Typing simulator
                  const isTypingEnabled = nodes.find(n => n.id === 'typing')?.enabled;
                  if (isTypingEnabled) {
                    addLog(`[Typing Indicator] Sending chat status packet "typing_on" to customer.`, 'info');
                  } else {
                    addLog(`[Typing Indicator] Bypassed typing simulation status.`, 'warning');
                  }

                  setTimeout(() => {
                    // Outgoing dispatch gateway
                    const isSenderEnabled = nodes.find(n => n.id === 'sender')?.enabled;
                    if (isSenderEnabled) {
                      addLog(`[Outbound Sender] Message dispatched successfully to WhatsApp Webhook API Gateway. Status: SENT`, 'success');
                      setChatMessages(prev => [...prev, { sender: 'ai', text: humanizedText }]);
                    } else {
                      addLog(`[Outbound Sender] Discarded! Sender node is disabled.`, 'error');
                    }
                    setIsSimulating(false);
                  }, 1500);

                }, 1000);

              }, 1000);

            }, 1000);

          }, 1000);

        }, 1000);

      }, 1000);

    } catch (e: any) {
      addLog(`[Pipeline Error] Simulation request failed: ${e.response?.data?.message || e.message}`, 'error');
      setIsSimulating(false);
    }
  };

  return (
    <div className={styles.builderContainer}>
      
      {/* 2. Middle Visual Workflow Canvas */}
      {!isFullPageView ? (
        <main className={styles.canvasArea}>
          <div className={styles.canvasHeader}>
            <div className={styles.canvasInfo}>
              <h3>Visual Workflow Editor</h3>
              <span>Rearrange and enable/disable modules. Click node to edit properties.</span>
            </div>
            <div className={styles.canvasActions}>
              <button className={styles.btnAction} onClick={() => handleTabChange('playground')}>
                <Play size={14} fill="var(--text-secondary)" />
                <span>Run Pipeline Test</span>
              </button>
            </div>
          </div>

          <div className={styles.flowList}>
            {nodes.map((node, index) => {
              const NodeIcon = node.icon;
              const isSelected = selectedNodeId === node.id;
              return (
                <React.Fragment key={node.id}>
                  {index > 0 && (
                    <div
                      className={`${styles.connectorLine} ${
                        !nodes[index - 1].enabled || !node.enabled ? styles.disabled : ''
                      } ${isSimulating ? styles.activeFlow : ''}`}
                    />
                  )}

                  <div
                    className={`${styles.nodeCard} ${isSelected ? styles.selected : ''} ${
                      !node.enabled ? styles.disabled : ''
                    }`}
                    onClick={() => handleTabChange(node.tabKey)}
                    draggable={true}
                    onDragStart={() => handleDragStart(node.id)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(node.id)}
                  >
                    <div className={styles.dragHandle}>
                      <GripVertical size={16} />
                    </div>

                    <div className={`${styles.nodeIconWrapper} ${styles[node.type] || styles.logical}`}>
                      <NodeIcon size={20} />
                    </div>

                    <div className={styles.nodeContent}>
                      <div className={styles.nodeTitle}>
                        <span>{node.name}</span>
                        {!node.enabled && (
                          <span style={{ fontSize: '0.65rem', background: 'var(--border-color)', color: 'var(--text-secondary)', padding: '2px 6px', borderRadius: '4px' }}>
                            Disabled
                          </span>
                        )}
                      </div>
                      <span className={styles.nodeDesc}>{node.desc}</span>
                    </div>

                    <div className={styles.nodeControls}>
                      <button
                        className={styles.nodeOrderBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveNode(index, 'up');
                        }}
                        disabled={index === 0}
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        className={styles.nodeOrderBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveNode(index, 'down');
                        }}
                        disabled={index === nodes.length - 1}
                      >
                        <ChevronDown size={14} />
                      </button>

                      <label className={styles.toggleSwitch} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={node.enabled}
                          onChange={(e) => handleToggleNode(node.id, e as any)}
                        />
                        <span className={styles.sliderRound} />
                      </label>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </main>
      ) : (
        <main className={styles.canvasArea} style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'whatsapp-accounts' && <MultiAccountView />}
          {activeTab === 'approval-queue' && <ApprovalQueueView />}
          {activeTab === 'scheduler' && <SchedulerView />}
          {activeTab === 'monitoring' && <MonitoringView />}
        </main>
      )}

      {/* 3. Right Properties Panel */}
      {!isFullPageView && (
        <section className={styles.propertiesPanel}>
        {/* Context panel header */}
        <div className={styles.panelHeader}>
          <div className={styles.panelIconWrapper}>
            <SettingsIcon size={18} />
          </div>
          <div className={styles.panelTitleInfo}>
            <h3>Properties Panel</h3>
            <span>Configure active builder selection</span>
          </div>
        </div>

        <div className={styles.panelBody}>
          
          {/* A. WORKFLOW OVERVIEW DEFAULT TABS */}
          {activeTab === 'automations' && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px' }}>Pipeline Summary</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  This dashboard represents the n8n visual flow path. Standard messages land at the webhook, resolve custom rules, pass pre-outbound safety tests, and humanize tones before dispatch.
                </p>
              </div>

              <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
                <h5 style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: '8px' }}>Active Modules ({nodes.filter(n => n.enabled).length}/{nodes.length})</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {nodes.map(n => (
                    <div key={n.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                      <span style={{ color: n.enabled ? 'var(--text-primary)' : 'var(--text-muted)' }}>{n.name}</span>
                      <span style={{ fontWeight: 600, color: n.enabled ? 'var(--success)' : 'var(--danger)' }}>
                        {n.enabled ? 'ON' : 'OFF'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* B. WHATSAPP ACCOUNTS PROPERTIES */}
          {activeTab === 'whatsapp-accounts' && (
            <div>
              <div className={styles.switchContainer}>
                <div className={styles.switchLabel}>
                  <span>Sandbox Mode</span>
                  <span>Mock messages locally without calling Meta API</span>
                </div>
                <label className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    checked={settings.sandbox_mode !== 'false'}
                    onChange={(e) => handleSaveSetting('sandbox_mode', e.target.checked ? 'true' : 'false')}
                  />
                  <span className={sliderRoundStyle(settings.sandbox_mode !== 'false')} />
                </label>
              </div>

              <div className={styles.accountCard}>
                <div className={styles.accNumber}>
                  {settings.whatsapp_phone_number || '+91 98765 43210'}
                </div>
                <div className={styles.accBadges}>
                  {settings.sandbox_mode === 'false' ? (
                    <span className={styles.accBadge}>Live (Meta API)</span>
                  ) : (
                    <span className={`${styles.accBadge} ${styles.inactive}`} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>Sandbox Mode</span>
                  )}
                  <span className={styles.accBadge}>Webhook Active</span>
                  {settings.sandbox_mode === 'false' && !settings.whatsapp_access_token ? (
                    <span className={`${styles.accBadge} ${styles.inactive}`} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}>Missing Token</span>
                  ) : (
                    <span className={styles.accBadge}>Connected</span>
                  )}
                </div>
                <div className={styles.accDetail}>
                  Business Account: <span>{settings.whatsapp_business_name || 'Antigravity Workspace'}</span>
                </div>
                <div className={styles.accDetail}>
                  Phone ID: <span style={{ fontFamily: 'monospace' }}>{settings.whatsapp_phone_number_id || 'Not Configured'}</span>
                </div>
                <div className={styles.accDetail}>
                  WABA ID: <span style={{ fontFamily: 'monospace' }}>{settings.whatsapp_business_account_id || 'Not Configured'}</span>
                </div>
                <div className={styles.accDetail}>
                  Webhook URL: <span style={{ fontFamily: 'monospace', fontSize: '0.72rem' }}>{settings.whatsapp_webhook_url || 'http://localhost:3000/webhook'}</span>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>WhatsApp Business Name</label>
                <input
                  type="text"
                  value={settings.whatsapp_business_name || ''}
                  onChange={(e) => handleSaveSetting('whatsapp_business_name', e.target.value)}
                  placeholder="e.g. Antigravity Workspace"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Connected Phone Number</label>
                <input
                  type="text"
                  value={settings.whatsapp_phone_number || ''}
                  onChange={(e) => handleSaveSetting('whatsapp_phone_number', e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                />
              </div>

              <div className={styles.formGroup}>
                <label>WhatsApp Phone Number ID</label>
                <input
                  type="text"
                  value={settings.whatsapp_phone_number_id || ''}
                  onChange={(e) => handleSaveSetting('whatsapp_phone_number_id', e.target.value)}
                  placeholder="e.g. 109827364528192"
                />
              </div>

              <div className={styles.formGroup}>
                <label>WhatsApp Business Account ID (WABA ID)</label>
                <input
                  type="text"
                  value={settings.whatsapp_business_account_id || ''}
                  onChange={(e) => handleSaveSetting('whatsapp_business_account_id', e.target.value)}
                  placeholder="e.g. 109827364528192"
                />
              </div>

              <div className={styles.formGroup}>
                <label>WhatsApp Access Token</label>
                <input
                  type="password"
                  value={settings.whatsapp_access_token || ''}
                  onChange={(e) => handleSaveSetting('whatsapp_access_token', e.target.value)}
                  placeholder="Meta Access Token (EAABw...)"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Webhook Verify Token</label>
                <input
                  type="text"
                  value={settings.whatsapp_verify_token || ''}
                  onChange={(e) => handleSaveSetting('whatsapp_verify_token', e.target.value)}
                  placeholder="Signature verify token"
                />
              </div>

              <div className={styles.formGroup} style={{ marginTop: '16px' }}>
                <label>Meta Webhook Callback URL</label>
                <input
                  type="text"
                  value={settings.whatsapp_webhook_url || ''}
                  onChange={(e) => handleSaveSetting('whatsapp_webhook_url', e.target.value)}
                  placeholder="e.g. http://localhost:3000/webhook"
                  style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                  Paste your public tunnel URL (e.g. `https://xxxx.lhr.life/webhook`) here. Copy this URL to your Meta Developer settings.
                </span>
              </div>
            </div>
          )}

          {/* C. BUSINESS ASSISTANT PROPERTIES */}
          {activeTab === 'business-assistant' && (
            <div>
              <div className={styles.switchContainer}>
                <div className={styles.switchLabel}>
                  <span>Enable AI Replies</span>
                  <span>Allow automated completion logic</span>
                </div>
                <label className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    checked={settings.business_ai_enabled !== 'false'}
                    onChange={(e) => handleSaveSetting('business_ai_enabled', e.target.checked ? 'true' : 'false')}
                  />
                  <span className={sliderRoundStyle(settings.business_ai_enabled !== 'false')} />
                </label>
              </div>

              <div className={styles.switchContainer}>
                <div className={styles.switchLabel}>
                  <span>Enable Memory</span>
                  <span>Retrieve last 10 dialogs for RAG context</span>
                </div>
                <label className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    checked={settings.business_memory_enabled !== 'false'}
                    onChange={(e) => handleSaveSetting('business_memory_enabled', e.target.checked ? 'true' : 'false')}
                  />
                  <span className={sliderRoundStyle(settings.business_memory_enabled !== 'false')} />
                </label>
              </div>

              <div className={styles.switchContainer}>
                <div className={styles.switchLabel}>
                  <span>Enable Brand Tone</span>
                  <span>Strict tone and voice constraints</span>
                </div>
                <label className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    checked={settings.business_brand_tone_enabled !== 'false'}
                    onChange={(e) => handleSaveSetting('business_brand_tone_enabled', e.target.checked ? 'true' : 'false')}
                  />
                  <span className={sliderRoundStyle(settings.business_brand_tone_enabled !== 'false')} />
                </label>
              </div>

              <div className={styles.switchContainer}>
                <div className={styles.switchLabel}>
                  <span>Enable Knowledge Base</span>
                  <span>Match vector source database articles</span>
                </div>
                <label className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    checked={settings.business_kb_enabled !== 'false'}
                    onChange={(e) => handleSaveSetting('business_kb_enabled', e.target.checked ? 'true' : 'false')}
                  />
                  <span className={sliderRoundStyle(settings.business_kb_enabled !== 'false')} />
                </label>
              </div>
            </div>
          )}

          {/* D. GROUP ASSISTANT PROPERTIES */}
          {activeTab === 'group-assistant' && (
            <div>
              <div className={styles.switchContainer}>
                <div className={styles.switchLabel}>
                  <span>Enable Group Replies</span>
                  <span>Respond to community messages</span>
                </div>
                <label className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    checked={settings.group_replies_enabled === 'true'}
                    onChange={(e) => handleSaveSetting('group_replies_enabled', e.target.checked ? 'true' : 'false')}
                  />
                  <span className={sliderRoundStyle(settings.group_replies_enabled === 'true')} />
                </label>
              </div>

              <div className={styles.switchContainer}>
                <div className={styles.switchLabel}>
                  <span>Admin Approval Mode</span>
                  <span>Require manual verify for group outputs</span>
                </div>
                <label className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    checked={settings.group_admin_approval === 'true'}
                    onChange={(e) => handleSaveSetting('group_admin_approval', e.target.checked ? 'true' : 'false')}
                  />
                  <span className={sliderRoundStyle(settings.group_admin_approval === 'true')} />
                </label>
              </div>

              <div className={styles.formGroup}>
                <label>Admin Inactivity Threshold</label>
                <select
                  value={settings.group_inactivity_wait || '5'}
                  onChange={(e) => handleSaveSetting('group_inactivity_wait', e.target.value)}
                >
                  <option value="3">3 Minutes</option>
                  <option value="5">5 Minutes</option>
                  <option value="10">10 Minutes</option>
                </select>
              </div>

              <div className={styles.switchContainer}>
                <div className={styles.switchLabel}>
                  <span>Fallback to Admin</span>
                  <span>Ping admin if escalation keyword matches</span>
                </div>
                <label className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    checked={settings.group_fallback_admin !== 'false'}
                    onChange={(e) => handleSaveSetting('group_fallback_admin', e.target.checked ? 'true' : 'false')}
                  />
                  <span className={sliderRoundStyle(settings.group_fallback_admin !== 'false')} />
                </label>
              </div>

              {/* Group Assistant List */}
              <div style={{ marginTop: '24px' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Whitelisted Groups</h4>
                <form onSubmit={handleAddGroup} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                  <input
                    type="text"
                    placeholder="Group ID (e.g. 120363@g.us)"
                    value={newGroup.groupId || ''}
                    onChange={(e) => setNewGroup(prev => ({ ...prev, groupId: e.target.value }))}
                    style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                  />
                  <input
                    type="text"
                    placeholder="Group Name"
                    value={newGroup.groupName || ''}
                    onChange={(e) => setNewGroup(prev => ({ ...prev, groupName: e.target.value }))}
                    style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                  />
                  <button type="submit" className={styles.btnAction} style={{ justifyContent: 'center' }}>
                    <Plus size={14} /> Add Whitelisted Group
                  </button>
                </form>
                
                <div className={styles.itemGridList} style={{ maxHeight: '180px', overflowY: 'auto' }}>
                  {groups.map(g => (
                    <div key={g.id} className={styles.gridItemRow}>
                      <div>
                        <div className={styles.itemVal}>{g.groupName}</div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>ID: {g.groupId}</span>
                      </div>
                      <span style={{ fontSize: '0.72rem', background: 'var(--primary-alpha)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '10px' }}>
                        {g.inactivityWaitMinutes}m wait
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* E. HUMANIZER RULES PROPERTIES */}
          {activeTab === 'humanizer' && (
            <div>
              <div className={styles.switchContainer}>
                <div className={styles.switchLabel}>
                  <span>Random Greetings</span>
                  <span>Inject casual greetings based on personality</span>
                </div>
                <label className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    checked={settings.humanizer_greetings !== 'false'}
                    onChange={(e) => handleSaveSetting('humanizer_greetings', e.target.checked ? 'true' : 'false')}
                  />
                  <span className={sliderRoundStyle(settings.humanizer_greetings !== 'false')} />
                </label>
              </div>

              <div className={styles.formGroup}>
                <label>Emoji Injection Density</label>
                <select
                  value={settings.humanizer_emoji_density || 'medium'}
                  onChange={(e) => handleSaveSetting('humanizer_emoji_density', e.target.value)}
                >
                  <option value="none">None (Strict text)</option>
                  <option value="low">Low (1 emoji per 3 sentences)</option>
                  <option value="medium">Medium (1-2 emojis per bubble)</option>
                  <option value="high">High (Heavy emojis & stickers)</option>
                </select>
              </div>

              <div className={styles.switchContainer}>
                <div className={styles.switchLabel}>
                  <span>Sentence Splitter</span>
                  <span>Break replies into consecutive short messages</span>
                </div>
                <label className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    checked={settings.humanizer_splitter !== 'false'}
                    onChange={(e) => handleSaveSetting('humanizer_splitter', e.target.checked ? 'true' : 'false')}
                  />
                  <span className={sliderRoundStyle(settings.humanizer_splitter !== 'false')} />
                </label>
              </div>

              <div className={styles.switchContainer}>
                <div className={styles.switchLabel}>
                  <span>Natural Pauses</span>
                  <span>Introduce micro-delays between bubbles</span>
                </div>
                <label className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    checked={settings.humanizer_pauses !== 'false'}
                    onChange={(e) => handleSaveSetting('humanizer_pauses', e.target.checked ? 'true' : 'false')}
                  />
                  <span className={sliderRoundStyle(settings.humanizer_pauses !== 'false')} />
                </label>
              </div>

              <div className={styles.switchContainer}>
                <div className={styles.switchLabel}>
                  <span>Typing Simulation</span>
                  <span>Display chat state typing... dynamically</span>
                </div>
                <label className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    checked={settings.humanizer_typing !== 'false'}
                    onChange={(e) => handleSaveSetting('humanizer_typing', e.target.checked ? 'true' : 'false')}
                  />
                  <span className={sliderRoundStyle(settings.humanizer_typing !== 'false')} />
                </label>
              </div>

              <div className={styles.formGroup}>
                <label>Default Output Language Mix</label>
                <select
                  value={settings.humanizer_lang_mix || 'english'}
                  onChange={(e) => handleSaveSetting('humanizer_lang_mix', e.target.value)}
                >
                  <option value="english">Pure English</option>
                  <option value="hinglish">Hinglish (Hindi-English mix)</option>
                  <option value="tamil_english">Tamillish (Tamil-English mix)</option>
                </select>
              </div>
            </div>
          )}

          {/* F. COMPLIANCE ENGINE PROPERTIES */}
          {activeTab === 'compliance' && (
            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '12px' }}>Verify Categories</h4>

              <div className={styles.switchContainer}>
                <div className={styles.switchLabel}>
                  <span>Spam Detection</span>
                  <span>Flag caps lock, urgent FOMO hooks</span>
                </div>
                <label className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    checked={settings.compliance_spam !== 'false'}
                    onChange={(e) => handleSaveSetting('compliance_spam', e.target.checked ? 'true' : 'false')}
                  />
                  <span className={sliderRoundStyle(settings.compliance_spam !== 'false')} />
                </label>
              </div>

              <div className={styles.switchContainer}>
                <div className={styles.switchLabel}>
                  <span>Misleading Claim Detection</span>
                  <span>Flag 100% financial profit claims</span>
                </div>
                <label className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    checked={settings.compliance_misleading !== 'false'}
                    onChange={(e) => handleSaveSetting('compliance_misleading', e.target.checked ? 'true' : 'false')}
                  />
                  <span className={sliderRoundStyle(settings.compliance_misleading !== 'false')} />
                </label>
              </div>

              <div className={styles.switchContainer}>
                <div className={styles.switchLabel}>
                  <span>Harassment & Threat Filter</span>
                  <span>Flag pressuring follow-up speech</span>
                </div>
                <label className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    checked={settings.compliance_harassment !== 'false'}
                    onChange={(e) => handleSaveSetting('compliance_harassment', e.target.checked ? 'true' : 'false')}
                  />
                  <span className={sliderRoundStyle(settings.compliance_harassment !== 'false')} />
                </label>
              </div>

              <div className={styles.switchContainer}>
                <div className={styles.switchLabel}>
                  <span>Adult Content Filter</span>
                  <span>Discard porn, xxx, or gambling items</span>
                </div>
                <label className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    checked={settings.compliance_adult !== 'false'}
                    onChange={(e) => handleSaveSetting('compliance_adult', e.target.checked ? 'true' : 'false')}
                  />
                  <span className={sliderRoundStyle(settings.compliance_adult !== 'false')} />
                </label>
              </div>

              <div className={styles.formGroup} style={{ marginTop: '20px' }}>
                <label>Risk Strictness Level</label>
                <select
                  value={settings.compliance_risk_threshold || 'medium'}
                  onChange={(e) => handleSaveSetting('compliance_risk_threshold', e.target.value)}
                >
                  <option value="low">Low (Score 0-30 = Send)</option>
                  <option value="medium">Medium (Score 31-60 = Auto-Rewrite)</option>
                  <option value="strict">Strict (Score 61+ = Human Approval required)</option>
                </select>
              </div>

              <div style={{ marginTop: '20px', background: 'var(--bg-base)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '12px' }}>
                <h5 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <AlertTriangle size={14} /> Rewrite Previews
                </h5>
                <div style={{ fontSize: '0.75rem', lineHeight: 1.4 }}>
                  <div style={{ marginBottom: '6px' }}><strong>Raw input:</strong> <span style={{ color: 'var(--danger)' }}>"BUY NOW!!! Guaranteed profit!"</span></div>
                  <div><strong>Compliance Suggestion:</strong> <span style={{ color: 'var(--success)' }}>"Review our offer. Favorable performance opportunities."</span></div>
                </div>
              </div>
            </div>
          )}

          {/* G. DELAY SETTINGS PROPERTIES */}
          {activeTab === 'delay-settings' && (
            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '16px' }}>Queue Wait Sliders</h4>

              <div className={styles.sliderGroup}>
                <div className={styles.sliderHeader}>
                  <span>Simple Answers</span>
                  <span className={styles.sliderVal}>{settings.delay_simple || '6'}s</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="15"
                  value={settings.delay_simple || '6'}
                  onChange={(e) => handleSaveSetting('delay_simple', e.target.value)}
                />
              </div>

              <div className={styles.sliderGroup}>
                <div className={styles.sliderHeader}>
                  <span>Medium Answers</span>
                  <span className={styles.sliderVal}>{settings.delay_medium || '20'}s</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="35"
                  value={settings.delay_medium || '20'}
                  onChange={(e) => handleSaveSetting('delay_medium', e.target.value)}
                />
              </div>

              <div className={styles.sliderGroup}>
                <div className={styles.sliderHeader}>
                  <span>Complex Answers</span>
                  <span className={styles.sliderVal}>{settings.delay_complex || '45'}s</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="90"
                  value={settings.delay_complex || '45'}
                  onChange={(e) => handleSaveSetting('delay_complex', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* H. AI PERSONALITIES CRUD */}
          {activeTab === 'ai-personality' && (
            <div>
              <form onSubmit={handleAddPersonality} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                <div className={styles.formGroup} style={{ marginBottom: '8px' }}>
                  <label>Personality Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Gym, School, Startup"
                    value={newPers.name || ''}
                    onChange={(e) => setNewPers(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className={styles.formGroup} style={{ marginBottom: '8px' }}>
                  <label>System instructions Prompt</label>
                  <textarea
                    rows={3}
                    placeholder="System instructions rules for response format."
                    value={newPers.systemPrompt || ''}
                    onChange={(e) => setNewPers(prev => ({ ...prev, systemPrompt: e.target.value }))}
                  />
                </div>
                <button type="submit" className={styles.btnAction} style={{ justifyContent: 'center' }}>
                  <Plus size={14} /> Add Brand Personality
                </button>
              </form>

              <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Configured Tones</h4>
              <div className={styles.itemGridList} style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {personalities.map(p => (
                  <div key={p.id} className={styles.gridItemRow}>
                    <div>
                      <div className={styles.itemVal}>{p.name}</div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Mix: {p.languageMix}</span>
                    </div>
                    <span style={{ fontSize: '0.72rem', background: 'var(--primary-alpha)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '10px' }}>
                      {p.greetingStyle}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* I. KNOWLEDGE SOURCES PROPERTIES */}
          {activeTab === 'knowledge-sources' && (
            <div>
              <div
                className={`${styles.uploadZone} ${isPdfUploading ? styles.uploading : ''}`}
                onClick={() => !isPdfUploading && document.getElementById('pdf-upload-input')?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handlePdfDrop}
                style={{ cursor: isPdfUploading ? 'not-allowed' : 'pointer' }}
              >
                {isPdfUploading ? (
                  <>
                    <div className={styles.spinner} style={{ margin: '8px auto', border: '3px solid rgba(0,0,0,0.1)', borderTop: '3px solid var(--primary)', borderRadius: '50%', width: '24px', height: '24px', animation: 'spin 1s linear infinite' }} />
                    <h5 style={{ fontSize: '0.82rem', fontWeight: 600 }}>Extracting knowledge...</h5>
                    <span>This can take a few seconds</span>
                  </>
                ) : (
                  <>
                    <Upload size={24} color="var(--primary)" />
                    <h5 style={{ fontSize: '0.82rem', fontWeight: 600 }}>Drag & drop or Click to upload PDF</h5>
                    <span>Accepts documents up to 10MB</span>
                  </>
                )}
              </div>
              <input
                type="file"
                id="pdf-upload-input"
                accept=".pdf"
                style={{ display: 'none' }}
                onChange={handlePdfFileChange}
              />

              <form onSubmit={handleAddKb} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                <div className={styles.formGroup} style={{ marginBottom: '8px' }}>
                  <label>KB Prompt Pattern/Question</label>
                  <input
                    type="text"
                    placeholder="What are your business hours?"
                    value={newKb.question || ''}
                    onChange={(e) => setNewKb(prev => ({ ...prev, question: e.target.value }))}
                  />
                </div>
                <div className={styles.formGroup} style={{ marginBottom: '8px' }}>
                  <label>RAG Vector Answer Text</label>
                  <textarea
                    rows={3}
                    placeholder="Reply content matched on keyword trigger."
                    value={newKb.answer || ''}
                    onChange={(e) => setNewKb(prev => ({ ...prev, answer: e.target.value }))}
                  />
                </div>
                <button type="submit" className={styles.btnAction} style={{ justifyContent: 'center' }}>
                  <Plus size={14} /> Add FAQ Article
                </button>
              </form>

              <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Active FAQs</h4>
              <div className={styles.itemGridList} style={{ maxHeight: '180px', overflowY: 'auto' }}>
                {kbArticles.map(article => (
                  <div key={article.id} className={styles.gridItemRow}>
                    <div style={{ maxWidth: '85%' }}>
                      <div className={styles.itemVal} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{article.question}</div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {article.answer}
                      </span>
                    </div>
                    <button className={styles.deleteIconBtn} onClick={() => article.id && deleteKb(article.id)}>
                      <Trash size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* J. TEST PLAYGROUND PANEL */}
          {activeTab === 'playground' && (
            <div className={styles.playgroundConsole}>
              <div className={styles.chatArea}>
                {chatMessages.length === 0 && (
                  <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    Send a test message below to start tracing pipelines.
                  </div>
                )}
                {chatMessages.map((msg, index) => (
                  <div key={index} className={`${styles.chatBubble} ${msg.sender === 'user' ? styles.user : styles.ai}`}>
                    {msg.text}
                  </div>
                ))}
              </div>

              {playgroundLogs.length > 0 && (
                <div className={styles.pipelineLog}>
                  {playgroundLogs.map((log, index) => (
                    <div key={index} className={`${styles.logLine} ${styles[log.type]}`}>
                      {log.text}
                    </div>
                  ))}
                </div>
              )}

              <div className={styles.formGroup} style={{ marginTop: '16px' }}>
                <label>Input Test Customer Message</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    placeholder="Type test text..."
                    disabled={isSimulating}
                  />
                  <button
                    className={styles.btnAction}
                    style={{ background: 'var(--primary)', color: 'white', border: 'none' }}
                    onClick={handlePlaygroundSend}
                    disabled={isSimulating}
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* K. SYSTEM SETTINGS */}
          {activeTab === 'settings' && (
            <div>
              <div className={styles.formGroup}>
                <label>OpenAI Chat API Key</label>
                <input
                  type="password"
                  value={settings.openai_api_key || ''}
                  onChange={(e) => handleSaveSetting('openai_api_key', e.target.value)}
                  placeholder="sk-proj-..."
                />
              </div>

              <div className={styles.formGroup}>
                <label>Default Operator Username</label>
                <input
                  type="text"
                  value={settings.admin_email || 'admin@platform.com'}
                  disabled={true}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Database URI</label>
                <input
                  type="text"
                  value="postgresql://postgres:***@localhost:5432/whatsapp_auto"
                  disabled={true}
                />
              </div>
            </div>
          )}

        </div>
      </section>
      )}

    </div>
  );
};

// Helper for switch slider status color overrides
const sliderRoundStyle = (_isChecked: boolean) => {
  return styles.sliderRound;
};

export default AutomationBuilder;
