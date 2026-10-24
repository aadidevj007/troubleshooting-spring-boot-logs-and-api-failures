import { useEffect, useState } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import {
  Activity, AlertTriangle, BookOpen, Boxes, Database, FlaskConical, Gauge,
  Menu, Network, Plus, RefreshCw, Send, Terminal, X,
} from "lucide-react";
import { isAllowedEndpoint, isSafeApiOrigin } from "./apiSecurity";

const API = import.meta.env.VITE_API_URL || "http://localhost:8081";
const API_ORIGIN = new URL(API, window.location.origin);
if (!isSafeApiOrigin(API)) {
  throw new Error("The API must point to a local application origin.");
}

type Student = { id: number; name: string; email: string };
type DbStatus = { connected: boolean; host: string; port: number; checkedAt: string; message: string };
type DiagnosticResult = {
  scenario: string; classification: string; simulated: boolean; evidence: string;
  probableCause: string; recommendedFix: string; timestamp: string;
};
type RequestResult = {
  status: number; duration: number; headers: Record<string, string>; body: unknown;
};
type HistoryEntry = Pick<RequestResult, "status" | "duration"> & { method: string; path: string; at: string };
type Endpoint = { method: "GET" | "POST"; path: string; label: string; body: string };

const ENDPOINTS: Endpoint[] = [
  { method: "GET", path: "/api/students", label: "List students", body: "" },
  { method: "GET", path: "/api/students/1", label: "Get student #1", body: "" },
  { method: "GET", path: "/api/diagnostics/database", label: "Live database check", body: "" },
  { method: "POST", path: "/api/diagnostics/scenarios", label: "Run safe simulation", body: '{"scenario":"WRONG_HOST"}' },
  { method: "POST", path: "/api/students", label: "Create student", body: '{"name":"Noah Patel","email":"noah.patel@example.com"}' },
] as const;

