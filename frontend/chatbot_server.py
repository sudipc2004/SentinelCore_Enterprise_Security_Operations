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


APP_OPERATIONS = [
    {
        "name": "Dashboard",
        "route": "/dashboard",
        "keywords": ["dashboard", "home", "metrics", "stats", "chart", "live", "feed", "mttr"],
        "answer": (
            "Dashboard shows the security overview. It displays total operators, active users, teams, "
            "open incidents, MTTR, asset inventory, log counts, threat intel totals, charts, and a live event feed."
        ),
    },
    {
        "name": "Users",
        "route": "/users",
        "keywords": ["user", "users", "operator", "account", "role", "analyst", "viewer", "admin", "main"],
        "answer": (
            "Users is used to manage operator accounts. Admins can view users, create or update accounts, "
            "assign roles, departments, and control who can access security operations."
        ),
    },
    {
        "name": "Teams",
        "route": "/teams",
        "keywords": ["team", "teams", "department", "lead", "member", "routing"],
        "answer": (
            "Teams organizes security staff into operational groups. Teams can own assets, receive incident routing, "
            "and define team leads for response responsibility."
        ),
    },
    {
        "name": "Assets",
        "route": "/assets",
        "keywords": ["asset", "assets", "server", "firewall", "router", "endpoint", "csv", "inventory"],
        "answer": (
            "Assets maintains the corporate asset inventory. You can add servers, routers, firewalls, endpoints, "
            "databases, and cloud assets, import assets through CSV, filter them, and update online or offline status."
        ),
    },
    {
        "name": "Incidents",
        "route": "/incidents",
        "keywords": ["incident", "incidents", "kanban", "priority", "sla", "assign", "triage", "resolve"],
        "answer": (
            "Incidents handles response workflow. Analysts and admins can create incidents, set priority and status, "
            "assign users or teams, track due dates, and move cards by drag & drop method across Open, Triaged, In Progress, Resolved, and Closed. "
            "You can also ask me for status using an incident ID, for example: status of incident {incident id}."
        ),
    },
        {
        "name": "Incidents_track",
        "route": "/incidents",
        "keywords": ["status", "track"],
        "answer": (
            "You can able to track incident status using an incident ID, for example: status of incident {incident id}."
        ),
    },
    {
        "name": "Threat Intel",
        "route": "/threat-intel",
        "keywords": ["threat", "intel", "ioc", "indicator", "malware", "ip", "domain", "hash"],
        "answer": (
            "Threat Intel stores indicators of compromise such as suspicious IPs, domains, hashes, and malware references. "
            "It helps analysts connect logs and incidents with known threats."
        ),
    },
    {
        "name": "Audit Logs",
        "route": "/audit-logs",
        "keywords": ["audit", "audit logs", "activity", "history", "trace", "compliance"],
        "answer": (
            "Audit Logs records important user and system actions. It is mainly for admins and analysts who need "
            "traceability, compliance evidence, and investigation history."
        ),
    },
    {
        "name": "Log Explorer",
        "route": "/logs",
        "keywords": ["log", "logs", "explorer", "security log", "anomaly", "event"],
        "answer": (
            "Log Explorer is used to inspect security events and anomaly records. It helps operators search logs, "
            "review suspicious activity, and connect raw events to incidents."
        ),
    },
    {
        "name": "Vulnerabilities",
        "route": "/vulnerabilities",
        "keywords": ["vulnerability", "vulnerabilities", "cve", "weakness", "risk", "patch"],
        "answer": (
            "Vulnerabilities tracks weaknesses and risk findings. Use it to review exposed systems, severity, "
            "patching needs, and remediation progress."
        ),
    },
    {
        "name": "Alerts",
        "route": "/alerts",
        "keywords": ["alert", "alerts", "notification", "warning", "triaged"],
        "answer": (
            "Alerts shows security warnings that need attention. Operators can review alert status, identify urgent events, "
            "and decide whether an alert should become an incident."
        ),
    },
    {
        "name": "Reports",
        "route": "/reports",
        "keywords": ["report", "reports", "summary", "export", "analytics"],
        "answer": (
            "Reports summarizes security operations for review. It is useful for management updates, trend analysis, "
            "and documenting incident, asset, alert, and threat activity."
        ),
    },
    {
        "name": "Authentication",
        "route": "/login",
        "keywords": ["login", "register", "logout", "authentication", "jwt", "password", "session"],
        "answer": (
            "Authentication controls access to Sentinel Core. Users register or log in, the backend issues a JWT token, "
            "and protected pages only open when a valid session exists."
        ),
    }
]


