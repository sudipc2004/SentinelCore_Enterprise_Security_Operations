from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import re
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen

HOST = "127.0.0.1"
PORT = 5000
BACKEND_API = "http://localhost:8080"
INCIDENT_ID_PATTERN = re.compile(r"\b[0-9a-fA-F]{24}\b")

# General Module Operations Guidance Database
APP_OPERATIONS = [
    {
        "name": "Dashboard",
        "route": "/dashboard",
        "keywords": ["dashboard", "home", "metrics", "stats", "chart", "live", "feed", "mttr"],
        "answer": (
            "📊 Dashboard Overview:\n"
            "• Displays live security operations metrics, active users, MTTR, asset inventory, log feeds, and threat totals.\n"
            "💡 Navigate to 📊 Dashboard for the high-level security overview."
        ),
    },
    {
        "name": "Users",
        "route": "/users",
        "keywords": ["user", "users", "operator", "account", "role", "analyst", "viewer", "admin"],
        "answer": (
            "👥 Users Management:\n"
            "• Used to manage operator accounts, assign roles (ADMIN, ANALYST, USER), departments, and status.\n"
            "💡 Navigate to 👤 Users to configure access control."
        ),
    },
    {
        "name": "Teams",
        "route": "/teams",
        "keywords": ["team", "teams", "department", "lead", "member", "routing"],
        "answer": (
            "🏢 Operational Teams:\n"
            "• Organizes SOC staff into specialized response groups, assigns asset ownership, and defines incident routing.\n"
            "💡 Navigate to 👥 Teams to manage team structures."
        ),
    },
    {
        "name": "Assets",
        "route": "/assets",
        "keywords": ["asset", "assets", "server", "firewall", "router", "endpoint", "csv", "inventory"],
        "answer": (
            "🖥️ Asset Inventory:\n"
            "• Maintains corporate infrastructure records (Servers, Firewalls, Endpoints, Cloud Assets, Databases).\n"
            "• Supports CSV batch import, status tracking (ONLINE/OFFLINE), and risk scoring.\n"
            "💡 Navigate to 🖥️ Assets to view or register hardware."
        ),
    },
    {
        "name": "Incidents",
        "route": "/incidents",
        "keywords": ["incident", "incidents", "kanban", "priority", "sla", "assign", "triage", "resolve"],
        "answer": (
            "🚨 Incident Management:\n"
            "• Handles threat response workflow with a Drag & Drop Kanban board across Open, Triaged, In Progress, Resolved, and Closed.\n"
            "• Tracks SLA due dates, assignee responsibilities, and priority levels (P1-P4).\n"
            "💡 Navigate to 📋 Incidents to manage active cases."
        ),
    },
    {
        "name": "Threat Intel",
        "route": "/threat-intel",
        "keywords": ["threat", "intel", "ioc", "indicator", "malware", "ip", "domain", "hash"],
        "answer": (
            "🛡️ Threat Intelligence:\n"
            "• Stores Indicators of Compromise (IOCs) such as malicious IPs, domains, phishing URLs, and malware hashes.\n"
            "• Automated Defense Engine auto-blocks detected threat indicators directly from log ingestion and alerts.\n"
            "💡 Navigate to 🛡️ Threat Intel to review blocked indicators."
        ),
    },
    {
        "name": "Audit Trails",
        "route": "/audit-logs",
        "keywords": ["audit", "audit logs", "activity", "history", "trace", "trails"],
        "answer": (
            "📜 Audit Trails:\n"
            "• Records critical security actions, user logins, configuration changes, and compliance evidence for forensics.\n"
            "💡 Navigate to 📜 Audit Trails to view complete system history."
        ),
    },
    {
        "name": "Log Explorer",
        "route": "/logs",
        "keywords": ["log", "logs", "explorer", "security log", "anomaly", "event"],
        "answer": (
            "🔍 Log Explorer:\n"
            "• Inspects raw security event streams, anomaly markers, and ingestion sources (WAF, Firewall, Linux, Active Directory).\n"
            "💡 Navigate to 📁 Log Explorer to search or upload security logs."
        ),
    },
    {
        "name": "Vulnerabilities",
        "route": "/vulnerabilities",
        "keywords": ["vulnerability", "vulnerabilities", "cve", "weakness", "risk", "patch"],
        "answer": (
            "🐛 Vulnerability Management:\n"
            "• Tracks software weaknesses, CVE identifiers, asset exposures, and remediation patch status.\n"
            "💡 Navigate to 🐛 Vulnerabilities to view open CVEs."
        ),
    },
    {
        "name": "Alerts Management",
        "route": "/alerts",
        "keywords": ["alert", "alerts", "notification", "warning", "triaged"],
        "answer": (
            "⚠️ Alerts Management:\n"
            "• Displays real-time security warnings (SQL Injection, Brute Force, Ransomware, Geo-velocity Anomalies).\n"
            "• Supports alert status updates and automated incident escalation.\n"
            "💡 Navigate to 🔔 Alerts to triage warnings."
        ),
    },
    {
        "name": "Playbooks",
        "route": "/playbooks",
        "keywords": ["list", "notebook", "book", "playbook"],
        "answer": (
            "📖 Playbooks:\n"
            "• Standardized automated response procedures and security simulation routines.\n"
            "💡 Navigate to 📚 Playbooks to run automation scenarios."
        ),
    },
    {
        "name": "Reports",
        "route": "/reports",
        "keywords": ["report", "reports", "summary", "export", "analytics"],
        "answer": (
            "📈 Reports Engine:\n"
            "• Generates executive summaries, compliance reports, and analytics exports in PDF, CSV, or JSON format.\n"
            "💡 Navigate to 📊 Reports to generate analytics."
        ),
    },
    {
        "name": "Notifications",
        "route": "/notifications",
        "keywords": ["notifications", "prefs", "channels", "email", "slack"],
        "answer": (
            "🔔 Notification Preferences:\n"
            "• Configures real-time dispatch channels (Email, Slack, PagerDuty, Webhooks) and quiet hours.\n"
            "💡 Navigate to ⚙️ Notifications to adjust settings."
        ),
    }
]

