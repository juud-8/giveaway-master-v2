'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WhopApp } from '@/lib/iframe';

interface WhopContext {
  companyId: string;
  userId?: string | null;
  resolvedBy?: 'url' | 'slug' | 'sdk' | 'postMessage';
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

    const inIframe = typeof window !== 'undefined' && window.self !== window.top;
    setIsInIframe(inIframe);
    addDebug(`Running in ${inIframe ? 'iframe' : 'standalone'} mode`);

    // Try to get context from Whop SDK first (for iframe mode)
    if (inIframe) {
      addDebug('Initializing Whop SDK for iframe context...');

      // The WhopApp SDK automatically handles iframe communication
      // and will provide user context via the SDK methods
      const tryWhopSDK = async () => {
        try {
          addDebug('Waiting for Whop SDK to load context...');

          // Wait a short moment for SDK to initialize
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Check if SDK provided context via URL params after initialization
          const urlParams = new URLSearchParams(window.location.search);
          const companyId = urlParams.get('companyId') || urlParams.get('company_id');

          if (companyId) {
            addDebug(`Got context from Whop SDK via URL: company ${companyId}`);
            setWhopContext({
              companyId,
              userId: urlParams.get('userId') || urlParams.get('user_id') || null,
              resolvedBy: 'sdk',
            });
            setTimeout(() => {
              addDebug(`Redirecting to dashboard with SDK companyId: ${companyId}`);
              router.push(`/?companyId=${companyId}`);
            }, 500);
            return true;
          } else {
            addDebug('Whop SDK did not provide context via URL, trying fallback methods');
          }
        } catch (error) {
          addDebug(`Whop SDK error: ${error instanceof Error ? error.message : String(error)}`);
        }
        return false;
      };

      tryWhopSDK().then((success) => {
        if (success) return; // SDK worked, we're done

        // SDK didn't work, fall back to manual methods
        addDebug('Trying fallback methods...');
        checkURLAndSlugParams();
      });
    } else {
      // Not in iframe, use URL/slug methods directly
      checkURLAndSlugParams();
    }

    function checkURLAndSlugParams() {
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
    }

    // Cleanup function (if needed)
    return undefined;
  }, [addDebug, router]);

  // Handle SDK context that might come in after initial load
  useEffect(() => {
    if (whopContext?.companyId && whopContext.resolvedBy === 'sdk' && !whopContext.userId) {
      // SDK might send updated context with userId
      addDebug('SDK context updated');
    }
  }, [addDebug, whopContext]);

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
