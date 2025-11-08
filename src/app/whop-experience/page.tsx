'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface WhopContext {
  companyId: string;
  userId?: string | null;
  resolvedBy?: 'url' | 'slug' | 'postMessage';
  companyName?: string;
}

export default function WhopExperience() {
  const router = useRouter();
  const [isInIframe, setIsInIframe] = useState(false);
  const [whopContext, setWhopContext] = useState<WhopContext | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const resolvingIdentifierRef = useRef<string | null>(null);

  const addDebug = useCallback((message: string) => {
    console.log('[Whop Debug]', message);
    setDebugInfo((prev) => [...prev, message]);
  }, []);

  useEffect(() => {
    const extractSlugFromPath = (path: string) => {
      const segments = path.split('/').filter(Boolean);
      const appIndex = segments.lastIndexOf('app');
      if (appIndex > 0) {
        return segments[appIndex - 1];
      }
      if (segments.length >= 2 && segments[0] === 'joined') {
        return segments[segments.length - 1];
      }
      return null;
    };

    const extractSlugFromReferrer = () => {
      if (!document.referrer) return null;
      try {
        const refUrl = new URL(document.referrer);
        if (!refUrl.hostname.endsWith('whop.com')) {
          return null;
        }
        return extractSlugFromPath(refUrl.pathname);
      } catch (error) {
        addDebug(`Failed to parse document.referrer: ${(error as Error).message}`);
        return null;
      }
    };

    const inIframe = window.self !== window.top;
    setIsInIframe(inIframe);
    addDebug(`Running in ${inIframe ? 'iframe' : 'standalone'} mode`);

    const urlParams = new URLSearchParams(window.location.search);
    const companyId = urlParams.get('companyId') || urlParams.get('company_id');
    const userId = urlParams.get('userId') || urlParams.get('user_id');

    addDebug(`URL params - companyId: ${companyId}, userId: ${userId}`);
    addDebug(
      `All params: ${Array.from(urlParams.entries())
        .map(([k, v]) => `${k}=${v}`)
        .join(', ')}`
    );

    if (companyId) {
      addDebug(`Found companyId in URL: ${companyId}`);
      setWhopContext({ companyId, userId, resolvedBy: 'url' });
      setTimeout(() => {
        addDebug(`Redirecting to dashboard with companyId: ${companyId}`);
        router.push(`/?companyId=${companyId}`);
      }, 500);
    } else {
      const slugFromParams =
        urlParams.get('experienceSlug') ||
        urlParams.get('experienceId') ||
        urlParams.get('slug');
      const slugFromPath = extractSlugFromPath(window.location.pathname);
      const slugFromReferrer = extractSlugFromReferrer();

      const identifierCandidate =
        slugFromParams || slugFromPath || slugFromReferrer || null;

      if (identifierCandidate && resolvingIdentifierRef.current !== identifierCandidate) {
        resolvingIdentifierRef.current = identifierCandidate;
        addDebug(
          `Attempting to resolve companyId via identifier: ${identifierCandidate}`
        );

        const resolveCompany = async (identifier: string) => {
          try {
            const response = await fetch(
              `/api/whop-company?identifier=${encodeURIComponent(identifier)}`
            );

            if (!response.ok) {
              const payload = await response.json().catch(() => ({}));
              throw new Error(
                payload?.error ||
                  `Failed to resolve company (status ${response.status})`
              );
            }

            const data = await response.json();
            const resolvedCompanyId = data?.company?.id;

            if (resolvedCompanyId) {
              addDebug(
                `Resolved companyId ${resolvedCompanyId} (name: ${data.company?.name || 'unknown'})`
              );
              setWhopContext({
                companyId: resolvedCompanyId,
                userId,
                resolvedBy: 'slug',
                companyName: data.company?.name,
              });
              setTimeout(() => {
                addDebug(`Redirecting to dashboard with resolved companyId: ${resolvedCompanyId}`);
                router.push(`/?companyId=${resolvedCompanyId}`);
              }, 500);
            } else {
              throw new Error('Whop company response missing id');
            }
          } catch (error) {
            addDebug(
              `Failed to resolve identifier "${identifier}": ${
                error instanceof Error ? error.message : String(error)
              }`
            );
          }
        };

        resolveCompany(identifierCandidate);
      } else if (!identifierCandidate) {
        addDebug('No slug found in URL or referrer, awaiting other context');
      }
    }

    if (inIframe) {
      addDebug('Setting up postMessage listener');

      const allowedOrigins = [
        'https://whop.com',
        'https://app.whop.com',
        /https:\/\/.*\.whop\.com$/,
        /https:\/\/.*\.apps\.whop\.com$/,
      ];

      const handleMessage = (event: MessageEvent) => {
        const isAllowedOrigin = allowedOrigins.some((origin) => {
          if (typeof origin === 'string') {
            return event.origin === origin;
          }
          return origin.test(event.origin);
        });

        if (!isAllowedOrigin) {
          addDebug(`Rejected message from unknown origin: ${event.origin}`);
          return;
        }

        if (event.data && event.data.type) {
          addDebug(`Received Whop message: ${JSON.stringify(event.data)}`);

          switch (event.data.type) {
            case 'whop:context':
              if (event.data.context?.companyId) {
                setWhopContext({
                  companyId: event.data.context.companyId,
                  userId: event.data.context.userId,
                  resolvedBy: 'postMessage',
                });
              }
              break;
            case 'whop:ready':
              if (window.parent && event.source) {
                window.parent.postMessage({ type: 'app:ready' }, event.origin);
              }
              break;
          }
        }
      };

      window.addEventListener('message', handleMessage);

      if (window.parent) {
        const sendReady = () => {
          try {
            window.parent.postMessage({ type: 'app:loaded' }, '*');
            addDebug('Sent app:loaded message to parent');
          } catch (error) {
            addDebug(`Failed to send ready message: ${error}`);
          }
        };

        sendReady();
        setTimeout(sendReady, 100);
        setTimeout(sendReady, 500);
        setTimeout(sendReady, 1000);
      }

      return () => {
        window.removeEventListener('message', handleMessage);
      };
    }

    return undefined;
  }, [addDebug, router]);

  // If we have company context from postMessage, redirect to main dashboard
  useEffect(() => {
    if (whopContext?.companyId && whopContext.resolvedBy === 'postMessage') {
      addDebug('Context received via postMessage, redirecting to dashboard');
      router.push(`/?companyId=${whopContext.companyId}`);
    }
  }, [addDebug, whopContext, router]);

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
          {whopContext.companyName ? ` (${whopContext.companyName})` : ''}
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