DEFAULT_ANSWER = (
    "🤖 Welcome to SentinelCore AI Assistant!\n\n"
    "I can provide real-time security intelligence and operational stats:\n"
    "• 🖥️ Registered Assets (`how many assets`)\n"
    "• 🚨 Incident Status Overview (`incident status`)\n"
    "• 👥 Registered Users (`about registered users`)\n"
    "• 🏢 Operational Teams (`about teams`)\n"
    "• ⚠️ Security Alerts (`active alerts`)\n"
    "• 🛡️ Threat Intelligence IOCs (`blocked threat intel`)\n\n"
    "Ask me any question or pick a quick prompt below!"
)

# Helper HTTP fetcher
def make_api_request(endpoint, authorization):
    headers = {"Accept": "application/json"}
    if authorization:
        headers["Authorization"] = authorization
    req = Request(f"{BACKEND_API}{endpoint}", headers=headers)
    try:
        with urlopen(req, timeout=5) as response:
            return json.loads(response.read().decode("utf-8"))
    except Exception as e:
        print(f"[chatbot] Error querying {endpoint}: {e}")
        return None

# --- DYNAMIC API DATA FETCHERS ---

def fetch_assets_stats(authorization):
    data = make_api_request("/api/assets?size=1000", authorization)
    if data is None:
        return "⚠️ Unable to fetch Asset inventory from SentinelCore backend. Make sure you are logged in."

    assets = data.get("content", data) if isinstance(data, dict) else data
    if not isinstance(assets, list):
        assets = []

    total = data.get("totalElements", len(assets)) if isinstance(data, dict) else len(assets)
    online = sum(1 for a in assets if str(a.get("status")).upper() == "ONLINE")
    offline = sum(1 for a in assets if str(a.get("status")).upper() == "OFFLINE")
    critical = sum(1 for a in assets if str(a.get("criticality")).upper() == "CRITICAL")
    high = sum(1 for a in assets if str(a.get("criticality")).upper() == "HIGH")

    # Categories breakdown
    types = {}
    for a in assets:
        t = a.get("type", "UNKNOWN")
        types[t] = types.get(t, 0) + 1

    type_summary = ", ".join([f"{t}: {count}" for t, count in types.items()]) if types else "N/A"

    return (
        f"🖥️ **Registered Assets Summary**:\n"
        f"• **Total Registered Assets**: `{total}`\n"
        f"• 🟢 **Online**: `{online}`  |  🔴 **Offline**: `{offline}`\n"
        f"• ⚠️ **Critical Severity**: `{critical}`  |  🟠 **High Severity**: `{high}`\n"
        f"• **Asset Breakdown**: {type_summary}\n\n"
        f"💡 Manage system inventory under 🖥️ **Assets** module (/assets)."
    )

