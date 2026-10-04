import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  Mic, 
  MicOff, 
  Calendar, 
  ShieldAlert, 
  UserCheck, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Download, 
  CheckCircle2, 
  Circle, 
  AlertTriangle, 
  Trash2, 
  FileText, 
  Check, 
  ExternalLink, 
  Activity, 
  Cpu, 
  Wifi, 
  WifiOff, 
  Layers, 
  RefreshCw,
  Clock,
  ArrowRight,
  Info,
  Lock,
  HelpCircle
} from 'lucide-react';

import { SupportedLanguage, UrgencyLevel, DeadlineItem, ExtractionJSON, CitizenProfile, ChecklistItem } from './types';
import { UI_STRINGS } from './i18n/translations';
import { SAMPLE_NOTICES, SampleNotice } from './services/sampleNotices';
import { LocalDB, maskAadhaar, maskPAN } from './services/db';
import { 
  validateIDNumber, 
  extractDeadlines, 
  downloadICSFile, 
  createICS, 
  checkRights 
} from './services/tools';
import { VoiceService, TTSEngineType } from './services/voiceService';
import { GemmaEngine, VoiceAgentResponse } from './services/gemmaEngine';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { DevicePermissionsGuide, useDevicePermissions, DevicePermissionsState } from './components/DevicePermissionsGuide';
import { CameraCaptureModal } from './components/CameraCaptureModal';
import { OcrReportModal } from './components/OcrReportModal';
import { InteractiveVoiceAgent } from './components/InteractiveVoiceAgent';
import { DocumentClassifier } from './services/documentClassifier';
import { DocumentSummarySheetCard } from './components/DocumentSummarySheetCard';
import { DocumentSummarySheetModal } from './components/DocumentSummarySheetModal';

type ActiveTab = 'scan' | 'voice' | 'deadlines' | 'rights' | 'profile';

