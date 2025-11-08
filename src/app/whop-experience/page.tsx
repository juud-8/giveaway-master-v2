'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function WhopExperience() {
  const router = useRouter();
  const [isInIframe, setIsInIframe] = useState(false);
  const [whopContext, setWhopContext] = useState<any>(null);

  useEffect(() => {
    // Check if running in iframe
    const inIframe = window.self !== window.top;
    setIsInIframe(inIframe);

    if (inIframe) {
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
          console.warn('Rejected message from unknown origin:', event.origin);
          return;
        }

        // Handle Whop SDK messages
        if (event.data && event.data.type) {
          console.log('Received Whop message:', event.data);

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
              'https://whop.com'
            );
          } catch (error) {
            console.error('Failed to send ready message:', error);
          }
        };

        // Send immediately and retry after a short delay
        sendReady();
        setTimeout(sendReady, 100);
      }

      return () => {
        window.removeEventListener('message', handleMessage);
      };
    }
  }, []);

  // If we have company context, redirect to main dashboard
  useEffect(() => {
    if (whopContext?.companyId) {
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
    </div>
  );
}
