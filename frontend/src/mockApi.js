import axios from 'axios';
import seedUsers from '../../sentinelcore.users.json';
import seedTeams from '../../sentinelcore.teams.json';

// --- Database Configuration & LocalStorage Helper ---
const DB_KEYS = {
  USERS: 'mock_db_users',
  TEAMS: 'mock_db_teams',
  INCIDENTS: 'mock_db_incidents',
  ASSETS: 'mock_db_assets',
  THREAT_INTEL: 'mock_db_threat_intel',
  LOGS: 'mock_db_logs',
  AUDIT_LOGS: 'mock_db_audit_logs',
  REPORTS: 'mock_db_reports',
  VULNERABILITIES: 'mock_db_vulnerabilities',
  REMEDIATION_TASKS: 'mock_db_remediation_tasks',
  PATCHES: 'mock_db_patches',
  NOTIFICATIONS: 'mock_db_notifications',
  ENRICHMENTS: 'mock_db_enrichments',
  FEEDS: 'mock_db_feeds',
  NOTES: 'mock_db_notes',
  ACTORS: 'mock_db_actors',
  MALWARE: 'mock_db_malware',
  CVES: 'mock_db_cves'
};

const getDB = (key, defaultData) => {
  const val = localStorage.getItem(key);
  if (!val) {
    localStorage.setItem(key, JSON.stringify(defaultData));
    return defaultData;
  }
  try {
    return JSON.parse(val);
  } catch (e) {
    localStorage.setItem(key, JSON.stringify(defaultData));
    return defaultData;
  }
};

const saveDB = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// --- Seed Data Mappers ---
const mapSeedUsers = (users) => {
  return users.map(u => ({
    id: u._id?.$oid || String(Math.random()),
    name: u.name,
    email: u.email,
    password: u.password,
    role: u.role,
    department: u.department,
    status: u.status || 'ACTIVE',
    createdAt: u.createdAt?.$date || new Date().toISOString(),
    updatedAt: u.updatedAt?.$date || new Date().toISOString(),
    lastLogin: u.lastLogin?.$date || null
  }));
};

const mapSeedTeams = (teams) => {
  return teams.map(t => ({
    id: t._id?.$oid || String(Math.random()),
    teamName: t.teamName,
    department: t.department,
    teamLead: t.teamLead, // user ID string
    members: t.members || [], // array of user ID strings
    description: t.description,
    createdAt: t.createdAt?.$date || new Date().toISOString(),
    updatedAt: t.updatedAt?.$date || new Date().toISOString()
  }));
};

// --- Initialize Mock Databases ---
const usersList = mapSeedUsers(seedUsers);
const teamsList = mapSeedTeams(seedTeams);

