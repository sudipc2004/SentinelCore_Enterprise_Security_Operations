import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * useWebSocket
 * Connects to a STOMP/SockJS endpoint and subscribes to a topic.
 * Only processes genuine real-time events broadcast by the backend.
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
    } catch (err) {
      console.warn('STOMP/SockJS packages unavailable for WebSocket connection', err);
      setConnected(false);
      return;
    }

    if (clientRef.current?.active) {
      setConnected(true);
      return;
    }

    const token = localStorage.getItem('token');
    const targetUrl = brokerURL || `http://${window.location.hostname || 'localhost'}:8080/ws`;

    const client = new Client({
      webSocketFactory: () => new SockJS(targetUrl),
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 3000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        setConnected(true);
        client.subscribe(topic, (message) => {
          try {
            const payload = JSON.parse(message.body);
            setEvents((prev) =>
              [{ ...payload, _id: payload._id || payload.id || (Date.now() + Math.random().toString()) }, ...prev].slice(0, maxEvents)
            );
          } catch {
            setEvents((prev) =>
              [
                {
                  message: message.body,
                  severity: 'INFO',
                  timestamp: new Date().toISOString(),
                  _id: Date.now() + Math.random().toString(),
                },
                ...prev,
              ].slice(0, maxEvents)
            );
          }
        });
      },
      onDisconnect: () => {
        setConnected(false);
      },
      onStompError: (frame) => {
        console.warn('STOMP error:', frame);
        setConnected(false);
      },
      onWebSocketError: (err) => {
        console.warn('WebSocket connection error:', err);
        setConnected(false);
      },
    });

    try {
      client.activate();
      clientRef.current = client;
    } catch (err) {
      console.error('Failed to activate STOMP client', err);
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

