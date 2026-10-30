'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, Bot, User, Languages, Mic, Square, Loader2, AlertCircle, Volume2 } from 'lucide-react';
import {
  useNavigationStore,
  useCustomerStore,
  useAgentStore,
  useAdminStore,
  useTreasurerStore,
} from '@/store/app-store';
import {
  useBranchManagerStore,
  useLoanOfficerStore,
  useTellerStore,
  useFieldSupervisorStore,
  useAccountantStore,
  useComplianceStore,
} from '@/store/staff-stores';

// ---- Reply languages for Ghana ----
const LANGUAGES: { id: string; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'twi', label: 'Twi' },
  { id: 'ga', label: 'Ga' },
  { id: 'ewe', label: 'Ewe' },
  { id: 'hausa', label: 'Hausa' },
  { id: 'pidgin', label: 'Pidgin' },
];
const LANGUAGE_STORAGE_KEY = 'isusupro-ai-lang';
const LOCALIZE_STORAGE_KEY = 'isusupro-ai-ui-strings-v1';
const MAX_RECORD_MS = 45_000;

// ---- TTS audio cache (module-level so it survives chat re-opens) ----
// Repeat plays of the same reply skip the network entirely — important for
// metered mobile data in Ghana. Small LRU: WAV base64 is ~350KB per entry.
const TTS_CACHE_LIMIT = 8;
const ttsCache = new Map<string, string>();
function ttsCacheGet(key: string): string | undefined {
  const hit = ttsCache.get(key);
  if (hit) {
    ttsCache.delete(key);
    ttsCache.set(key, hit); // touch → most-recently-used
  }
  return hit;
}
function ttsCacheSet(key: string, value: string) {
  if (ttsCache.size >= TTS_CACHE_LIMIT) {
    const oldest = ttsCache.keys().next().value;
    if (oldest !== undefined) ttsCache.delete(oldest);
  }
  ttsCache.set(key, value);
}

const cedi = (n: number) => `₵${Number(n).toLocaleString()}`;

// ---- Voice input helpers: capture PCM via Web Audio API → 16-bit mono WAV.
// WAV is universally accepted by the ASR service, unlike MediaRecorder's
// browser-specific container formats (webm/mp4/ogg).
function encodeWav(samples: Int16Array, sampleRate: number): ArrayBuffer {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true); // chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeStr(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) view.setInt16(offset, samples[i], true);
  return buffer;
}

/**
 * Collect a small, live data snapshot for the signed-in portal so the AI can
 * ground its answers in the user's real figures. Uses Zustand `getState()`
 * (no subscriptions) so building it has zero render cost.
 */
