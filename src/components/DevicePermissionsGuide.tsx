import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  Mic, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  RefreshCw, 
  Smartphone, 
  Globe, 
  AlertTriangle,
  Lock,
  ExternalLink
} from 'lucide-react';
import { SupportedLanguage } from '../types';

export type PermissionStatusType = 'granted' | 'denied' | 'prompt' | 'unknown';

export interface DevicePermissionsState {
  camera: PermissionStatusType;
  microphone: PermissionStatusType;
}

interface DevicePermissionsGuideProps {
  isOpen: boolean;
  onClose: () => void;
  lang: SupportedLanguage;
  initialTab?: 'camera' | 'microphone';
  onPermissionsUpdated?: (state: DevicePermissionsState) => void;
}

export function useDevicePermissions() {
  const [permissions, setPermissions] = useState<DevicePermissionsState>({
    camera: 'unknown',
    microphone: 'unknown'
  });

  const checkPermissions = async () => {
    let camStatus: PermissionStatusType = 'unknown';
    let micStatus: PermissionStatusType = 'unknown';

    if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
      try {
        const camQuery = await navigator.permissions.query({ name: 'camera' as any });
        camStatus = camQuery.state as PermissionStatusType;
        camQuery.onchange = () => {
          setPermissions(prev => ({ ...prev, camera: camQuery.state as PermissionStatusType }));
        };
      } catch (e) {
        // Permissions query for camera not supported in this browser
      }

      try {
        const micQuery = await navigator.permissions.query({ name: 'microphone' as any });
        micStatus = micQuery.state as PermissionStatusType;
        micQuery.onchange = () => {
          setPermissions(prev => ({ ...prev, microphone: micQuery.state as PermissionStatusType }));
        };
      } catch (e) {
        // Permissions query for microphone not supported in this browser
      }
    }

    setPermissions({ camera: camStatus, microphone: micStatus });
    return { camera: camStatus, microphone: micStatus };
  };

  useEffect(() => {
    checkPermissions();
  }, []);

  return { permissions, checkPermissions };
}

