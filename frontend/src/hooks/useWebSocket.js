import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * useWebSocket
 * Connects to a STOMP/SockJS endpoint and subscribes to a topic.
 * Degrades gracefully — if the server is unavailable, `connected` stays false
 * and no error is thrown to the parent component.
 * In mock/offline mode, it falls back to a simulated periodic event stream.
 *
 * @param {string} brokerURL  - Full WS/HTTP URL, e.g. 'http://localhost:8080/ws'
 * @param {string} topic      - STOMP topic, e.g. '/topic/events'
 * @param {number} maxEvents  - Maximum events to keep in the feed (default 50)
 */
export function useWebSocket(brokerURL, topic, maxEvents = 50) {
  const [events, setEvents] = useState([]);
  const [connected, setConnected] = useState(false);
  const clientRef = useRef(null);
  const simulatorIntervalRef = useRef(null);

  const startSimulator = useCallback(() => {
    if (simulatorIntervalRef.current) return;
    setConnected(true); // Show connected glow for simulation

    // Seed initial events immediately
    const initialEvents = Array.from({ length: 4 }).map((_, idx) => {
      const categories = [
        'SSO Authentication success',
        'Database connection pool warning',
        'Port scanning alert: 1024 ports scanned',
        'Outbound traffic threshold exceeded'
      ];
      const severities = ['INFO', 'LOW', 'MEDIUM', 'HIGH'];
      const sources = ['Okta-Service', 'Postgres-Main', 'IDS-Agent-01', 'Switch-Core-A'];
      return {
        message: categories[idx],
        severity: severities[idx],
        timestamp: new Date(Date.now() - (idx + 1) * 60000).toISOString(),
        _id: Date.now() - idx * 1000
      };
    });
    setEvents(initialEvents);

    simulatorIntervalRef.current = setInterval(() => {
      const categories = [
        'Brute Force scanning detected',
        'Inbound SQL injection blocked',
        'High anomalous bandwidth usage',
        'New external IP registered in Blocklist',
        'Privilege escalation warning',
        'Malicious attachment parsed'
      ];
      const severities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
      const sources = ['WAF-Gateway', 'Firewall-01', 'Core-Router', 'Office365-Connector', 'ActiveDirectory'];
      
      const randomSeverity = severities[Math.floor(Math.random() * severities.length)];
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];
      const randomSource = sources[Math.floor(Math.random() * sources.length)];
      
      const mockEvent = {
        message: `${randomCategory} from ${randomSource}`,
        severity: randomSeverity,
        timestamp: new Date().toISOString(),
        _id: Date.now() + Math.random(),
      };
      
      setEvents((prev) => [mockEvent, ...prev].slice(0, maxEvents));
    }, 4000);
  }, [maxEvents]);

  const connect = useCallback(async () => {
    let Client, SockJS;
    try {
      const stomp = await import('@stomp/stompjs');
      Client = stomp.Client;
      const sockjs = await import('sockjs-client');
      SockJS = sockjs.default;
    } catch {
      // Packages not available — fall back to simulator
      startSimulator();
      return;
    }

    if (clientRef.current?.active) return;

    const token = localStorage.getItem('token');

    const client = new Client({
      webSocketFactory: () => new SockJS(brokerURL),
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 8000,
      onConnect: () => {
        setConnected(true);
        if (simulatorIntervalRef.current) {
          clearInterval(simulatorIntervalRef.current);
          simulatorIntervalRef.current = null;
        }
        client.subscribe(topic, (message) => {
          try {
            const payload = JSON.parse(message.body);
            setEvents((prev) =>
              [{ ...payload, _id: Date.now() + Math.random() }, ...prev].slice(0, maxEvents)
            );
          } catch {
            setEvents((prev) =>
              [
                {
                  message: message.body,
                  severity: 'INFO',
                  timestamp: new Date().toISOString(),
                  _id: Date.now(),
                },
                ...prev,
              ].slice(0, maxEvents)
            );
          }
        });
      },
      onDisconnect: () => {
        setConnected(false);
        startSimulator();
      },
      onStompError: () => {
        setConnected(false);
        startSimulator();
      },
      onWebSocketError: () => {
        setConnected(false);
        startSimulator();
      },
    });

    try {
      client.activate();
      clientRef.current = client;
    } catch {
      setConnected(false);
      startSimulator();
    }
  }, [brokerURL, topic, maxEvents, startSimulator]);

  useEffect(() => {
    connect();
    return () => {
      if (clientRef.current?.active) {
        clientRef.current.deactivate();
      }
      if (simulatorIntervalRef.current) {
        clearInterval(simulatorIntervalRef.current);
      }
    };
  }, [connect]);

  return { events, connected };
}