def fetch_incidents_stats(authorization):
    data = make_api_request("/api/incidents?size=1000", authorization)
    if data is None:
        return "⚠️ Unable to fetch Incidents from SentinelCore backend. Make sure you are logged in."

    incidents = data.get("content", data) if isinstance(data, dict) else data
    if not isinstance(incidents, list):
        incidents = []

    total = data.get("totalElements", len(incidents)) if isinstance(data, dict) else len(incidents)
    open_cnt = sum(1 for i in incidents if str(i.get("status")).upper() == "OPEN")
    triaged_cnt = sum(1 for i in incidents if str(i.get("status")).upper() == "TRIAGED")
    progress_cnt = sum(1 for i in incidents if str(i.get("status")).upper() == "IN_PROGRESS")
    resolved_cnt = sum(1 for i in incidents if str(i.get("status")).upper() == "RESOLVED")
    closed_cnt = sum(1 for i in incidents if str(i.get("status")).upper() == "CLOSED")

    p1_cnt = sum(1 for i in incidents if str(i.get("priority")).upper() in ["P1", "CRITICAL"])
    p2_cnt = sum(1 for i in incidents if str(i.get("priority")).upper() in ["P2", "HIGH"])

    recent_incidents = incidents[:5]
    incident_lines = []
    for inc in recent_incidents:
        inc_id = inc.get("id", "N/A")
        inc_title = inc.get("title", "Untitled")
        inc_prio = inc.get("priority", "P3")
        inc_status = str(inc.get("status", "OPEN")).replace("_", " ")
        incident_lines.append(f"• ID: `{inc_id}` — **{inc_title}** (`{inc_status}`, `{inc_prio}`)")

    inc_list_str = "\n".join(incident_lines) if incident_lines else "No active incidents."

    return (
        f"🚨 **Incident Status Overview**:\n"
        f"• **Total Incidents Logged**: `{total}`\n"
        f"• 🔴 **Open**: `{open_cnt}`  |  🟠 **Triaged**: `{triaged_cnt}`  |  🔵 **In Progress**: `{progress_cnt}`\n"
        f"• 🟢 **Resolved**: `{resolved_cnt}`  |  ⚪ **Closed**: `{closed_cnt}`\n"
        f"• ⚡ **Critical Priority (P1)**: `{p1_cnt}`  |  🔥 **High Priority (P2)**: `{p2_cnt}`\n\n"
        f"📌 **Active Incident IDs for Tracking**:\n"
        f"{inc_list_str}\n\n"
        f"💡 Type `status of incident <ID>` to track a specific incident or visit 📋 **Incidents** board (/incidents)."
    )

def fetch_users_stats(authorization):
    data = make_api_request("/api/users?size=1000", authorization)
    if data is None:
        return "⚠️ Unable to fetch Registered Users from SentinelCore backend."

    users = data.get("content", data) if isinstance(data, dict) else data
    if not isinstance(users, list):
        users = []

    total = data.get("totalElements", len(users)) if isinstance(data, dict) else len(users)
    admins = sum(1 for u in users if str(u.get("role")).upper() == "ADMIN")
    analysts = sum(1 for u in users if str(u.get("role")).upper() == "ANALYST")
    viewers = sum(1 for u in users if str(u.get("role")).upper() == "USER")
    active = sum(1 for u in users if str(u.get("status")).upper() == "ACTIVE")

    return (
        f"👥 **Registered Users Overview**:\n"
        f"• **Total Registered Accounts**: `{total}`\n"
        f"• 🛡️ **Administrators**: `{admins}`\n"
        f"• 🔍 **SOC Analysts**: `{analysts}`\n"
        f"• 👤 **Security Viewers**: `{viewers}`\n"
        f"• 🟢 **Active Sessions/Accounts**: `{active}`\n\n"
        f"💡 Manage operator roles and permissions under 👤 **Users** module (/users)."
    )

