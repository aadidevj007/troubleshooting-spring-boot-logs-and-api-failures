import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import {
  Activity, AlertTriangle, BookOpen, Boxes, Check, ChevronRight, Copy, Database,
  FlaskConical, Gauge, Menu, Network, Plus, RefreshCw, Search, Send, Terminal, X,
} from "lucide-react";
import { isAllowedEndpoint, isSafeApiOrigin } from "./apiSecurity";

const API = import.meta.env.VITE_API_URL || "http://localhost:8081";
const API_ORIGIN = new URL(API, window.location.origin);
if (!isSafeApiOrigin(API)) throw new Error("The API must point to a local application origin.");

type Student = { id: number; name: string; email: string };
type DbStatus = { connected: boolean; host: string; port: number; checkedAt: string; message: string };
type AppHealth = { service: string; status: string; checkedAt: string };
type DiagnosticResult = {
  scenario: string; classification: string; simulated: boolean; evidence: string;
  probableCause: string; recommendedFix: string; timestamp: string;
};
type Endpoint = { method: "GET" | "POST"; path: string; label: string; body: string };
type ApiResponse<T> = { data: T; status: number; headers: Record<string, string>; duration: number };
type RequestActivity = { id: string; method: string; path: string; status: number; duration: number; at: string };
type EventDetail =
  | { kind: "database"; label: string; title: string; meta: string }
  | { kind: "request"; label: string; title: string; meta: string; method: "GET" | "POST"; path: string }
  | { kind: "simulation"; label: string; title: string; meta: string; scenario: string };

const ENDPOINTS: Endpoint[] = [
  { method: "GET", path: "/api/students", label: "List students", body: "" },
  { method: "GET", path: "/api/students/1", label: "Get student #1", body: "" },
  { method: "GET", path: "/api/diagnostics/database", label: "Live database check", body: "" },
  { method: "POST", path: "/api/diagnostics/scenarios", label: "Run safe simulation", body: '{"scenario":"WRONG_HOST"}' },
  { method: "POST", path: "/api/students", label: "Create student", body: '{"name":"Noah Patel","email":"noah.patel@example.com"}' },
];
const SCENARIOS = [
  { id: "WRONG_HOST", title: "Wrong database hostname", classification: "DNS FAILURE", text: "Simulate a hostname that is not resolvable." },
  { id: "WRONG_PASSWORD", title: "Wrong database password", classification: "AUTH FAILURE", text: "Simulate MySQL rejecting invalid credentials." },
  { id: "DB_UNAVAILABLE", title: "Database unavailable", classification: "AVAILABILITY", text: "Simulate a database that is stopped or unhealthy." },
  { id: "API_NOT_FOUND", title: "API route not found", classification: "ROUTING", text: "Simulate an unregistered application route." },
];

class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

async function request<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const endpoint = new URL(path, API_ORIGIN);
  const method = (options?.method || "GET") as string;
  if (endpoint.origin !== API_ORIGIN.origin || !isAllowedEndpoint(method, endpoint.pathname)) {
    throw new ApiError(0, "This endpoint is not available in the local API allowlist.");
  }
  const started = performance.now();
  let response: Response;
  try {
    response = await fetch(endpoint, {
      ...options,
      headers: { Accept: "application/json", "Content-Type": "application/json", ...(options?.headers || {}) },
    });
  } catch {
    throw new ApiError(0, "Network failure: the local API could not be reached.");
  }
  const body = await response.json().catch(() => ({}));
  const headers = Object.fromEntries(response.headers.entries());
  const duration = Math.round(performance.now() - started);
  if (!response.ok) throw new ApiError(response.status, `${response.status} ${response.statusText}: ${body.message || "The API request failed"}`);
  return { data: body as T, status: response.status, headers, duration };
}

type ConsoleContextValue = {
  activity: RequestActivity[];
  record: (entry: Omit<RequestActivity, "id" | "at">) => void;
};
const ConsoleContext = createContext<ConsoleContextValue>({ activity: [], record: () => undefined });
const useConsole = () => useContext(ConsoleContext);

