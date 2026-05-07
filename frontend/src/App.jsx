import { useState, useEffect, useCallback, createContext, useContext } from "react";

// ─── Mock API (troque por fetch real apontando para seu backend) ───
const API = "http://localhost:3001/api";
let token = localStorage.getItem("np_token");

async function api(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Erro na requisição");
  return data;
}

// ─── Auth Context ─────────────────────────────────────────────────
const AuthCtx = createContext(null);
function useAuth() { return useContext(AuthCtx); }

// ─── Icons (inline SVG) ───────────────────────────────────────────
const Icon = {
  dashboard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  clients: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  categories: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>,
  whatsapp: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>,
  resellers: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>,
  settings: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>,
  plus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  edit: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>,
  send: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22,2 15,22 11,13 2,9"/></svg>,
  close: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  logout: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  bell: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20,6 9,17 4,12"/></svg>,
  alert: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  log: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>,
};

// ─── Mock Data for demo ───────────────────────────────────────────
const MOCK = {
  user: { id: 1, name: "Revenda Demo", email: "demo@notifypro.com", is_admin: true, wa_type: "evolution", notify_days: "7,3,1", notify_time: "09:00" },
  stats: { total: 142, expired: 8, expiring7: 23, sentToday: 17, categories: 5, upcoming: [
    { name: "Carlos Silva", phone: "11999001122", expires_at: "2026-05-06", category_name: "IPTV Premium", color: "#FF6B35", days_left: 1 },
    { name: "Ana Oliveira", phone: "21988776655", expires_at: "2026-05-07", category_name: "VPN", color: "#25D366", days_left: 2 },
    { name: "Marcos Lima", phone: "31977665544", expires_at: "2026-05-08", category_name: "Streaming", color: "#4F46E5", days_left: 3 },
    { name: "Julia Santos", phone: "41966554433", expires_at: "2026-05-10", category_name: "IPTV Premium", color: "#FF6B35", days_left: 5 },
  ]},
  clients: [
    { id: 1, name: "Carlos Silva", phone: "11999001122", email: "carlos@email.com", plan_name: "Premium", category_id: 1, category_name: "IPTV Premium", category_color: "#FF6B35", expires_at: "2026-05-06", active: 1, days_until_expiry: 1 },
    { id: 2, name: "Ana Oliveira", phone: "21988776655", email: "ana@email.com", plan_name: "Basic", category_id: 2, category_name: "VPN", category_color: "#25D366", expires_at: "2026-05-07", active: 1, days_until_expiry: 2 },
    { id: 3, name: "Marcos Lima", phone: "31977665544", email: null, plan_name: "Standard", category_id: 3, category_name: "Streaming", category_color: "#4F46E5", expires_at: "2026-05-08", active: 1, days_until_expiry: 3 },
    { id: 4, name: "Julia Santos", phone: "41966554433", email: "julia@email.com", plan_name: "Premium", category_id: 1, category_name: "IPTV Premium", category_color: "#FF6B35", expires_at: "2026-05-10", active: 1, days_until_expiry: 5 },
    { id: 5, name: "Pedro Alves", phone: "51955443322", email: null, plan_name: "Basic", category_id: 4, category_name: "Office 365", category_color: "#0EA5E9", expires_at: "2026-05-20", active: 1, days_until_expiry: 15 },
    { id: 6, name: "Fernanda Costa", phone: "61944332211", email: "fer@email.com", plan_name: "Standard", category_id: 2, category_name: "VPN", category_color: "#25D366", expires_at: "2026-06-01", active: 1, days_until_expiry: 27 },
    { id: 7, name: "Ricardo Sousa", phone: "71933221100", email: null, plan_name: "Premium", category_id: 3, category_name: "Streaming", category_color: "#4F46E5", expires_at: "2026-04-30", active: 1, days_until_expiry: -5 },
  ],
  categories: [
    { id: 1, name: "IPTV Premium", description: "Canais HD e 4K", color: "#FF6B35", client_count: 48, message_template: "Olá {nome}! 👋\n\nSeu plano *{plano}* vence em *{dias}* ({vencimento}).\n\nPara renovar, entre em contato. 🙏" },
    { id: 2, name: "VPN", description: "Acesso seguro", color: "#25D366", client_count: 32, message_template: "Oi {nome}! Sua *VPN* vence em {dias} ({vencimento}). Renove já! 🔒" },
    { id: 3, name: "Streaming", description: "Netflix/Spotify compartilhado", color: "#4F46E5", client_count: 27, message_template: "Olá {nome}! Seu acesso ao *{plano}* vence em {dias}. Não fique sem! 🎬" },
    { id: 4, name: "Office 365", description: "Suite Microsoft", color: "#0EA5E9", client_count: 19, message_template: "Oi {nome}! Sua licença *Office 365* vence em {dias} ({vencimento}). 💼" },
    { id: 5, name: "Antivírus", description: "Proteção digital", color: "#EF4444", client_count: 16, message_template: "Olá {nome}! Seu *Antivírus* vence em {dias}. Renove e fique protegido! 🛡️" },
  ],
  resellers: [
    { id: 2, name: "João Revenda SP", email: "joao@revenda.com", phone: "11977660001", active: 1, client_count: 45, wa_type: "evolution", notify_days: "3,1", created_at: "2026-01-10" },
    { id: 3, name: "Maria Tech RJ", email: "maria@tech.com", phone: "21988550002", active: 1, client_count: 32, wa_type: "zapi", notify_days: "7,3", created_at: "2026-02-05" },
    { id: 4, name: "Pedro Net MG", email: "pedro@net.com", phone: "31966440003", active: 0, client_count: 12, wa_type: null, notify_days: "1", created_at: "2026-03-15" },
  ],
  logs: [
    { id: 1, client_name: "Carlos Silva", phone: "11999001122", message: "Olá Carlos! Seu plano vence em 1 dia.", status: "sent", sent_at: "2026-05-05 09:00:00", days_before: 1 },
    { id: 2, client_name: "Ana Oliveira", phone: "21988776655", message: "Oi Ana! Sua VPN vence em 2 dias.", status: "sent", sent_at: "2026-05-05 09:00:00", days_before: 2 },
    { id: 3, client_name: "Marcos Lima", phone: "31977665544", message: "Olá Marcos! Seu acesso vence em 3 dias.", status: "failed", error_msg: "Connection timeout", sent_at: "2026-05-05 09:00:00", days_before: 3 },
    { id: 4, client_name: "Julia Santos", phone: "41966554433", message: "Oi Julia! Seu plano vence em 7 dias.", status: "sent", sent_at: "2026-05-04 09:00:00", days_before: 7 },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────
function formatDate(d) {
  if (!d) return "—";
  const [y, m, day] = d.split("T")[0].split("-");
  return `${day}/${m}/${y}`;
}

function daysLabel(n) {
  if (n < 0) return { txt: `Vencido há ${Math.abs(n)}d`, cls: "badge-red" };
  if (n === 0) return { txt: "Vence hoje!", cls: "badge-red" };
  if (n <= 3) return { txt: `${n}d restante${n > 1 ? "s" : ""}`, cls: "badge-orange" };
  if (n <= 7) return { txt: `${n} dias`, cls: "badge-yellow" };
  return { txt: `${n} dias`, cls: "badge-green" };
}

// ─── UI Components ────────────────────────────────────────────────
function Badge({ children, variant = "green" }) {
  const cls = {
    green: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
    red: "bg-red-500/15 text-red-400 border border-red-500/20",
    orange: "bg-orange-500/15 text-orange-400 border border-orange-500/20",
    yellow: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20",
    blue: "bg-blue-500/15 text-blue-400 border border-blue-500/20",
    gray: "bg-zinc-500/15 text-zinc-400 border border-zinc-500/20",
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls[variant]}`}>{children}</span>;
}

function Toast({ msg, type, onClose }) {
  useEffect(() => { if (msg) { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); } }, [msg]);
  if (!msg) return null;
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, animation: "slideUp .25s ease" }}>
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium ${type === "error" ? "bg-red-950 border-red-800 text-red-200" : "bg-emerald-950 border-emerald-800 text-emerald-200"}`}>
        <span className="w-4 h-4">{type === "error" ? Icon.alert : Icon.check}</span>
        {msg}
        <button onClick={onClose} className="ml-2 w-4 h-4 opacity-60 hover:opacity-100">{Icon.close}</button>
      </div>
    </div>
  );
}