async function request<T>(path: string, options?: RequestInit): Promise<{ data: T; status: number; headers: Record<string, string> }> {
  const endpoint = new URL(path, API_ORIGIN);
  if (endpoint.origin !== API_ORIGIN.origin || !isAllowedEndpoint(options?.method || "GET", endpoint.pathname)) {
    throw new Error("This endpoint is not available in the local API allowlist.");
  }
  const response = await fetch(endpoint, {
    ...options,
    headers: { Accept: "application/json", "Content-Type": "application/json", ...(options?.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  const headers = Object.fromEntries(response.headers.entries());
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${body.message || "The API request failed"}`);
  return { data: body as T, status: response.status, headers };
}

function Shell() {
  const [mobile, setMobile] = useState(false);
  const nav = [{ to: "/", label: "Overview", icon: Gauge }, { to: "/explorer", label: "API Explorer", icon: Terminal }, { to: "/database", label: "Database diagnostics", icon: Database }, { to: "/logs", label: "Application logs", icon: BookOpen }, { to: "/lab", label: "Failure lab", icon: FlaskConical }, { to: "/students", label: "Student records", icon: Boxes }];
  return <div className="shell">
    <aside className={mobile ? "sidebar open" : "sidebar"}><div className="brand"><div className="brand-mark">Q34</div><div><strong>REDLINE</strong><span>OPS CONSOLE</span></div><button className="mobile-close" onClick={() => setMobile(false)}><X size={18}/></button></div>
      <div className="workspace"><span className="dot green"/> LOCAL / DOCKER <span className="chevron">⌄</span></div>
      <nav>{nav.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} onClick={() => setMobile(false)} className={({ isActive }) => isActive ? "active" : ""}><Icon size={17}/>{label}</NavLink>)}</nav>
      <div className="sidebar-foot"><div className="live"><span className="pulse"/> LOCAL TOOLING</div><small>Q34 / v1.0.0<br/>Spring Boot + MySQL</small></div>
    </aside>
    <main><header><button className="mobile-menu" onClick={() => setMobile(true)}><Menu/></button><div><span className="eyebrow">SYSTEM / DIAGNOSTICS</span><h1>Container operations center</h1></div><div className="header-status"><span className="dot green"/> LOCAL ONLY <span className="divider"/> <span className="muted">LIVE TELEMETRY</span></div></header><Routes><Route path="/" element={<Overview/>}/><Route path="/explorer" element={<Explorer/>}/><Route path="/database" element={<DatabasePage/>}/><Route path="/logs" element={<Logs/>}/><Route path="/lab" element={<FailureLab/>}/><Route path="/students" element={<Students/>}/></Routes></main>
  </div>;
}

function Overview() {
  const [db, setDb] = useState<DbStatus | null>(null); const [students, setStudents] = useState<Student[]>([]); const [apiState, setApiState] = useState<RequestResult | null>(null); const [error, setError] = useState("");
  const load = async () => { setError(""); const start = performance.now(); try { const result = await request<Student[]>("/api/students"); setStudents(result.data); setApiState({ status: result.status, duration: Math.round(performance.now() - start), headers: result.headers, body: result.data }); } catch (e) { setError((e as Error).message); setApiState(null); } try { setDb((await request<DbStatus>("/api/diagnostics/database")).data); } catch (e) { setDb(null); setError((current) => current || (e as Error).message); } };
  useEffect(() => { void load(); }, []);
  return <Page title="Overview" subtitle="Live health and service telemetry from the local API"><div className="actions"><button className="button ghost" onClick={() => void load()}><RefreshCw size={15}/> Refresh telemetry</button></div>
    {error && <div className="error-box"><AlertTriangle/> {error}</div>}<div className="hero-grid"><section className="hero-card"><div className="hero-title"><span className="status-icon"><Activity/></span><div><span className="eyebrow">API STATUS</span><h2>{apiState ? "Operational" : "Unknown"}</h2></div><span className={`badge ${apiState ? "success" : "warning"}`}>● {apiState ? "HEALTHY" : "UNAVAILABLE"}</span></div><div className="metric-row"><div><b>{apiState?.status ?? "—"}</b><span>Last response</span></div><div><b>{apiState ? `${apiState.duration} ms` : "—"}</b><span>Measured latency</span></div><div><b>{apiState ? students.length : "—"}</b><span>Records visible</span></div></div></section><section className="card db-card"><div className="card-heading"><div><span className="eyebrow">DATABASE</span><h3>MySQL connection</h3></div><Database size={22}/></div><div className="db-state"><span className={db?.connected ? "status-dot" : "status-dot danger"}/><strong>{db ? (db.connected ? "Connected" : "Unavailable") : "Unknown"}</strong></div><p>{db ? `${db.host}:${db.port} · checked ${new Date(db.checkedAt).toLocaleTimeString()}` : "No live database telemetry available."}</p></section></div>
    <div className="section-head"><div><span className="eyebrow">SERVICE MAP</span><h2>Runtime services</h2></div></div><div className="service-grid"><Service name="app" desc="Spring Boot API" status={apiState ? "Responding" : "Unknown"} icon={<Activity/>}/><Service name="mysql" desc="MySQL 8.4 database" status={db ? (db.connected ? "Healthy" : "Unavailable") : "Unknown"} icon={<Database/>}/><Service name="app_network" desc="Private bridge network" status="Unavailable" icon={<Network/>}/></div>
    <div className="section-head"><div><span className="eyebrow">RECENT EVENTS</span><h2>Diagnostic timeline</h2></div></div><div className="card timeline"><Event tone={db?.connected ? "green" : "red"} title={db ? db.message : "Database check unavailable"} meta={db ? `Live database check · ${new Date(db.checkedAt).toLocaleString()}` : "Live telemetry unavailable"}/><Event tone="red" title="Scenario simulations available" meta="Failure lab · explicitly labeled simulations"/><Event tone={apiState ? "green" : "red"} title={apiState ? `Student API responded with HTTP ${apiState.status}` : "Student API status unavailable"} meta="API explorer · live request"/></div>
  </Page>;
}
function Service({ name, desc, status, icon }: {name:string; desc:string; status:string; icon:React.ReactNode}) { const healthy = status === "Healthy" || status === "Responding"; return <div className="card service"><div className="service-icon">{icon}</div><div><strong>{name}</strong><p>{desc}</p></div><span className="service-status"><span className={`dot ${healthy ? "green" : "muted-dot"}`}/>{status}</span></div>; }
function Event({tone,title,meta}:{tone:string;title:string;meta:string}) { return <div className="event"><span className={`event-line ${tone}`}/><div><strong>{title}</strong><p>{meta}</p></div><span className="event-arrow">→</span></div>; }
function Page({title,subtitle,children}:{title:string;subtitle:string;children:React.ReactNode}) { return <div className="page"><div className="page-title"><div><span className="eyebrow">Q34 / CONTROL PLANE</span><h2>{title}</h2><p>{subtitle}</p></div></div>{children}</div>; }

function Explorer() {
  const [selected, setSelected] = useState(ENDPOINTS[0]); const [body, setBody] = useState(ENDPOINTS[0].body); const [result, setResult] = useState<RequestResult>(); const [error, setError] = useState(""); const [history, setHistory] = useState<HistoryEntry[]>([]);
  const choose = (path: string, method: string) => { const item = ENDPOINTS.find((entry) => entry.path === path && entry.method === method) || ENDPOINTS[0]; setSelected(item); setBody(item.body); setError(""); };
  const send = async () => { setError(""); setResult(undefined); if (selected.method === "POST") { try { JSON.parse(body); } catch { setError("Request body is not valid JSON."); return; } } const started = performance.now(); try { const response = await request<unknown>(selected.path, { method: selected.method, body: selected.method === "POST" ? body : undefined }); const next = { status: response.status, duration: Math.round(performance.now() - started), headers: response.headers, body: response.data }; setResult(next); setHistory((items) => [{ method: selected.method, path: selected.path, status: next.status, duration: next.duration, at: new Date().toLocaleTimeString() }, ...items].slice(0, 8)); } catch (e) { setError((e as Error).message); } };
  return <Page title="API Explorer" subtitle="Send approved requests against the local Spring Boot service"><div className="card request-card"><div className="request-bar"><select value={`${selected.method} ${selected.path}`} onChange={(e) => { const [method, ...path] = e.target.value.split(" "); choose(path.join(" "), method); }}>{ENDPOINTS.map((item) => <option key={`${item.method} ${item.path}`}>{item.method} {item.path}</option>)}</select><button className="button primary" onClick={() => void send()}><Send size={15}/> Send request</button></div><div className="example-row">{ENDPOINTS.map((item) => <button key={item.label} onClick={() => choose(item.path, item.method)}>{item.method} {item.path}</button>)}</div>{selected.method === "POST" && <textarea className="code-input" value={body} onChange={(e) => setBody(e.target.value)} aria-label="JSON request body"/>}</div><div className="result-head"><h3>Response</h3>{result && <span className="badge success">{result.status} · {result.duration} ms</span>}</div><div className="card response">{error ? <div className="error-box"><AlertTriangle/> {error}</div> : result ? <><strong>Response headers</strong><pre>{JSON.stringify(result.headers, null, 2)}</pre><strong>Response body</strong><pre>{JSON.stringify(result.body, null, 2)}</pre></> : <pre>Choose an approved endpoint and send a request.</pre>}</div><div className="result-head"><h3>Local request history</h3><span className="muted">Bodies are never stored</span></div><div className="card response">{history.length ? history.map((item, index) => <div className="history-row" key={`${item.at}-${index}`}><code>{item.method} {item.path}</code><span>{item.status} · {item.duration} ms · {item.at}</span></div>) : <p className="muted">No requests yet.</p>}</div></Page>;
}

function DatabasePage() {
  const [db,setDb]=useState<DbStatus>(); const [error,setError]=useState(""); const check=async()=>{setError("");try{setDb((await request<DbStatus>("/api/diagnostics/database")).data);}catch(e){setError((e as Error).message);setDb(undefined);}}; useEffect(() => { void check(); },[]);
  const commands=["docker compose ps","docker compose logs --tail=100 app","docker compose logs --tail=100 mysql","docker network inspect q34_app_network","docker compose exec app getent hosts mysql"];
  return <Page title="Database diagnostics" subtitle="A read-only SELECT 1 check against the configured datasource">{error&&<div className="error-box"><AlertTriangle/> {error}</div>}<div className="diagnostic-banner"><div className={db?.connected?"checkmark":"checkmark bad"}>{db?.connected?"✓":"!"}</div><div><span className="eyebrow">LIVE JDBC CHECK</span><h3>{db?.connected?"Database connection verified":"Database connection unavailable"}</h3><p>{db?.message||"No live connectivity result available."}</p></div><button className="button ghost" onClick={() => void check()}><RefreshCw size={15}/> Run check</button></div><div className="two-col"><section><div className="section-head"><div><span className="eyebrow">CONNECTION DETAILS</span><h2>Safe runtime telemetry</h2></div></div><div className="card detail-list"><div><span>Host</span><strong>{db?.host||"Unknown"}</strong></div><div><span>Port</span><strong>{db?.port||"Unknown"}</strong></div><div><span>Service DNS</span><strong>mysql</strong></div><div><span>Last checked</span><strong>{db?.checkedAt?new Date(db.checkedAt).toLocaleString():"Unknown"}</strong></div></div></section><section><div className="section-head"><div><span className="eyebrow">DOCKER TOOLKIT</span><h2>Run from PowerShell</h2></div></div><div className="card command-list">{commands.map(c=><div key={c} className="command"><code>{c}</code><button onClick={()=>void navigator.clipboard?.writeText(c)}>COPY</button></div>)}</div></section></div></Page>;
}

function Logs(){return <Page title="Application logs" subtitle="Example entries only; Docker logs are authoritative."><div className="notice"><Terminal size={17}/><span>These are illustrative UI entries, not live log ingestion. Use <code>docker compose logs --no-color app</code> for authoritative evidence.</span></div><div className="card log-table"><div className="log-header"><span>TYPE</span><span>LEVEL</span><span>COMPONENT</span><span>MESSAGE</span></div>{[["EXAMPLE","INFO","DiagnosticsService","JDBC connectivity result is shown in the dashboard"],["EXAMPLE","WARN","FailureLab","Scenario results are simulations, not observed failures"],["COMMAND","INFO","Docker","docker compose logs --no-color app"]].map((l,i)=><div className="log-row" key={i}><span>{l[0]}</span><span className={l[1]==="WARN"?"level warn":"level"}>{l[1]}</span><span>{l[2]}</span><strong>{l[3]}</strong></div>)}</div></Page>}

function FailureLab(){const [result,setResult]=useState<DiagnosticResult>();const [error,setError]=useState("");const run=async(scenario:string)=>{setError("");try{const response=await request<DiagnosticResult>("/api/diagnostics/scenarios",{method:"POST",body:JSON.stringify({scenario})});setResult(response.data);}catch(e){setError((e as Error).message);}};return <Page title="Failure lab" subtitle="Deterministic, local-only simulations with no datasource changes">{error&&<div className="error-box"><AlertTriangle/> {error}</div>}<div className="lab-grid">{[["WRONG_HOST","Wrong database hostname","DNS FAILURE","Simulates a hostname that is not resolvable."],["WRONG_PASSWORD","Wrong database password","AUTH FAILURE","Simulates MySQL rejecting invalid credentials."],["DB_UNAVAILABLE","Database unavailable","AVAILABILITY","Simulates a database that is stopped or unhealthy."],["API_NOT_FOUND","API route not found","ROUTING","Simulates an unregistered application route."]].map(([scenario,title,tag,text])=><div className="card lab-card" key={scenario}><div className="lab-top"><span className="tag red">SIMULATION</span><span className="lab-dot red"/></div><h3>{title}</h3><p>{text}</p><button className="button ghost" onClick={()=>void run(scenario)}>Run safe simulation</button><small className="muted">{tag}</small></div>)}</div>{result&&<div className="card diagnostic-result"><span className="badge warning">SIMULATED · {result.classification}</span><h3>{result.scenario}</h3><p>{result.evidence}</p><p><strong>Probable cause:</strong> {result.probableCause}</p><p><strong>Recommended fix:</strong> {result.recommendedFix}</p></div>}<div className="warning-panel"><AlertTriangle/><div><strong>Safety boundary</strong><p>Simulations never connect to user-supplied hosts, accept credentials, execute commands, manipulate Docker, or change datasource settings.</p></div></div></Page>}

function Students(){const [students,setStudents]=useState<Student[]>([]);const [name,setName]=useState("");const [email,setEmail]=useState("");const [message,setMessage]=useState("");const load=async()=>{try{setStudents((await request<Student[]>("/api/students")).data);}catch(e){setMessage((e as Error).message);}};useEffect(() => { void load(); },[]);const add=async(e:React.FormEvent)=>{e.preventDefault();try{await request("/api/students",{method:"POST",body:JSON.stringify({name,email})});setName("");setEmail("");setMessage("Student created");void load();}catch(e){setMessage((e as Error).message)}};return <Page title="Student records" subtitle="Persistent MySQL records behind the API"><div className="two-col"><form className="card form-card" onSubmit={add}><div className="section-head"><div><span className="eyebrow">CREATE RECORD</span><h2>New student</h2></div><Plus/></div><label>Name<input required value={name} onChange={e=>setName(e.target.value)} placeholder="Asha Rao"/></label><label>Email<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="asha@example.com"/></label><button className="button primary" type="submit">Create student</button>{message&&<small className="form-message">{message}</small>}</form><div><div className="section-head"><div><span className="eyebrow">LIVE DATASET</span><h2>{students.length} students</h2></div><button className="button ghost" onClick={() => void load()}><RefreshCw size={15}/></button></div><div className="card student-list">{students.map(s=><div className="student" key={s.id}><span className="avatar">{s.name.split(" ").map(x=>x[0]).join("")}</span><div><strong>{s.name}</strong><p>{s.email}</p></div><code>#{s.id}</code></div>)}</div></div></div></Page>}

export default function App(){return <Shell/>}