function Shell() {
  const [mobile, setMobile] = useState(false);
  const [activity, setActivity] = useState<RequestActivity[]>([]);
  const record = (entry: Omit<RequestActivity, "id" | "at">) => setActivity((items) => [
    { ...entry, id: crypto.randomUUID(), at: new Date().toISOString() }, ...items,
  ].slice(0, 20));
  const nav = [
    { to: "/", label: "Overview", icon: Gauge },
    { to: "/explorer", label: "API Explorer", icon: Terminal },
    { to: "/database", label: "Database diagnostics", icon: Database },
    { to: "/logs", label: "Request activity", icon: BookOpen },
    { to: "/lab", label: "Failure lab", icon: FlaskConical },
    { to: "/students", label: "Student records", icon: Boxes },
  ];
  return <ConsoleContext.Provider value={{ activity, record }}><div className="shell">
    <aside className={mobile ? "sidebar open" : "sidebar"}>
      <div className="brand"><div className="brand-mark">Q34</div><div><strong>REDLINE</strong><span>OPS CONSOLE</span></div><button className="mobile-close" aria-label="Close navigation" onClick={() => setMobile(false)}><X size={18}/></button></div>
      <div className="workspace"><span className="dot green"/> LOCAL / DOCKER <span className="static-label">STATIC</span></div>
      <nav>{nav.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === "/"} onClick={() => setMobile(false)} className={({ isActive }) => isActive ? "active" : ""}><Icon size={17}/>{label}</NavLink>)}</nav>
      <div className="sidebar-foot"><div className="live"><span className="pulse"/> SESSION CONSOLE</div><small>Q34 / v1.0.0<br/>Spring Boot + MySQL</small></div>
    </aside>
    <main><header><button className="mobile-menu" aria-label="Open navigation" onClick={() => setMobile(true)}><Menu/></button><div><span className="eyebrow">SYSTEM / DIAGNOSTICS</span><h1>Container operations center</h1></div><div className="header-status"><span className="dot green"/> LOCAL ONLY <span className="divider"/> <span className="muted">LIVE TELEMETRY</span></div></header>
      <Routes><Route path="/" element={<Overview/>}/><Route path="/explorer" element={<Explorer/>}/><Route path="/database" element={<DatabasePage/>}/><Route path="/logs" element={<Logs/>}/><Route path="/lab" element={<FailureLab/>}/><Route path="/students" element={<Students/>}/></Routes>
    </main>
  </div></ConsoleContext.Provider>;
}

