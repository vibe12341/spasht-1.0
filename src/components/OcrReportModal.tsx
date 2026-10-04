import React, { useState } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Download, 
  Printer, 
  ShieldCheck, 
  Clock, 
  Stamp, 
  Building2, 
  Calendar 
} from 'lucide-react';
import { ExtractionJSON, SupportedLanguage } from '../types';

interface OcrReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  extraction: ExtractionJSON | null;
  imagePreview?: string | null;
  lang: SupportedLanguage;
}

export const OcrReportModal: React.FC<OcrReportModalProps> = ({
  isOpen,
  onClose,
  extraction,
  imagePreview,
  lang
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !extraction) return null;

  const copyOcrText = () => {
    if (extraction.raw_ocr_text) {
      navigator.clipboard.writeText(extraction.raw_ocr_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-5 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-3xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  {lang === 'kn' ? 'ಅಧಿಕೃತ OCR ಸ್ಕ್ಯಾನ್ ಮತ್ತು ಶಾಸನಬದ್ಧ ವರದಿ' : lang === 'hi' ? 'आधिकारिक OCR स्कैन व वैधानिक रिपोर्ट' : 'Official Notice OCR & Statutory Report'}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Confidence: {Math.round(extraction.confidence * 100)}%
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {extraction.issuing_authority} • Ref: {extraction.notice_reference_no}
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

        {/* Scrollable Report Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          
          {/* Statutory Assessment Box */}
          <div className="bg-gradient-to-r from-indigo-950/40 to-slate-900 p-4 rounded-xl border border-indigo-700/50 space-y-2">
            <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Statutory Compliance & Legal Assessment</span>
            </div>
            <p className="text-slate-200 leading-relaxed font-sans text-xs">
              {extraction.legal_assessment || 'This notice was inspected by Go Vision under statutory rules. Citizens are entitled to written show-cause explanation, personal hearing, and cure windows before adverse ex-parte proceedings.'}
            </p>
            <div className="text-[11px] text-amber-300/90 flex items-center gap-1.5 pt-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>This is guidance, not legal advice. Verify at the concerned government office.</span>
            </div>
          </div>

          {/* Detected Stamps & Official Seals */}
          {extraction.detected_stamps && extraction.detected_stamps.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Detected Official Seals, Stamps & Inscriptions
              </span>
              <div className="flex flex-wrap gap-2">
                {extraction.detected_stamps.map((stamp, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700 text-cyan-300 text-[11px] font-mono flex items-center gap-1.5"
                  >
                    <Stamp className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{stamp}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Verbatim Raw OCR Extracted Text */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Verbatim Optical Text Extraction (Raw OCR)
              </span>
              <button
                onClick={copyOcrText}
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Raw OCR'}</span>
              </button>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 max-h-56 overflow-y-auto whitespace-pre-wrap leading-relaxed select-text">
              {extraction.raw_ocr_text || extraction.summary_in_user_language}
            </div>
          </div>

          {/* Summary & Timelines */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Extracted Deadlines */}
            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-2.5">
              <h4 className="font-bold text-white flex items-center gap-1.5 text-xs">
                <Clock className="w-3.5 h-3.5 text-rose-400" />
                <span>Extracted Statutory Timelines</span>
              </h4>
              <div className="space-y-2">
                {extraction.deadlines.map((dl, idx) => (
                  <div key={idx} className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700/60 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{dl.date_iso || 'Date calculated'}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold ${
                        dl.urgency === 'red' ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'
                      }`}>
                        {dl.urgency}
                      </span>
                    </div>
                    <p className="text-slate-300">{dl.action}</p>
                    {dl.penalty && (
                      <p className="text-[10px] text-rose-300">Consequence: {dl.penalty}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Required Actions & Documents */}
            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-2.5">
              <h4 className="font-bold text-white flex items-center gap-1.5 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Mandatory Actions & Papers</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {extraction.required_actions.map((act, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-2 border-t border-slate-700/60">
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Papers Needed:</span>
                <span className="text-xs text-cyan-300">{extraction.documents_needed.join(', ')}</span>
              </div>
            </div>

          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            onClick={printReport}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-cyan-400" />
            <span>Print Report</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition cursor-pointer"
          >
            Close Report
          </button>
        </div>

      </div>
    </div>
  );
};