function buildLiveSnapshot(portal: string): Record<string, string> {
  const snap: Record<string, string> = {};
  try {
    if (portal === 'customer') {
      const s = useCustomerStore.getState();
      snap['User name'] = s.user?.name ?? '';
      const main = s.wallets?.find((w) => w.type === 'main') ?? s.wallets?.[0];
      if (main) snap['Main wallet balance'] = cedi(main.balance);
      const activeLoans = s.myLoans?.filter((l) => l.status === 'active') ?? [];
      if (activeLoans.length > 0) {
        snap['Active loans'] = `${activeLoans.length} (total remaining ${cedi(activeLoans.reduce((a, l) => a + (l.remainingBalance || 0), 0))})`;
      } else snap['Active loans'] = 'none';
      const goals = s.savingsGoals ?? [];
      if (goals.length > 0) {
        snap['Savings goals'] = goals
          .slice(0, 4)
          .map((g) => `${g.name}: ${cedi(g.currentAmount)} of ${cedi(g.targetAmount)}`)
          .join('; ');
      }
      if (s.susuGroups?.length) {
        snap['My susu groups'] = s.susuGroups.map((g) => g.name).slice(0, 4).join(', ');
        const nextPayout = s.susuPayouts?.find((p) => p.status === 'pending');
        if (nextPayout) {
          snap['Next susu payout'] = `${cedi(nextPayout.amount)} from ${nextPayout.groupName} on ${nextPayout.payoutDate}`;
        }
      }
      snap['Transactions recorded'] = String(s.transactions?.length ?? 0);
    } else if (portal === 'agent') {
      const s = useAgentStore.getState();
      snap['Agent name'] = s.user?.name ?? '';
      if (s.agent) {
        snap['Territory'] = s.agent.territory ?? '';
        snap['Rating'] = `${s.agent.rating}/5`;
        snap['Total customers'] = String(s.agent.totalCustomers ?? s.allCustomers?.length ?? 0);
      }
      const openRoutes = s.collectionRoutes?.filter((r) => r.status === 'in_progress' || r.status === 'partial') ?? [];
      if (openRoutes.length > 0) {
        const expected = openRoutes.reduce((a, r) => a + (r.totalExpected || 0), 0);
        const collected = openRoutes.reduce((a, r) => a + (r.totalCollected || 0), 0);
        snap['Today routes'] = `${openRoutes.length} open · collected ${cedi(collected)} of ${cedi(expected)} expected`;
      }
      const pending = s.commissions?.filter((c) => c.status === 'pending') ?? [];
      snap['Commissions'] = `pending ${cedi(pending.reduce((a, c) => a + (c.amount || 0), 0))}`;
    } else if (portal === 'treasurer') {
      const s = useTreasurerStore.getState();
      snap['Treasurer name'] = s.user?.name ?? '';
      snap['Groups managed'] = String(s.managedGroups?.length ?? 0);
      if (s.managedGroups?.length) {
        snap['Group names'] = s.managedGroups.map((g) => g.name).slice(0, 4).join(', ');
        snap['Combined pool'] = cedi(s.managedGroups.reduce((a, g) => a + (g.totalPool || 0), 0));
        const g0 = s.managedGroups[0];
        if (g0) snap['Leading group round'] = `${g0.name}: round ${g0.currentRound} of ${g0.totalRounds}`;
      }
      const pendingPayouts = s.payouts?.filter((p) => p.status === 'pending') ?? [];
      snap['Pending payouts'] = `${pendingPayouts.length} totalling ${cedi(pendingPayouts.reduce((a, p) => a + (p.amount || 0), 0))}`;
      const overdue = s.allContributions?.filter((c) => c.status === 'overdue') ?? [];
      snap['Overdue contributions'] = String(overdue.length);
      snap['Members'] = String(s.allMembers?.length ?? 0);
    } else if (portal === 'admin') {
      const s = useAdminStore.getState();
      if (s.stats) {
        snap['Total users'] = String(s.stats.totalUsers ?? '');
        snap['Total deposits'] = cedi(s.stats.totalDeposits ?? 0);
        snap['Total susu pool'] = cedi(s.stats.totalSusuPool ?? 0);
        snap['Agents'] = `${s.stats.activeAgents ?? 0} active of ${s.stats.totalAgents ?? 0}`;
        snap['Susu groups'] = String(s.stats.totalSusuGroups ?? '');
      }
      const pending = s.allLoans?.filter((l) => l.status === 'pending') ?? [];
      snap['Pending loan approvals'] = `${pending.length} worth ${cedi(pending.reduce((a, l) => a + (l.amount || 0), 0))}`;
    } else if (portal === 'branch-manager') {
      const s = useBranchManagerStore.getState();
      snap['Branch manager'] = s.user?.name ?? '';
      snap['Staff'] = String(s.staff?.length ?? 0);
      const pending = s.approvals?.filter((a) => a.status === 'pending_bm') ?? [];
      snap['Approvals awaiting me'] = `${pending.length} worth ${cedi(pending.reduce((a, x) => a + (x.amount || 0), 0))}`;
      if (s.targets?.length) {
        snap['Branch targets'] = s.targets
          .slice(0, 3)
          .map((t) => `${t.metric}: ${t.achieved} of ${t.target} (${t.period})`)
          .join('; ');
      }
    } else if (portal === 'loan-officer') {
      const s = useLoanOfficerStore.getState();
      snap['Loan officer'] = s.user?.name ?? '';
      const stages = s.applications ?? [];
      snap['Pipeline'] = `${stages.length} applications (${stages.filter((a) => a.stage === 'appraisal').length} in appraisal, ${stages.filter((a) => a.stage === 'new').length} new)`;
      const portfolio = s.portfolio ?? [];
      snap['Portfolio outstanding'] = cedi(portfolio.reduce((a, p) => a + (p.outstanding || 0), 0));
      const arrears = portfolio.filter((p) => p.arrearsDays > 0);
      snap['Loans in arrears'] = `${arrears.length}${arrears.length > 0 ? ` (worst ${Math.max(...arrears.map((p) => p.arrearsDays))} days)` : ''}`;
      snap['Appraisals completed'] = String(s.appraisals?.length ?? 0);
    } else if (portal === 'teller') {
      const s = useTellerStore.getState();
      snap['Teller'] = s.user?.name ?? '';
      if (s.drawer) {
        snap['Drawer expected balance'] = cedi(s.drawer.expectedBalance ?? 0);
        snap['Drawer variance'] = cedi(s.drawer.variance ?? 0);
      }
      snap['Queue'] = `${(s.queue ?? []).filter((q) => q.status === 'waiting').length} waiting · ${(s.queue ?? []).filter((q) => q.status === 'completed').length} completed today`;
      snap['Pending vault transfers'] = String((s.transfers ?? []).filter((t) => t.status !== 'completed').length);
    } else if (portal === 'field-supervisor') {
      const s = useFieldSupervisorStore.getState();
      snap['Field supervisor'] = s.user?.name ?? '';
      const agents = s.agents ?? [];
      snap['Agents supervised'] = String(agents.length);
      if (agents.length > 0) {
        snap['Average collection rate'] = `${Math.round(agents.reduce((a, x) => a + (x.collectionRate || 0), 0) / agents.length)}%`;
        snap['Offline agents right now'] = String(agents.filter((a) => a.status === 'offline').length);
        snap['KYC verifications pending'] = String(agents.reduce((a, x) => a + (x.pendingVerify || 0), 0));
      }
      snap['Spot checks done'] = String(s.spotChecks?.length ?? 0);
    } else if (portal === 'accountant') {
      const s = useAccountantStore.getState();
      snap['Accountant'] = s.user?.name ?? '';
      const dr = (s.ledger ?? []).reduce((a, l) => a + (l.debit || 0), 0);
      const cr = (s.ledger ?? []).reduce((a, l) => a + (l.credit || 0), 0);
      snap['Ledger'] = `debits ${cedi(dr)} vs credits ${cedi(cr)} (${dr === cr ? 'balanced' : `difference ${cedi(Math.abs(dr - cr))}`})`;
      snap['Accounts in CoA'] = String(s.coa?.length ?? 0);
      snap['Reconciliations needing work'] = String((s.reconciliations ?? []).filter((r) => r.status !== 'reconciled').length);
      snap['Draft statements'] = String((s.statements ?? []).filter((st) => st.status === 'draft').length);
    } else if (portal === 'compliance-officer') {
      const s = useComplianceStore.getState();
      snap['Compliance officer'] = s.user?.name ?? '';
      const alerts = s.alerts ?? [];
      snap['AML alerts'] = `${alerts.filter((a) => a.status === 'open' || a.status === 'escalated').length} open · ${alerts.filter((a) => a.severity === 'critical').length} critical`;
      snap['STRs in progress'] = String((s.strs ?? []).filter((r) => r.status === 'under_review' || r.status === 'draft').length);
      snap['BoG returns'] = String(s.bogReturns?.length ?? 0);
    }
  } catch {
    // Snapshot is best-effort — never break the chat over missing data.
  }
  return snap;
}

