/**
 * PWA Indicators Component
 * HU-041: Shows PWA installation status and offline capabilities
 */

import React, { useState, useEffect } from 'react';
import {
  Wifi,
  WifiOff,
  Download,
  Smartphone,
  CheckCircle,
  AlertCircle,
  X,
  RefreshCw,
  Home
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';
import { cn } from '../../utils/cn';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PwaIndicators: React.FC = () => {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [cacheStatus, setCacheStatus] = useState<'checking' | 'ready' | 'updating'>('checking');

  useEffect(() => {
    // Check if already installed
    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
      }

      // For iOS
      if ((window.navigator as any).standalone) {
        setIsInstalled(true);
      }
    };

    checkInstalled();

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);

      // Show install prompt after a delay
      setTimeout(() => {
        if (!isInstalled && !localStorage.getItem('pwa-install-dismissed')) {
          setShowInstallPrompt(true);
        }
      }, 5000);
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    // Network status listeners
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineAlert(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineAlert(true);
    };

    // Service Worker update listener
    const checkForUpdates = () => {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          setUpdateAvailable(true);
        });

        // Check registration for updates
        navigator.serviceWorker.ready.then((registration) => {
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                }
              });
            }
          });
        });
      }
    };

    // Check cache status
    const checkCacheStatus = async () => {
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          if (cacheNames.length > 0) {
            setCacheStatus('ready');
          }
        } catch (error) {
          console.error('Cache check failed:', error);
        }
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    checkForUpdates();
    checkCacheStatus();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isInstalled]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setIsInstalled(true);
        setShowInstallPrompt(false);
      } else {
        localStorage.setItem('pwa-install-dismissed', 'true');
        setShowInstallPrompt(false);
      }
    } catch (error) {
      console.error('Install failed:', error);
    }

    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  const handleUpdateClick = () => {
    window.location.reload();
  };

  const dismissInstallPrompt = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  return (
    <>
      {/* Offline Alert */}
      {showOfflineAlert && (
        <div className="fixed top-4 right-4 max-w-sm z-50 animate-slide-in-top">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg shadow-lg p-4">
            <div className="flex items-start gap-3">
              <WifiOff className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-yellow-900 dark:text-yellow-300">
                  {t('pwa.offlineMode', 'Offline Mode')}
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                  {t('pwa.offlineMessage', 'You are currently offline. Some features may be limited.')}
                </p>
              </div>
              <button
                onClick={() => setShowOfflineAlert(false)}
                className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Install Prompt */}
      {showInstallPrompt && isInstallable && !isInstalled && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-slide-in-bottom">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Home className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t('pwa.installTitle', 'Install App')}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {t('pwa.installMessage', 'Install our app for a better experience with offline access and faster loading.')}
                </p>
                <div className="flex gap-3 mt-4">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleInstallClick}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {t('pwa.installButton', 'Install')}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={dismissInstallPrompt}
                  >
                    {t('pwa.notNow', 'Not now')}
                  </Button>
                </div>
              </div>
              <button
                onClick={dismissInstallPrompt}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Available */}
      {updateAvailable && (
        <div className="fixed top-4 right-4 max-w-sm z-50 animate-slide-in-top">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg shadow-lg p-4">
            <div className="flex items-start gap-3">
              <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-blue-900 dark:text-blue-300">
                  {t('pwa.updateAvailable', 'Update Available')}
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                  {t('pwa.updateMessage', 'A new version is available. Refresh to update.')}
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  className="mt-3"
                  onClick={handleUpdateClick}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {t('pwa.updateButton', 'Refresh')}
                </Button>
              </div>
              <button
                onClick={() => setUpdateAvailable(false)}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Bar (for installed PWA) */}
      {isInstalled && (
        <div className="fixed bottom-4 right-4 z-40">
          <div className="bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 px-3 py-2">
            <div className="flex items-center gap-3">
              {/* Connection Status */}
              <div className="flex items-center gap-1.5">
                {isOnline ? (
                  <Wifi className="w-4 h-4 text-green-500" />
                ) : (
                  <WifiOff className="w-4 h-4 text-gray-400" />
                )}
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {isOnline ? t('pwa.online', 'Online') : t('pwa.offline', 'Offline')}
                </span>
              </div>

              {/* Cache Status */}
              <div className="flex items-center gap-1.5">
                {cacheStatus === 'ready' ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : cacheStatus === 'updating' ? (
                  <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                )}
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {cacheStatus === 'ready'
                    ? t('pwa.cacheReady', 'Cached')
                    : cacheStatus === 'updating'
                    ? t('pwa.cacheUpdating', 'Updating')
                    : t('pwa.cacheChecking', 'Checking')}
                </span>
              </div>

              {/* PWA Badge */}
              <div className="flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  PWA
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Install Banner - Alternative larger banner
export const PwaInstallBanner: React.FC = () => {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Check if banner was previously dismissed
      const dismissed = localStorage.getItem('pwa-banner-dismissed');
      const dismissedDate = dismissed ? new Date(dismissed) : null;
      const daysSinceDismissed = dismissedDate
        ? (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24)
        : Infinity;

      // Show banner if not dismissed or dismissed more than 7 days ago
      if (!dismissed || daysSinceDismissed > 7) {
        setShow(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setShow(false);
      }
    } catch (error) {
      console.error('Install failed:', error);
    }

    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('pwa-banner-dismissed', new Date().toISOString());
  };

  if (!show) return null;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Home className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">
              {t('pwa.bannerText', 'Install our app for offline access and a better experience')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleInstall}
              className="bg-white text-blue-600 hover:bg-gray-100"
            >
              {t('pwa.install', 'Install')}
            </Button>
            <button
              onClick={handleDismiss}
              className="text-white/80 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PwaIndicators;