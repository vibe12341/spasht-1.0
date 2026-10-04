import React, { useState } from 'react';
import { 
  FileCheck2, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  ExternalLink, 
  Volume2, 
  VolumeX, 
  Download, 
  Printer, 
  Copy, 
  Building2, 
  HelpCircle,
  ArrowRight,
  MessageSquare
} from 'lucide-react';
import { DocumentSummarySheetData, SupportedLanguage } from '../types';
import { VoiceService } from '../services/voiceService';

interface DocumentSummarySheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  summarySheet: DocumentSummarySheetData | null;
  lang: SupportedLanguage;
  onAddCalendar?: () => void;
  onAskVoiceAI?: () => void;
}

export const DocumentSummarySheetModal: React.FC<DocumentSummarySheetModalProps> = ({
  isOpen,
  onClose,
  summarySheet,
  lang,
  onAddCalendar,
  onAskVoiceAI
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copiedDin, setCopiedDin] = useState(false);
  const [checkedDocs, setCheckedDocs] = useState<Record<number, boolean>>({});

  if (!isOpen || !summarySheet) return null;

  const toggleDocCheck = (idx: number) => {
    setCheckedDocs(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const copyRefNumber = () => {
    navigator.clipboard.writeText(summarySheet.reference_identifier);
    setCopiedDin(true);
    setTimeout(() => setCopiedDin(false), 2000);
  };

  const speakSummarySheet = () => {
    if (isSpeaking) {
      VoiceService.stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = `${summarySheet.whats_going_on.core_headline}. ${summarySheet.whats_going_on.plain_explanation}. ${summarySheet.whats_going_on.financial_impact}`;
    setIsSpeaking(true);
    VoiceService.speak(textToSpeak, lang, () => {
      setIsSpeaking(false);
    });
  };

  const printSummarySheet = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-5 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-3xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shrink-0">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                  {summarySheet.issuing_jurisdiction}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  {summarySheet.document_category}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white mt-1">
                {lang === 'kn' ? 'ಅಧಿಕೃತ ದಾಖಲೆಯ ವಿವರಣೆ ಹಾಳೆ' : lang === 'hi' ? 'दस्तावेज़ विवरण व स्थिति सारांश' : 'Official Document Summary Sheet'}
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                {summarySheet.document_sub_type}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => {
              VoiceService.stopSpeaking();
              setIsSpeaking(false);
              onClose();
            }}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm transition cursor-pointer shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Document Dossier */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs">
          
          {/* Reference & Timeline Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">Reference / DIN:</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-cyan-300 font-bold truncate">{summarySheet.reference_identifier}</span>
                <button
                  onClick={copyRefNumber}
                  className="text-slate-400 hover:text-cyan-300 cursor-pointer"
                  title="Copy Reference"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 block uppercase">Issuing Authority:</span>
              <span className="text-slate-200 font-semibold truncate block mt-0.5">
                {summarySheet.issuing_authority_name}
              </span>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Statutory Deadline:</span>
                <span className="text-white font-bold block mt-0.5">{summarySheet.critical_deadline_date}</span>
              </div>
              <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase shrink-0 ${
                summarySheet.urgency_status === 'red'
                  ? 'bg-rose-950 text-rose-300 border border-rose-700 animate-pulse'
                  : 'bg-amber-950 text-amber-300 border border-amber-700'
              }`}>
                {summarySheet.days_remaining} Days Left
              </span>
            </div>
          </div>

          {/* SECTION 1: WHAT'S GOING ON? (Plain Language Breakdown) */}
          <div className="bg-slate-800/80 rounded-2xl border border-slate-700 p-4 sm:p-5 space-y-3.5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-cyan-400" />
                {lang === 'kn' ? 'ಇಲ್ಲಿ ಏನು ನಡೆಯುತ್ತಿದೆ? (ಸರಳ ವಿವರಣೆ)' : lang === 'hi' ? 'यहाँ क्या हो रहा है? (सरल भाषा में समझें)' : "What's Going On? (Plain Breakdown)"}
              </span>

              {/* Voice Read Aloud Toggle */}
              <button
                onClick={speakSummarySheet}
                className={`px-3 py-1 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                  isSpeaking
                    ? 'bg-rose-950/80 border-rose-600 text-rose-300 animate-pulse'
                    : 'bg-cyan-950/80 border-cyan-600/60 text-cyan-300 hover:bg-cyan-900'
                }`}
              >
                {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                <span>{isSpeaking ? 'Stop Voice' : 'Read Aloud'}</span>
              </button>
            </div>

            {/* Core Punchy Headline */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/70 via-slate-900 to-slate-900 border border-cyan-500/40">
              <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
                {summarySheet.whats_going_on.core_headline}
              </h3>
            </div>

            {/* Explanation Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs leading-relaxed">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/60 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Plain Explanation:</span>
                <p className="text-slate-200">{summarySheet.whats_going_on.plain_explanation}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/60 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Why It Was Issued:</span>
                <p className="text-slate-300">{summarySheet.whats_going_on.why_issued}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/60 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Department's Requirement:</span>
                <p className="text-slate-300">{summarySheet.whats_going_on.allegation_or_query}</p>
              </div>

              <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/40 space-y-1">
                <span className="text-[10px] font-bold uppercase text-rose-400 block flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Financial Risk / Penalty:
                </span>
                <p className="text-rose-200 font-medium">{summarySheet.whats_going_on.financial_impact}</p>
              </div>
            </div>
          </div>

          {/* SECTION 2: STEP-BY-STEP ACTION ROADMAP */}
          <div className="bg-slate-800/80 rounded-2xl border border-slate-700 p-4 sm:p-5 space-y-3 shadow-lg">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              {lang === 'kn' ? 'ನೀವು ತೆಗೆದುಕೊಳ್ಳಬೇಕಾದ ತಕ್ಷಣದ ಕ್ರಮಗಳು' : lang === 'hi' ? 'आपके लिए आवश्यक त्वरित कार्रवाई कदम' : 'Immediate Action Roadmap'}
            </span>

            <div className="space-y-2.5">
              {summarySheet.action_roadmap.map((step) => (
                <div
                  key={step.step_number}
                  className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-700/70"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-950 border border-emerald-500/50 text-emerald-300 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                    {step.step_number}
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <div className="font-bold text-white text-xs">{step.title}</div>
                    <p className="text-slate-300 text-xs leading-relaxed">{step.description}</p>
                    {step.portal_link && (
                      <a
                        href={step.portal_link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 underline font-mono mt-1"
                      >
                        <span>Open Official Portal</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 3: CITIZEN LEGAL RIGHTS & REQUIRED PAPERS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Legal Rights & Safeguards */}
            <div className="bg-slate-800/80 rounded-2xl border border-slate-700 p-4 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>Your Citizen Rights Under Law</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono block">
                Governing Act: {summarySheet.statutory_governing_act}
              </span>
              <ul className="space-y-1.5 text-xs text-slate-300 leading-relaxed">
                {summarySheet.citizen_rights.map((right, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-indigo-400 font-bold">•</span>
                    <span>{right}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Required Papers Checklist */}
            <div className="bg-slate-800/80 rounded-2xl border border-slate-700 p-4 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                <FileCheck2 className="w-4 h-4 text-cyan-400" />
                <span>Required Documents Checklist</span>
              </div>
              <span className="text-[10px] text-slate-400 block">Check off papers as you prepare them:</span>
              <div className="space-y-1.5">
                {summarySheet.required_documents.map((doc, idx) => (
                  <button
                    key={idx}
                    onClick={() => toggleDocCheck(idx)}
                    className="w-full text-left flex items-start gap-2 p-2 rounded-lg bg-slate-900/60 border border-slate-700/60 hover:bg-slate-700/40 transition cursor-pointer text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={!!checkedDocs[idx]}
                      onChange={() => {}}
                      className="mt-0.5 accent-cyan-500 rounded cursor-pointer pointer-events-none"
                    />
                    <span className={checkedDocs[idx] ? 'line-through text-slate-500' : 'text-slate-200'}>
                      {doc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Legal Disclaimer */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 text-center leading-relaxed">
            {summarySheet.disclaimer}
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <button
              onClick={printSummarySheet}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-400" />
              <span>Print Sheet</span>
            </button>
            {onAddCalendar && (
              <button
                onClick={onAddCalendar}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Save to Calendar</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onAskVoiceAI && (
              <button
                onClick={() => {
                  VoiceService.stopSpeaking();
                  setIsSpeaking(false);
                  onClose();
                  onAskVoiceAI();
                }}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-500 hover:from-cyan-500 hover:to-sky-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-600/30 transition cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Ask Voice AI About This</span>
              </button>
            )}
            <button
              onClick={() => {
                VoiceService.stopSpeaking();
                setIsSpeaking(false);
                onClose();
              }}
              className="px-4 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-semibold text-xs transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