def fetch_teams_stats(authorization):
    data = make_api_request("/api/teams?size=1000", authorization)
    if data is None:
        return "⚠️ Unable to fetch Teams from SentinelCore backend."

    teams = data.get("content", data) if isinstance(data, dict) else data
    if not isinstance(teams, list):
        teams = []

    total = data.get("totalElements", len(teams)) if isinstance(data, dict) else len(teams)
    team_details = []
    for t in teams[:5]:
        name = t.get("teamName", t.get("name", "Security Team"))
        lead = t.get("teamLead", "N/A")
        members = len(t.get("memberUserIds", t.get("members", [])))
        team_details.append(f"• ⚔️ **{name}** (Lead: `{lead}`, Members: `{members}`)")

    team_str = "\n".join(team_details) if team_details else "No active teams configured."

    return (
        f"🏢 **Registered Teams Overview**:\n"
        f"• **Total Operational Teams**: `{total}`\n"
        f"{team_str}\n\n"
        f"💡 Configure team responsibilities and incident routing under 👥 **Teams** module (/teams)."
    )

def fetch_alerts_stats(authorization):
    data = make_api_request("/api/alerts?size=1000", authorization)
    if data is None:
        return "⚠️ Unable to fetch Alerts from SentinelCore backend."

    alerts = data.get("content", data) if isinstance(data, dict) else data
    if not isinstance(alerts, list):
        alerts = []

    total = data.get("totalElements", len(alerts)) if isinstance(data, dict) else len(alerts)
    critical = sum(1 for a in alerts if str(a.get("severity")).upper() == "CRITICAL")
    high = sum(1 for a in alerts if str(a.get("severity")).upper() == "HIGH")
    medium = sum(1 for a in alerts if str(a.get("severity")).upper() == "MEDIUM")
    low = sum(1 for a in alerts if str(a.get("severity")).upper() == "LOW")

    return (
        f"⚠️ **Security Alerts Overview**:\n"
        f"• **Total Active Alerts**: `{total}`\n"
        f"• 🔴 **Critical Severity**: `{critical}`\n"
        f"• 🟠 **High Severity**: `{high}`\n"
        f"• 🟡 **Medium Severity**: `{medium}`\n"
        f"• 🟢 **Low Severity**: `{low}`\n\n"
        f"💡 Triage and review active alerts under 🔔 **Alerts Management** (/alerts)."
    )

def fetch_threat_intel_stats(authorization):
    data = make_api_request("/api/threat-intel?size=1000", authorization)
    if data is None:
        return "⚠️ Unable to fetch Threat Intel indicators from SentinelCore backend."

    iocs = data.get("content", data) if isinstance(data, dict) else data
    if not isinstance(iocs, list):
        iocs = []

    total = data.get("totalElements", len(iocs)) if isinstance(data, dict) else len(iocs)
    ips = sum(1 for i in iocs if str(i.get("type")).upper() == "IP")
    domains = sum(1 for i in iocs if str(i.get("type")).upper() == "DOMAIN")
    urls = sum(1 for i in iocs if str(i.get("type")).upper() == "URL")
    hashes = sum(1 for i in iocs if str(i.get("type")).upper() in ["HASH", "MALWARE_HASH"])

    return (
        f"🛡️ **Threat Intelligence & Blocked IOCs**:\n"
        f"• **Total Blocked Indicators**: `{total}`\n"
        f"• 🌐 **Auto-Blocked Attacking IPs**: `{ips}`\n"
        f"• 🔗 **Auto-Blocked Malicious Domains**: `{domains}`\n"
        f"• 🌐 **Auto-Blocked Phishing URLs**: `{urls}`\n"
        f"• 💻 **Auto-Blocked Malware Hashes**: `{hashes}`\n\n"
        f"💡 View automated defense blocks under 🛡️ **Threat Intel** module (/threat-intel)."
    )