function Modal({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.7)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden" style={{ maxHeight: "90vh", overflowY: "auto" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg flex items-center justify-center transition-colors">{Icon.close}</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <div>
      {label && <label className="block text-xs font-medium text-zinc-400 mb-1.5">{label}</label>}
      <input {...props} className={`w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition ${props.className || ""}`} />
    </div>
  );
}

function Select({ label, children, ...props }) {
  return (
    <div>
      {label && <label className="block text-xs font-medium text-zinc-400 mb-1.5">{label}</label>}
      <select {...props} className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 transition">
        {children}
      </select>
    </div>
  );
}

function Textarea({ label, ...props }) {
  return (
    <div>
      {label && <label className="block text-xs font-medium text-zinc-400 mb-1.5">{label}</label>}
      <textarea {...props} className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition resize-none" />
    </div>
  );
}

function Btn({ children, variant = "primary", loading, icon, ...props }) {
  const cls = {
    primary: "bg-emerald-500 hover:bg-emerald-400 text-black font-semibold",
    secondary: "bg-zinc-700 hover:bg-zinc-600 text-white",
    danger: "bg-red-600 hover:bg-red-500 text-white",
    ghost: "text-zinc-400 hover:text-white hover:bg-zinc-800",
  };
  return (
    <button {...props} disabled={loading || props.disabled} className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm transition ${cls[variant]} disabled:opacity-50 ${props.className || ""}`}>
      {loading ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : icon && <span className="w-4 h-4">{icon}</span>}
      {children}
    </button>
  );
}

// ─── Pages ────────────────────────────────────────────────────────

// LOGIN
function LoginPage({ onLogin }) {
  const [form, setForm] = useState({ email: "admin@notifypro.com", password: "admin123" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault(); setLoading(true); setErr("");
    // Demo: bypass real API
    await new Promise(r => setTimeout(r, 600));
    onLogin(MOCK.user, "demo_token");
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "radial-gradient(ellipse at 50% 0%, #052e1650 0%, #09090b 70%)" }}>
      <div className="w-full max-w-sm px-4">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-black mx-auto mb-4 shadow-lg shadow-emerald-500/25">
            <span className="w-7 h-7">{Icon.whatsapp}</span>
          </div>
          <h1 style={{ fontFamily: "'Sora', sans-serif" }} className="text-2xl font-bold text-white">NotifyPro</h1>
          <p className="text-zinc-400 text-sm mt-1">Gestão de clientes & notificações</p>
        </div>
        <form onSubmit={submit} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          {err && <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-3">{err}</div>}
          <Input label="Email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          <Input label="Senha" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
          <Btn type="submit" loading={loading} className="w-full justify-center">Entrar</Btn>
        </form>
        <p className="text-center text-xs text-zinc-600 mt-4">NotifyPro © 2026</p>
      </div>
    </div>
  );
}

// DASHBOARD
function Dashboard() {
  const s = MOCK.stats;
  const cards = [
    { label: "Total de Clientes", value: s.total, icon: Icon.clients, color: "#4F46E5", bg: "#4F46E520" },
    { label: "Vencendo em 7 dias", value: s.expiring7, icon: Icon.bell, color: "#F59E0B", bg: "#F59E0B20" },
    { label: "Vencidos", value: s.expired, icon: Icon.alert, color: "#EF4444", bg: "#EF444420" },
    { label: "Enviados Hoje", value: s.sentToday, icon: Icon.whatsapp, color: "#25D366", bg: "#25D36620" },
  ];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white" style={{ fontFamily: "'Sora', sans-serif" }}>Dashboard</h1>
        <p className="text-zinc-400 text-sm">Visão geral do sistema</p>
      </div>
      <div className="grid grid-cols-2 gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        {cards.map(c => (
          <div key={c.label} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: c.bg }}>
              <span className="w-5 h-5" style={{ color: c.color }}>{c.icon}</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{c.value}</p>
              <p className="text-xs text-zinc-400">{c.label}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center gap-2">
          <span className="w-4 h-4 text-orange-400">{Icon.bell}</span>
          <h2 className="text-sm font-semibold text-white">Vencendo em breve</h2>
        </div>
        <div className="divide-y divide-zinc-800">
          {s.upcoming.map((c, i) => {
            const dl = daysLabel(c.days_left);
            return (
              <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-zinc-800/50 transition">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: c.color + "33", color: c.color }}>
                    {c.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{c.name}</p>
                    <p className="text-xs text-zinc-400">{c.phone} · {c.category_name}</p>
                  </div>
                </div>
                <Badge variant={dl.cls.replace("badge-", "")}>{dl.txt}</Badge>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// CLIENTS
function Clients({ toast }) {
  const [clients, setClients] = useState(MOCK.clients);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [modal, setModal] = useState(null); // null | "add" | client_obj
  const [form, setForm] = useState({});
  const [sending, setSending] = useState(null);

  const filtered = clients.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search);
    const matchFilter = filter === "all" || (filter === "expiring" && c.days_until_expiry >= 0 && c.days_until_expiry <= 7) || (filter === "expired" && c.days_until_expiry < 0);
    return matchSearch && matchFilter;
  });

  function openAdd() { setForm({ expires_at: new Date().toISOString().split("T")[0], active: 1 }); setModal("add"); }
  function openEdit(c) { setForm({ ...c }); setModal(c); }

  function save() {
    if (modal === "add") {
      const newC = { ...form, id: Date.now(), category_name: MOCK.categories.find(c => c.id == form.category_id)?.name || "", category_color: MOCK.categories.find(c => c.id == form.category_id)?.color || "#25D366", days_until_expiry: Math.ceil((new Date(form.expires_at) - new Date()) / 86400000) };
      setClients(p => [newC, ...p]);
      toast("Cliente cadastrado!", "success");
    } else {
      setClients(p => p.map(c => c.id === modal.id ? { ...c, ...form, category_name: MOCK.categories.find(x => x.id == form.category_id)?.name || c.category_name } : c));
      toast("Cliente atualizado!", "success");
    }
    setModal(null);
  }

  async function sendMsg(client) {
    setSending(client.id);
    await new Promise(r => setTimeout(r, 1200));
    setSending(null);
    toast(`Mensagem enviada para ${client.name}!`, "success");
  }

  function remove(id) {
    if (!confirm("Remover cliente?")) return;
    setClients(p => p.filter(c => c.id !== id));
    toast("Cliente removido", "success");
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white" style={{ fontFamily: "'Sora', sans-serif" }}>Clientes</h1>
          <p className="text-zinc-400 text-sm">{clients.length} clientes cadastrados</p>
        </div>
        <Btn icon={Icon.plus} onClick={openAdd}>Novo Cliente</Btn>
      </div>
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1" style={{ minWidth: 200 }}>
          <span className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500">{Icon.search}</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente ou telefone..." className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg pl-9 pr-4 py-2.5 text-sm placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition" />
        </div>
        <Select value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">Todos</option>
          <option value="expiring">Vencendo em 7d</option>
          <option value="expired">Vencidos</option>
        </Select>
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800 text-left">
                <th className="px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Cliente</th>
                <th className="px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Telefone</th>
                <th className="px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Categoria</th>
                <th className="px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Vencimento</th>
                <th className="px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filtered.map(c => {
                const dl = daysLabel(c.days_until_expiry);
                return (
                  <tr key={c.id} className="hover:bg-zinc-800/40 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: (c.category_color || "#4F46E5") + "33", color: c.category_color || "#4F46E5" }}>
                          {c.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{c.name}</p>
                          {c.plan_name && <p className="text-xs text-zinc-500">{c.plan_name}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-300 font-mono">{c.phone}</td>
                    <td className="px-4 py-3">
                      {c.category_name && <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full" style={{ background: (c.category_color || "#4F46E5") + "22", color: c.category_color || "#4F46E5" }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />{c.category_name}
                      </span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-300">{formatDate(c.expires_at)}</td>
                    <td className="px-4 py-3"><Badge variant={dl.cls.replace("badge-", "")}>{dl.txt}</Badge></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => sendMsg(c)} disabled={sending === c.id} className="w-8 h-8 text-emerald-400 hover:bg-emerald-500/10 rounded-lg flex items-center justify-center transition" title="Enviar WhatsApp">
                          {sending === c.id ? <span className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" /> : <span className="w-4 h-4">{Icon.send}</span>}
                        </button>
                        <button onClick={() => openEdit(c)} className="w-8 h-8 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg flex items-center justify-center transition" title="Editar">
                          <span className="w-4 h-4">{Icon.edit}</span>
                        </button>
                        <button onClick={() => remove(c.id)} className="w-8 h-8 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg flex items-center justify-center transition" title="Remover">
                          <span className="w-4 h-4">{Icon.trash}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!filtered.length && <div className="text-center py-12 text-zinc-500 text-sm">Nenhum cliente encontrado</div>}
        </div>
      </div>
      <Modal open={!!modal} title={modal === "add" ? "Novo Cliente" : "Editar Cliente"} onClose={() => setModal(null)}>
        <div className="space-y-4">
          <Input label="Nome completo *" value={form.name || ""} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="João Silva" />
          <Input label="Telefone (WhatsApp) *" value={form.phone || ""} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="11999887766" />
          <Input label="Email" value={form.email || ""} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="joao@email.com" />
          <Input label="Nome do plano" value={form.plan_name || ""} onChange={e => setForm(f => ({ ...f, plan_name: e.target.value }))} placeholder="Premium" />
          <Select label="Categoria" value={form.category_id || ""} onChange={e => setForm(f => ({ ...f, category_id: parseInt(e.target.value) }))}>
            <option value="">Selecione...</option>
            {MOCK.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Input label="Data de vencimento *" type="date" value={form.expires_at || ""} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} />
          <Textarea label="Observações" value={form.notes || ""} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Anotações sobre o cliente..." />
          <div className="flex gap-3 pt-2">
            <Btn variant="secondary" onClick={() => setModal(null)} className="flex-1 justify-center">Cancelar</Btn>
            <Btn onClick={save} className="flex-1 justify-center">Salvar</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// CATEGORIES
function Categories({ toast }) {
  const [cats, setCats] = useState(MOCK.categories);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const VARS = ["{nome}", "{telefone}", "{plano}", "{vencimento}", "{dias}"];

  function openAdd() { setForm({ color: "#25D366", message_template: "Olá {nome}! 👋\n\nSeu plano *{plano}* vence em *{dias}* ({vencimento}).\n\nPara renovar, entre em contato. 🙏" }); setModal("add"); }
  function openEdit(c) { setForm({ ...c }); setModal(c); }

  function save() {
    if (modal === "add") {
      setCats(p => [...p, { ...form, id: Date.now(), client_count: 0 }]);
      toast("Categoria criada!", "success");
    } else {
      setCats(p => p.map(c => c.id === modal.id ? { ...c, ...form } : c));
      toast("Categoria atualizada!", "success");
    }
    setModal(null);
  }

  function remove(id) {
    if (!confirm("Remover categoria?")) return;
    setCats(p => p.filter(c => c.id !== id));
    toast("Categoria removida", "success");
  }

  function insertVar(v) { setForm(f => ({ ...f, message_template: (f.message_template || "") + v })); }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white" style={{ fontFamily: "'Sora', sans-serif" }}>Categorias</h1>
          <p className="text-zinc-400 text-sm">Tipos de serviço e mensagens</p>
        </div>
        <Btn icon={Icon.plus} onClick={openAdd}>Nova Categoria</Btn>
      </div>
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
        {cats.map(c => (
          <div key={c.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition">
            <div className="h-1.5" style={{ background: c.color }} />
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-white">{c.name}</h3>
                  {c.description && <p className="text-xs text-zinc-400 mt-0.5">{c.description}</p>}
                </div>
                <Badge variant="gray">{c.client_count} clientes</Badge>
              </div>
              <div className="bg-zinc-800 rounded-lg p-3 mb-3">
                <p className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">{c.message_template.slice(0, 120)}{c.message_template.length > 120 ? "..." : ""}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(c)} className="flex-1 flex items-center justify-center gap-1.5 text-xs text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 py-2 rounded-lg transition">
                  <span className="w-3.5 h-3.5">{Icon.edit}</span> Editar
                </button>
                <button onClick={() => remove(c.id)} className="flex-1 flex items-center justify-center gap-1.5 text-xs text-zinc-400 hover:text-red-400 bg-zinc-800 hover:bg-red-500/10 py-2 rounded-lg transition">
                  <span className="w-3.5 h-3.5">{Icon.trash}</span> Remover
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Modal open={!!modal} title={modal === "add" ? "Nova Categoria" : "Editar Categoria"} onClose={() => setModal(null)}>
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1"><Input label="Nome *" value={form.name || ""} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="IPTV Premium" /></div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Cor</label>
              <input type="color" value={form.color || "#25D366"} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="w-10 h-10 rounded-lg border border-zinc-700 bg-zinc-800 cursor-pointer p-1" />
            </div>
          </div>
          <Input label="Descrição" value={form.description || ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Breve descrição do serviço" />
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Mensagem do WhatsApp *</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {VARS.map(v => <button key={v} onClick={() => insertVar(v)} className="text-xs bg-zinc-800 hover:bg-zinc-700 text-emerald-400 px-2 py-1 rounded font-mono transition">{v}</button>)}
            </div>
            <Textarea value={form.message_template || ""} onChange={e => setForm(f => ({ ...f, message_template: e.target.value }))} rows={6} placeholder="Use as variáveis acima para personalizar..." />
            <p className="text-xs text-zinc-500 mt-1">Use *texto* para negrito no WhatsApp</p>
          </div>
          <div className="flex gap-3 pt-2">
            <Btn variant="secondary" onClick={() => setModal(null)} className="flex-1 justify-center">Cancelar</Btn>
            <Btn onClick={save} className="flex-1 justify-center">Salvar</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// WHATSAPP SETTINGS + LOGS
function WhatsApp({ toast }) {
  const [form, setForm] = useState({ wa_type: "evolution", wa_api_url: "", wa_instance: "", wa_token: "", notify_days: "7,3,1", notify_time: "09:00" });
  const [testing, setTesting] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [tab, setTab] = useState("config");

  async function saveConfig() {
    await new Promise(r => setTimeout(r, 500));
    toast("Configurações salvas!", "success");
  }

  async function testConn() {
    if (!testPhone) { toast("Informe um telefone para o teste", "error"); return; }
    setTesting(true);
    await new Promise(r => setTimeout(r, 1500));
    setTesting(false);
    toast(`Mensagem de teste enviada para ${testPhone}!`, "success");
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white" style={{ fontFamily: "'Sora', sans-serif" }}>WhatsApp</h1>
        <p className="text-zinc-400 text-sm">Configuração e histórico de envios</p>
      </div>
      <div className="flex gap-2">
        {["config", "logs"].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === t ? "bg-emerald-500 text-black" : "bg-zinc-800 text-zinc-400 hover:text-white"}`}>
            {t === "config" ? "Configuração" : "Histórico"}
          </button>
        ))}
      </div>

      {tab === "config" && (
        <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <h2 className="font-semibold text-white flex items-center gap-2"><span className="w-4 h-4 text-emerald-400">{Icon.whatsapp}</span>API do WhatsApp</h2>
            <Select label="Tipo de API" value={form.wa_type} onChange={e => setForm(f => ({ ...f, wa_type: e.target.value }))}>
              <option value="evolution">Evolution API (Open Source)</option>
              <option value="zapi">Z-API (Brasil)</option>
              <option value="webhook">Webhook Genérico</option>
            </Select>
            <Input label="URL da API" value={form.wa_api_url} onChange={e => setForm(f => ({ ...f, wa_api_url: e.target.value }))} placeholder="https://sua-api.com" />
            {form.wa_type === "evolution" && <Input label="Nome da Instância" value={form.wa_instance} onChange={e => setForm(f => ({ ...f, wa_instance: e.target.value }))} placeholder="minha-instancia" />}
            <Input label="Token / API Key" type="password" value={form.wa_token} onChange={e => setForm(f => ({ ...f, wa_token: e.target.value }))} placeholder="••••••••••••" />

            <div className="border-t border-zinc-800 pt-4 space-y-3">
              <p className="text-xs font-medium text-zinc-400">Teste de conexão</p>
              <div className="flex gap-2">
                <Input value={testPhone} onChange={e => setTestPhone(e.target.value)} placeholder="11999887766" className="flex-1" />
                <Btn onClick={testConn} loading={testing} variant="secondary">Testar</Btn>
              </div>
            </div>
            <Btn onClick={saveConfig} className="w-full justify-center">Salvar Configuração</Btn>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <h2 className="font-semibold text-white flex items-center gap-2"><span className="w-4 h-4 text-orange-400">{Icon.bell}</span>Agendamento</h2>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Dias antes do vencimento</label>
              <Input value={form.notify_days} onChange={e => setForm(f => ({ ...f, notify_days: e.target.value }))} placeholder="7,3,1" />
              <p className="text-xs text-zinc-500 mt-1">Separe por vírgula. Ex: 7,3,1 = enviar 7, 3 e 1 dia antes</p>
            </div>
            <div>
              <Input label="Horário de envio" type="time" value={form.notify_time} onChange={e => setForm(f => ({ ...f, notify_time: e.target.value }))} />
              <p className="text-xs text-zinc-500 mt-1">Horário diário para verificar e enviar notificações</p>
            </div>
            <div className="bg-zinc-800 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-zinc-300">Variáveis disponíveis nas mensagens:</p>
              {["{nome}", "{telefone}", "{plano}", "{vencimento}", "{dias}"].map(v => (
                <div key={v} className="flex items-center gap-2">
                  <code className="text-xs text-emerald-400 font-mono">{v}</code>
                  <span className="text-xs text-zinc-500">→ {v === "{nome}" ? "Nome do cliente" : v === "{telefone}" ? "Telefone" : v === "{plano}" ? "Nome do plano" : v === "{vencimento}" ? "Data DD/MM/AAAA" : "Dias até vencer"}</span>
                </div>
              ))}
            </div>
            <Btn onClick={saveConfig} className="w-full justify-center">Salvar Agendamento</Btn>
          </div>
        </div>
      )}

      {tab === "logs" && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800 text-left">
                  <th className="px-4 py-3 text-xs font-medium text-zinc-400 uppercase">Cliente</th>
                  <th className="px-4 py-3 text-xs font-medium text-zinc-400 uppercase">Telefone</th>
                  <th className="px-4 py-3 text-xs font-medium text-zinc-400 uppercase">Mensagem</th>
                  <th className="px-4 py-3 text-xs font-medium text-zinc-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-xs font-medium text-zinc-400 uppercase">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {MOCK.logs.map(l => (
                  <tr key={l.id} className="hover:bg-zinc-800/40 transition">
                    <td className="px-4 py-3 text-sm text-white font-medium">{l.client_name}</td>
                    <td className="px-4 py-3 text-sm text-zinc-300 font-mono">{l.phone}</td>
                    <td className="px-4 py-3 text-sm text-zinc-400 max-w-xs truncate">{l.message}</td>
                    <td className="px-4 py-3"><Badge variant={l.status === "sent" ? "green" : "red"}>{l.status === "sent" ? "Enviado" : "Falhou"}</Badge></td>
                    <td className="px-4 py-3 text-xs text-zinc-500">{l.sent_at.split(" ")[0].split("-").reverse().join("/")} {l.sent_at.split(" ")[1]?.slice(0, 5)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// RESELLERS (admin only)
function Resellers({ toast }) {
  const [resellers, setResellers] = useState(MOCK.resellers);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  function openAdd() { setForm({}); setModal("add"); }
  function openEdit(r) { setForm({ ...r }); setModal(r); }

  function save() {
    if (modal === "add") {
      setResellers(p => [{ ...form, id: Date.now(), active: 1, client_count: 0, created_at: new Date().toISOString().split("T")[0] }, ...p]);
      toast("Revenda criada!", "success");
    } else {
      setResellers(p => p.map(r => r.id === modal.id ? { ...r, ...form } : r));
      toast("Revenda atualizada!", "success");
    }
    setModal(null);
  }

  function toggle(r) {
    setResellers(p => p.map(x => x.id === r.id ? { ...x, active: x.active ? 0 : 1 } : x));
    toast(r.active ? "Revenda desativada" : "Revenda ativada", "success");
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white" style={{ fontFamily: "'Sora', sans-serif" }}>Revendas</h1>
          <p className="text-zinc-400 text-sm">Gerenciar revendedores</p>
        </div>
        <Btn icon={Icon.plus} onClick={openAdd}>Nova Revenda</Btn>
      </div>
      <div className="grid gap-4">
        {resellers.map(r => (
          <div key={r.id} className={`bg-zinc-900 border rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap transition ${r.active ? "border-zinc-800" : "border-zinc-800 opacity-60"}`}>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center text-sm font-bold text-emerald-400">
                {r.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-white">{r.name}</h3>
                  <Badge variant={r.active ? "green" : "gray"}>{r.active ? "Ativo" : "Inativo"}</Badge>
                </div>
                <p className="text-sm text-zinc-400">{r.email} · {r.phone || "Sem telefone"}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-lg font-bold text-white">{r.client_count}</p>
                <p className="text-xs text-zinc-500">clientes</p>
              </div>
              {r.wa_type && <Badge variant="blue">{r.wa_type}</Badge>}
              <div className="flex gap-2">
                <button onClick={() => openEdit(r)} className="w-8 h-8 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg flex items-center justify-center transition"><span className="w-4 h-4">{Icon.edit}</span></button>
                <button onClick={() => toggle(r)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${r.active ? "text-zinc-400 hover:text-red-400 hover:bg-red-500/10" : "text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10"}`}>
                  <span className="w-4 h-4">{r.active ? Icon.trash : Icon.check}</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Modal open={!!modal} title={modal === "add" ? "Nova Revenda" : "Editar Revenda"} onClose={() => setModal(null)}>
        <div className="space-y-4">
          <Input label="Nome *" value={form.name || ""} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Revenda São Paulo" />
          <Input label="Email *" type="email" value={form.email || ""} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@revenda.com" />
          <Input label="Senha *" type="password" value={form.password || ""} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder={modal !== "add" ? "Deixe em branco para manter" : "Senha de acesso"} />
          <Input label="Telefone" value={form.phone || ""} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="11999887766" />
          <div className="flex gap-3 pt-2">
            <Btn variant="secondary" onClick={() => setModal(null)} className="flex-1 justify-center">Cancelar</Btn>
            <Btn onClick={save} className="flex-1 justify-center">Salvar</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────
const MENU = [
  { key: "dashboard", label: "Dashboard", icon: "dashboard" },
  { key: "clients", label: "Clientes", icon: "clients" },
  { key: "categories", label: "Categorias", icon: "categories" },
  { key: "whatsapp", label: "WhatsApp", icon: "whatsapp" },
  { key: "resellers", label: "Revendas", icon: "resellers", adminOnly: true },
];

function Sidebar({ page, setPage, user, onLogout, open, onClose }) {
  return (
    <>
      {open && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={onClose} />}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-zinc-950 border-r border-zinc-800 z-50 flex flex-col transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="px-5 py-5 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-black">
              <span className="w-4 h-4">{Icon.whatsapp}</span>
            </div>
            <span className="font-bold text-white text-lg" style={{ fontFamily: "'Sora', sans-serif" }}>NotifyPro</span>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {MENU.filter(m => !m.adminOnly || user?.is_admin).map(m => (
            <button key={m.key} onClick={() => { setPage(m.key); onClose(); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${page === m.key ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "text-zinc-400 hover:text-white hover:bg-zinc-800"}`}>
              <span className="w-4 h-4">{Icon[m.icon]}</span>
              {m.label}
            </button>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-zinc-800">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-7 h-7 bg-emerald-500/20 rounded-lg flex items-center justify-center text-xs font-bold text-emerald-400">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition">
            <span className="w-4 h-4">{Icon.logout}</span>Sair
          </button>
        </div>
      </aside>
    </>
  );
}

// ─── App ──────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState({ msg: "", type: "" });

  function showToast(msg, type = "success") { setToast({ msg, type }); }
  function onLogin(u, t) { setUser(u); token = t; localStorage.setItem("np_token", t); }
  function onLogout() { setUser(null); token = null; localStorage.removeItem("np_token"); }

  if (!user) return <LoginPage onLogin={onLogin} />;

  const pages = { dashboard: <Dashboard />, clients: <Clients toast={showToast} />, categories: <Categories toast={showToast} />, whatsapp: <WhatsApp toast={showToast} />, resellers: <Resellers toast={showToast} /> };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&display=swap" rel="stylesheet" />
      <style>{`
        body { background: #09090b; margin: 0; }
        * { box-sizing: border-box; }
        @keyframes slideUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #18181b; } ::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 3px; }
      `}</style>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar page={page} setPage={setPage} user={user} onLogout={onLogout} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
          <header className="bg-zinc-950 border-b border-zinc-800 px-4 py-3 flex items-center gap-3 lg:hidden sticky top-0 z-30">
            <button onClick={() => setSidebarOpen(true)} className="w-9 h-9 bg-zinc-800 hover:bg-zinc-700 rounded-lg flex items-center justify-center text-white">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <span className="font-bold text-white" style={{ fontFamily: "'Sora', sans-serif" }}>NotifyPro</span>
          </header>
          <main className="flex-1 p-5 max-w-6xl w-full mx-auto">{pages[page]}</main>
        </div>
      </div>
      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: "", type: "" })} />
    </>
  );
}