function Page({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return <div className="page"><div className="page-title"><div><span className="eyebrow">Q34 / CONTROL PLANE</span><h2>{title}</h2><p>{subtitle}</p></div></div>{children}</div>;
}
function ErrorBox({ message }: { message: string }) { return <div className="error-box" role="alert"><AlertTriangle size={18}/><span>{message}</span></div>; }
function LoadingCard({ label = "Loading live telemetry…" }: { label?: string }) { return <div className="card loading-card" aria-live="polite"><span className="skeleton wide"/><span className="skeleton medium"/><p>{label}</p></div>; }
function EmptyState({ title, message }: { title: string; message: string }) { return <div className="empty-state"><Activity size={20}/><strong>{title}</strong><p>{message}</p></div>; }

function Overview() {
  const { activity, record } = useConsole();
  const navigate = useNavigate();
  const [db, setDb] = useState<DbStatus>(); const [health, setHealth] = useState<AppHealth>(); const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const load = async () => {
    setLoading(true); setError("");
    const errors: string[] = [];
    const [healthResult, studentResult, dbResult] = await Promise.allSettled([
      request<AppHealth>("/actuator/health"), request<Student[]>("/api/students"), request<DbStatus>("/api/diagnostics/database"),
    ]);
    if (healthResult.status === "fulfilled") { setHealth(healthResult.value.data); record({ method: "GET", path: "/actuator/health", status: healthResult.value.status, duration: healthResult.value.duration }); } else errors.push("API health is unavailable.");
    if (studentResult.status === "fulfilled") { setStudents(studentResult.value.data); record({ method: "GET", path: "/api/students", status: studentResult.value.status, duration: studentResult.value.duration }); } else errors.push("Student data is unavailable.");
    if (dbResult.status === "fulfilled") { setDb(dbResult.value.data); record({ method: "GET", path: "/api/diagnostics/database", status: dbResult.value.status, duration: dbResult.value.duration }); } else errors.push("Database telemetry is unavailable.");
    setError(errors.join(" ")); setLoading(false);
  };
  useEffect(() => { void load(); }, []);
  const events: EventDetail[] = [
    ...(db ? [{ kind: "database" as const, label: "Live check", title: db.message, meta: `Checked ${new Date(db.checkedAt).toLocaleString()}` }] : []),
    ...(activity.slice(0, 3).map((item) => ({ kind: "request" as const, label: "Observed request", title: `${item.method} ${item.path}`, meta: `${item.status} · ${item.duration} ms · ${new Date(item.at).toLocaleTimeString()}`, method: item.method as "GET" | "POST", path: item.path }))),
    { kind: "simulation", label: "Simulation", title: "Failure scenarios available", meta: "Deterministic simulations · no live fault", scenario: "WRONG_HOST" },
  ];
  return <Page title="Overview" subtitle="Live health and service telemetry from the local API"><div className="actions"><button className="button ghost" disabled={loading} onClick={() => void load()}><RefreshCw size={15} className={loading ? "spin" : ""}/> {loading ? "Refreshing…" : "Refresh telemetry"}</button></div>
    {error && <ErrorBox message={error}/>}
    {loading && !health ? <div className="hero-grid"><LoadingCard/><LoadingCard label="Checking configured MySQL datasource…"/></div> : <div className="hero-grid"><section className="hero-card"><div className="hero-title"><span className="status-icon"><Activity/></span><div><span className="eyebrow">API STATUS</span><h2>{health?.status === "UP" ? "Operational" : "Unknown"}</h2></div><span className={`badge ${health?.status === "UP" ? "success" : "warning"}`}>● {health?.status === "UP" ? "HEALTHY" : "UNKNOWN"}</span></div><div className="metric-row"><div><b>{health?.status === "UP" ? "UP" : "—"}</b><span>Last observed status</span></div><div><b>{activity.find((item) => item.path === "/actuator/health")?.duration ? `${activity.find((item) => item.path === "/actuator/health")?.duration} ms` : "—"}</b><span>Measured latency</span></div><div><b>{health ? students.length : "—"}</b><span>Records visible</span></div></div></section><section className="card db-card"><div className="card-heading"><div><span className="eyebrow">DATABASE</span><h3>Configured MySQL</h3></div><Database size={22}/></div><div className="db-state"><span className={db?.connected ? "status-dot" : "status-dot danger"}/><strong>{db ? (db.connected ? "Connected" : "Unavailable") : "Unknown"}</strong></div><p>{db ? `${db.host}:${db.port} · checked ${new Date(db.checkedAt).toLocaleTimeString()}` : "No live database telemetry available."}</p></section></div>}
    <div className="section-head"><div><span className="eyebrow">SERVICE DEPENDENCIES</span><h2>Observed runtime map</h2></div></div><div className="service-grid"><Service name="app" desc="Spring Boot API · observed through HTTP" status={health?.status === "UP" ? "Responding" : "Unknown"} icon={<Activity/>}/><Service name="mysql" desc="JDBC datasource · SELECT 1" status={db ? (db.connected ? "Healthy" : "Unavailable") : "Unknown"} icon={<Database/>}/><Service name="q34_app_network" desc="Docker network · not monitored by API" status="Not monitored" icon={<Network/>}/></div>
    <div className="section-head"><div><span className="eyebrow">RECENT EVENTS</span><h2>Observed and simulated activity</h2></div><span className="muted">{events.length} entries</span></div><EventList events={events} onNavigate={(event) => { if (event.kind === "database") navigate("/database"); else if (event.kind === "request") navigate("/explorer", { state: { method: event.method, path: event.path } }); else navigate("/lab", { state: { scenario: event.scenario } }); }}/></Page>;
}
function Service({ name, desc, status, icon }: { name: string; desc: string; status: string; icon: ReactNode }) { const healthy = status === "Healthy" || status === "Responding"; return <div className="card service"><div className="service-icon">{icon}</div><div><strong>{name}</strong><p>{desc}</p></div><span className="service-status"><span className={`dot ${healthy ? "green" : "muted-dot"}`}/>{status}</span></div>; }
function EventList({ events, onNavigate }: { events: EventDetail[]; onNavigate: (event: EventDetail) => void }) {
  const [filter, setFilter] = useState("");
  const filtered = events.filter((event) => `${event.title} ${event.meta} ${event.label}`.toLowerCase().includes(filter.toLowerCase()));
  return <div className="event-panel"><div className="event-filter"><Search size={15}/><input aria-label="Filter events" placeholder="Filter events…" value={filter} onChange={(e) => setFilter(e.target.value)}/></div>{filtered.length ? filtered.map((event, index) => <div className="event" key={`${event.kind}-${event.title}-${index}`}><span className={`event-line ${event.kind === "simulation" ? "red" : "green"}`}/><div><span className="event-label">{event.label}</span><strong>{event.title}</strong><p>{event.meta}</p></div><button className="event-arrow" aria-label={`Open ${event.title}`} title={`Open ${event.title}`} onClick={() => onNavigate(event)}><ChevronRight size={18}/></button></div>) : <EmptyState title="No matching events" message="Try a different search term."/>}</div>;
}

function Explorer() {
  const { record } = useConsole(); const location = useLocation(); const navigate = useNavigate();
  const state = location.state as { method?: "GET" | "POST"; path?: string } | null;
  const initial = ENDPOINTS.find((item) => item.method === state?.method && item.path === state?.path) || ENDPOINTS[0];
  const [selected, setSelected] = useState(initial); const [body, setBody] = useState(initial.body); const [result, setResult] = useState<ApiResponse<unknown>>(); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const choose = (value: string) => { const [method, ...parts] = value.split(" "); const item = ENDPOINTS.find((entry) => entry.method === method && entry.path === parts.join(" ")) || ENDPOINTS[0]; setSelected(item); setBody(item.body); setResult(undefined); setError(""); };
  const send = async () => { setError(""); setResult(undefined); if (selected.method === "POST") { try { setBody(JSON.stringify(JSON.parse(body), null, 2)); } catch { setError("Request body is not valid JSON."); return; } } setLoading(true); try { const response = await request(selected.path, { method: selected.method, body: selected.method === "POST" ? body : undefined }); setResult(response); record({ method: selected.method, path: selected.path, status: response.status, duration: response.duration }); } catch (e) { setError((e as Error).message); } finally { setLoading(false); } };
  const reset = () => { setBody(selected.body); setResult(undefined); setError(""); };
  const copy = (value: string) => void navigator.clipboard?.writeText(value);
  return <Page title="API Explorer" subtitle="Approved requests against the configured local Spring Boot service"><div className="card request-card"><div className="request-bar"><select aria-label="Approved endpoint" value={`${selected.method} ${selected.path}`} onChange={(e) => choose(e.target.value)}>{ENDPOINTS.map((item) => <option key={`${item.method} ${item.path}`}>{item.method} {item.path}</option>)}</select><button className="button primary" disabled={loading} onClick={() => void send()}><Send size={15}/> {loading ? "Sending…" : "Send request"}</button><button className="icon-button" aria-label="Reset request" title="Reset request" onClick={reset}><RefreshCw size={16}/></button></div><div className="example-row">{ENDPOINTS.map((item) => <button key={item.label} onClick={() => choose(`${item.method} ${item.path}`)}>{item.method} {item.path}</button>)}</div>{selected.method === "POST" && <div className="editor-wrap"><div className="editor-tools"><span>JSON request body</span><button className="icon-button" onClick={() => setBody((value) => { try { return JSON.stringify(JSON.parse(value), null, 2); } catch { return value; }})} title="Format JSON" aria-label="Format JSON">FORMAT</button><button className="icon-button" onClick={() => void copy(body)} title="Copy request" aria-label="Copy request"><Copy size={14}/></button></div><textarea className="code-input" value={body} onChange={(e) => setBody(e.target.value)} aria-label="JSON request body"/></div>}</div>{error && <ErrorBox message={error}/>}<div className="result-head"><h3>Response</h3>{result && <span className="badge success">{result.status} · {result.duration} ms</span>}</div><div className="card response">{loading ? <LoadingCard label="Waiting for local API response…"/> : result ? <><div className="response-toolbar"><strong>Response headers</strong><button className="icon-button" onClick={() => void copy(JSON.stringify(result.headers, null, 2))} title="Copy response headers" aria-label="Copy response headers"><Copy size={14}/></button></div><pre>{JSON.stringify(result.headers, null, 2)}</pre><div className="response-toolbar"><strong>Response body</strong><button className="icon-button" onClick={() => void copy(JSON.stringify(result.data, null, 2))} title="Copy response body" aria-label="Copy response body"><Copy size={14}/></button></div><pre>{JSON.stringify(result.data, null, 2)}</pre></> : <EmptyState title="No response yet" message="Choose an approved endpoint and send a request."/>}</div><div className="result-head"><h3>Session request history</h3><span className="muted">Bodies are never stored</span></div><ActivityList/></Page>;
}
function ActivityList() { const { activity } = useConsole(); return <div className="card activity-list">{activity.length ? activity.map((item) => <div className="history-row" key={item.id}><code>{item.method} {item.path}</code><span className={item.status >= 400 ? "level warn" : "level"}>{item.status} · {item.duration} ms · {new Date(item.at).toLocaleTimeString()}</span></div>) : <EmptyState title="No requests in this session" message="Requests made from the dashboard will appear here."/>}</div>; }

function DatabasePage() {
  const [db, setDb] = useState<DbStatus>(); const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const { record } = useConsole();
  const check = async () => { setLoading(true); setError(""); try { const response = await request<DbStatus>("/api/diagnostics/database"); setDb(response.data); record({ method: "GET", path: "/api/diagnostics/database", status: response.status, duration: response.duration }); } catch (e) { setError((e as Error).message); } finally { setLoading(false); } };
  useEffect(() => { void check(); }, []);
  return <Page title="Database diagnostics" subtitle="A read-only SELECT 1 check against the configured datasource">{error && <ErrorBox message={error}/>}<div className="diagnostic-banner"><div className={db?.connected ? "checkmark" : "checkmark bad"}>{db?.connected ? <Check/> : "!"}</div><div><span className="eyebrow">LIVE JDBC CHECK</span><h3>{loading ? "Checking configured datasource…" : db?.connected ? "Database connection verified" : "Database connection unavailable"}</h3><p>{db?.message || "No live connectivity result available."}</p></div><button className="button ghost" disabled={loading} onClick={() => void check()}><RefreshCw size={15} className={loading ? "spin" : ""}/> {loading ? "Checking…" : "Run check"}</button></div>{db && <div className="two-col"><section><div className="section-head"><div><span className="eyebrow">CONNECTION DETAILS</span><h2>Safe runtime telemetry</h2></div></div><div className="card detail-list"><div><span>Host</span><strong>{db.host || "Unknown"}</strong></div><div><span>Port</span><strong>{db.port || "Unknown"}</strong></div><div><span>Check time</span><strong>{new Date(db.checkedAt).toLocaleString()}</strong></div><div><span>Classification</span><strong>{db.connected ? "CONNECTED" : "UNAVAILABLE"}</strong></div></div></section><section><div className="section-head"><div><span className="eyebrow">EVIDENCE GUIDANCE</span><h2>Authoritative sources</h2></div></div><div className="card guidance"><p>Application telemetry does not monitor Docker networks or containers.</p><code>docker compose ps</code><code>docker compose logs --tail=100 app</code><code>docker network inspect q34_app_network</code></div></section></div>}{loading && !db && <LoadingCard label="Running SELECT 1 against the configured datasource…"/>}</Page>;
}

function Logs() {
  const { activity } = useConsole(); const [filter, setFilter] = useState("");
  const visible = activity.filter((item) => `${item.method} ${item.path} ${item.status}`.toLowerCase().includes(filter.toLowerCase()));
  return <Page title="Request activity" subtitle="Observed browser session activity; not persistent server logs"><div className="notice"><BookOpen size={17}/><span>These are requests observed by this browser session. Use <code>docker compose logs --no-color app</code> for authoritative container logs.</span></div><div className="search-box"><Search size={15}/><input aria-label="Filter request activity" placeholder="Filter method, endpoint, or status…" value={filter} onChange={(e) => setFilter(e.target.value)}/></div><div className="card log-table"><div className="log-header"><span>TIME</span><span>STATUS</span><span>REQUEST</span><span>DURATION</span></div>{visible.length ? visible.map((item) => <div className="log-row" key={item.id}><span>{new Date(item.at).toLocaleTimeString()}</span><span className={item.status >= 400 ? "level warn" : "level"}>{item.status}</span><strong>{item.method} {item.path}</strong><span>{item.duration} ms</span></div>) : <EmptyState title="No observed requests" message="Use the Overview, Explorer, or Diagnostics pages to create session activity."/>}</div></Page>;
}

function FailureLab() {
  const location = useLocation(); const { record } = useConsole(); const initial = (location.state as { scenario?: string } | null)?.scenario || ""; const [selected, setSelected] = useState(initial); const [result, setResult] = useState<DiagnosticResult>(); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const run = async (scenario: string) => { setSelected(scenario); setError(""); setResult(undefined); setLoading(true); try { const response = await request<DiagnosticResult>("/api/diagnostics/scenarios", { method: "POST", body: JSON.stringify({ scenario }) }); setResult(response.data); record({ method: "POST", path: "/api/diagnostics/scenarios", status: response.status, duration: response.duration }); } catch (e) { setError((e as Error).message); } finally { setLoading(false); } };
  return <Page title="Failure lab" subtitle="Deterministic, local-only simulations with no datasource changes"><div className="simulation-banner"><FlaskConical size={19}/><div><strong>Simulation mode</strong><p>Results are deterministic guidance, not observed failures.</p></div></div>{error && <ErrorBox message={error}/>}<div className="lab-grid">{SCENARIOS.map((scenario) => <div className={`card lab-card ${selected === scenario.id ? "selected" : ""}`} key={scenario.id}><div className="lab-top"><span className="tag red">SIMULATION</span><span className="lab-dot red"/></div><h3>{scenario.title}</h3><p>{scenario.text}</p><span className="scenario-classification">{scenario.classification}</span><button className="button ghost" disabled={loading} onClick={() => void run(scenario.id)}>{loading && selected === scenario.id ? "Running…" : "Run safe simulation"}</button></div>)}</div>{result && <div className="card diagnostic-result"><div className="result-title"><span className="badge warning">SIMULATED · {result.classification}</span><span className="muted">{new Date(result.timestamp).toLocaleString()}</span></div><h3>{result.scenario}</h3><p><strong>Evidence:</strong> {result.evidence}</p><p><strong>Probable cause:</strong> {result.probableCause}</p><p><strong>Recommended fix:</strong> {result.recommendedFix}</p></div>}<div className="warning-panel"><AlertTriangle/><div><strong>Safety boundary</strong><p>Simulations never connect to user-supplied hosts, accept credentials, execute commands, manipulate Docker, or change datasource settings.</p></div></div></Page>;
}

function Students() {
  const [students, setStudents] = useState<Student[]>([]); const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [message, setMessage] = useState(""); const [loading, setLoading] = useState(true); const { record } = useConsole();
  const load = async () => { setLoading(true); try { const response = await request<Student[]>("/api/students"); setStudents(response.data); record({ method: "GET", path: "/api/students", status: response.status, duration: response.duration }); } catch (e) { setMessage((e as Error).message); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  const add = async (event: FormEvent) => { event.preventDefault(); setMessage(""); try { const response = await request<Student>("/api/students", { method: "POST", body: JSON.stringify({ name, email }) }); record({ method: "POST", path: "/api/students", status: response.status, duration: response.duration }); setName(""); setEmail(""); setMessage("Student created"); void load(); } catch (e) { setMessage((e as Error).message); } };
  return <Page title="Student records" subtitle="Persistent MySQL records behind the API">
    <div className="two-col">
      <form className="card form-card" onSubmit={add}>
        <div className="section-head"><div><span className="eyebrow">CREATE RECORD</span><h2>New student</h2></div><Plus/></div>
        <label>Name<input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Asha Rao"/></label>
        <label>Email<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="asha@example.com"/></label>
        <button className="button primary" type="submit">Create student</button>
        {message && <small className="form-message">{message}</small>}
      </form>
      <div>
        <div className="section-head"><div><span className="eyebrow">LIVE DATASET</span><h2>{loading ? "Loading…" : `${students.length} students`}</h2></div><button className="icon-button" aria-label="Refresh students" title="Refresh students" disabled={loading} onClick={() => void load()}><RefreshCw size={15} className={loading ? "spin" : ""}/></button></div>
        <div className="card student-list">
          {loading ? <LoadingCard label="Reading student records…"/> : students.length ? students.map((student) => <div className="student" key={student.id}><span className="avatar">{student.name.split(" ").map((part) => part[0]).join("")}</span><div><strong>{student.name}</strong><p>{student.email}</p></div><code>#{student.id}</code></div>) : <EmptyState title="No students found" message="The configured database returned an empty dataset."/>}
        </div>
      </div>
    </div>
  </Page>;
}

export default function App() { return <Shell/>; }