def fetch_single_incident(incident_id, authorization):
    # Direct fetch
    incident = make_api_request(f"/api/incidents/{incident_id}", authorization)
    
    # If direct endpoint returned 404 or None, search /api/incidents list for matching ID or title
    if not incident or not isinstance(incident, dict) or "id" not in incident:
        all_incidents = make_api_request("/api/incidents?size=1000", authorization)
        inc_list = all_incidents.get("content", all_incidents) if isinstance(all_incidents, dict) else all_incidents
        if isinstance(inc_list, list):
            target = None
            for inc in inc_list:
                inc_id_str = str(inc.get("id", ""))
                inc_title = str(inc.get("title", ""))
                if incident_id.lower() == inc_id_str.lower() or incident_id.lower() in inc_id_str.lower() or incident_id.lower() in inc_title.lower():
                    target = inc
                    break
            incident = target

    if not incident or not isinstance(incident, dict):
        return f"❌ Could not find any incident matching ID or keyword `{incident_id}` in SentinelCore database. Please verify the ID under 📋 **Incidents** board (/incidents)."

    inc_id = incident.get("id") or incident_id
    title = incident.get("title") or "Untitled Incident"
    status = str(incident.get("status") or "UNKNOWN").replace("_", " ")
    priority = incident.get("priority") or "P3"
    
    assigned_to = incident.get("assignedTo")
    if isinstance(assigned_to, dict):
        assignee = assigned_to.get("name") or assigned_to.get("email") or "Unassigned"
    elif isinstance(assigned_to, str) and assigned_to.strip():
        assignee = assigned_to
    else:
        assignee = "Unassigned"

    assigned_team = incident.get("assignedTeam")
    if isinstance(assigned_team, dict):
        team = assigned_team.get("teamName") or assigned_team.get("name") or "No team"
    elif isinstance(assigned_team, str) and assigned_team.strip():
        team = assigned_team
    else:
        team = "No team"

    due = incident.get("dueAt") or "No SLA set"
    created = incident.get("createdAt") or "N/A"

    return (
        f"📌 **Incident Details & Tracking Status ({inc_id})**:\n"
        f"• 📋 **Title**: {title}\n"
        f"• 📊 **Status**: `{status}`\n"
        f"• ⚡ **Priority**: `{priority}`\n"
        f"• 👤 **Assigned Analyst**: `{assignee}`\n"
        f"• 🏢 **Assigned Team**: `{team}`\n"
        f"• ⏱️ **SLA Due Date**: `{due}`\n"
        f"• 📅 **Logged Timestamp**: `{created}`\n\n"
        f"💡 Open and update this card under 📋 **Incidents** board (/incidents)."
    )

# --- INTENT PARSER & RESPONSE ROUTER ---

def normalize(text):
    return "".join(ch.lower() if ch.isalnum() else " " for ch in text).split()

def extract_incident_id(message):
    # 1. 24-character Mongo hex ObjectId
    match24 = re.search(r"\b[0-9a-fA-F]{24}\b", message)
    if match24:
        return match24.group(0)

    # 2. Formatted ID e.g. INC-101, INC101, #101
    match_inc = re.search(r"\b(?:INC[-_]?\d+|#\d+)\b", message, re.IGNORECASE)
    if match_inc:
        return match_inc.group(0)

    # 3. Key phrase prefix match e.g. "incident id 123", "track 66d...", "status of incident 123"
    match_prefix = re.search(r"\b(?:incident|case|track|status\s+of\s+incident)\s+(?:id|number|code|#)?\s*[:#-]?\s*([a-zA-Z0-9_-]+)", message, re.IGNORECASE)
    if match_prefix:
        candidate = match_prefix.group(1).strip()
        reserved_words = {
            "status", "stats", "stat", "track", "trace", "check", "lookup", "find", "by", "id",
            "details", "summary", "overview", "report", "reports", "list", "count", "info",
            "log", "logs", "priority", "triage", "open", "closed", "resolved", "triaged",
            "history", "updates", "all", "current", "active", "how", "to", "the", "my", "a", "an",
            "dashboard", "users", "teams", "assets", "alerts", "threat", "intel", "registered"
        }
        cand_lower = candidate.lower()
        if cand_lower not in reserved_words and len(candidate) >= 3:
            # Must contain digits or be a valid 24-char hex or specific alphanumeric ID to be an ID
            if any(ch.isdigit() for ch in candidate) or len(candidate) == 24:
                return candidate

    return None

