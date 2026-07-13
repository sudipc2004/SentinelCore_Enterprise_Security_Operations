import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * useWebSocket
 * Connects to a STOMP/SockJS endpoint and subscribes to a topic.
 * Degrades gracefully — if the server is unavailable, `connected` stays false
 * and no error is thrown to the parent component.
 *
 * @param {string} brokerURL  - Full WS/HTTP URL, e.g. 'http://localhost:8080/ws'
 * @param {string} topic      - STOMP topic, e.g. '/topic/events'
 * @param {number} maxEvents  - Maximum events to keep in the feed (default 50)
 */
export function useWebSocket(brokerURL, topic, maxEvents = 50) {
  const [events, setEvents] = useState([]);
  const [connected, setConnected] = useState(false);
  const clientRef = useRef(null);

  const connect = useCallback(async () => {
    let Client, SockJS;
    try {
      const stomp = await import('@stomp/stompjs');
      Client = stomp.Client;
      const sockjs = await import('sockjs-client');
      SockJS = sockjs.default;
    } catch {
      // Packages not available — stay disconnected silently
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
      onDisconnect: () => setConnected(false),
      onStompError: () => setConnected(false),
      onWebSocketError: () => setConnected(false),
    });

    try {
      client.activate();
      clientRef.current = client;
    } catch {
      setConnected(false);
    }
  }, [brokerURL, topic, maxEvents]);

  useEffect(() => {
    connect();
    return () => {
      if (clientRef.current?.active) {
        clientRef.current.deactivate();
      }
    };
  }, [connect]);

  return { events, connected };
}