DEFAULT_ANSWER = (
    "I can explain Sentinel Core operations such as dashboard, users, teams, assets, incidents, threat intel, "
    "audit logs, log explorer, vulnerabilities, alerts, reports, login, and logout. Ask about any module."
)


def extract_incident_id(message):
    match = INCIDENT_ID_PATTERN.search(message)
    return match.group(0) if match else None


def wants_incident_status(message):
    words = set(normalize(message))
    status_words = {"status", "track", "trace", "check", "lookup", "find", "incident"}
    return bool(words.intersection(status_words))


def format_incident_status(incident):
    title = incident.get("title") or "Untitled incident"
    incident_id = incident.get("id") or "-"
    status = incident.get("status") or "UNKNOWN"
    priority = incident.get("priority") or "-"
    assignee = (incident.get("assignedTo") or {}).get("name") or "Unassigned"
    team = (incident.get("assignedTeam") or {}).get("teamName") or "No team"
    due_at = incident.get("dueAt") or "No SLA"
    resolved_at = incident.get("resolvedAt")

    reply = (
        f"Incident {incident_id} is {status.replace('_', ' ')}. "
        f"Title: {title}."
        f"Priority: {priority}."
        f"Assignee: {assignee}."
        f"Team: {team}."
        f"Due: {due_at}."
    )
    if resolved_at:
        reply += f" Resolved at: {resolved_at}."
    return reply


def fetch_incident_status(incident_id, authorization):
    if not authorization:
        return "Please log in first, then ask again with the incident ID. I need your session token to read incident status."

    request = Request(
        f"{BACKEND_API}/api/incidents/{incident_id}",
        headers={"Authorization": authorization, "Accept": "application/json"},
    )

    try:
        with urlopen(request, timeout=5) as response:
            incident = json.loads(response.read().decode("utf-8"))
            return format_incident_status(incident)
    except HTTPError as error:
        if error.code == 401:
            return "Your session is expired or unauthorized. Please log in again, then ask for that incident status."
        if error.code == 403:
            return "You do not have permission to view that incident status."
        if error.code == 404:
            return f"I could not find any incident with ID {incident_id}."
        return "I could not read that incident right now. Please try again."
    except (TimeoutError, URLError):
        return "The Sentinel Core backend is not reachable right now, so I cannot check incident status."


def normalize(text):
    return "".join(ch.lower() if ch.isalnum() else " " for ch in text).split()


def find_best_answer(message):
    words = normalize(message)
    if not words:
        return DEFAULT_ANSWER

    message_text = " ".join(words)
    best_operation = None
    best_score = 0

    for operation in APP_OPERATIONS:
        score = 0
        for keyword in operation["keywords"]:
            key = keyword.lower()
            if key in message_text:
                score += 3 if " " in key else 1
        if operation["name"].lower() in message_text:
            score += 4
        if score > best_score:
            best_operation = operation
            best_score = score

    if not best_operation:
        if any(word in message_text for word in ["help", "menu", "modules", "features", "operation", "operations"]):
            module_list = ", ".join(f"{item['name']} ({item['route']})" for item in APP_OPERATIONS)
            return f"Sentinel Core modules are: {module_list}. Ask me about one module for details."
        return DEFAULT_ANSWER

    return f"{best_operation['answer']} Open it from {best_operation['route']}."


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
            self.send_json({"status": "ok", "service": "Sentinel Core Python Chatbot"})
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
            incident_id = extract_incident_id(message)
            if incident_id and wants_incident_status(message):
                reply = fetch_incident_status(incident_id, self.headers.get("Authorization"))
            else:
                reply = find_best_answer(message)
            self.send_json({"reply": reply})
        except json.JSONDecodeError:
            self.send_error(400, "Invalid JSON body")

    def send_json(self, payload):
        data = json.dumps(payload).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, format_text, *args):
        print(f"[chatbot] {self.address_string()} - {format_text % args}")


def run():
    server = ThreadingHTTPServer((HOST, PORT), ChatbotHandler)
    print(f"Sentinel Core Python Chatbot running at http://{HOST}:{PORT}")
    print("Use POST /chat with JSON: {\"message\": \"explain incidents\"}")
    server.serve_forever()


if __name__ == "__main__":
    run()