// ---- Portal-aware configuration ----
const PORTAL_CONFIG: Record<string, { greeting: string; suggestions: string[] }> = {
  customer: {
    greeting: 'Akwaaba! I\'m Susu AI 👋 Your personal money assistant. Ask me anything about susu, saving, loans or budgeting.',
    suggestions: ['How does susu work?', 'Help me budget better', 'Tips to save for school fees', 'Is a susu-backed loan right for me?'],
  },
  agent: {
    greeting: 'Hello! I\'m Susu AI 👋 Ready to help you manage collections, KYC and customer relationships.',
    suggestions: ['How do I improve collections?', 'Handle absent customers', 'Grow my commission', 'KYC tips for customers'],
  },
  treasurer: {
    greeting: 'Hello! I\'m Susu AI 👋 Your assistant for group records, payout cycles and reconciliation.',
    suggestions: ['Best payout practices', 'How to reconcile floats', 'Handle missed contributions', 'Prepare for round close-out'],
  },
  admin: {
    greeting: 'Welcome! I\'m Susu AI 👋 Ask me about portfolio risk, compliance, payroll or growing the loan book.',
    suggestions: ['Summarize portfolio risk', 'Reduce loan defaults', 'Improve compliance', 'Grow susu adoption'],
  },
  'branch-manager': {
    greeting: 'Welcome, Branch Manager! I\'m Susu AI 👋 Ask about branch targets, staff performance or high-value approvals.',
    suggestions: ['Which loans should I approve today?', 'How is my branch tracking?', 'Coach an underperforming agent', 'PAR 30 improvement ideas'],
  },
  'loan-officer': {
    greeting: 'Hello! I\'m Susu AI 👋 Your credit desk assistant — appraisals, 5C scoring and portfolio follow-up.',
    suggestions: ['Review my pipeline', 'Tips for 5C appraisals', 'How to structure a follow-up call?', 'Spot early warning signs'],
  },
  teller: {
    greeting: 'Hello! I\'m Susu AI 👋 Here to help with counter flows, drawer balancing and vault procedures.',
    suggestions: ['Steps for EOD reconciliation', 'Handle a cash variance', 'Vault transfer rules', 'Spot a counterfeit note'],
  },
  'field-supervisor': {
    greeting: 'Hello! I\'m Susu AI 👋 Your field ops assistant — agents, routes and spot checks.',
    suggestions: ['Improve agent collection rates', 'Plan a route reassignment', 'Run a great spot check', 'Motivate offline agents'],
  },
  accountant: {
    greeting: 'Hello! I\'m Susu AI 👋 Your books assistant — journal entries, reconciliations and statements.',
    suggestions: ['Explain today\'s variances', 'Best loan-loss provision level?', 'Prepare for month-end close', 'SSNIT & PAYE deadlines'],
  },
  'compliance-officer': {
    greeting: 'Welcome, Compliance Officer! I\'m Susu AI 👋 Ask about AML typologies, STR filing or BoG NBFRI returns.',
    suggestions: ['Review open AML alerts', 'Typologies for structuring', 'NBFRI 3 checklist', 'When must I file an STR?'],
  },
};

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