def route_user_message(message, authorization):
    raw_lower = message.lower()
    words = set(normalize(message))

    # Single Incident ID Lookup
    inc_id = extract_incident_id(message)
    if inc_id:
        return fetch_single_incident(inc_id, authorization)

    # General Incident Tracking Guide
    if any(k in raw_lower for k in [
        "how to track incident", "how to track", "incident by id", "track by id",
        "search incident by id", "how to find incident"
    ]):
        return (
            f"📌 **How to Track Incident Status by ID**:\n"
            f"• Type `status of incident <ID>` or `track <ID>` (e.g. `status of incident 66d8f52a...` or `INC-101`).\n"
            f"• You can copy any Incident ID directly from the 📋 **Incidents** Kanban board (/incidents).\n\n"
            f"💡 Or ask for overall status via `incident status` or `incident stats`!"
        )

    # 1. Assets Query
    if any(k in raw_lower for k in ["asset", "assets", "registered assets", "how many assets", "asset count", "server count", "hardware"]):
        return fetch_assets_stats(authorization)

    # 2. Incidents Query (Overall stats & status)
    if any(k in raw_lower for k in [
        "incident", "incidents", "incident status", "incident stats", "incident summary",
        "incident overview", "incident report", "incident count", "open incidents",
        "how incident", "track incident", "active incidents", "incident priority",
        "incident triage", "incidents status"
    ]):
        return fetch_incidents_stats(authorization)

    # 3. Users Query
    if any(k in raw_lower for k in ["user", "users", "registered users", "how many users", "operator", "operators", "user list", "user status"]):
        return fetch_users_stats(authorization)

    # 4. Teams Query
    if any(k in raw_lower for k in ["team", "teams", "registered teams", "about teams", "how many teams", "department", "departments"]):
        return fetch_teams_stats(authorization)

    # 5. Alerts Query
    if any(k in raw_lower for k in ["alert", "alerts", "warning", "warnings", "critical alerts", "active alerts"]):
        return fetch_alerts_stats(authorization)

    # 6. Threat Intel Query
    if any(k in raw_lower for k in ["threat intel", "ioc", "iocs", "blocked ips", "blocked domains", "malware", "indicators"]):
        return fetch_threat_intel_stats(authorization)

    # 7. Check General Operation Definitions
    best_op = None
    best_score = 0
    message_text = " ".join(words)

    for op in APP_OPERATIONS:
        score = 0
        for kw in op["keywords"]:
            if kw in message_text:
                score += 3 if " " in kw else 1
        if op["name"].lower() in message_text:
            score += 4
        if score > best_score:
            best_op = op
            best_score = score

    if best_op and best_score >= 1:
        return f"{best_op['answer']}"

    if any(w in message_text for w in ["help", "menu", "modules", "features", "list", "show"]):
        module_list = ", ".join([f"• **{op['name']}**" for op in APP_OPERATIONS])
        return (
            f"📚 **SentinelCore Available Modules**:\n"
            f"{module_list}\n\n"
            f"💡 Ask me specifically about any module or statistics!"
        )

    return DEFAULT_ANSWER

class ChatbotHandler(BaseHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/health":
            self.send_json({"status": "ok", "service": "Sentinel Core Python AI Chatbot"})
            return
        if path == "/":
            self.send_json({"message": DEFAULT_ANSWER})
            return
        self.send_error(404, "Route not found")

    def do_POST(self):
        path = urlparse(self.path).path
        if path != "/chat":
            self.send_error(404, "Route not found")
            return

        try:
            content_length = int(self.headers.get("Content-Length", "0"))
            body = self.rfile.read(content_length).decode("utf-8")
            payload = json.loads(body or "{}")
            message = str(payload.get("message", "")).strip()
            auth_header = self.headers.get("Authorization")

            reply = route_user_message(message, auth_header)
            self.send_json({"reply": reply})
        except json.JSONDecodeError:
            self.send_error(400, "Invalid JSON body")

    def send_json(self, payload):
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, format_text, *args):
        print(f"[chatbot] {self.address_string()} - {format_text % args}")

def run():
    server = ThreadingHTTPServer((HOST, PORT), ChatbotHandler)
    print(f"========================================================================")
    print(f" [*] SentinelCore AI Chatbot Server running at http://{HOST}:{PORT}")
    print(f" [+] Live REST Integration: Assets, Incidents, Users, Teams, Alerts & IOCs")
    print(f"========================================================================")
    server.serve_forever()

if __name__ == "__main__":
    run()