export const DevicePermissionsGuide: React.FC<DevicePermissionsGuideProps> = ({
  isOpen,
  onClose,
  lang,
  initialTab = 'camera',
  onPermissionsUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'microphone'>(initialTab);
  const [selectedBrowser, setSelectedBrowser] = useState<'chrome' | 'safari' | 'firefox' | 'android'>('chrome');
  const [permState, setPermState] = useState<DevicePermissionsState>({
    camera: 'unknown',
    microphone: 'unknown'
  });
  const [isTesting, setIsTesting] = useState(false);
  const [testMessage, setTestMessage] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (isOpen) {
      detectBrowser();
      refreshStatus();
    }
  }, [isOpen]);

  const detectBrowser = () => {
    if (typeof window === 'undefined') return;
    const ua = navigator.userAgent.toLowerCase();
    if (/android/i.test(ua)) {
      setSelectedBrowser('android');
    } else if (/safari/i.test(ua) && !/chrome|chromium|edg|opr/i.test(ua)) {
      setSelectedBrowser('safari');
    } else if (/firefox/i.test(ua)) {
      setSelectedBrowser('firefox');
    } else {
      setSelectedBrowser('chrome');
    }
  };

  const refreshStatus = async () => {
    let cam: PermissionStatusType = 'unknown';
    let mic: PermissionStatusType = 'unknown';

    if (navigator.permissions && navigator.permissions.query) {
      try {
        const c = await navigator.permissions.query({ name: 'camera' as any });
        cam = c.state as PermissionStatusType;
      } catch {}
      try {
        const m = await navigator.permissions.query({ name: 'microphone' as any });
        mic = m.state as PermissionStatusType;
      } catch {}
    }

    const updated = { camera: cam, microphone: mic };
    setPermState(updated);
    if (onPermissionsUpdated) onPermissionsUpdated(updated);
  };

  const requestTest = async (type: 'camera' | 'microphone') => {
    setIsTesting(true);
    setTestMessage(null);

    try {
      if (type === 'camera') {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        setPermState(prev => ({ ...prev, camera: 'granted' }));
        setTestMessage(lang === 'kn' ? 'ಕ್ಯಾಮೆರಾ ಅನುಮತಿ ಸಕ್ರಿಯವಾಗಿದೆ!' : lang === 'hi' ? 'कैमरा अनुमति सफलतापूर्वक प्राप्त हुई!' : 'Camera access granted successfully!');
      } else {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        setPermState(prev => ({ ...prev, microphone: 'granted' }));
        setTestMessage(lang === 'kn' ? 'ಮೈಕ್ರೊಫೋನ್ ಅನುಮತಿ ಸಕ್ರಿಯವಾಗಿದೆ!' : lang === 'hi' ? 'माइक्रोफ़ोन अनुमति सफलतापूर्वक प्राप्त हुई!' : 'Microphone access granted successfully!');
      }
    } catch (err: any) {
      console.warn(`Request permission error for ${type}:`, err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermState(prev => ({ ...prev, [type]: 'denied' }));
        setTestMessage(lang === 'kn' ? 'ಅನುಮತಿಯನ್ನು ನಿರಾಕರಿಸಲಾಗಿದೆ. ಕೆಳಗಿನ ಹಂತಗಳನ್ನು ಅನುಸರಿಸಿ.' : lang === 'hi' ? 'अनुमति अस्वीकार कर दी गई। कृपया नीचे दिए गए निर्देश देखें।' : 'Permission was denied. Please follow the instructions below to enable access.');
      } else if (err.name === 'NotFoundError') {
        setTestMessage(lang === 'kn' ? 'ಸಾಧನ ಪತ್ತೆಯಾಗಿಲ್ಲ.' : lang === 'hi' ? 'कोई डिवाइस नहीं मिला।' : 'No device hardware detected.');
      } else {
        setTestMessage(err.message || 'Unable to access device');
      }
    } finally {
      setIsTesting(false);
      refreshStatus();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl rounded-2xl bg-slate-800 border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-700 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                {lang === 'kn' 
                  ? 'ಸಾಧನ ಅನುಮತಿಗಳ ಮಾರ್ಗದರ್ಶಿ' 
                  : lang === 'hi' 
                  ? 'डिवाइस अनुमति सहायता (Camera & Mic)' 
                  : 'Device Permissions Guide'}
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'kn'
                  ? 'ಕ್ಯಾಮೆರಾ ಅಥವಾ ಮೈಕ್ರೊಫೋನ್ ಪ್ರವೇಶವನ್ನು ಸಕ್ರಿಯಗೊಳಿಸಲು ಹಂತಗಳು'
                  : lang === 'hi'
                  ? 'कैमरा और माइक्रोफ़ोन पुनः चालू करने के आसान चरण'
                  : 'Ensure smooth notice scanning and voice assistant interaction'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Current Status Pills */}
        <div className="grid grid-cols-2 gap-3 p-4 bg-slate-900/40 border-b border-slate-700/60 text-xs">
          {/* Camera Status */}
          <div className={`p-3 rounded-xl border flex items-center justify-between ${
            permState.camera === 'granted'
              ? 'bg-emerald-950/30 border-emerald-700/50 text-emerald-200'
              : permState.camera === 'denied'
              ? 'bg-rose-950/30 border-rose-700/50 text-rose-200'
              : 'bg-slate-800 border-slate-700 text-slate-300'
          }`}>
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-cyan-400" />
              <div>
                <span className="font-semibold block">Camera Access</span>
                <span className="text-[10px] font-mono capitalize">
                  {permState.camera === 'granted' ? 'Allowed' : permState.camera === 'denied' ? 'Blocked / Denied' : 'Needs Permission'}
                </span>
              </div>
            </div>
            {permState.camera === 'granted' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : permState.camera === 'denied' ? (
              <XCircle className="w-4 h-4 text-rose-400" />
            ) : (
              <HelpCircle className="w-4 h-4 text-slate-400" />
            )}
          </div>

          {/* Microphone Status */}
          <div className={`p-3 rounded-xl border flex items-center justify-between ${
            permState.microphone === 'granted'
              ? 'bg-emerald-950/30 border-emerald-700/50 text-emerald-200'
              : permState.microphone === 'denied'
              ? 'bg-rose-950/30 border-rose-700/50 text-rose-200'
              : 'bg-slate-800 border-slate-700 text-slate-300'
          }`}>
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-sky-400" />
              <div>
                <span className="font-semibold block">Microphone Access</span>
                <span className="text-[10px] font-mono capitalize">
                  {permState.microphone === 'granted' ? 'Allowed' : permState.microphone === 'denied' ? 'Blocked / Denied' : 'Needs Permission'}
                </span>
              </div>
            </div>
            {permState.microphone === 'granted' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : permState.microphone === 'denied' ? (
              <XCircle className="w-4 h-4 text-rose-400" />
            ) : (
              <HelpCircle className="w-4 h-4 text-slate-400" />
            )}
          </div>
        </div>

        {/* Tab Selection: Camera vs Microphone */}
        <div className="flex border-b border-slate-700 px-4 bg-slate-800/80">
          <button
            onClick={() => setActiveTab('camera')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'camera'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Camera (Notice Scanning)</span>
          </button>
          <button
            onClick={() => setActiveTab('microphone')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'microphone'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>Microphone (Voice Agent)</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          
          {/* Test Action Bar */}
          <div className="flex items-center justify-between bg-slate-900/70 p-3 rounded-xl border border-slate-700">
            <span className="text-slate-300 font-medium">
              {activeTab === 'camera' ? 'Test Camera Input' : 'Test Microphone Input'}
            </span>
            <button
              onClick={() => requestTest(activeTab)}
              disabled={isTesting}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Testing...' : 'Prompt / Test Access'}</span>
            </button>
          </div>

          {testMessage && (
            <div className={`p-3 rounded-xl border text-xs font-medium ${
              testMessage.includes('granted') || testMessage.includes('सफलतापूर्वक') || testMessage.includes('ಸಕ್ರಿಯವಾಗಿದೆ')
                ? 'bg-emerald-950/40 border-emerald-600/60 text-emerald-300'
                : 'bg-amber-950/40 border-amber-600/60 text-amber-300'
            }`}>
              {testMessage}
            </div>
          )}

          {/* Browser Selection Buttons */}
          <div className="space-y-2">
            <span className="text-slate-400 font-semibold block text-[11px] uppercase tracking-wider">
              {lang === 'kn' ? 'ನಿಮ್ಮ ಬ್ರೌಸರ್ ಆಯ್ಕೆಮಾಡಿ:' : lang === 'hi' ? 'अपना ब्राउज़र चुनें:' : 'Select Your Browser:'}
            </span>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => setSelectedBrowser('chrome')}
                className={`py-2 px-1 rounded-xl border text-center font-bold text-[11px] transition cursor-pointer ${
                  selectedBrowser === 'chrome'
                    ? 'border-cyan-500 bg-cyan-950 text-cyan-300'
                    : 'border-slate-700 bg-slate-900/60 text-slate-400 hover:text-white'
                }`}
              >
                Chrome / Edge
              </button>
              <button
                onClick={() => setSelectedBrowser('safari')}
                className={`py-2 px-1 rounded-xl border text-center font-bold text-[11px] transition cursor-pointer ${
                  selectedBrowser === 'safari'
                    ? 'border-cyan-500 bg-cyan-950 text-cyan-300'
                    : 'border-slate-700 bg-slate-900/60 text-slate-400 hover:text-white'
                }`}
              >
                Safari / iOS
              </button>
              <button
                onClick={() => setSelectedBrowser('firefox')}
                className={`py-2 px-1 rounded-xl border text-center font-bold text-[11px] transition cursor-pointer ${
                  selectedBrowser === 'firefox'
                    ? 'border-cyan-500 bg-cyan-950 text-cyan-300'
                    : 'border-slate-700 bg-slate-900/60 text-slate-400 hover:text-white'
                }`}
              >
                Firefox
              </button>
              <button
                onClick={() => setSelectedBrowser('android')}
                className={`py-2 px-1 rounded-xl border text-center font-bold text-[11px] transition cursor-pointer ${
                  selectedBrowser === 'android'
                    ? 'border-cyan-500 bg-cyan-950 text-cyan-300'
                    : 'border-slate-700 bg-slate-900/60 text-slate-400 hover:text-white'
                }`}
              >
                Android
              </button>
            </div>
          </div>

          {/* Browser Specific Step-By-Step Instructions */}
          <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-700/80 space-y-3">
            <h4 className="font-bold text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>
                {selectedBrowser === 'chrome' && 'Google Chrome / Microsoft Edge / Brave'}
                {selectedBrowser === 'safari' && 'Apple Safari (iPhone, iPad & Mac)'}
                {selectedBrowser === 'firefox' && 'Mozilla Firefox'}
                {selectedBrowser === 'android' && 'Chrome for Android / Samsung Internet'}
              </span>
            </h4>

            {selectedBrowser === 'chrome' && (
              <ol className="list-decimal list-inside space-y-2 text-slate-300 leading-relaxed">
                <li>
                  Look at the top URL address bar and click the <strong>Tune / Lock icon (🔒 or 🎛️)</strong> directly to the left of the website URL.
                </li>
                <li>
                  Find <strong>{activeTab === 'camera' ? 'Camera' : 'Microphone'}</strong> in the site permissions list.
                </li>
                <li>
                  Switch the toggle from <em>Blocked</em> or <em>Ask</em> to <strong>Allow</strong>.
                </li>
                <li>
                  Click the <strong>Reload / Refresh</strong> button on your browser.
                </li>
              </ol>
            )}

            {selectedBrowser === 'safari' && (
              <div className="space-y-2 text-slate-300 leading-relaxed">
                <p className="font-semibold text-cyan-400">On iPhone or iPad:</p>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300">
                  <li>Tap the <strong>aA</strong> or page icon on the left side of the Safari address bar.</li>
                  <li>Tap <strong>Website Settings</strong>.</li>
                  <li>Tap <strong>{activeTab === 'camera' ? 'Camera' : 'Microphone'}</strong> and change setting to <strong>Allow</strong>.</li>
                  <li>If still blocked: Open iPhone <strong>Settings $\rightarrow$ Safari $\rightarrow$ Camera / Microphone $\rightarrow$ Allow</strong>.</li>
                </ol>
                <p className="font-semibold text-cyan-400 pt-1">On Mac Safari:</p>
                <p className="text-slate-300">Click <strong>Safari</strong> in the top menu $\rightarrow$ <strong>Settings for This Website...</strong> $\rightarrow$ set {activeTab === 'camera' ? 'Camera' : 'Microphone'} to <strong>Allow</strong>.</p>
              </div>
            )}

            {selectedBrowser === 'firefox' && (
              <ol className="list-decimal list-inside space-y-2 text-slate-300 leading-relaxed">
                <li>
                  Look at the address bar and click the <strong>crossed-out {activeTab === 'camera' ? 'Camera' : 'Microphone'} icon</strong>.
                </li>
                <li>
                  Click the <strong>"X" button</strong> next to <em>Blocked Temporarily</em> to clear the block.
                </li>
                <li>
                  Reload the webpage, then click <strong>Allow</strong> when the permission pop-up appears.
                </li>
              </ol>
            )}

            {selectedBrowser === 'android' && (
              <ol className="list-decimal list-inside space-y-2 text-slate-300 leading-relaxed">
                <li>
                  Tap the <strong>lock icon 🔒</strong> on the left side of the address bar (or tap the 3 dots ⋮ $\rightarrow$ <strong>Settings</strong> $\rightarrow$ <strong>Site Settings</strong>).
                </li>
                <li>
                  Tap <strong>Permissions</strong> $\rightarrow$ <strong>{activeTab === 'camera' ? 'Camera' : 'Microphone'}</strong>.
                </li>
                <li>
                  Select <strong>Allow</strong>.
                </li>
                <li>
                  Swipe down to refresh the page.
                </li>
              </ol>
            )}
          </div>

          {/* Fallback Tip */}
          <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/60 flex items-start gap-2.5 text-slate-400">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong>Offline scanning alternative:</strong> If your camera hardware is unavailable, you can always take a photo using your device's native camera app and click <strong>"Upload Image"</strong> in Go Vision.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 flex items-center justify-between bg-slate-900/60">
          <button
            onClick={() => refreshStatus()}
            className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1.5 cursor-pointer text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Re-check Status</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