/** Renders **bold** segments and preserves line breaks. */
function MessageBody({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <div className="whitespace-pre-wrap text-sm leading-relaxed">
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={i}>{part.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </div>
  );
}

export function SusuAiChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('en');
  const [localized, setLocalized] = useState<Record<string, { greeting: string; suggestions: string[] }>>({});
  const [translating, setTranslating] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [micNotice, setMicNotice] = useState<string | null>(null);
  const [ttsLoadingIdx, setTtsLoadingIdx] = useState<number | null>(null);
  const [ttsPlayingIdx, setTtsPlayingIdx] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const portal = useNavigationStore((s) => s.currentPortal) || 'customer';
  const config = PORTAL_CONFIG[portal] || PORTAL_CONFIG.customer;
  const activeLanguage = LANGUAGES.find((l) => l.id === language) ?? LANGUAGES[0];

  // Localized widget strings for the chosen language (English until translated)
  const strings = {
    greeting: language === 'en' ? config.greeting : localized[language]?.greeting ?? config.greeting,
    suggestions: language === 'en' ? config.suggestions : localized[language]?.suggestions ?? config.suggestions,
  };

  // Restore the chosen reply language + cached translations across sessions
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && LANGUAGES.some((l) => l.id === saved)) setLanguage(saved);
    try {
      const raw = window.localStorage.getItem(LOCALIZE_STORAGE_KEY);
      if (raw) setLocalized(JSON.parse(raw));
    } catch {
      // corrupted cache — keep English fallback
    }
  }, []);

  // Mirrors `localized` for use inside async callbacks without re-subscribing
  const localizedRef = useRef(localized);
  useEffect(() => {
    localizedRef.current = localized;
  }, [localized]);
  const localizingRef = useRef<Set<string>>(new Set());
  const recorderRef = useRef<{
    ctx: AudioContext;
    stream: MediaStream;
    source: MediaStreamAudioSourceNode;
    processor: ScriptProcessorNode;
    stopTimer: ReturnType<typeof setTimeout>;
  } | null>(null);
  const pcmRef = useRef<Int16Array[]>([]);
  const finishRecordingRef = useRef<() => void>(() => {});
  const inputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Hands-free voice mode: when the current turn began with the microphone,
  // the reply is read aloud automatically (vital for low-literacy users).
  const voiceTurnRef = useRef(false);

  // Other parts of the app (e.g. the Financial Health card) can open the chat
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('susu-ai:open', handler);
    return () => window.removeEventListener('susu-ai:open', handler);
  }, []);

  // Stop any playback when the widget unmounts
  useEffect(() => () => {
    audioRef.current?.pause();
    audioRef.current = null;
  }, []);

  const ensureLocalized = async (id: string) => {
    if (id === 'en' || localizingRef.current.has(id) || localizedRef.current[id]) return;
    localizingRef.current.add(id);
    setTranslating(true);
    try {
      const res = await fetch('/api/ai/localize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: id,
          greeting: config.greeting,
          suggestions: config.suggestions,
        }),
      });
      const data = await res.json();
      if (data?.greeting && Array.isArray(data?.suggestions) && data.suggestions.length === config.suggestions.length) {
        const pack = { greeting: data.greeting as string, suggestions: data.suggestions as string[] };
        setLocalized((prev) => {
          const next = { ...prev, [id]: pack };
          try {
            if (typeof window !== 'undefined') window.localStorage.setItem(LOCALIZE_STORAGE_KEY, JSON.stringify(next));
          } catch {
            // storage full — session-only cache is fine
          }
          return next;
        });
      }
    } catch {
      // network/AI failure — English strings stay as fallback
    } finally {
      localizingRef.current.delete(id);
      setTranslating(false);
    }
  };

  const chooseLanguage = (id: string) => {
    setLanguage(id);
    if (typeof window !== 'undefined') window.localStorage.setItem(LANGUAGE_STORAGE_KEY, id);
    if (id !== 'en') void ensureLocalized(id);
    setMicNotice(null);
  };

  // Translate the widget strings when the panel opens in a local language
  useEffect(() => {
    if (open && language !== 'en' && !localized[language]) void ensureLocalized(language);
     
  }, [open, language, localized]);

  // Seed greeting whenever the widget opens (or portal changes while open).
  // While only the greeting is on screen, switching language re-seeds it live.
  useEffect(() => {
    if (open && messages.length <= 1) {
      setMessages([{ role: 'assistant', content: strings.greeting }]);
    }
     
  }, [open, portal, strings.greeting]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading, open]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || loading) return;
    const next: Message[] = [...messages, { role: 'user', content }];
    setMessages(next);
    setInput('');
    setLoading(true);
    // Capture (and consume) the voice-turn flag for this request only.
    const viaVoice = voiceTurnRef.current;
    voiceTurnRef.current = false;
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // drop the seeded greeting (always index 0) from the AI context
        body: JSON.stringify({
          portal,
          language,
          context: buildLiveSnapshot(portal),
          messages: next.slice(1).map(({ role, content }) => ({ role, content })),
        }),
      });
      const data = await res.json();
      const reply = data.reply || data.error || 'Sorry, please try again.';
      setMessages((m) => [...m, { role: 'assistant', content: reply }]);
      // Hands-free: the question came in by voice, so answer by voice.
      if (viaVoice) void speakMessage(next.length, reply);
    } catch {
      const offline = 'I could not reach the AI service. Please check your connection and try again.';
      setMessages((m) => [...m, { role: 'assistant', content: offline }]);
    } finally {
      setLoading(false);
    }
  };

  // ---- Voice input: record PCM → WAV → /api/ai/transcribe → input box ----
  const transcribeWav = async (wav: ArrayBuffer) => {
    setTranscribing(true);
    setMicNotice(null);
    try {
      let binary = '';
      const bytes = new Uint8Array(wav);
      const CHUNK = 0x8000;
      for (let i = 0; i < bytes.length; i += CHUNK) {
        binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
      }
      const res = await fetch('/api/ai/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioBase64: btoa(binary) }),
      });
      const data = await res.json();
      if (data?.text) {
        setInput((prev) => (prev.trim() ? `${prev.trim()} ${data.text}` : data.text));
        inputRef.current?.focus();
        voiceTurnRef.current = true; // answer this turn by voice too
      } else {
        setMicNotice(data?.error || 'Could not transcribe that — please try again or type.');
      }
    } catch {
      setMicNotice('Voice input is unavailable right now. Please type instead.');
    } finally {
      setTranscribing(false);
    }
  };

  const finishRecording = () => {
    const rec = recorderRef.current;
    recorderRef.current = null;
    setRecording(false);
    if (rec) {
      clearTimeout(rec.stopTimer);
      try {
        rec.processor.disconnect();
        rec.source.disconnect();
      } catch {
        // graph already torn down
      }
      rec.stream.getTracks().forEach((t) => t.stop());
      void rec.ctx.close().catch(() => {});
    }
    const total = pcmRef.current.reduce((a, c) => a + c.length, 0);
    if (total === 0) {
      setMicNotice('No sound captured — tap the mic and speak clearly.');
      return;
    }
    const merged = new Int16Array(total);
    let offset = 0;
    for (const chunk of pcmRef.current) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }
    pcmRef.current = [];
    void transcribeWav(encodeWav(merged, rec ? rec.ctx.sampleRate : 16000));
  };
  finishRecordingRef.current = finishRecording;

  const startRecording = async () => {
    if (recording || transcribing || loading) return;
    setMicNotice(null);
    try {
      const AudioCtx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = ctx.createMediaStreamSource(stream);
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      pcmRef.current = [];
      processor.onaudioprocess = (e) => {
        const input = e.inputBuffer.getChannelData(0);
        const chunk = new Int16Array(input.length);
        for (let i = 0; i < input.length; i++) {
          const s = Math.max(-1, Math.min(1, input[i]));
          chunk[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        pcmRef.current.push(chunk);
      };
      source.connect(processor);
      processor.connect(ctx.destination); // keeps the graph pulling on every browser
      const stopTimer = setTimeout(() => finishRecordingRef.current(), MAX_RECORD_MS);
      recorderRef.current = { ctx, stream, source, processor, stopTimer };
      setRecording(true);
    } catch {
      setMicNotice('Microphone unavailable. Please allow mic access or type your question.');
    }
  };

  // ---- Read a reply aloud (text-to-speech) ----
  const stopSpeaking = () => {
    audioRef.current?.pause();
    setTtsPlayingIdx(null);
  };

  const speakMessage = async (idx: number, text: string) => {
    if (ttsLoadingIdx !== null) return;
    stopSpeaking();
    setTtsLoadingIdx(idx);
    setMicNotice(null);
    try {
      // Cache hit → instant playback, no network round-trip.
      const key = `${language}|${text}`;
      let b64 = ttsCacheGet(key);
      if (!b64) {
        const res = await fetch('/api/ai/speak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, language }),
        });
        const data = await res.json();
        if (!data?.audioBase64) throw new Error(data?.error || 'TTS unavailable');
        b64 = data.audioBase64 as string;
        ttsCacheSet(key, b64);
      }
      const audio = new Audio(`data:audio/wav;base64,${b64}`);
      audio.onended = () => setTtsPlayingIdx(null);
      audioRef.current = audio;
      await audio.play();
      setTtsPlayingIdx(idx);
    } catch {
      setMicNotice('Could not read that aloud right now. Please try again.');
    } finally {
      setTtsLoadingIdx(null);
    }
  };

  return (
    <>
      {/* Floating action button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.4 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close Susu AI assistant' : 'Open Susu AI assistant'}
        className="fixed bottom-20 right-4 z-[70] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-600/30 lg:bottom-6 lg:right-6"
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X className="h-6 w-6" />
            </motion.span>
          ) : (
            <motion.span key="s" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <Sparkles className="h-6 w-6" />
            </motion.span>
          )}
        </AnimatePresence>
        {!open && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
            <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-white bg-amber-400" />
          </span>
        )}
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="fixed bottom-36 right-2 z-[69] flex h-[min(560px,72vh)] w-[min(400px,calc(100vw-1rem))] flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl lg:bottom-24 lg:right-6"
            role="dialog"
            aria-label="Susu AI chat"
          >
            {/* Header */}
            <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-3 text-white">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 backdrop-blur">
                <Bot className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-sm font-semibold">
                  Susu AI
                  <span className="rounded-full bg-amber-400/90 px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-emerald-950">Beta</span>
                </p>
                <p className="flex items-center gap-1 text-xs text-emerald-100">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
                  Online · Live data · {activeLanguage.label}
                </p>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close chat" className="rounded-full p-1.5 transition hover:bg-white/10">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-muted/40 px-3 py-4">
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-emerald-600 text-white'}`}>
                    {m.role === 'user' ? <User className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                  </div>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 shadow-sm ${
                      m.role === 'user'
                        ? 'rounded-tr-sm bg-primary text-primary-foreground'
                        : 'rounded-tl-sm border bg-card text-card-foreground'
                    }`}
                  >
                    <MessageBody text={m.content} />
                    {m.role === 'assistant' && (
                      <div className="mt-1.5 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => (ttsPlayingIdx === i ? stopSpeaking() : void speakMessage(i, m.content))}
                          disabled={ttsLoadingIdx === i}
                          aria-label={ttsPlayingIdx === i ? 'Stop reading aloud' : 'Read reply aloud'}
                          title={ttsPlayingIdx === i ? 'Stop reading aloud' : 'Read reply aloud'}
                          className="flex h-6 w-6 items-center justify-center rounded-full text-emerald-600 transition hover:bg-emerald-50 disabled:opacity-50 dark:hover:bg-emerald-950/40"
                        >
                          {ttsLoadingIdx === i ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : ttsPlayingIdx === i ? (
                            <Square className="h-3 w-3 fill-current" />
                          ) : (
                            <Volume2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {loading && (
                <div className="flex gap-2">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border bg-card px-4 py-3.5 shadow-sm">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="h-2 w-2 rounded-full bg-emerald-500"
                        animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Suggestions — wrap onto multiple rows so every prompt is visible
                and tappable inside the modal (no hidden horizontal scroll) */}
            {messages.length <= 1 && !loading && (
              <div className="flex flex-wrap gap-1.5 border-t bg-background px-3 py-2.5">
                {strings.suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-lg border bg-card px-2.5 py-1.5 text-left text-xs font-medium leading-snug text-foreground transition hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Reply language — Ghana languages for financial inclusion.
                Chips wrap so ALL six languages (incl. Twi) are visible and
                tappable instead of being cut off beyond a hidden scrollbar. */}
            <div className="border-t bg-background px-3 py-1.5" role="group" aria-label="Reply language">
              <div className="flex flex-wrap items-center gap-1">
                <Languages className="mr-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                {translating && (
                  <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                    <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                    Translating…
                  </span>
                )}
                {LANGUAGES.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => chooseLanguage(l.id)}
                    aria-pressed={language === l.id}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                      language === l.id
                        ? 'bg-emerald-600 text-white'
                        : 'border bg-card text-muted-foreground hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Voice notice */}
            {micNotice && (
              <p className="flex items-center gap-1.5 border-t bg-amber-50 px-3 py-1.5 text-[11px] font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {micNotice}
              </p>
            )}

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-center gap-2 border-t bg-background p-3"
            >
              <button
                type="button"
                onClick={() => (recording ? finishRecordingRef.current() : void startRecording())}
                disabled={transcribing || loading}
                aria-label={recording ? 'Stop voice recording' : 'Start voice input'}
                className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition disabled:opacity-40 ${
                  recording
                    ? 'bg-red-600 text-white shadow'
                    : 'border bg-card text-muted-foreground hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400'
                }`}
              >
                {recording && <span className="absolute inset-0 animate-ping rounded-xl bg-red-500/40" aria-hidden />}
                {recording ? <Square className="h-4 w-4 fill-current" /> : <Mic className="h-4 w-4" />}
              </button>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  recording
                    ? 'Listening… tap ⏹ when done'
                    : language === 'en'
                      ? 'Ask Susu AI anything…'
                      : `Ask Susu AI (${activeLanguage.label} or English)…`
                }
                className="h-10 min-w-0 flex-1 rounded-xl border bg-muted/50 px-3.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                disabled={loading}
              />
              {transcribing ? (
                <div
                  aria-label="Transcribing your voice"
                  role="status"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white"
                >
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : (
                <motion.button
                  type="submit"
                  whileTap={{ scale: 0.92 }}
                  disabled={!input.trim() || loading}
                  aria-label="Send message"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow transition disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                </motion.button>
              )}
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