const initialIncidents = [
  {
    id: 'inc-1',
    title: 'Brute force attack on ActiveDirectory server',
    description: 'Detected 45 failed login attempts in 2 minutes targeting administrator account.',
    priority: 'P1',
    status: 'OPEN',
    category: 'Unauthorized Access',
    source: 'ActiveDirectory',
    assignedTo: '6a50d23c6e100d55d9c1c4cf', // Subhasish Nath
    assignedTeam: '6a50d60a6e100d55d9c1c4d8', // Delta
    dueAt: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
  },
  {
    id: 'inc-2',
    title: 'Phishing campaign targeting Finance department',
    description: 'Reported emails posing as invoice updates containing suspicious macro attachment.',
    priority: 'P2',
    status: 'TRIAGED',
    category: 'Phishing',
    source: 'Office365',
    assignedTo: '6a50e0ac2ebea069090f0d14', // Ayan Dutta
    assignedTeam: '6a522bb1b8db831ddb3a4070', // Red
    dueAt: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString()
  },
  {
    id: 'inc-3',
    title: 'SQL Injection attempt detected on web gateway',
    description: 'WAF blocked multiple GET requests containing SQL injection payloads.',
    priority: 'P1',
    status: 'IN_PROGRESS',
    category: 'Network Anomaly',
    source: 'WAF-Gateway',
    assignedTo: '6a50d1b06e100d55d9c1c4cc', // Admin
    assignedTeam: '6a50d60a6e100d55d9c1c4d8', // Delta
    dueAt: new Date(Date.now() + 1 * 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
  }
];

const initialAssets = [
  {
    id: 'asset-1',
    name: 'Primary Domain Controller',
    type: 'SERVER',
    ipAddress: '10.1.10.5',
    macAddress: '00:0C:29:43:2F:11',
    os: 'Windows Server 2022',
    criticality: 'CRITICAL',
    status: 'ONLINE',
    ownerTeamId: '6a50d60a6e100d55d9c1c4d8',
    lastSeen: new Date().toISOString()
  },
  {
    id: 'asset-2',
    name: 'WAF Gateway Appliance',
    type: 'FIREWALL',
    ipAddress: '10.1.10.1',
    macAddress: '00:0C:29:88:1A:BC',
    os: 'FortiOS 7.2',
    criticality: 'CRITICAL',
    status: 'ONLINE',
    ownerTeamId: '6a50d60a6e100d55d9c1c4d8',
    lastSeen: new Date().toISOString()
  },
  {
    id: 'asset-3',
    name: 'Marketing Web Host',
    type: 'SERVER',
    ipAddress: '192.168.10.45',
    macAddress: '00:15:5D:01:22:98',
    os: 'Linux (Ubuntu 22.04)',
    criticality: 'MEDIUM',
    status: 'ONLINE',
    ownerTeamId: '6a50d5eb6e100d55d9c1c4d6',
    lastSeen: new Date().toISOString()
  },
  {
    id: 'asset-4',
    name: 'SQL Production Database',
    type: 'DATABASE',
    ipAddress: '10.2.20.12',
    macAddress: '00:15:5D:88:99:FF',
    os: 'Linux (RHEL 9.1)',
    criticality: 'CRITICAL',
    status: 'ONLINE',
    ownerTeamId: '6a50d60a6e100d55d9c1c4d8',
    lastSeen: new Date().toISOString()
  },
  {
    id: 'asset-5',
    name: 'Employee Workstation - QA',
    type: 'ENDPOINT',
    ipAddress: '192.168.20.101',
    macAddress: '8C:16:45:C2:E0:0A',
    os: 'Windows 11 Enterprise',
    criticality: 'LOW',
    status: 'OFFLINE',
    ownerTeamId: '6a5500d3c03d491061894595',
    lastSeen: new Date(Date.now() - 3 * 3600 * 1000).toISOString()
  }
];

const initialThreatIntel = [
  {
    id: 'threat-1',
    type: 'IP',
    value: '185.220.101.5',
    description: 'Identified Tor Exit node active in brute-force dictionary attempts.',
    source: 'AlienVault OTX',
    reviewerTeamId: '6a50d60a6e100d55d9c1c4d8',
    riskScore: 88.0,
    status: 'ACTIVE',
    tags: ['BruteForce', 'TorExit'],
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString()
  },
  {
    id: 'threat-2',
    type: 'DOMAIN',
    value: 'sentinell-core-security-alert.org',
    description: 'Domain registering phishing templates resembling SSO landing page.',
    source: 'PhishTank',
    reviewerTeamId: '6a50d5eb6e100d55d9c1c4d6',
    riskScore: 92.0,
    status: 'ACTIVE',
    tags: ['Phishing', 'SSO_Spoof'],
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'threat-3',
    type: 'URL',
    value: 'http://compromised-site.ru/files/payload.exe',
    description: 'Active download URL spreading Trojan installer payloads.',
    source: 'ThreatFeeds',
    reviewerTeamId: '6a50dedf2ebea069090f0d0e',
    riskScore: 96.0,
    status: 'ACTIVE',
    tags: ['Malware', 'TrojanDistribution'],
    createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString()
  }
];

const initialEnrichments = [
  {
    id: 'enrich-1',
    iocId: 'threat-1',
    country: 'Russia',
    countryCode: 'RU',
    isp: 'Mtel Network Providers',
    asn: 'AS4231',
    latitude: 55.7558,
    longitude: 37.6173,
    reputationScore: 88.0,
    confidenceScore: 95.0,
    malwareFamily: 'CobaltStrike C2',
    threatCategory: 'Command & Control',
    associatedCves: ['CVE-2023-38606'],
    relatedThreatActors: ['APT29 (Cozy Bear)'],
    mitreAttacks: ['T1110 (Brute Force)', 'T1078 (Valid Accounts)'],
    firstSeen: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    lastSeen: new Date().toISOString()
  },
  {
    id: 'enrich-2',
    iocId: 'threat-2',
    country: 'Seychelles',
    countryCode: 'SC',
    isp: 'Cloud Registrar Proxy',
    asn: 'AS28456',
    latitude: -4.6796,
    longitude: 55.4920,
    reputationScore: 92.0,
    confidenceScore: 88.0,
    malwareFamily: 'Redline Stealer',
    threatCategory: 'Phishing',
    associatedCves: ['CVE-2023-32409'],
    relatedThreatActors: ['Lazarus Group'],
    mitreAttacks: ['T1566 (Phishing)', 'T1204 (User Execution)'],
    firstSeen: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    lastSeen: new Date().toISOString()
  }
];

const initialFeeds = [
  { id: 'feed-1', name: 'VirusTotal', url: 'https://www.virustotal.com/api', enabled: true, status: 'ACTIVE', lastSync: new Date(Date.now() - 3600 * 1000).toISOString(), syncIntervalMinutes: 60 },
  { id: 'feed-2', name: 'AlienVault OTX', url: 'https://otx.alienvault.com/api', enabled: true, status: 'ACTIVE', lastSync: new Date(Date.now() - 7200 * 1000).toISOString(), syncIntervalMinutes: 120 },
  { id: 'feed-3', name: 'AbuseIPDB', url: 'https://api.abuseipdb.com/api', enabled: false, status: 'INACTIVE', lastSync: null, syncIntervalMinutes: 30 },
  { id: 'feed-4', name: 'PhishTank', url: 'https://phishtank.com/api', enabled: true, status: 'ACTIVE', lastSync: new Date(Date.now() - 10800 * 1000).toISOString(), syncIntervalMinutes: 180 },
  { id: 'feed-5', name: 'CIRCL CVE Feed', url: 'https://cve.circl.lu/api', enabled: true, status: 'ACTIVE', lastSync: new Date(Date.now() - 14400 * 1000).toISOString(), syncIntervalMinutes: 240 },
  { id: 'feed-6', name: 'MISP Community', url: 'https://misp-community.org/api', enabled: false, status: 'INACTIVE', lastSync: null, syncIntervalMinutes: 360 }
];

const initialActors = [
  { id: 'actor-1', name: 'APT29', aliases: ['Cozy Bear', 'Nobelium', 'Midnight Blizzard'], originCountry: 'Russia', targetedSectors: ['Government', 'Defense', 'NATO', 'NGOs'], description: 'State-sponsored cyber espionage group active since at least 2008, known for SolarWinds attack.', associatedMalware: ['CobaltStrike', 'Redline Stealer'] },
  { id: 'actor-2', name: 'Lazarus Group', aliases: ['Guardians of Peace', 'Hidden Cobra', 'APT38'], originCountry: 'North Korea', targetedSectors: ['Finance', 'Cryptocurrency', 'Defense', 'Entertainment'], description: 'State-sponsored hacker group active since 2009, behind WannaCry and Sony Pictures hacks.', associatedMalware: ['Destover', 'Mimikatz', 'Redline Stealer'] }
];

const initialMalware = [
  { id: 'mal-1', name: 'CobaltStrike', type: 'TROJAN', description: 'Commercial penetration testing tool used widely by threat actors for beacon C2.', signatures: ['md5:9d5e30b...', 'sha256:d17ab88...'], associatedActors: ['APT29'] },
  { id: 'mal-2', name: 'Redline Stealer', type: 'SPYWARE', description: 'Malware that harvests saved passwords, browser autofill, cookies, and crypto tokens.', signatures: ['md5:5e3bc83...', 'sha256:a44cd12...'], associatedActors: ['APT29', 'Lazarus Group'] }
];

const initialCves = [
  { id: 'cve-1', cveId: 'CVE-2023-38606', description: 'Apple iOS, iPadOS, and macOS kernel vulnerability allowing state modification.', cvssScore: 9.8, severity: 'CRITICAL', epssScore: 0.85, cwe: 'CWE-20 (Improper Input Validation)', capec: ['CAPEC-115'], publishedDate: new Date(Date.now() - 180 * 24 * 3600 * 1000).toISOString() },
  { id: 'cve-2', cveId: 'CVE-2023-32409', description: 'WebKit sandbox breakout allowing remote attackers to execute arbitrary code.', cvssScore: 8.8, severity: 'HIGH', epssScore: 0.64, cwe: 'CWE-119 (Buffer Overflow)', capec: ['CAPEC-100'], publishedDate: new Date(Date.now() - 120 * 24 * 3600 * 1000).toISOString() },
  { id: 'cve-3', cveId: 'CVE-2022-22965', description: 'Spring framework remote code execution (Spring4Shell) via ClassLoader parameter binding.', cvssScore: 7.5, severity: 'HIGH', epssScore: 0.44, cwe: 'CWE-94 (Code Injection)', capec: ['CAPEC-242'], publishedDate: new Date(Date.now() - 400 * 24 * 3600 * 1000).toISOString() },
  { id: 'cve-4', cveId: 'CVE-2021-44228', description: 'Apache Log4j2 JNDI vulnerability allowing unauthenticated remote code execution (Log4Shell).', cvssScore: 10.0, severity: 'CRITICAL', epssScore: 0.99, cwe: 'CWE-502 (Deserialization)', capec: ['CAPEC-253'], publishedDate: new Date(Date.now() - 800 * 24 * 3600 * 1000).toISOString() }
];

const initialVulnerabilities = [
  {
    id: 'vuln-1',
    cveId: 'CVE-2023-38606',
    cvssScore: 9.8,
    severity: 'CRITICAL',
    description: 'Apple iOS, iPadOS, and macOS kernel vulnerability allowing state modification.',
    affectedSoftware: 'macOS Ventura < 13.5',
    detectionDate: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    patchAvailability: true,
    status: 'ASSIGNED',
    assetId: 'asset-1',
    assignedToEmail: 'subhas@sentinelcore.in',
    assignedTeamId: '6a50d60a6e100d55d9c1c4d8',
    dueDate: new Date(Date.now() + 4 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'vuln-2',
    cveId: 'CVE-2023-32409',
    cvssScore: 8.8,
    severity: 'HIGH',
    description: 'WebKit sandbox breakout allowing remote attackers to execute arbitrary code.',
    affectedSoftware: 'libwebkit2gtk-4.0',
    detectionDate: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    patchAvailability: true,
    status: 'IN_PROGRESS',
    assetId: 'asset-3',
    assignedToEmail: 'vikram@sentinelcore.in',
    assignedTeamId: '6a50d5eb6e100d55d9c1c4d6',
    dueDate: new Date(Date.now() + 8 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'vuln-3',
    cveId: 'CVE-2022-22965',
    cvssScore: 7.5,
    severity: 'HIGH',
    description: 'Spring framework remote code execution (Spring4Shell) via ClassLoader parameter binding.',
    affectedSoftware: 'Spring Boot Starter Web < 2.6.6',
    detectionDate: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    patchAvailability: true,
    status: 'NEW',
    assetId: 'asset-4',
    assignedToEmail: 'admin@sentinelcore.in',
    assignedTeamId: '6a50d60a6e100d55d9c1c4d8',
    dueDate: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'vuln-4',
    cveId: 'CVE-2021-44228',
    cvssScore: 10.0,
    severity: 'CRITICAL',
    description: 'Apache Log4j2 JNDI vulnerability allowing unauthenticated remote code execution (Log4Shell).',
    affectedSoftware: 'Log4j-core 2.14.1',
    detectionDate: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString(),
    patchAvailability: true,
    status: 'RESOLVED',
    assetId: 'asset-2',
    assignedToEmail: 'admin@sentinelcore.in',
    assignedTeamId: '6a50d60a6e100d55d9c1c4d8',
    dueDate: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
  }
];

const initialRemediationTasks = [
  { id: 'task-v1', vulnerabilityId: 'vuln-1', assignedAnalystEmail: 'subhas@sentinelcore.in', dueDate: new Date(Date.now() + 4 * 24 * 3600 * 1000).toISOString(), status: 'ASSIGNED', exceptionApproved: false, exceptionReason: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'task-v2', vulnerabilityId: 'vuln-2', assignedAnalystEmail: 'vikram@sentinelcore.in', dueDate: new Date(Date.now() + 8 * 24 * 3600 * 1000).toISOString(), status: 'IN_PROGRESS', exceptionApproved: false, exceptionReason: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'task-v3', vulnerabilityId: 'vuln-3', assignedAnalystEmail: 'admin@sentinelcore.in', dueDate: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString(), status: 'NEW', exceptionApproved: false, exceptionReason: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'task-v4', vulnerabilityId: 'vuln-4', assignedAnalystEmail: 'admin@sentinelcore.in', dueDate: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(), status: 'RESOLVED', exceptionApproved: false, exceptionReason: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
];

const initialPatchesList = [
  { id: 'pat-1', cveId: 'CVE-2023-38606', patchId: 'KB948201', vendor: 'Apple Inc.', affectedProduct: 'macOS Ventura', fixedVersion: 'Ventura 13.5', releaseDate: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(), downloadUrl: 'https://support.apple.com/kb/update', status: 'PENDING' },
  { id: 'pat-2', cveId: 'CVE-2023-32409', patchId: 'KB902410', vendor: 'Ubuntu Canonical', affectedProduct: 'libwebkit2gtk-4.0', fixedVersion: '2.40.5-0ubuntu0.22.04.1', releaseDate: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(), downloadUrl: 'https://ubuntu.com/security/notices', status: 'DEPLOYED' },
  { id: 'pat-3', cveId: 'CVE-2022-22965', patchId: 'KB771120', vendor: 'VMware Spring', affectedProduct: 'Spring Framework', fixedVersion: '5.3.18 / 5.2.20', releaseDate: new Date(Date.now() - 365 * 24 * 3600 * 1000).toISOString(), downloadUrl: 'https://spring.io/security/cve-2022-22965', status: 'PENDING' }
];

const initialNotifications = [
  { id: 'not-1', type: 'NEW_CRITICAL_CVE', title: 'New Critical CVE Discovered!', message: 'Asset Primary Domain Controller (10.1.10.5) is vulnerable to CVE-2023-38606 (CVSS: 9.8)', isRead: false, createdAt: new Date().toISOString() },
  { id: 'not-2', type: 'PATCH_AVAILABLE', title: 'Vendor Update Released', message: 'Apple released Ventura 13.5 patch addressing critical kernel CVE-2023-38606', isRead: false, createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString() }
];

const initialReportsList = [
  { id: 'rep-1', title: 'Executive Vulnerability Compliance Summary', type: 'DAILY', generatedBy: 'admin@sentinelcore.in', createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), summary: 'Platform risk compliance matches 85%. Patches pending deploy on 3 critical assets.' }
];

const initialNotesList = [
  { id: 'note-1', targetId: 'threat-1', targetType: 'IOC', authorEmail: 'admin@sentinelcore.in', authorName: 'Admin', content: 'Blocked this IP permanently in WAF router rules.', createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString() },
  { id: 'note-2', targetId: 'vuln-1', targetType: 'VULNERABILITY', authorEmail: 'subhas@sentinelcore.in', authorName: 'Subhasish Nath', content: 'Testing patch deployment in staging environments.', createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString() }
];

// --- Getters & Storage Synchronizer ---
const getUsers = () => getDB(DB_KEYS.USERS, usersList);
const getTeams = () => getDB(DB_KEYS.TEAMS, teamsList);
const getIncidents = () => getDB(DB_KEYS.INCIDENTS, initialIncidents);
const getAssets = () => getDB(DB_KEYS.ASSETS, initialAssets);
const getLogs = () => getDB(DB_KEYS.LOGS, initialLogs);
const getAuditLogs = () => getDB(DB_KEYS.AUDIT_LOGS, []);
const getReports = () => getDB(DB_KEYS.REPORTS, initialReportsList);

const getThreatIntel = () => getDB(DB_KEYS.THREAT_INTEL, initialThreatIntel);
const getEnrichments = () => getDB(DB_KEYS.ENRICHMENTS, initialEnrichments);
const getFeeds = () => getDB(DB_KEYS.FEEDS, initialFeeds);
const getActors = () => getDB(DB_KEYS.ACTORS, initialActors);
const getMalware = () => getDB(DB_KEYS.MALWARE, initialMalware);
const getCves = () => getDB(DB_KEYS.CVES, initialCves);

const getVulnerabilities = () => getDB(DB_KEYS.VULNERABILITIES, initialVulnerabilities);
const getRemediationTasks = () => getDB(DB_KEYS.REMEDIATION_TASKS, initialRemediationTasks);
const getPatches = () => getDB(DB_KEYS.PATCHES, initialPatchesList);
const getNotifications = () => getDB(DB_KEYS.NOTIFICATIONS, initialNotifications);
const getNotes = () => getDB(DB_KEYS.NOTES, initialNotesList);

const addAuditLog = (userEmail, action, details) => {
  const current = getAuditLogs();
  const entry = {
    id: 'audit-' + Math.random().toString(36).substr(2, 9),
    userEmail: userEmail || 'anonymous',
    action,
    details,
    timestamp: new Date().toISOString()
  };
  saveDB(DB_KEYS.AUDIT_LOGS, [entry, ...current]);
};

// --- Custom Mock Axios Adapter ---
const mockAdapter = async (config) => {
  let url = config.url || '';
  const method = (config.method || 'get').toLowerCase();
  
  if (url.startsWith('http://localhost:8080')) {
    url = url.substring('http://localhost:8080'.length);
  }
  
  const params = config.params || {};
  let parsedData = {};
  if (config.data) {
    try {
      parsedData = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    } catch (e) {
      parsedData = config.data;
    }
  }

  const authHeader = config.headers?.Authorization || axios.defaults.headers.common['Authorization'] || '';
  const tokenUserId = authHeader.replace('Bearer mock-jwt-token-for-', '').trim();
  const activeUser = getUsers().find(u => u.id === tokenUserId);
  const activeEmail = activeUser?.email || 'anonymous';
  const activeName = activeUser?.name || 'Admin';

  const ok = (data) => ({
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config
  });

  const badRequest = (message) => ({
    data: { message },
    status: 400,
    statusText: 'Bad Request',
    headers: {},
    config
  });

  const unauthorized = () => ({
    data: { message: 'Unauthorized session' },
    status: 401,
    statusText: 'Unauthorized',
    headers: {},
    config
  });

  // --- Endpoints Router ---

  // POST /api/auth/login
  if (url === '/api/auth/login' && method === 'post') {
    const { email, password } = parsedData;
    const user = getUsers().find(u => u.email === email);
    if (user) {
      const updated = getUsers().map(u => u.id === user.id ? { ...u, lastLogin: new Date().toISOString() } : u);
      saveDB(DB_KEYS.USERS, updated);
      addAuditLog(email, 'USER_LOGIN', `User logged in from browser (mock mode).`);
      return ok({
        token: 'mock-jwt-token-for-' + user.id,
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        status: user.status
      });
    }
    return badRequest('Invalid email or password');
  }

  // GET /api/auth/profile
  if (url === '/api/auth/profile' && method === 'get') {
    if (!activeUser) return unauthorized();
    return ok(activeUser);
  }

  // POST /api/auth/register
  if (url === '/api/auth/register' && method === 'post') {
    const { name, email, password, role, department } = parsedData;
    const exists = getUsers().find(u => u.email === email);
    if (exists) return badRequest('Email already registered');
    
    const newUser = {
      id: 'usr-' + Math.random().toString(36).substr(2, 9),
      name,
      email,
      password: password || 'default',
      role: role || 'VIEWER',
      department: department || 'Security',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLogin: null
    };

    saveDB(DB_KEYS.USERS, [...getUsers(), newUser]);
    addAuditLog(email, 'USER_REGISTER', `New user registered: ${name} (${email}) with role ${role}`);
    return ok(newUser);
  }

  // POST /api/auth/logout
  if (url === '/api/auth/logout' && method === 'post') {
    addAuditLog(activeEmail, 'USER_LOGOUT', `User logged out.`);
    return ok({ message: 'Logged out successfully' });
  }

  // GET /api/users
  if (url.startsWith('/api/users') && method === 'get' && !url.includes('/status')) {
    const size = parseInt(params.size || '10');
    const page = parseInt(params.page || '0');
    let list = getUsers();
    
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    if (params.role) {
      list = list.filter(u => u.role === params.role);
    }
    if (params.department) {
      list = list.filter(u => u.department === params.department);
    }

    const totalElements = list.length;
    const totalPages = Math.ceil(totalElements / size);
    const sliced = list.slice(page * size, (page + 1) * size);

    return ok({
      content: sliced,
      totalPages,
      totalElements,
      number: page,
      size
    });
  }

  // POST /api/users
  if (url === '/api/users' && method === 'post') {
    const newUser = {
      id: 'usr-' + Math.random().toString(36).substr(2, 9),
      ...parsedData,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    saveDB(DB_KEYS.USERS, [...getUsers(), newUser]);
    addAuditLog(activeEmail, 'USER_CREATE', `Created user account: ${newUser.name}`);
    return ok(newUser);
  }

  // PUT /api/users/:id
  if (url.startsWith('/api/users/') && method === 'put' && !url.endsWith('/status')) {
    const id = url.substring('/api/users/'.length);
    const updatedUser = {
      ...parsedData,
      id,
      updatedAt: new Date().toISOString()
    };
    saveDB(DB_KEYS.USERS, getUsers().map(u => u.id === id ? { ...u, ...updatedUser } : u));
    addAuditLog(activeEmail, 'USER_UPDATE', `Updated user account: ${updatedUser.name}`);
    return ok(updatedUser);
  }

  // PUT /api/users/:id/status
  if (url.startsWith('/api/users/') && url.endsWith('/status') && method === 'put') {
    const parts = url.split('/');
    const id = parts[3];
    const { status } = parsedData;
    let updated;
    const updatedUsers = getUsers().map(u => {
      if (u.id === id) {
        updated = { ...u, status, updatedAt: new Date().toISOString() };
        return updated;
      }
      return u;
    });
    saveDB(DB_KEYS.USERS, updatedUsers);
    addAuditLog(activeEmail, 'USER_STATUS_CHANGE', `Updated status for ${updated?.name} to ${status}`);
    return ok(updated);
  }

  // DELETE /api/users/:id
  if (url.startsWith('/api/users/') && method === 'delete') {
    const id = url.substring('/api/users/'.length);
    const user = getUsers().find(u => u.id === id);
    saveDB(DB_KEYS.USERS, getUsers().filter(u => u.id !== id));
    addAuditLog(activeEmail, 'USER_DELETE', `Deleted user account: ${user?.name || id}`);
    return ok({ message: 'User deleted' });
  }

  // GET /api/teams
  if (url.startsWith('/api/teams') && method === 'get') {
    let list = getTeams();
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(t => t.teamName.toLowerCase().includes(q) || t.department.toLowerCase().includes(q));
    }
    return ok(list);
  }

  // POST /api/teams
  if (url === '/api/teams' && method === 'post') {
    const newTeam = {
      id: 'team-' + Math.random().toString(36).substr(2, 9),
      ...parsedData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    saveDB(DB_KEYS.TEAMS, [...getTeams(), newTeam]);
    addAuditLog(activeEmail, 'TEAM_CREATE', `Created security team: ${newTeam.teamName}`);
    return ok(newTeam);
  }

  // PUT /api/teams/:id
  if (url.startsWith('/api/teams/') && method === 'put') {
    const id = url.substring('/api/teams/'.length);
    const updatedTeam = {
      ...parsedData,
      id,
      updatedAt: new Date().toISOString()
    };
    saveDB(DB_KEYS.TEAMS, getTeams().map(t => t.id === id ? { ...t, ...updatedTeam } : t));
    addAuditLog(activeEmail, 'TEAM_UPDATE', `Updated security team: ${updatedTeam.teamName}`);
    return ok(updatedTeam);
  }

  // DELETE /api/teams/:id
  if (url.startsWith('/api/teams/') && method === 'delete') {
    const id = url.substring('/api/teams/'.length);
    const team = getTeams().find(t => t.id === id);
    saveDB(DB_KEYS.TEAMS, getTeams().filter(t => t.id !== id));
    addAuditLog(activeEmail, 'TEAM_DELETE', `Deleted security team: ${team?.teamName || id}`);
    return ok({ message: 'Team deleted' });
  }

  // GET /api/incidents
  if (url.startsWith('/api/incidents') && method === 'get') {
    let list = getIncidents();
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(i => i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q));
    }
    if (params.priority) {
      list = list.filter(i => i.priority === params.priority);
    }
    if (params.status) {
      list = list.filter(i => i.status === params.status);
    }

    const users = getUsers();
    const teams = getTeams();
    const resolved = list.map(inc => ({
      ...inc,
      assignedTo: users.find(u => u.id === inc.assignedTo) || null,
      assignedTeam: teams.find(t => t.id === inc.assignedTeam) || null
    }));

    return ok({
      content: resolved,
      totalElements: resolved.length,
      totalPages: 1,
      size: 200,
      number: 0
    });
  }

  // POST /api/incidents
  if (url === '/api/incidents' && method === 'post') {
    const newIncident = {
      id: 'inc-' + Math.random().toString(36).substr(2, 9),
      ...parsedData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    saveDB(DB_KEYS.INCIDENTS, [...getIncidents(), newIncident]);
    addAuditLog(activeEmail, 'INCIDENT_CREATE', `Created security incident: ${newIncident.title}`);
    return ok(newIncident);
  }

  // PUT /api/incidents/:id
  if (url.startsWith('/api/incidents/') && method === 'put') {
    const id = url.substring('/api/incidents/'.length);
    const data = parsedData;
    let updated;
    const list = getIncidents().map(inc => {
      if (inc.id === id) {
        updated = { ...inc, ...data, updatedAt: new Date().toISOString() };
        if (data.status === 'RESOLVED' && !inc.resolvedAt) {
          updated.resolvedAt = new Date().toISOString();
        }
        return updated;
      }
      return inc;
    });
    saveDB(DB_KEYS.INCIDENTS, list);
    addAuditLog(activeEmail, 'INCIDENT_UPDATE', `Updated security incident: ${updated?.title} (Status: ${updated?.status})`);
    return ok(updated);
  }

  // DELETE /api/incidents/:id
  if (url.startsWith('/api/incidents/') && method === 'delete') {
    const id = url.substring('/api/incidents/'.length);
    const incident = getIncidents().find(i => i.id === id);
    saveDB(DB_KEYS.INCIDENTS, getIncidents().filter(i => i.id !== id));
    addAuditLog(activeEmail, 'INCIDENT_DELETE', `Deleted security incident: ${incident?.title || id}`);
    return ok({ message: 'Incident deleted' });
  }

  // GET /api/assets
  if (url.startsWith('/api/assets') && method === 'get') {
    return ok(getAssets());
  }

  // POST /api/assets
  if (url === '/api/assets' && method === 'post') {
    const current = getAssets();
    const existingIndex = parsedData.id ? current.findIndex(a => a.id === parsedData.id) : -1;
    let asset;
    
    if (existingIndex !== -1) {
      asset = { ...current[existingIndex], ...parsedData, lastSeen: new Date().toISOString() };
      current[existingIndex] = asset;
      saveDB(DB_KEYS.ASSETS, current);
      addAuditLog(activeEmail, 'ASSET_UPDATE', `Updated managed asset: ${asset.name}`);
    } else {
      asset = {
        id: 'asset-' + Math.random().toString(36).substr(2, 9),
        ...parsedData,
        lastSeen: new Date().toISOString()
      };
      saveDB(DB_KEYS.ASSETS, [...current, asset]);
      addAuditLog(activeEmail, 'ASSET_CREATE', `Registered managed asset: ${asset.name}`);
    }
    return ok(asset);
  }

  // DELETE /api/assets/:id
  if (url.startsWith('/api/assets/') && method === 'delete') {
    const id = url.substring('/api/assets/'.length);
    const asset = getAssets().find(a => a.id === id);
    saveDB(DB_KEYS.ASSETS, getAssets().filter(a => a.id !== id));
    addAuditLog(activeEmail, 'ASSET_DELETE', `Deleted managed asset: ${asset?.name || id}`);
    return ok({ message: 'Asset deleted' });
  }

  // POST /api/assets/import
  if (url === '/api/assets/import' && method === 'post') {
    const newAssets = [
      { id: 'asset-import-1', name: 'Imported Server-A', type: 'SERVER', ipAddress: '10.5.10.15', macAddress: '00:0C:29:EE:FF:11', os: 'Linux (Debian)', criticality: 'HIGH', status: 'ONLINE', ownerTeamId: getTeams()[0]?.id || '', lastSeen: new Date().toISOString() },
      { id: 'asset-import-2', name: 'Imported Firewall-B', type: 'FIREWALL', ipAddress: '10.5.10.1', macAddress: '00:0C:29:AA:BB:CC', os: 'PaloAlto PAN-OS', criticality: 'CRITICAL', status: 'ONLINE', ownerTeamId: getTeams()[0]?.id || '', lastSeen: new Date().toISOString() }
    ];
    saveDB(DB_KEYS.ASSETS, [...getAssets(), ...newAssets]);
    addAuditLog(activeEmail, 'ASSETS_IMPORT', `Imported ${newAssets.length} assets from CSV template.`);
    return ok(newAssets);
  }

  // ----------------------------------------------------
  // --- Threat Intelligence Endpoint Mock Overrides ---
  // ----------------------------------------------------
  
  // GET /api/threat-intel
  if (url.startsWith('/api/threat-intel') && method === 'get' && !url.includes('/enrichment') && !url.includes('/feeds') && !url.includes('/notes') && !url.includes('/actors') && !url.includes('/malware')) {
    const size = parseInt(params.size || '10');
    const page = parseInt(params.page || '0');
    let list = getThreatIntel();
    
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(t => t.value.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
    }
    if (params.type) {
      list = list.filter(t => t.type === params.type);
    }

    const totalElements = list.length;
    const totalPages = Math.ceil(totalElements / size);
    const sliced = list.slice(page * size, (page + 1) * size);

    // Support plain list returns for compatibility with original code
    if (params.size === undefined && params.page === undefined) {
      return ok(list);
    }

    return ok({
      content: sliced,
      totalPages,
      totalElements,
      number: page,
      size
    });
  }

  // GET /api/threat-intel/:id
  if (url.startsWith('/api/threat-intel/') && method === 'get' && !url.endsWith('/enrichment') && !url.endsWith('/notes')) {
    const id = url.substring('/api/threat-intel/'.length);
    const ioc = getThreatIntel().find(t => t.id === id);
    if (!ioc) return { status: 404, data: { message: "IOC not found" } };
    return ok(ioc);
  }

  // POST /api/threat-intel
  if (url === '/api/threat-intel' && method === 'post') {
    const newThreat = {
      id: 'threat-' + Math.random().toString(36).substr(2, 9),
      status: 'ACTIVE',
      riskScore: parsedData.type === 'IP' ? 88.0 : 92.0,
      tags: ['ManualImport'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...parsedData
    };
    saveDB(DB_KEYS.THREAT_INTEL, [...getThreatIntel(), newThreat]);
    addAuditLog(activeEmail, 'THREAT_INTEL_CREATE', `Added Threat Indicator: ${newThreat.value}`);
    return ok(newThreat);
  }

  // PUT /api/threat-intel/:id
  if (url.startsWith('/api/threat-intel/') && method === 'put') {
    const id = url.substring('/api/threat-intel/'.length);
    const updated = {
      ...parsedData,
      id,
      updatedAt: new Date().toISOString()
    };
    saveDB(DB_KEYS.THREAT_INTEL, getThreatIntel().map(t => t.id === id ? { ...t, ...updated } : t));
    addAuditLog(activeEmail, 'THREAT_INTEL_UPDATE', `Updated threat indicator: ${updated.value}`);
    return ok(updated);
  }

  // DELETE /api/threat-intel/:id
  if (url.startsWith('/api/threat-intel/') && method === 'delete') {
    const id = url.substring('/api/threat-intel/'.length);
    const threat = getThreatIntel().find(t => t.id === id);
    saveDB(DB_KEYS.THREAT_INTEL, getThreatIntel().filter(t => t.id !== id));
    addAuditLog(activeEmail, 'THREAT_INTEL_DELETE', `Deleted threat indicator: ${threat?.value || id}`);
    return ok({ message: 'Threat intel deleted' });
  }

  // GET /api/threat-intel/:id/enrichment
  if (url.startsWith('/api/threat-intel/') && url.endsWith('/enrichment') && method === 'get') {
    const parts = url.split('/');
    const iocId = parts[3];
    const enrich = getEnrichments().find(e => e.iocId === iocId);
    if (!enrich) {
      return ok({
        iocId,
        country: 'Unknown',
        countryCode: 'UN',
        isp: 'Private Range',
        asn: 'N/A',
        latitude: 0,
        longitude: 0,
        reputationScore: 50.0,
        confidenceScore: 70.0,
        malwareFamily: 'None',
        threatCategory: 'Audit',
        associatedCves: [],
        relatedThreatActors: [],
        mitreAttacks: []
      });
    }
    return ok(enrich);
  }

  // POST /api/threat-intel/:id/enrich
  if (url.startsWith('/api/threat-intel/') && url.endsWith('/enrich') && method === 'post') {
    const parts = url.split('/');
    const iocId = parts[3];
    const ioc = getThreatIntel().find(t => t.id === iocId);
    
    const newEnrich = {
      id: 'enrich-' + Math.random().toString(36).substr(2, 9),
      iocId,
      country: ioc?.type === 'IP' ? 'Russia' : 'Seychelles',
      countryCode: ioc?.type === 'IP' ? 'RU' : 'SC',
      isp: 'SecureTransit ISP',
      asn: 'AS59124',
      latitude: 55.75,
      longitude: 37.62,
      reputationScore: ioc?.riskScore || 75.0,
      confidenceScore: 90.0,
      malwareFamily: 'Redline Stealer Payload',
      threatCategory: 'Exploit C2 Server',
      associatedCves: ['CVE-2023-38606', 'CVE-2023-32409'],
      relatedThreatActors: ['APT29', 'Lazarus Group'],
      mitreAttacks: ['T1110 (Brute Force)', 'T1566 (Phishing)', 'T1078 (Valid Accounts)'],
      firstSeen: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
      lastSeen: new Date().toISOString()
    };
    
    const filtered = getEnrichments().filter(e => e.iocId !== iocId);
    saveDB(DB_KEYS.ENRICHMENTS, [...filtered, newEnrich]);
    addAuditLog(activeEmail, 'IOC_ENRICH', `Enriched indicator metrics: ${ioc?.value || iocId}`);
    return ok(newEnrich);
  }

  // GET /api/threat-intel/feeds
  if (url === '/api/threat-intel/feeds' && method === 'get') {
    return ok(getFeeds());
  }

  // POST /api/threat-intel/feeds/:id/toggle
  if (url.startsWith('/api/threat-intel/feeds/') && url.endsWith('/toggle') && method === 'post') {
    const parts = url.split('/');
    const feedId = parts[4];
    let updated;
    const feeds = getFeeds().map(f => {
      if (f.id === feedId) {
        updated = { ...f, enabled: !f.enabled };
        return updated;
      }
      return f;
    });
    saveDB(DB_KEYS.FEEDS, feeds);
    addAuditLog(activeEmail, 'FEED_TOGGLE', `Toggled threat feed ${updated?.name} to ${updated?.enabled ? 'enabled' : 'disabled'}`);
    return ok(updated);
  }

  // POST /api/threat-intel/feeds/:id/sync
  if (url.startsWith('/api/threat-intel/feeds/') && url.endsWith('/sync') && method === 'post') {
    const parts = url.split('/');
    const feedId = parts[4];
    let updated;
    const feeds = getFeeds().map(f => {
      if (f.id === feedId) {
        updated = { ...f, status: 'ACTIVE', lastSync: new Date().toISOString() };
        return updated;
      }
      return f;
    });
    saveDB(DB_KEYS.FEEDS, feeds);
    addAuditLog(activeEmail, 'FEED_SYNC', `Manually synchronized feed source: ${updated?.name}`);
    return ok(updated);
  }

  // POST /api/threat-intel/import
  if (url === '/api/threat-intel/import' && method === 'post') {
    const list = Array.isArray(parsedData) ? parsedData : [];
    const added = list.map(ioc => ({
      id: 'threat-' + Math.random().toString(36).substr(2, 9),
      status: 'ACTIVE',
      riskScore: 70.0,
      tags: ['BulkImport'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...ioc
    }));
    saveDB(DB_KEYS.THREAT_INTEL, [...getThreatIntel(), ...added]);
    addAuditLog(activeEmail, 'IOC_IMPORT', `Bulk imported ${added.length} security indicators.`);
    return ok(added);
  }

  // GET /api/threat-intel/actors
  if (url === '/api/threat-intel/actors' && method === 'get') {
    return ok(getActors());
  }

  // GET /api/threat-intel/malware
  if (url === '/api/threat-intel/malware' && method === 'get') {
    return ok(getMalware());
  }

  // ----------------------------------------------------
  // --- Vulnerability Management Endpoint Overrides ---
  // ----------------------------------------------------
  
  // GET /api/vulnerabilities
  if (url.startsWith('/api/vulnerabilities') && method === 'get' && !url.includes('/remediation') && !url.includes('/patches') && !url.includes('/dashboard') && !url.includes('/notifications') && !url.includes('/notes')) {
    return ok(getVulnerabilities());
  }

  // GET /api/vulnerabilities/:id
  if (url.startsWith('/api/vulnerabilities/') && method === 'get' && !url.endsWith('/notes')) {
    const id = url.substring('/api/vulnerabilities/'.length);
    const vuln = getVulnerabilities().find(v => v.id === id);
    if (!vuln) return { status: 404, data: { message: "Vulnerability not found" } };
    return ok(vuln);
  }

  // POST /api/vulnerabilities
  if (url === '/api/vulnerabilities' && method === 'post') {
    const id = 'vuln-' + Math.random().toString(36).substr(2, 9);
    
    // Auto lookup CVE data to fetch CVSS and severity
    const matchingCve = getCves().find(c => c.cveId.toUpperCase() === parsedData.cveId?.toUpperCase());
    const cvssScore = matchingCve ? matchingCve.cvssScore : parsedData.cvssScore || 5.0;
    const severity = matchingCve ? matchingCve.severity : (cvssScore >= 9.0 ? 'CRITICAL' : cvssScore >= 7.0 ? 'HIGH' : cvssScore >= 4.0 ? 'MEDIUM' : 'LOW');
    const description = matchingCve ? matchingCve.description : parsedData.description || 'Manual entry discovered vulnerability.';

    const newVuln = {
      id,
      cvssScore,
      severity,
      description,
      detectionDate: new Date().toISOString(),
      status: 'NEW',
      dueDate: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString(),
      ...parsedData
    };

    saveDB(DB_KEYS.VULNERABILITIES, [...getVulnerabilities(), newVuln]);
    
    // Create remediation task
    const newTask = {
      id: 'task-' + Math.random().toString(36).substr(2, 9),
      vulnerabilityId: id,
      assignedAnalystEmail: newVuln.assignedToEmail || '',
      dueDate: newVuln.dueDate,
      status: 'NEW',
      exceptionApproved: false,
      exceptionReason: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    saveDB(DB_KEYS.REMEDIATION_TASKS, [...getRemediationTasks(), newTask]);

    // Critical alarm trigger
    if (severity === 'CRITICAL') {
      const asset = getAssets().find(a => a.id === newVuln.assetId);
      const newNotif = {
        id: 'not-' + Math.random().toString(36).substr(2, 9),
        type: 'NEW_CRITICAL_CVE',
        title: 'New Critical CVE Discovered!',
        message: `Asset ${asset?.name || 'Unknown'} (${asset?.ipAddress || 'unknown'}) is vulnerable to ${newVuln.cveId} (CVSS: ${cvssScore})`,
        isRead: false,
        createdAt: new Date().toISOString()
      };
      saveDB(DB_KEYS.NOTIFICATIONS, [newNotif, ...getNotifications()]);
    }

    addAuditLog(activeEmail, 'VULN_CREATE', `Manually registered vulnerability ${newVuln.cveId} on Asset ID ${newVuln.assetId}`);
    return ok(newVuln);
  }

  // PUT /api/vulnerabilities/:id
  if (url.startsWith('/api/vulnerabilities/') && method === 'put') {
    const id = url.substring('/api/vulnerabilities/'.length);
    const data = parsedData;
    let updated;
    const list = getVulnerabilities().map(vuln => {
      if (vuln.id === id) {
        updated = { ...vuln, ...data };
        if (data.status === 'RESOLVED' && !vuln.resolvedAt) {
          updated.resolvedAt = new Date().toISOString();
        }
        return updated;
      }
      return vuln;
    });
    saveDB(DB_KEYS.VULNERABILITIES, list);

    // Sync remediation task state
    const updatedTasks = getRemediationTasks().map(t => {
      if (t.vulnerabilityId === id) {
        return {
          ...t,
          status: data.status,
          assignedAnalystEmail: data.assignedToEmail || t.assignedAnalystEmail,
          updatedAt: new Date().toISOString()
        };
      }
      return t;
    });
    saveDB(DB_KEYS.REMEDIATION_TASKS, updatedTasks);

    addAuditLog(activeEmail, 'VULN_UPDATE', `Updated vulnerability ticket: ${updated.cveId} status set to ${updated.status}`);
    return ok(updated);
  }

  // DELETE /api/vulnerabilities/:id
  if (url.startsWith('/api/vulnerabilities/') && method === 'delete') {
    const id = url.substring('/api/vulnerabilities/'.length);
    const vuln = getVulnerabilities().find(v => v.id === id);
    saveDB(DB_KEYS.VULNERABILITIES, getVulnerabilities().filter(v => v.id !== id));
    saveDB(DB_KEYS.REMEDIATION_TASKS, getRemediationTasks().filter(t => t.vulnerabilityId !== id));
    addAuditLog(activeEmail, 'VULN_DELETE', `Deleted vulnerability: ${vuln?.cveId || id}`);
    return ok({ message: 'Vulnerability deleted' });
  }

  // POST /api/vulnerabilities/import
  if (url === '/api/vulnerabilities/import' && method === 'post') {
    const raw = Array.isArray(parsedData) ? parsedData : [];
    const added = raw.map(v => {
      const id = 'vuln-' + Math.random().toString(36).substr(2, 9);
      const matchingCve = getCves().find(c => c.cveId.toUpperCase() === v.cveId?.toUpperCase());
      const cvssScore = matchingCve ? matchingCve.cvssScore : v.cvssScore || 6.5;
      const severity = matchingCve ? matchingCve.severity : (cvssScore >= 9.0 ? 'CRITICAL' : cvssScore >= 7.0 ? 'HIGH' : cvssScore >= 4.0 ? 'MEDIUM' : 'LOW');
      
      const newVuln = {
        id,
        cvssScore,
        severity,
        description: matchingCve?.description || v.description || 'Imported scan finding.',
        detectionDate: new Date().toISOString(),
        status: 'NEW',
        dueDate: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString(),
        ...v
      };
      
      // Auto create task
      const newTask = {
        id: 'task-' + Math.random().toString(36).substr(2, 9),
        vulnerabilityId: id,
        assignedAnalystEmail: '',
        dueDate: newVuln.dueDate,
        status: 'NEW',
        exceptionApproved: false,
        exceptionReason: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      saveDB(DB_KEYS.REMEDIATION_TASKS, [...getRemediationTasks(), newTask]);

      return newVuln;
    });

    saveDB(DB_KEYS.VULNERABILITIES, [...getVulnerabilities(), ...added]);
    addAuditLog(activeEmail, 'VULN_IMPORT', `Ingested Nessus/OpenVAS security scanner findings (${added.length} CVEs).`);
    return ok(added);
  }

  // GET /api/vulnerabilities/remediation
  if (url === '/api/vulnerabilities/remediation' && method === 'get') {
    return ok(getRemediationTasks());
  }

  // POST /api/vulnerabilities/remediation/:id/exception
  if (url.startsWith('/api/vulnerabilities/remediation/') && url.endsWith('/exception') && method === 'post') {
    const parts = url.split('/');
    const taskId = parts[4];
    const { reason } = parsedData;
    let vulnId;

    const tasks = getRemediationTasks().map(t => {
      if (t.id === taskId) {
        vulnId = t.vulnerabilityId;
        return {
          ...t,
          exceptionApproved: true,
          exceptionReason: reason,
          status: 'CLOSED',
          updatedAt: new Date().toISOString()
        };
      }
      return t;
    });
    saveDB(DB_KEYS.REMEDIATION_TASKS, tasks);

    // Auto mark vulnerability closed
    if (vulnId) {
      saveDB(DB_KEYS.VULNERABILITIES, getVulnerabilities().map(v => v.id === vulnId ? { ...v, status: 'CLOSED' } : v));
    }

    addAuditLog(activeEmail, 'REMEDIATION_EXCEPTION', `Approved compliance exception for remediation task ID: ${taskId}. Reason: ${reason}`);
    return ok({ id: taskId, exceptionApproved: true, status: 'CLOSED' });
  }

  // GET /api/vulnerabilities/patches
  if (url === '/api/vulnerabilities/patches' && method === 'get') {
    return ok(getPatches());
  }

  // GET /api/vulnerabilities/dashboard/stats
  if (url === '/api/vulnerabilities/dashboard/stats' && method === 'get') {
    const vulnerabilities = getVulnerabilities();
    const assets = getAssets();

    const totalAssets = assets.length;
    const totalVulnerabilities = vulnerabilities.length;
    const criticalCVEs = vulnerabilities.filter(v => v.severity === 'CRITICAL').length;
    
    let resolved = vulnerabilities.filter(v => v.status === 'RESOLVED' || v.status === 'CLOSED').length;
    const patchCompliance = totalVulnerabilities > 0 ? Math.round((resolved / totalVulnerabilities) * 100) : 100;

    // top vulnerable assets calculation
    const counts = {};
    vulnerabilities.forEach(v => {
      counts[v.assetId] = (counts[v.assetId] || 0) + 1;
    });
    
    const topVulnerableAssets = Object.entries(counts)
      .map(([assetId, count]) => {
        const asset = assets.find(a => a.id === assetId);
        return {
          assetName: asset?.name || 'Unknown host',
          ipAddress: asset?.ipAddress || '0.0.0.0',
          count
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return ok({
      totalAssets,
      totalVulnerabilities,
      criticalCVEs,
      patchCompliance,
      topVulnerableAssets
    });
  }

  // GET /api/vulnerabilities/notifications
  if (url === '/api/vulnerabilities/notifications' && method === 'get') {
    return ok(getNotifications());
  }

  // POST /api/vulnerabilities/notifications/:id/read
  if (url.startsWith('/api/vulnerabilities/notifications/') && url.endsWith('/read') && method === 'post') {
    const parts = url.split('/');
    const notifId = parts[4];
    const updated = getNotifications().map(n => n.id === notifId ? { ...n, isRead: true } : n);
    saveDB(DB_KEYS.NOTIFICATIONS, updated);
    return ok({ id: notifId, isRead: true });
  }

  // GET /api/vulnerabilities/:id/notes & POST /api/vulnerabilities/:id/notes
  // GET /api/threat-intel/:id/notes & POST /api/threat-intel/:id/notes
  const isNotesUrl = url.includes('/notes');
  if (isNotesUrl) {
    const parts = url.split('/');
    const targetId = parts[3];
    const targetType = url.includes('threat-intel') ? 'IOC' : 'VULNERABILITY';
    
    if (method === 'get') {
      const list = getNotes().filter(n => n.targetId === targetId && n.targetType === targetType);
      return ok(list);
    } else if (method === 'post') {
      const { content } = parsedData;
      const newNote = {
        id: 'note-' + Math.random().toString(36).substr(2, 9),
        targetId,
        targetType,
        authorEmail: activeEmail,
        authorName: activeName,
        content,
        createdAt: new Date().toISOString()
      };
      saveDB(DB_KEYS.NOTES, [...getNotes(), newNote]);
      addAuditLog(activeEmail, 'ADD_COMMENT', `Added comment note to ${targetType.toLowerCase()} target ID ${targetId}`);
      return ok(newNote);
    }
  }

  // GET /api/audit-logs
  if (url.startsWith('/api/audit-logs') && method === 'get') {
    const size = parseInt(params.size || '10');
    const page = parseInt(params.page || '0');
    const list = getAuditLogs();
    const totalElements = list.length;
    const totalPages = Math.ceil(totalElements / size);
    const sliced = list.slice(page * size, (page + 1) * size);

    return ok({
      content: sliced,
      totalPages,
      totalElements,
      number: page,
      size
    });
  }

  // GET /api/dashboard/stats
  if (url === '/api/dashboard/stats' && method === 'get') {
    const incidents = getIncidents();
    const users = getUsers();
    const logs = getLogs();

    const totalIncidents = incidents.length;
    const openAlerts = incidents.filter(i => i.status !== 'RESOLVED' && i.status !== 'CLOSED').length;
    const activeUsersCount = users.filter(u => u.status === 'ACTIVE').length;
    
    const severityMap = { P1: 0, P2: 0, P3: 0, P4: 0 };
    incidents.forEach(inc => {
      if (severityMap[inc.priority] !== undefined) severityMap[inc.priority]++;
    });

    const severityDistribution = [
      { name: 'P1 Critical', value: severityMap.P1 },
      { name: 'P2 High', value: severityMap.P2 },
      { name: 'P3 Medium', value: severityMap.P3 },
      { name: 'P4 Low', value: severityMap.P4 }
    ];

    const statusMap = { OPEN: 0, TRIAGED: 0, IN_PROGRESS: 0, RESOLVED: 0, CLOSED: 0 };
    incidents.forEach(inc => {
      const st = inc.status.toUpperCase();
      if (statusMap[st] !== undefined) statusMap[st]++;
    });

    const alertStatusCounts = [
      { status: 'Open', count: statusMap.OPEN },
      { status: 'Triaged', count: statusMap.TRIAGED },
      { status: 'In Progress', count: statusMap.IN_PROGRESS },
      { status: 'Resolved', count: statusMap.RESOLVED + statusMap.CLOSED }
    ];

    return ok({
      totalIncidents,
      openAlerts,
      activeUsers: activeUsersCount,
      logIngestionRate: logs.length,
      incidentTrend: [
        { day: 'Mon', incidents: 4, alerts: 9 },
        { day: 'Tue', incidents: 7, alerts: 14 },
        { day: 'Wed', incidents: 3, alerts: 6 },
        { day: 'Thu', incidents: 9, alerts: 21 },
        { day: 'Fri', incidents: totalIncidents, alerts: logs.length },
        { day: 'Sat', incidents: 2, alerts: 4 },
        { day: 'Sun', incidents: 6, alerts: 13 }
      ],
      severityDistribution,
      alertStatusCounts
    });
  }

  // GET /api/reports
  if (url === '/api/reports' && method === 'get') {
    return ok(getReports());
  }

  // POST /api/reports/generate
  if (url === '/api/reports/generate' && method === 'post') {
    const { type } = parsedData;
    const newReport = {
      id: 'report-' + Math.random().toString(36).substr(2, 9),
      title: `${type.charAt(0) + type.slice(1).toLowerCase()} Security Audit Summary`,
      type,
      generatedBy: activeEmail,
      createdAt: new Date().toISOString(),
      summary: `Automated ${type} posture review generated. All systems green. Risk posture nominal.`
    };
    saveDB(DB_KEYS.REPORTS, [newReport, ...getReports()]);
    addAuditLog(activeEmail, 'REPORT_GENERATE', `Compiled security audit report type: ${type}`);
    return ok(newReport);
  }

  // default 404
  return {
    data: { message: `Mock endpoint not found: ${method.toUpperCase()} ${url}` },
    status: 404,
    statusText: 'Not Found',
    headers: {},
    config
  };
};

// --- Setup request interceptor to override the axios adapter ---
axios.interceptors.request.use(
  (config) => {
    const isApiUrl = config.url && (
      config.url.startsWith('/api') || 
      config.url.startsWith('http://localhost:8080/api')
    );
    if (isApiUrl) {
      config.adapter = mockAdapter;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

console.log('✅ SentinelCore Expanded Client Mock API Interceptor successfully mounted.');