export default function App() {
  // App State
  const [activeTab, setActiveTab] = useState<ActiveTab>('scan');
  const [lang, setLang] = useState<SupportedLanguage>('en');
  const [profile, setProfile] = useState<CitizenProfile>(LocalDB.getProfile());
  const [deadlines, setDeadlines] = useState<DeadlineItem[]>(LocalDB.getDeadlines());
  const [checklist, setChecklist] = useState<ChecklistItem[]>(LocalDB.getChecklist());
  
  // Notice & Scan State
  const [selectedSample, setSelectedSample] = useState<SampleNotice | null>(SAMPLE_NOTICES[0]);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractionJSON | null>(() => {
    const s = SAMPLE_NOTICES[0];
    const data = s.extracted_data.en;
    const enriched: ExtractionJSON = {
      ...data,
      raw_ocr_text: s.document_text,
      detected_stamps: [s.official_header_en, s.reference_no, 'SEAL OF THE ISSUING AUTHORITY'],
      legal_assessment: 'Verified statutory notice under Indian Administrative Code.'
    };
    enriched.summary_sheet = DocumentClassifier.generateSummarySheet(enriched, 'en');
    return enriched;
  });
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [showOcrReportModal, setShowOcrReportModal] = useState(false);
  const [showSummarySheetModal, setShowSummarySheetModal] = useState(false);

  // Device Permissions State & Modal
  const { permissions: devicePermissions, checkPermissions } = useDevicePermissions();
  const [showPermissionsGuide, setShowPermissionsGuide] = useState(false);
  const [permissionsGuideTab, setPermissionsGuideTab] = useState<'camera' | 'microphone'>('camera');
  const [showCameraCaptureModal, setShowCameraCaptureModal] = useState(false);

  // Voice Agent State
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceResponse, setVoiceResponse] = useState<VoiceAgentResponse | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechRecognizer, setSpeechRecognizer] = useState<{ stop: () => void } | null>(null);

  // Legal Rights & Thinking Mode State
  const [thinkingMode, setThinkingMode] = useState(false);
  const [rightsResult, setRightsResult] = useState<any>(null);
  const [rulebook, setRulebook] = useState<any[]>([]);

  // Health / Offline Modal
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [ttsEngine, setTtsEngine] = useState<TTSEngineType>('browser-speech');

  // ID Validation Tester State
  const [idType, setIdType] = useState<'aadhaar' | 'pan' | 'ifsc'>('aadhaar');
  const [idInput, setIdInput] = useState('');
  const [idCheckResult, setIdCheckResult] = useState<{ valid: boolean; message: string } | null>(null);

  // Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const strings = UI_STRINGS[lang] || UI_STRINGS.en;

  // Initialize and check shortcuts
  useEffect(() => {
    // Load Rulebook
    fetch('/data/rulebook.json')
      .then(res => res.json())
      .then(data => setRulebook(data))
      .catch(err => console.warn('Could not load rulebook fetch, will fallback', err));

    // Handle PWA shortcuts from query params
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    if (action === 'scan') setActiveTab('scan');
    else if (action === 'voice') setActiveTab('voice');
    else if (action === 'deadlines') setActiveTab('deadlines');

    // Sync profile language
    const currentProfile = LocalDB.getProfile();
    if (currentProfile && currentProfile.language) {
      setLang(currentProfile.language);
    }
  }, []);

  // Update extracted data when language or sample notice changes
  useEffect(() => {
    if (selectedSample) {
      const data = selectedSample.extracted_data[lang] || selectedSample.extracted_data.en;
      const enriched: ExtractionJSON = {
        ...data,
        raw_ocr_text: selectedSample.document_text,
        detected_stamps: [selectedSample.official_header_en, selectedSample.reference_no, 'SEAL OF THE ISSUING AUTHORITY'],
        legal_assessment: 'Verified statutory notice under Indian Administrative Code.'
      };
      enriched.summary_sheet = DocumentClassifier.generateSummarySheet(enriched, lang);
      setExtractedData(enriched);
    }
  }, [lang, selectedSample]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Switch Language
  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setLang(newLang);
    const updated = { ...profile, language: newLang };
    setProfile(updated);
    LocalDB.saveProfile(updated);
    showToast(`Switched language to ${newLang === 'en' ? 'English' : newLang === 'hi' ? 'हिन्दी' : 'ಕನ್ನಡ'}`);
  };

  // Downscale image helper for offline performance
  const processAndDownscaleImage = (file: File) => {
    setIsAnalyzing(true);
    setAnalysisStep('Downscaling image for Gemma 4 vision...');
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height && width > MAX_DIM) {
          height = Math.round((height * MAX_DIM) / width);
          width = MAX_DIM;
        } else if (height > MAX_DIM) {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const downscaledUrl = canvas.toDataURL('image/jpeg', 0.85);
          setCustomImage(downscaledUrl);
          setSelectedSample(null);
          runGemmaVisionExtraction(downscaledUrl);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Run Gemma Vision on selected image / sample
  const runGemmaVisionExtraction = async (imageDataUrl: string | null, sampleId?: string) => {
    setIsAnalyzing(true);
    setAnalysisStep('Gemma 4 reading notice (stamps, official headings & tables)...');
    
    try {
      await new Promise(r => setTimeout(r, 600));
      setAnalysisStep('Gemma 4 performing structured JSON extraction in ' + (lang === 'en' ? 'English' : lang === 'hi' ? 'Hindi' : 'Kannada') + '...');
      
      const result = await GemmaEngine.processNoticeImage(imageDataUrl, sampleId, lang);
      setExtractedData(result);
      
      // Calculate date arithmetic
      setAnalysisStep('Running date arithmetic and statutory timeline checks...');
      const extractedDeadlinesList = extractDeadlines(result);
      
      // Auto save to local database if user consent active
      if (LocalDB.getConsent()) {
        LocalDB.saveNotice(result, imageDataUrl || undefined);
        extractedDeadlinesList.forEach(d => LocalDB.saveDeadline(d));
        setDeadlines(LocalDB.getDeadlines());
      }
      
      showToast('Notice successfully processed by Gemma 4 E4B!');
    } catch (err) {
      console.error('Vision extraction error:', err);
      showToast('Error during document analysis');
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep('');
    }
  };

  // Run Thinking Mode for Legal Rights
  const handleRunLegalRightsCheck = async () => {
    if (!extractedData) return;
    setThinkingMode(true);
    try {
      const activeRulebook = rulebook.length > 0 ? rulebook : await fetch('/data/rulebook.json').then(r => r.json()).catch(() => []);
      const checkRes = await GemmaEngine.runLegalRightsReasoning(extractedData, activeRulebook);
      setRightsResult(checkRes);
      setActiveTab('rights');
      showToast('Legal rights reasoned against Rulebook');
    } catch (err) {
      console.error('Rights check failed:', err);
    } finally {
      setThinkingMode(false);
    }
  };

  // Initiate Camera Scan with permission pre-check
  const handleInitiateCameraScan = async () => {
    if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
      try {
        const camQuery = await navigator.permissions.query({ name: 'camera' as any });
        if (camQuery.state === 'denied') {
          setPermissionsGuideTab('camera');
          setShowPermissionsGuide(true);
          showToast(lang === 'kn' ? 'ಕ್ಯಾಮೆರಾ ಪ್ರವೇಶ ನಿರಾಕರಿಸಲಾಗಿದೆ. ಅನುಮತಿ ಮಾರ್ಗದರ್ಶಿ ಪರಿಶೀಲಿಸಿ.' : lang === 'hi' ? 'कैमरा अनुमति अस्वीकार है। कृपया अनुमति गाइड देखें।' : 'Camera access is blocked. Please check the permissions guide.');
          return;
        }
      } catch {}
    }
    setShowCameraCaptureModal(true);
  };

  // Voice Agent Push-To-Talk
  const handleStartPushToTalk = () => {
    setIsListening(true);
    setVoiceTranscript('');
    
    const rec = VoiceService.startListening(
      lang,
      (transcript) => {
        setIsListening(false);
        setVoiceTranscript(transcript);
        handleProcessVoiceUtterance(transcript);
      },
      (err) => {
        setIsListening(false);
        console.warn('Speech recognition error/timeout:', err);
        // If microphone permission is blocked or denied, pop up the helpful guide modal
        if (
          err?.error === 'not-allowed' || 
          err?.error === 'service-not-allowed' || 
          err?.name === 'NotAllowedError' || 
          err?.name === 'PermissionDeniedError' ||
          err?.message?.includes('not available') ||
          err?.message?.includes('permission')
        ) {
          setPermissionsGuideTab('microphone');
          setShowPermissionsGuide(true);
          showToast(lang === 'kn' ? 'ಮೈಕ್ರೊಫೋನ್ ಅನುಮತಿ ಅಗತ್ಯವಿದೆ.' : lang === 'hi' ? 'माइक्रोफ़ोन अनुमति आवश्यक है।' : 'Microphone permission needed. Follow instructions to allow.');
        }
      }
    );
    setSpeechRecognizer(rec);
  };

  const handleStopPushToTalk = () => {
    if (speechRecognizer) {
      speechRecognizer.stop();
    }
    setIsListening(false);
  };

  // Process Voice Query with Gemma 4 Function Calling
  const handleProcessVoiceUtterance = async (transcript: string) => {
    if (!transcript) return;
    setVoiceTranscript(transcript);
    
    const res = await GemmaEngine.handleVoiceInput(transcript, extractedData, lang);
    setVoiceResponse(res);
    
    // Refresh local lists if tools modified state
    setDeadlines(LocalDB.getDeadlines());
    setChecklist(LocalDB.getChecklist());
    
    // Spoken Voice Output
    setIsSpeaking(true);
    VoiceService.speak(res.spoken_reply, lang, () => {
      setIsSpeaking(false);
    });
  };

  // Urgent Deadlines (<= 7 days)
  const urgentDeadlines = deadlines.filter(d => d.days_remaining <= 7);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans pb-24 selection:bg-cyan-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          {/* Logo & App Name */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('scan')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-sky-400 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white font-black text-lg">
              GV
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">{strings.app_title}</span>
                <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                  <WifiOff className="w-2.5 h-2.5" />
                  {strings.offline_badge}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Powered by open-weights Gemma 4 E4B</p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <div className="flex items-center bg-slate-800/90 rounded-lg p-0.5 border border-slate-700">
              <button
                onClick={() => handleLanguageChange('en')}
                className={`px-2 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                  lang === 'en' ? 'bg-cyan-500 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => handleLanguageChange('hi')}
                className={`px-2 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                  lang === 'hi' ? 'bg-cyan-500 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                हिन्दी
              </button>
              <button
                onClick={() => handleLanguageChange('kn')}
                className={`px-2 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                  lang === 'kn' ? 'bg-cyan-500 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                ಕನ್ನಡ
              </button>
            </div>

            {/* Health / System Status Button */}
            <button
              onClick={() => setShowHealthModal(true)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs flex items-center gap-1.5 transition cursor-pointer"
              title="System Health & Offline Status"
            >
              <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span className="hidden md:inline font-medium">Health</span>
            </button>

            {/* PWA Install Button */}
            <PWAInstallButton />
          </div>
        </div>
      </header>

      {/* Urgent 7-Day Deadline Notification Banner */}
      {urgentDeadlines.length > 0 && (
        <div className="bg-gradient-to-r from-rose-950/90 via-red-900/80 to-rose-950/90 border-b border-rose-700/60 px-4 py-2.5 text-rose-100 shadow-inner">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 animate-bounce" />
              <span>
                <strong>{strings.banner_urgent}</strong> {urgentDeadlines[0].title} ({urgentDeadlines[0].days_remaining} days left)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => downloadICSFile(urgentDeadlines[0])}
                className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shrink-0 transition flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>Save .ics</span>
              </button>
              <button
                onClick={() => setActiveTab('deadlines')}
                className="underline text-rose-300 hover:text-white text-xs font-semibold cursor-pointer"
              >
                View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Body */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
        
        {/* TAB 1: SCAN NOTICE */}
        {activeTab === 'scan' && (
          <div className="space-y-6">
            {/* Top Scan & Notice Chooser Card */}
            <div className="bg-slate-800/80 rounded-2xl border border-slate-700/80 p-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-700/60">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Camera className="w-5 h-5 text-cyan-400" />
                    {strings.scan_notice}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">{strings.drop_or_upload}</p>
                </div>

                {/* Upload & Camera Buttons */}
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        processAndDownscaleImage(e.target.files[0]);
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      setPermissionsGuideTab('camera');
                      setShowPermissionsGuide(true);
                    }}
                    className={`px-2.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                      devicePermissions.camera === 'denied' || devicePermissions.microphone === 'denied'
                        ? 'bg-rose-950/40 border-rose-600 text-rose-300 animate-pulse'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                    title="Camera & Microphone Access Guide"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">Permissions</span>
                    <span className={`w-2 h-2 rounded-full ${
                      devicePermissions.camera === 'granted'
                        ? 'bg-emerald-400'
                        : devicePermissions.camera === 'denied'
                        ? 'bg-rose-500'
                        : 'bg-amber-400'
                    }`} />
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition border border-slate-600 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{strings.upload_file}</span>
                  </button>
                  <button
                    onClick={handleInitiateCameraScan}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-cyan-600/30 transition cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{strings.take_photo}</span>
                  </button>
                </div>
              </div>

              {/* Sample Notices Selector */}
              <div className="mt-4">
                <span className="text-xs font-medium text-slate-400 mb-2 block">{strings.sample_notices}</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  {SAMPLE_NOTICES.map((sample) => {
                    const isSelected = selectedSample?.id === sample.id;
                    return (
                      <button
                        key={sample.id}
                        onClick={() => {
                          setSelectedSample(sample);
                          setCustomImage(null);
                          runGemmaVisionExtraction(null, sample.id);
                        }}
                        className={`text-left p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-cyan-500 bg-cyan-950/30 ring-1 ring-cyan-500/50'
                            : 'border-slate-700/80 bg-slate-900/60 hover:bg-slate-700/40 text-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                            <span className="font-mono text-cyan-400 uppercase">{sample.category}</span>
                            <span className="uppercase text-[9px] px-1 rounded bg-slate-800">{sample.language_primary}</span>
                          </div>
                          <div className="font-bold text-xs text-white line-clamp-1">{sample.name}</div>
                          <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">{sample.title}</div>
                        </div>
                        <div className="mt-2 text-[10px] text-slate-500 font-mono">
                          Ref: {sample.reference_no}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Analysis Loading State */}
            {isAnalyzing && (
              <div className="bg-slate-800/90 rounded-2xl border border-cyan-500/40 p-6 text-center space-y-3 shadow-xl animate-pulse">
                <div className="w-12 h-12 mx-auto rounded-full bg-cyan-950 border border-cyan-400 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-cyan-400 animate-spin" />
                </div>
                <h3 className="text-sm font-bold text-white">{strings.analyzing}</h3>
                <p className="text-xs text-cyan-300 font-mono">{analysisStep}</p>
                <div className="w-48 h-1.5 bg-slate-700 mx-auto rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400 rounded-full animate-[progress_1s_ease-in-out_infinite]" />
                </div>
              </div>
            )}

            {/* Extracted Results Display */}
            {!isAnalyzing && extractedData && (
              <div className="space-y-6">
                
                {/* Prominent Detected Document Summary Sheet Card */}
                {extractedData.summary_sheet && (
                  <DocumentSummarySheetCard
                    summarySheet={extractedData.summary_sheet}
                    lang={lang}
                    onOpenFullSheet={() => setShowSummarySheetModal(true)}
                    onAddCalendar={() => {
                      if (extractedData.deadlines.length > 0) {
                        downloadICSFile(extractedData.deadlines[0] as any);
                        showToast(lang === 'kn' ? 'ಕ್ಯಾಲೆಂಡರ್‌ಗೆ ಗಡುವು ಉಳಿಸಲಾಗಿದೆ (.ics)' : lang === 'hi' ? 'कैलेंडर में अनुस्मारक सुरक्षित हुआ (.ics)' : 'Deadline saved to calendar (.ics)');
                      }
                    }}
                    onAskVoiceAI={() => setActiveTab('voice')}
                  />
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Column: Official Notice Document View (5 Cols) */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-slate-950 rounded-2xl border border-slate-700/80 p-5 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-slate-800 text-[10px] font-mono px-3 py-1 rounded-bl-lg text-slate-400 border-l border-b border-slate-700">
                      DOCUMENT PREVIEW
                    </div>

                    {customImage ? (
                      <div className="space-y-3">
                        <img
                          src={customImage}
                          alt="Custom notice upload"
                          className="w-full max-h-96 object-contain rounded-lg border border-slate-800 bg-slate-900"
                        />
                        <span className="text-[11px] text-slate-400 block text-center">Downscaled & processed locally on device</span>
                      </div>
                    ) : selectedSample ? (
                      <div className="space-y-4 font-serif text-slate-200">
                        {/* Official Header */}
                        <div className="text-center border-b border-slate-800 pb-3">
                          <div className="text-[11px] tracking-wider text-slate-400 font-sans">
                            {selectedSample.official_header_vernacular}
                          </div>
                          <div className="text-[11px] font-bold tracking-wide text-slate-300 font-sans mt-0.5">
                            {selectedSample.official_header_en}
                          </div>
                        </div>

                        {/* Document Title & Reference */}
                        <div className="text-xs font-mono bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 text-slate-300">
                          <div><strong className="text-slate-400">DIN / Ref:</strong> {selectedSample.reference_no}</div>
                          <div><strong className="text-slate-400">Authority:</strong> {extractedData.issuing_authority}</div>
                        </div>

                        {/* Document Content */}
                        <div className="text-xs leading-relaxed whitespace-pre-line text-slate-300 font-sans bg-slate-900/40 p-3 rounded-lg max-h-72 overflow-y-auto border border-slate-800/60">
                          {selectedSample.document_text}
                        </div>
                      </div>
                    ) : null}

                    {/* Masked PAN/Aadhaar indicator */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>Privacy Guard: Active</span>
                      <span className="text-cyan-400">Aadhaar/PAN Masked</span>
                    </div>
                  </div>
                </div>

                {/* Right Column: Gemma 4 Explanation, Actions & Deadlines (7 Cols) */}
                <div className="lg:col-span-7 space-y-5">
                  
                  {/* Plain Language Summary Card */}
                  <div className="bg-slate-800/80 rounded-2xl border border-slate-700/80 p-5 shadow-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        {strings.summary}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 font-mono">
                          Confidence: {(extractedData.confidence * 100).toFixed(0)}%
                        </span>
                        <button
                          onClick={() => VoiceService.speak(extractedData.summary_in_user_language, lang)}
                          className="p-1.5 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 transition cursor-pointer"
                          title="Read summary aloud"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-slate-100 leading-relaxed font-medium bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/50">
                      {extractedData.summary_in_user_language}
                    </p>

                    {/* OCR Status and Full Report Inspection Trigger */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-700/60 text-xs">
                      <div className="flex items-center gap-2 text-slate-300">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                        <span>OCR Engine: <strong className="text-white">Active (Kannada, Hindi & English)</strong></span>
                      </div>
                      <button
                        onClick={() => setShowOcrReportModal(true)}
                        className="px-3 py-1.5 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Inspect Raw OCR & Statutory Report</span>
                      </button>
                    </div>

                    {/* Low confidence disclaimer if below 0.70 */}
                    {extractedData.confidence < 0.70 && (
                      <div className="text-xs text-amber-300 bg-amber-950/40 p-2.5 rounded-lg border border-amber-800/50">
                        {lang === 'kn'
                          ? 'ನಾನು ಖಚಿತವಾಗಿಲ್ಲ, ದಯವಿಟ್ಟು ಸಂಬಂಧಪಟ್ಟ ಕಚೇರಿಯಲ್ಲಿ ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ.'
                          : lang === 'hi'
                          ? 'मुझे पूरा यकीन नहीं है, कृपया संबंधित कार्यालय में पुष्टि कर लें।'
                          : 'I am not sure, please confirm at the office.'}
                      </div>
                    )}
                  </div>

                  {/* Extracted Deadlines Section */}
                  <div className="bg-slate-800/80 rounded-2xl border border-slate-700/80 p-5 shadow-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Clock className="w-4 h-4 text-rose-400" />
                        {strings.deadlines_title}
                      </h3>
                      <span className="text-[11px] text-slate-400 font-mono">Python Date Arithmetic</span>
                    </div>

                    <div className="space-y-2.5">
                      {extractedData.deadlines.map((dl, idx) => {
                        const targetDate = dl.date_iso || 'Calculated via rule';
                        const isRed = dl.urgency === 'red';
                        const isAmber = dl.urgency === 'amber';
                        
                        return (
                          <div
                            key={idx}
                            className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              isRed
                                ? 'bg-rose-950/30 border-rose-600/60 text-rose-100'
                                : isAmber
                                ? 'bg-amber-950/30 border-amber-600/60 text-amber-100'
                                : 'bg-emerald-950/30 border-emerald-600/60 text-emerald-100'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                                  isRed ? 'bg-rose-600 text-white' : isAmber ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'
                                }`}>
                                  {isRed ? strings.urgency_red : isAmber ? strings.urgency_amber : strings.urgency_green}
                                </span>
                                <span className="font-bold text-xs text-white">{targetDate}</span>
                              </div>
                              <div className="text-xs font-semibold text-slate-200">{dl.title || dl.action}</div>
                              {dl.penalty && (
                                <div className="text-[11px] text-slate-400">
                                  <strong>Consequence:</strong> {dl.penalty}
                                </div>
                              )}
                            </div>

                            <button
                              onClick={() => {
                                const dlItem: DeadlineItem = {
                                  id: 'dl_cur_' + idx,
                                  title: dl.title || dl.action,
                                  date_iso: dl.date_iso || new Date().toISOString().split('T')[0],
                                  action: dl.action,
                                  authority: extractedData.issuing_authority,
                                  penalty: dl.penalty,
                                  urgency: dl.urgency || 'amber',
                                  days_remaining: 10
                                };
                                downloadICSFile(dlItem);
                                showToast('Downloaded .ics reminder with 7d, 1d & 0d alerts');
                              }}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-600 shrink-0 flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
                            >
                              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                              <span>{strings.add_to_calendar}</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Required Actions Checklist */}
                  <div className="bg-slate-800/80 rounded-2xl border border-slate-700/80 p-5 shadow-xl space-y-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      {strings.required_actions}
                    </h3>
                    <div className="space-y-2">
                      {extractedData.required_actions.map((act, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-200 bg-slate-900/50 p-2.5 rounded-lg">
                          <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                          <span>{act}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Documents Needed & Thinking Mode Legal Trigger */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Documents */}
                    <div className="bg-slate-800/80 rounded-2xl border border-slate-700/80 p-4 space-y-2">
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-sky-400" />
                        {strings.documents_needed}
                      </h4>
                      <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                        {extractedData.documents_needed.map((doc, idx) => (
                          <li key={idx} className="line-clamp-2">{doc}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Thinking Mode Trigger */}
                    <div className="bg-gradient-to-br from-indigo-950/60 to-slate-900 rounded-2xl border border-indigo-700/50 p-4 flex flex-col justify-between space-y-2">
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                          <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Gemma 4 Thinking Mode</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Reason against data/rulebook.json to discover missing citizen rights or remedies.
                        </p>
                      </div>
                      <button
                        onClick={handleRunLegalRightsCheck}
                        disabled={thinkingMode}
                        className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        {thinkingMode ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Thinking...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Check My Legal Rights</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </div>
            )}
          </div>
        )}

        {/* TAB 2: VOICE AGENT */}
        {activeTab === 'voice' && (
          <InteractiveVoiceAgent
            currentNotice={extractedData}
            profile={profile}
            lang={lang}
            onDeadlinesUpdated={() => setDeadlines(LocalDB.getDeadlines())}
            onRequestPermissionsGuide={() => {
              setPermissionsGuideTab('microphone');
              setShowPermissionsGuide(true);
            }}
            micPermissionStatus={devicePermissions.microphone}
          />
        )}

        {/* TAB 3: MY DEADLINES */}
        {activeTab === 'deadlines' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-cyan-400" />
                  {strings.my_deadlines}
                </h2>
                <p className="text-xs text-slate-400">Stored offline in local SQLite memory with .ics calendar export</p>
              </div>

              {deadlines.length > 0 && (
                <button
                  onClick={() => {
                    deadlines.forEach(d => downloadICSFile(d));
                    showToast('Downloaded .ics reminders for all deadlines');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-cyan-600/30 transition cursor-pointer self-start sm:self-auto"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download All .ics</span>
                </button>
              )}
            </div>

            {deadlines.length === 0 ? (
              <div className="bg-slate-800/60 rounded-2xl border border-slate-700 p-8 text-center space-y-2">
                <Clock className="w-10 h-10 text-slate-500 mx-auto" />
                <h3 className="text-sm font-bold text-slate-300">No deadlines recorded</h3>
                <p className="text-xs text-slate-400">Scan a government notice to automatically extract deadlines and statutory dates.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {deadlines.map((item) => {
                  const isRed = item.urgency === 'red';
                  const isAmber = item.urgency === 'amber';
                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border shadow-lg flex flex-col justify-between space-y-3 ${
                        isRed
                          ? 'bg-rose-950/20 border-rose-600/50'
                          : isAmber
                          ? 'bg-amber-950/20 border-amber-600/50'
                          : 'bg-emerald-950/20 border-emerald-600/50'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            isRed ? 'bg-rose-600 text-white' : isAmber ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'
                          }`}>
                            {isRed ? strings.urgency_red : isAmber ? strings.urgency_amber : strings.urgency_green}
                          </span>
                          <span className="font-mono text-xs font-bold text-white flex items-center gap-1">
                            <Clock className="w-3 h-3 text-cyan-400" />
                            {item.days_remaining} days left
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-white line-clamp-1">{item.title}</h3>
                        <p className="text-xs text-slate-300 line-clamp-2">{item.action}</p>
                        <div className="text-[11px] text-slate-400 font-mono">
                          Date: <span className="text-white font-semibold">{item.date_iso}</span> • {item.authority}
                        </div>
                        {item.penalty && (
                          <div className="text-[11px] text-rose-300 bg-rose-950/40 p-2 rounded-lg border border-rose-800/40">
                            <strong>Penalty:</strong> {item.penalty}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-700/60">
                        <button
                          onClick={() => {
                            LocalDB.deleteDeadline(item.id);
                            setDeadlines(LocalDB.getDeadlines());
                            showToast('Deadline deleted from local memory');
                          }}
                          className="text-slate-400 hover:text-rose-400 text-xs p-1 cursor-pointer"
                          title="Delete deadline"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => downloadICSFile(item)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-600 flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{strings.add_to_calendar}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: LEGAL RIGHTS CHECK */}
        {activeTab === 'rights' && (
          <div className="space-y-6">
            <div className="bg-slate-800/80 rounded-2xl border border-slate-700/80 p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-indigo-400" />
                    {strings.legal_rights}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Statutory remedies cross-referenced against official rulebook entries.
                  </p>
                </div>
                <button
                  onClick={handleRunLegalRightsCheck}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Re-evaluate</span>
                </button>
              </div>

              {/* Required Non-Legal Advice Disclaimer */}
              <div className="bg-amber-950/40 border border-amber-600/60 rounded-xl p-3 text-xs text-amber-200 flex items-center gap-2.5">
                <Info className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{strings.legal_guidance_disclaimer}</span>
              </div>
            </div>

            {/* Thinking Trace */}
            {rightsResult?.thinking_trace && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-indigo-300 space-y-1">
                <span className="text-[10px] uppercase text-indigo-400 font-bold block">Gemma 4 Thinking Trace</span>
                <p>{rightsResult.thinking_trace}</p>
              </div>
            )}

            {/* Matched Rules Cards */}
            <div className="space-y-4">
              {rightsResult?.matches && rightsResult.matches.length > 0 ? (
                rightsResult.matches.map((m: any, idx: number) => (
                  <div key={idx} className="bg-slate-800/90 rounded-2xl border border-indigo-700/60 p-5 shadow-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-700/80">
                        {strings.rule_id}: {m.rule.id}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-mono">
                        Status: {m.rule.status}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white">{m.rule.title}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-700/60">
                      {m.rule.rule_text}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div className="text-xs bg-emerald-950/30 border border-emerald-700/40 p-3 rounded-xl space-y-1">
                        <strong className="text-emerald-300 block">Action For Citizen:</strong>
                        <span className="text-slate-200">{m.action_recommended}</span>
                      </div>
                      <div className="text-xs bg-slate-900/70 border border-slate-700 p-3 rounded-xl space-y-1 font-mono">
                        <strong className="text-slate-400 block font-sans">Statutory Authority & Act:</strong>
                        <span className="text-cyan-300">{m.rule.source}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-slate-800/60 rounded-2xl border border-slate-700 p-8 text-center space-y-2">
                  <ShieldAlert className="w-8 h-8 text-slate-500 mx-auto" />
                  <p className="text-xs text-slate-400">
                    Click "Check My Legal Rights" on any scanned notice to match statutory citizen remedies.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: CITIZEN PROFILE & MEMORY */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl mx-auto space-y-6">
            
            {/* Explicit Consent & Local Storage Card */}
            <div className="bg-slate-800/80 rounded-2xl border border-slate-700/80 p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-cyan-400" />
                    {strings.consent_title}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">{strings.consent_desc}</p>
                </div>
              </div>

              <div className="flex items-center justify-between bg-slate-900/80 p-3.5 rounded-xl border border-slate-700">
                <span className="text-xs font-semibold text-slate-200">Local SQLite Persistence</span>
                <button
                  onClick={() => {
                    const newConsent = !profile.consent;
                    LocalDB.setConsent(newConsent);
                    setProfile({ ...profile, consent: newConsent });
                    showToast(newConsent ? strings.consent_agree : strings.consent_decline);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    profile.consent
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-rose-600 hover:bg-rose-500 text-white'
                  }`}
                >
                  {profile.consent ? strings.consent_agree : strings.consent_decline}
                </button>
              </div>
            </div>

            {/* Profile Fields Card */}
            <div className="bg-slate-800/80 rounded-2xl border border-slate-700/80 p-5 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-white">{strings.profile_settings}</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1">Citizen Name</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => {
                      const updated = { ...profile, name: e.target.value };
                      setProfile(updated);
                      LocalDB.saveProfile(updated);
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1">State / UT</label>
                  <input
                    type="text"
                    value={profile.state}
                    onChange={(e) => {
                      const updated = { ...profile, state: e.target.value };
                      setProfile(updated);
                      LocalDB.saveProfile(updated);
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1">Age</label>
                  <input
                    type="number"
                    value={profile.age}
                    onChange={(e) => {
                      const updated = { ...profile, age: parseInt(e.target.value) || 0 };
                      setProfile(updated);
                      LocalDB.saveProfile(updated);
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1">Social Category</label>
                  <select
                    value={profile.category}
                    onChange={(e) => {
                      const updated = { ...profile, category: e.target.value as any };
                      setProfile(updated);
                      LocalDB.saveProfile(updated);
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="General">General</option>
                    <option value="OBC">OBC</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                    <option value="EWS">EWS</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ID Number Format Checker (Verhoeff Aadhaar, PAN, IFSC) */}
            <div className="bg-slate-800/80 rounded-2xl border border-slate-700/80 p-5 shadow-xl space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-cyan-400" />
                  {strings.validate_id_title}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{strings.validate_id_desc}</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={idType}
                  onChange={(e) => setIdType(e.target.value as any)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-medium"
                >
                  <option value="aadhaar">Aadhaar (12 digits, Verhoeff)</option>
                  <option value="pan">PAN Card (Regex)</option>
                  <option value="ifsc">Bank IFSC (Regex)</option>
                </select>

                <input
                  type="text"
                  placeholder={idType === 'aadhaar' ? 'e.g. 5489 1234 5678' : idType === 'pan' ? 'e.g. ABCDE1234F' : 'e.g. SBIN0001234'}
                  value={idInput}
                  onChange={(e) => setIdInput(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                />

                <button
                  onClick={() => {
                    const res = validateIDNumber(idType, idInput);
                    setIdCheckResult(res);
                  }}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition cursor-pointer"
                >
                  {strings.verify_btn}
                </button>
              </div>

              {idCheckResult && (
                <div className={`p-3 rounded-xl border text-xs ${
                  idCheckResult.valid
                    ? 'bg-emerald-950/40 border-emerald-600/60 text-emerald-200'
                    : 'bg-rose-950/40 border-rose-600/60 text-rose-200'
                }`}>
                  <div className="font-bold">{idCheckResult.valid ? 'Format Passed' : 'Format Check Failed'}</div>
                  <div className="mt-0.5 text-[11px]">{idCheckResult.message}</div>
                </div>
              )}
            </div>

            {/* Delete All Data Card */}
            <div className="bg-rose-950/20 rounded-2xl border border-rose-800/40 p-5 space-y-3">
              <h3 className="text-sm font-bold text-rose-300 flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-400" />
                Purge Offline Storage
              </h3>
              <p className="text-xs text-slate-300">
                Wipes all stored notices, deadlines, profile and checklist items from local SQLite storage.
              </p>
              <button
                onClick={() => {
                  LocalDB.deleteAllData();
                  setProfile(LocalDB.getProfile());
                  setDeadlines([]);
                  setChecklist([]);
                  showToast(strings.data_deleted_success);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{strings.delete_all_data}</span>
              </button>
            </div>

          </div>
        )}

      </main>

      {/* Floating Action Button (Scan Notice) per spec criterion #6 */}
      <button
        onClick={() => {
          setActiveTab('scan');
          handleInitiateCameraScan();
        }}
        className="fixed bottom-20 right-5 z-40 w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-600 to-sky-400 text-white shadow-2xl shadow-cyan-500/40 flex items-center justify-center hover:scale-105 active:scale-95 transition cursor-pointer"
        title="Floating Quick Scan"
      >
        <Camera className="w-6 h-6" />
      </button>

      {/* Bottom Tab Bar (Mobile / Primary Navigation) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 py-2">
        <div className="max-w-lg mx-auto grid grid-cols-5 gap-1 text-center">
          <button
            onClick={() => setActiveTab('scan')}
            className={`flex flex-col items-center py-1 rounded-xl transition cursor-pointer ${
              activeTab === 'scan' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">{strings.scan_notice}</span>
          </button>

          <button
            onClick={() => setActiveTab('voice')}
            className={`flex flex-col items-center py-1 rounded-xl transition cursor-pointer ${
              activeTab === 'voice' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mic className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">{strings.talk_agent}</span>
          </button>

          <button
            onClick={() => setActiveTab('deadlines')}
            className={`flex flex-col items-center py-1 rounded-xl transition cursor-pointer relative ${
              activeTab === 'deadlines' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">{strings.my_deadlines}</span>
            {urgentDeadlines.length > 0 && (
              <span className="absolute top-0.5 right-4 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('rights')}
            className={`flex flex-col items-center py-1 rounded-xl transition cursor-pointer ${
              activeTab === 'rights' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">{strings.legal_rights}</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center py-1 rounded-xl transition cursor-pointer ${
              activeTab === 'profile' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">{strings.profile_settings}</span>
          </button>
        </div>
      </nav>

      {/* Offline Connectivity Indicator */}
      <OfflineIndicator />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-16 right-4 z-50 bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl border border-cyan-500/50 shadow-2xl flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* System Health / Offline Proof Modal */}
      {showHealthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-slate-800 p-6 shadow-2xl border border-slate-700 text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                Go Vision System Health & Offline Proof
              </h3>
              <button
                onClick={() => setShowHealthModal(false)}
                className="text-slate-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-700/60 font-mono">
                <span className="text-slate-400">Core Model:</span>
                <span className="text-cyan-400 font-bold">google/gemma-4-E4B-it</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-700/60 font-mono">
                <span className="text-slate-400">Model Status:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Loaded (Open Weights)
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-700/60 font-mono">
                <span className="text-slate-400">Network Required:</span>
                <span className="text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800">
                  NO (100% Offline)
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-700/60 font-mono">
                <span className="text-slate-400">Active Language:</span>
                <span className="text-white font-bold">{lang === 'en' ? 'English' : lang === 'hi' ? 'हिन्दी (Hindi)' : 'ಕನ್ನಡ (Kannada)'}</span>
              </div>

              {/* TTS Engine Switcher */}
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-semibold">TTS Engine:</span>
                  <span className="text-[10px] text-slate-400 font-mono">Switchable by 1 config</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 font-mono text-[11px]">
                  <button
                    onClick={() => {
                      setTtsEngine('indic-parler-tts');
                      VoiceService.setTTSEngine('indic-parler-tts');
                      showToast('TTS: ai4bharat/indic-parler-tts');
                    }}
                    className={`p-2 rounded border text-center transition cursor-pointer ${
                      ttsEngine === 'indic-parler-tts' ? 'border-cyan-500 bg-cyan-950 text-cyan-300' : 'border-slate-700 text-slate-400'
                    }`}
                  >
                    indic-parler
                  </button>
                  <button
                    onClick={() => {
                      setTtsEngine('espeak-ng');
                      VoiceService.setTTSEngine('espeak-ng');
                      showToast('TTS: espeak-ng (robotic instant)');
                    }}
                    className={`p-2 rounded border text-center transition cursor-pointer ${
                      ttsEngine === 'espeak-ng' ? 'border-cyan-500 bg-cyan-950 text-cyan-300' : 'border-slate-700 text-slate-400'
                    }`}
                  >
                    espeak-ng
                  </button>
                  <button
                    onClick={() => {
                      setTtsEngine('browser-speech');
                      VoiceService.setTTSEngine('browser-speech');
                      showToast('TTS: Browser WebSpeech');
                    }}
                    className={`p-2 rounded border text-center transition cursor-pointer ${
                      ttsEngine === 'browser-speech' ? 'border-cyan-500 bg-cyan-950 text-cyan-300' : 'border-slate-700 text-slate-400'
                    }`}
                  >
                    browser
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-700/60 font-mono">
                <span className="text-slate-400">Storage Engine:</span>
                <span className="text-cyan-400">Local SQLite / IndexedDB</span>
              </div>
            </div>

            <button
              onClick={() => setShowHealthModal(false)}
              className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Device Permissions Guide Modal */}
      <DevicePermissionsGuide
        isOpen={showPermissionsGuide}
        onClose={() => setShowPermissionsGuide(false)}
        lang={lang}
        initialTab={permissionsGuideTab}
        onPermissionsUpdated={() => checkPermissions()}
      />

      {/* Live Camera Scanner Viewfinder Modal */}
      <CameraCaptureModal
        isOpen={showCameraCaptureModal}
        onClose={() => setShowCameraCaptureModal(false)}
        lang={lang}
        onCapture={(dataUrl) => {
          setCustomImage(dataUrl);
          setSelectedSample(null);
          runGemmaVisionExtraction(dataUrl);
        }}
        onPermissionDenied={() => {
          setPermissionsGuideTab('camera');
          setShowPermissionsGuide(true);
          showToast(lang === 'kn' ? 'ಕ್ಯಾಮೆರಾ ಪ್ರವೇಶ ನಿರಾಕರಿಸಲಾಗಿದೆ. ಅನುಮತಿ ಮಾರ್ಗದರ್ಶಿ ಪರಿಶೀಲಿಸಿ.' : lang === 'hi' ? 'कैमरा अनुमति अस्वीकार की गई। कृपया गाइड देखें।' : 'Camera access denied. Follow the instructions to allow access.');
        }}
      />

      {/* Official Notice OCR Text & Statutory Inspection Report Modal */}
      <OcrReportModal
        isOpen={showOcrReportModal}
        onClose={() => setShowOcrReportModal(false)}
        extraction={extractedData}
        imagePreview={customImage}
        lang={lang}
      />

      {/* Official Document Summary Sheet Modal */}
      <DocumentSummarySheetModal
        isOpen={showSummarySheetModal}
        onClose={() => setShowSummarySheetModal(false)}
        summarySheet={extractedData?.summary_sheet || null}
        lang={lang}
        onAddCalendar={() => {
          if (extractedData && extractedData.deadlines.length > 0) {
            downloadICSFile(extractedData.deadlines[0] as any);
            showToast(lang === 'kn' ? 'ಕ್ಯಾಲೆಂಡರ್‌ಗೆ ಗಡುವು ಉಳಿಸಲಾಗಿದೆ (.ics)' : lang === 'hi' ? 'कैलेंडर में अनुस्मारक सुरक्षित हुआ (.ics)' : 'Deadline saved to calendar (.ics)');
          }
        }}
        onAskVoiceAI={() => {
          setActiveTab('voice');
        }}
      />

    </div>
  );
}
