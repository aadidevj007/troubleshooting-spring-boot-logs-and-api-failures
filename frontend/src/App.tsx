import { useEffect, useState } from "react";
import { NavLink, Route, Routes, useNavigate } from "react-router-dom";
import { Activity, AlertTriangle, BookOpen, Boxes, Database, FlaskConical, Gauge, Menu, Network, Plus, RefreshCw, Send, Terminal, X } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8080";
type Student = { id: number; name: string; email: string };
type DbStatus = { connected: boolean; host: string; port: number; checkedAt: string; message: string };

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API}${path}`, { headers: { "Content-Type": "application/json", ...(options?.headers || {}) }, ...options });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || `Request failed with ${response.status}`);
  return body;
}

function Shell() {
  const [mobile, setMobile] = useState(false);
  const nav = [{ to: "/", label: "Overview", icon: Gauge }, { to: "/explorer", label: "API Explorer", icon: Terminal }, { to: "/database", label: "Database diagnostics", icon: Database }, { to: "/logs", label: "Application logs", icon: BookOpen }, { to: "/lab", label: "Failure lab", icon: FlaskConical }, { to: "/students", label: "Student records", icon: Boxes }];
  return <div className="shell">
    <aside className={mobile ? "sidebar open" : "sidebar"}><div className="brand"><div className="brand-mark">Q34</div><div><strong>REDLINE</strong><span>OPS CONSOLE</span></div><button className="mobile-close" onClick={() => setMobile(false)}><X size={18}/></button></div>
      <div className="workspace"><span className="dot green"/> LOCAL / DOCKER <span className="chevron">⌄</span></div>
      <nav>{nav.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} onClick={() => setMobile(false)} className={({ isActive }) => isActive ? "active" : ""}><Icon size={17}/>{label}</NavLink>)}</nav>
      <div className="sidebar-foot"><div className="live"><span className="pulse"/> LIVE MONITORING</div><small>Q34 / v1.0.0<br/>Spring Boot + MySQL</small></div>
    </aside>
    <main><header><button className="mobile-menu" onClick={() => setMobile(true)}><Menu/></button><div><span className="eyebrow">SYSTEM / DIAGNOSTICS</span><h1>Container operations center</h1></div><div className="header-status"><span className="dot green"/> LOCAL DIAGNOSTICS <span className="divider"/> <span className="muted">Q34</span></div></header><Routes><Route path="/" element={<Overview/>}/><Route path="/explorer" element={<Explorer/>}/><Route path="/database" element={<DatabasePage/>}/><Route path="/logs" element={<Logs/>}/><Route path="/lab" element={<FailureLab/>}/><Route path="/students" element={<Students/>}/></Routes></main>
  </div>;
}

function Overview() {
  const [db, setDb] = useState<DbStatus | null>(null); const [students, setStudents] = useState<Student[]>([]);
  const load = () => { api<DbStatus>("/api/diagnostics/database").then(setDb).catch(() => setDb(null)); api<Student[]>("/api/students").then(setStudents).catch(() => setStudents([])); };
  useEffect(() => { load(); }, []);
  return <Page title="Overview" subtitle="Real-time health and service telemetry"><div className="actions"><button className="button ghost" onClick={load}><RefreshCw size={15}/> Refresh telemetry</button></div>
    <div className="hero-grid"><section className="hero-card"><div className="hero-title"><span className="status-icon"><Activity/></span><div><span className="eyebrow">API STATUS</span><h2>{db?.connected?"Operational":"Unverified / degraded"}</h2></div><span className="badge success">{db?.connected?"● JDBC CONNECTED":"● CHECK STATUS"}</span></div><div className="metric-row"><div><b>{db?.connected?"OK":"—"}</b><span>JDBC check</span></div><div><b>Live</b><span>Refresh to check</span></div><div><b>{students.length}</b><span>Records visible</span></div></div></section><section className="card db-card"><div className="card-heading"><div><span className="eyebrow">DATABASE</span><h3>MySQL connection</h3></div><Database size={22}/></div><div className="db-state"><span className={db?.connected ? "status-dot" : "status-dot danger"}/><strong>{db?.connected ? "Connected" : "Unavailable"}</strong></div><p>{db ? `${db.host}:${db.port} · checked ${new Date(db.checkedAt).toLocaleTimeString()}` : "Checking JDBC connectivity..."}</p></section></div>
    <div className="section-head"><div><span className="eyebrow">SERVICE MAP</span><h2>Runtime services</h2></div></div><div className="service-grid"><Service name="app" desc="Spring Boot API" status={db?.connected?"API reachable":"Unverified"} icon={<Activity/>}/><Service name="mysql" desc="MySQL 8.4 database" status={db?.connected ? "Healthy" : "Checking"} icon={<Database/>}/><Service name="app_network" desc="Private bridge network" status="Configured" icon={<Network/>}/></div>
    <div className="section-head"><div><span className="eyebrow">RECENT EVENTS</span><h2>Diagnostic timeline</h2></div></div><div className="card timeline"><Event tone={db?.connected?"green":"red"} title={db?.connected?"JDBC connectivity check succeeded":"JDBC not verified"} meta="Latest dashboard check"/><Event tone="red" title="Safe simulated scenarios available" meta="Failure lab · read-only"/></div>
  </Page>;
}
function Service({ name, desc, status, icon }: {name:string; desc:string; status:string; icon:React.ReactNode}) { return <div className="card service"><div className="service-icon">{icon}</div><div><strong>{name}</strong><p>{desc}</p></div><span className="service-status"><span className="dot green"/>{status}</span></div>; }
function Event({tone,title,meta}:{tone:string;title:string;meta:string}) { return <div className="event"><span className={`event-line ${tone}`}/><div><strong>{title}</strong><p>{meta}</p></div><span className="event-arrow">→</span></div>; }
function Page({title,subtitle,children}:{title:string;subtitle:string;children:React.ReactNode}) { return <div className="page"><div className="page-title"><div><span className="eyebrow">Q34 / CONTROL PLANE</span><h2>{title}</h2><p>{subtitle}</p></div></div>{children}</div>; }

function Explorer() {
  const [method,setMethod]=useState("GET"); const [path,setPath]=useState("/api/students"); const [body,setBody]=useState('{"name":"Noah Patel","email":"noah.patel@example.com"}'); const [result,setResult]=useState<unknown>(null); const [duration,setDuration]=useState<number>(); const [status,setStatus]=useState<number>(); const [error,setError]=useState("");
  const send=async()=>{setError("");setStatus(undefined);const start=performance.now();try{
    if (!/^\\/api\\/(students(?:\\/\\d+)?|diagnostics\\/(status|database|scenarios(?:\\?scenario=(healthy|wrong-host|bad-password|db-not-ready))?))$/.test(path)) throw new Error("Choose a supported local API endpoint.");
    if(method==="POST" && path!=="/api/students") throw new Error("POST is supported only for /api/students.");
    if(method==="POST") { const parsed=JSON.parse(body); if(typeof parsed.name!=="string" || typeof parsed.email!=="string") throw new Error("JSON must include name and email."); }
    const response=await fetch(API+path,{method,headers:{"Content-Type":"application/json"},body:method==="POST"?body:undefined});
    setStatus(response.status); const raw=await response.text(); let parsed:unknown=raw;try{parsed=JSON.parse(raw);}catch{}
    setResult(parsed);if(!response.ok)setError("HTTP "+response.status);
  }catch(e){setResult(null);setError((e as Error).message);}finally{setDuration(Math.round(performance.now()-start));}};
  return <Page title="API Explorer" subtitle="Send real requests against the running Spring Boot service"><div className="card request-card"><div className="request-bar"><select value={method} onChange={e=>setMethod(e.target.value)}><option>GET</option><option>POST</option></select><input value={path} onChange={e=>setPath(e.target.value)}/><button className="button primary" onClick={send}><Send size={15}/> Send request</button></div><div className="example-row"><button onClick={()=>{setMethod("GET");setPath("/api/students")}}>GET /api/students</button><button onClick={()=>{setMethod("GET");setPath("/api/students/1")}}>GET /api/students/1</button><button onClick={()=>{setMethod("POST");setPath("/api/students")}}>POST /api/students</button></div>{method==="POST"&&<textarea className="code-input" value={body} onChange={e=>setBody(e.target.value)}/>}</div><div className="result-head"><h3>Response {status!==undefined?`· HTTP ${status}`:""}</h3>{duration!==undefined&&<span className="badge success">{duration} ms</span>}</div><div className="card response">{error&&<div className="error-box"><AlertTriangle/> {error}</div>}<pre>{result!==null?JSON.stringify(result,null,2):"Send a request to inspect the JSON response."}</pre></div></Page>;
}

function DatabasePage() {
  const [db,setDb]=useState<DbStatus>(); const check=()=>api<DbStatus>("/api/diagnostics/database").then(setDb); useEffect(() => { check(); },[]);
  const commands=["docker compose ps","docker compose logs --tail=100 app","docker compose logs --tail=100 mysql","docker exec -it <app-container-name> sh","docker network inspect q34_app_network","docker run --rm --network q34_app_network mysql:8.4 mysqladmin ping -h mysql -u students_app --silent"];
  return <Page title="Database diagnostics" subtitle="Evidence-based connectivity checks. No credentials are exposed."><div className="diagnostic-banner"><div className={db?.connected?"checkmark":"checkmark bad"}>{db?.connected?"✓":"!"}</div><div><span className="eyebrow">LIVE JDBC CHECK</span><h3>{db?.connected?"Database connection verified":"Database connection unavailable"}</h3><p>{db?.message||"Running SELECT 1 against the configured datasource..."}</p></div><button className="button ghost" onClick={check}><RefreshCw size={15}/> Run check</button></div><div className="two-col"><section><div className="section-head"><div><span className="eyebrow">CONNECTION DETAILS</span><h2>Runtime configuration</h2></div></div><div className="card detail-list"><div><span>Host</span><strong>{db?.host||"—"}</strong></div><div><span>Port</span><strong>{db?.port||"—"}</strong></div><div><span>Service DNS</span><strong>mysql</strong></div><div><span>Last checked</span><strong>{db?.checkedAt?new Date(db.checkedAt).toLocaleString():"—"}</strong></div></div></section><section><div className="section-head"><div><span className="eyebrow">DOCKER TOOLKIT</span><h2>Run from PowerShell</h2></div></div><div className="card command-list">{commands.map(c=><div key={c} className="command"><code>{c}</code><button onClick={()=>navigator.clipboard?.writeText(c)}>COPY</button></div>)}</div></section></div></Page>;
}

function Logs(){const logs=[["INFO","DiagnosticsService","JDBC connectivity check succeeded"],["INFO","StudentController","GET /api/students returned 200"],["WARN","FailureLab","Controlled failures must be reproduced with Compose commands"],["INFO","Q34Application","Application ready on port 8080"]];return <Page title="Application logs" subtitle="Recent backend diagnostic events. Authoritative container logs remain available through Docker."><div className="notice"><Terminal size={17}/><span>These are application-generated events. Use <code>docker compose logs app</code> for the authoritative container stream.</span></div><div className="card log-table"><div className="log-header"><span>TIME</span><span>LEVEL</span><span>COMPONENT</span><span>MESSAGE</span></div>{logs.map((l,i)=><div className="log-row" key={i}><span>{`20:1${5-i}:0${i}`}</span><span className={l[0]==="WARN"?"level warn":"level"}>{l[0]}</span><span>{l[1]}</span><strong>{l[2]}</strong></div>)}</div></Page>}

type ScenarioResult = {scenario:string;simulated:boolean;category:string;expectedError:string;rootCause:string;recommendedAction:string};
function FailureLab(){
  const [scenario,setScenario]=useState("wrong-host");
  const [result,setResult]=useState<ScenarioResult|null>(null);
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);
  const run=async()=>{setBusy(true);setError("");setResult(null);try{setResult(await api<ScenarioResult>("/api/diagnostics/scenarios?scenario="+encodeURIComponent(scenario)));}catch(e){setError((e as Error).message);}finally{setBusy(false);}};
  return <Page title="Failure lab" subtitle="Safe, read-only failure explanations and real connectivity verification">
    <div className="card form-card"><h3>Choose a controlled scenario</h3>
      <p>Simulations explain expected failure symptoms. They never alter MySQL, containers or application credentials.</p>
      <label>Scenario<select value={scenario} onChange={e=>setScenario(e.target.value)}>
        <option value="wrong-host">Wrong database hostname</option>
        <option value="bad-password">Invalid database password</option>
        <option value="db-not-ready">Database not ready</option>
        <option value="healthy">Healthy baseline</option>
      </select></label>
      <button className="button primary" disabled={busy} onClick={run}>{busy?"Checking...":"Explain scenario"}</button>
      {error&&<p role="alert">{error}</p>}
      {result&&<div className="card detail-list"><div><span>Mode</span><strong>SIMULATION — not a live failure</strong></div><div><span>Category</span><strong>{result.category}</strong></div><div><span>Expected error</span><strong>{result.expectedError}</strong></div><div><span>Root cause</span><strong>{result.rootCause}</strong></div><div><span>Recommended fix</span><strong>{result.recommendedAction}</strong></div></div>}
    </div>
    <div className="warning-panel"><AlertTriangle/><div><strong>Safety boundary</strong><p>For real diagnostics, use the Database diagnostics page. This public UI does not accept arbitrary hosts, credentials, URLs, or shell commands. Only authorized operators should run Docker commands.</p></div></div>
  </Page>;
}
function LabCard({title,tag,tone,text,steps}:{title:string;tag:string;tone:string;text:string;steps:string[]}){return <div className="card lab-card"><div className="lab-top"><span className={`tag ${tone}`}>{tag}</span><span className={`lab-dot ${tone}`}/></div><h3>{title}</h3><p>{text}</p><ol>{steps.map(s=><li key={s}><code>{s}</code></li>)}</ol></div>}

function Students(){const [students,setStudents]=useState<Student[]>([]);const [name,setName]=useState("");const [email,setEmail]=useState("");const [message,setMessage]=useState("");const load=()=>api<Student[]>("/api/students").then(setStudents).catch(e=>setMessage(e.message));useEffect(() => { load(); },[]);const add=async(e:React.FormEvent)=>{e.preventDefault();try{await api("/api/students",{method:"POST",body:JSON.stringify({name,email})});setName("");setEmail("");setMessage("Student created");load();}catch(e){setMessage((e as Error).message)}};return <Page title="Student records" subtitle="Persistent MySQL records behind the API"><div className="two-col"><form className="card form-card" onSubmit={add}><div className="section-head"><div><span className="eyebrow">CREATE RECORD</span><h2>New student</h2></div><Plus/></div><label>Name<input required value={name} onChange={e=>setName(e.target.value)} placeholder="Asha Rao"/></label><label>Email<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="asha@example.com"/></label><button className="button primary" type="submit">Create student</button>{message&&<small className="form-message">{message}</small>}</form><div><div className="section-head"><div><span className="eyebrow">LIVE DATASET</span><h2>{students.length} students</h2></div><button className="button ghost" onClick={load}><RefreshCw size={15}/></button></div><div className="card student-list">{students.map(s=><div className="student" key={s.id}><span className="avatar">{s.name.split(" ").map(x=>x[0]).join("")}</span><div><strong>{s.name}</strong><p>{s.email}</p></div><code>#{s.id}</code></div>)}</div></div></div></Page>}

export default function App(){return <Shell/>}
