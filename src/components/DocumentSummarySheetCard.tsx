import React, { useState } from 'react';
import { 
  FileCheck2, 
  AlertTriangle, 
  Clock, 
  HelpCircle, 
  Volume2, 
  VolumeX, 
  ChevronRight, 
  ShieldCheck, 
  Calendar, 
  Sparkles,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { DocumentSummarySheetData, SupportedLanguage } from '../types';
import { VoiceService } from '../services/voiceService';

interface DocumentSummarySheetCardProps {
  summarySheet: DocumentSummarySheetData;
  lang: SupportedLanguage;
  onOpenFullSheet: () => void;
  onAddCalendar?: () => void;
  onAskVoiceAI?: () => void;
}

export const DocumentSummarySheetCard: React.FC<DocumentSummarySheetCardProps> = ({
  summarySheet,
  lang,
  onOpenFullSheet,
  onAddCalendar,
  onAskVoiceAI
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speakBriefing = () => {
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

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 rounded-2xl border-2 border-cyan-500/40 p-4 sm:p-5 shadow-2xl space-y-4 relative overflow-hidden">
      
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Classification Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold uppercase tracking-wider bg-cyan-950 text-cyan-300 border border-cyan-700/60 flex items-center gap-1.5 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>{summarySheet.issuing_jurisdiction}</span>
          </span>

          <span className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold uppercase tracking-wider bg-slate-800 text-slate-200 border border-slate-700">
            {summarySheet.document_category}
          </span>
        </div>

        {/* Urgency Pill */}
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wide flex items-center gap-1.5 ${
            summarySheet.urgency_status === 'red'
              ? 'bg-rose-950 text-rose-300 border border-rose-700/80 animate-pulse'
              : 'bg-amber-950 text-amber-300 border border-amber-700/80'
          }`}>
            <Clock className="w-3.5 h-3.5" />
            <span>{summarySheet.days_remaining} Days Left ({summarySheet.critical_deadline_date})</span>
          </span>
        </div>
      </div>

      {/* Detected Document Title & Ref */}
      <div className="border-b border-slate-800 pb-3">
        <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
          <FileCheck2 className="w-5 h-5 text-cyan-400 shrink-0" />
          <span>{summarySheet.document_sub_type}</span>
        </h2>
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono mt-1">
          <span>Authority: <strong className="text-slate-200">{summarySheet.issuing_authority_name}</strong></span>
          <span>•</span>
          <span>Ref: <strong className="text-cyan-300">{summarySheet.reference_identifier}</strong></span>
        </div>
      </div>

      {/* "What's Going On?" Focus Box */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span>{lang === 'kn' ? 'ದಾಖಲೆಯ ವಿವರಣೆ (ಇಲ್ಲಿ ಏನು ನಡೆಯುತ್ತಿದೆ?)' : lang === 'hi' ? 'दस्तावेज़ विश्लेषण: यहाँ क्या हो रहा है?' : "What's Going On? (Official Briefing)"}</span>
          </span>

          <button
            onClick={speakBriefing}
            className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              isSpeaking
                ? 'bg-rose-950 border-rose-600 text-rose-300 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
            <span>{isSpeaking ? 'Stop' : 'Listen'}</span>
          </button>
        </div>

        {/* Core Headline */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white font-semibold text-xs sm:text-sm leading-relaxed">
          {summarySheet.whats_going_on.core_headline}
        </div>

        {/* Key Points Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80 space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Plain Breakdown:</span>
            <p className="text-slate-200 leading-relaxed">{summarySheet.whats_going_on.plain_explanation}</p>
          </div>

          <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-800/40 space-y-1">
            <span className="text-[10px] font-bold uppercase text-rose-400 block flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              <span>Consequence / Risk:</span>
            </span>
            <p className="text-rose-200 leading-relaxed font-medium">{summarySheet.whats_going_on.financial_impact}</p>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          {onAddCalendar && (
            <button
              onClick={onAddCalendar}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Save Reminder (.ics)</span>
            </button>
          )}

          {onAskVoiceAI && (
            <button
              onClick={onAskVoiceAI}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ask Voice AI</span>
            </button>
          )}
        </div>

        {/* View Full Summary Sheet Trigger */}
        <button
          onClick={onOpenFullSheet}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-500 hover:from-cyan-500 hover:to-sky-400 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-cyan-600/30 transition cursor-pointer"
        >
          <span>View Full Summary Sheet</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
