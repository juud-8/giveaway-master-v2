'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function WhopExperience() {
  const router = useRouter();
  const [isInIframe, setIsInIframe] = useState(false);
  const [whopContext, setWhopContext] = useState<any>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebug = (message: string) => {
    console.log('[Whop Debug]', message);
    setDebugInfo(prev => [...prev, message]);
  };

  useEffect(() => {
    // Check if running in iframe
    const inIframe = window.self !== window.top;
    setIsInIframe(inIframe);
    addDebug(`Running in ${inIframe ? 'iframe' : 'standalone'} mode`);

    // First, try to get context from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const companyId = urlParams.get('companyId') || urlParams.get('company_id');
    const userId = urlParams.get('userId') || urlParams.get('user_id');

    addDebug(`URL params - companyId: ${companyId}, userId: ${userId}`);
    addDebug(`All params: ${Array.from(urlParams.entries()).map(([k,v]) => `${k}=${v}`).join(', ')}`);

    if (companyId) {
      addDebug(`Found companyId in URL: ${companyId}`);
      setWhopContext({ companyId, userId });
      // Redirect immediately if we have the company ID
      setTimeout(() => {
        addDebug(`Redirecting to dashboard with companyId: ${companyId}`);
        router.push(`/?companyId=${companyId}`);
      }, 500);
      return;
    }

    // Try to fetch context from server-side (JWT token in headers)
    addDebug('Attempting to fetch Whop context from API...');

    const fetchContext = async () => {
      try {
        const response = await fetch('/api/whop/context', {
          credentials: 'include', // Include cookies
        });

        addDebug(`API response status: ${response.status}`);

        if (response.ok) {
          const data = await response.json();
          addDebug(`Context received from API (source: ${data.source}): ${JSON.stringify(data.context)}`);

          if (data.context && data.context.companyId) {
            setWhopContext(data.context);
            return;
          } else if (data.context && data.context.userId) {
            // If we have userId but no companyId, still set the context
            addDebug('Received userId but no companyId from API');
            setWhopContext(data.context);
            return;
          }
        } else {
          const errorData = await response.json();
          addDebug(`API error: ${errorData.message || errorData.error}`);
        }
      } catch (error) {
        addDebug(`Failed to fetch context from API: ${error}`);
      }

      // If API fetch failed and in iframe, try postMessage as last resort
      if (inIframe) {
        addDebug('API fetch failed, setting up postMessage listener as fallback');

        // Set up message listener for Whop SDK communication
        const handleMessage = (event: MessageEvent) => {
          // Only accept messages from Whop domains
          const allowedOrigins = [
            'https://whop.com',
            'https://app.whop.com',
            /https:\/\/.*\.whop\.com$/,
            /https:\/\/.*\.apps\.whop\.com$/,
          ];

          const isAllowedOrigin = allowedOrigins.some(origin => {
            if (typeof origin === 'string') {
              return event.origin === origin;
            }
            return origin.test(event.origin);
          });

          if (!isAllowedOrigin) {
            addDebug(`Rejected message from unknown origin: ${event.origin}`);
            return;
          }

          // Handle Whop SDK messages
          if (event.data && event.data.type) {
            addDebug(`Received Whop message: ${JSON.stringify(event.data)}`);

            switch (event.data.type) {
              case 'whop:context':
                setWhopContext(event.data.context);
                break;
              case 'whop:ready':
                // Send ready confirmation back to parent
                if (window.parent && event.source) {
                  window.parent.postMessage(
                    { type: 'app:ready' },
                    event.origin
                  );
                }
                break;
            }
          }
        };

        window.addEventListener('message', handleMessage);

        // Notify parent that app is loaded
        if (window.parent) {
          const sendReady = () => {
            try {
              window.parent.postMessage(
                { type: 'app:loaded' },
                '*' // Use wildcard since we don't know the exact origin
              );
              addDebug('Sent app:loaded message to parent');
            } catch (error) {
              addDebug(`Failed to send ready message: ${error}`);
            }
          };

          // Send immediately and retry a few times
          sendReady();
          setTimeout(sendReady, 100);
          setTimeout(sendReady, 500);
          setTimeout(sendReady, 1000);
        }
      }
    };

    fetchContext();
  }, [router]);

  // If we have company context from postMessage, redirect to main dashboard
  useEffect(() => {
    if (whopContext?.companyId) {
      addDebug(`Context received via postMessage, redirecting to dashboard`);
      router.push(`/?companyId=${whopContext.companyId}`);
    }
  }, [whopContext, router]);

  return (
    <div style={{
      padding: '40px',
      backgroundColor: '#0f172a',
      color: 'white',
      minHeight: '100vh',
      fontFamily: 'system-ui'
    }}>
      <h1>✅ Giveaway Master Loaded!</h1>
      <p>App is running in {isInIframe ? 'Whop iframe' : 'standalone mode'}</p>
      {whopContext ? (
        <p style={{ fontSize: '12px', color: '#4ade80' }}>
          Context received: Company {whopContext.companyId}
        </p>
      ) : (
        <p style={{ fontSize: '12px', color: '#888' }}>
          Waiting for Whop context...
        </p>
      )}

      {debugInfo.length > 0 && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#1e293b',
          borderRadius: '8px',
          fontSize: '11px',
          fontFamily: 'monospace'
        }}>
          <div style={{ marginBottom: '10px', fontWeight: 'bold', color: '#94a3b8' }}>
            Debug Log:
          </div>
          {debugInfo.map((info, index) => (
            <div key={index} style={{ color: '#cbd5e1', marginBottom: '4px' }}>
              [{index + 1}] {info}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
