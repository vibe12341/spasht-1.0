import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, 
  MicOff, 
  Send, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  RotateCcw, 
  Trash2, 
  ShieldCheck, 
  Clock, 
  FileText, 
  Cpu, 
  Info,
  Calendar,
  Lock,
  ChevronRight
} from 'lucide-react';
import { SupportedLanguage, ExtractionJSON, VoiceChatMessage, CitizenProfile } from '../types';
import { VoiceService } from '../services/voiceService';
import { GemmaEngine, VoiceAgentResponse } from '../services/gemmaEngine';

interface InteractiveVoiceAgentProps {
  currentNotice: ExtractionJSON | null;
  profile: CitizenProfile;
  lang: SupportedLanguage;
  onDeadlinesUpdated?: () => void;
  onRequestPermissionsGuide: () => void;
  micPermissionStatus: string;
}

export const InteractiveVoiceAgent: React.FC<InteractiveVoiceAgentProps> = ({
  currentNotice,
  profile,
  lang,
  onDeadlinesUpdated,
  onRequestPermissionsGuide,
  micPermissionStatus
}) => {
  const [messages, setMessages] = useState<VoiceChatMessage[]>(() => [
    {
      id: 'init-msg',
      sender: 'agent',
      text: lang === 'kn'
        ? 'ನಮಸ್ಕಾರ! ನಾನು ಗೋ ವಿಷನ್ ವಾಯ್ಸ್ ಸಹಾಯಕ. ನಿಮ್ಮ ಸರ್ಕಾರಿ ನೋಟಿಸ್‌ನ ಗಡುವುಗಳು, ಅಗತ್ಯ ದಾಖಲೆಗಳು ಮತ್ತು ಶಾಸನಬದ್ಧ ಹಕ್ಕುಗಳ ಬಗ್ಗೆ ನಾನು ಉತ್ತರಿಸಬಲ್ಲೆ. ನೀವು ಏನು ತಿಳಿಯಲು ಬಯಸುತ್ತೀರಿ?'
        : lang === 'hi'
        ? 'नमस्ते! मैं गो विज़न वॉयस असिस्टेंट हूँ। मैं आपके सरकारी नोटिस की अंतिम तिथि, आवश्यक दस्तावेज़ व वैधानिक अधिकारों के बारे में बता सकता हूँ। आप क्या पूछना चाहते हैं?'
        : 'Hello! I am Go Vision Voice AI. I can explain your notice deadlines, required documents, penalties, and citizen rights under Indian law. What would you like to ask?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      legal_references: ['Statutory Citizen Guidance']
    }
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSpeed, setSpeechSpeed] = useState<number>(1.0);
  const [speechRecognizer, setSpeechRecognizer] = useState<{ stop: () => void } | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  // Push-to-talk start
  const handleStartPushToTalk = () => {
    setIsListening(true);

    const rec = VoiceService.startListening(
      lang,
      (transcript) => {
        setIsListening(false);
        if (transcript.trim()) {
          handleSendMessage(transcript.trim());
        }
      },
      (err) => {
        setIsListening(false);
        console.warn('Speech recognition error:', err);
        if (
          err?.error === 'not-allowed' || 
          err?.name === 'NotAllowedError' || 
          err?.error === 'service-not-allowed' ||
          err?.message?.includes('not available') ||
          err?.message?.includes('permission')
        ) {
          onRequestPermissionsGuide();
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

  // Submit a message (via voice or text)
  const handleSendMessage = async (queryText: string) => {
    if (!queryText.trim() || isProcessing) return;

    const userMsg: VoiceChatMessage = {
      id: 'msg_' + Date.now(),
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsProcessing(true);

    try {
      const response: VoiceAgentResponse = await GemmaEngine.handleVoiceInput(
        queryText,
        currentNotice,
        lang,
        messages
      );

      const agentMsg: VoiceChatMessage = {
        id: 'msg_' + (Date.now() + 1),
        sender: 'agent',
        text: response.spoken_reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        tool_called: response.tool_called,
        legal_references: response.legal_references || []
      };

      setMessages(prev => [...prev, agentMsg]);

      // Speak response aloud
      setIsSpeaking(true);
      VoiceService.speak(response.spoken_reply, lang, () => {
        setIsSpeaking(false);
      }, speechSpeed);

      if (onDeadlinesUpdated && (response.tool_called === 'save_deadline' || response.tool_called === 'create_ics')) {
        onDeadlinesUpdated();
      }
    } catch (err) {
      console.error('Voice query error:', err);
      const errorMsg: VoiceChatMessage = {
        id: 'msg_err_' + Date.now(),
        sender: 'agent',
        text: lang === 'kn'
          ? 'ದೋಷ ಸಂಭವಿಸಿದೆ. ದಯವಿಟ್ಟು ಸಂಬಂಧಪಟ್ಟ ಸರ್ಕಾರಿ ಕಚೇರಿಯಲ್ಲಿ ಪರಿಶೀಲಿಸಿ.'
          : lang === 'hi'
          ? 'त्रुटि हुई। कृपया संबंधित सरकारी कार्यालय में पुष्टि कर लें।'
          : 'An error occurred. Please verify at the concerned government office.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  const replayMessage = (text: string) => {
    setIsSpeaking(true);
    VoiceService.speak(text, lang, () => {
      setIsSpeaking(false);
    }, speechSpeed);
  };

  const stopAudio = () => {
    VoiceService.stopSpeaking();
    setIsSpeaking(false);
  };

  const clearHistory = () => {
    VoiceService.stopSpeaking();
    setIsSpeaking(false);
    setMessages([
      {
        id: 'init-msg-reset',
        sender: 'agent',
        text: lang === 'kn'
          ? 'ಸಂಭಾಷಣೆಯನ್ನು ತೆರವುಗೊಳಿಸಲಾಗಿದೆ. ನಿಮ್ಮ ನೋಟಿಸ್ ಬಗ್ಗೆ ಯಾವುದೇ ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳಿ.'
          : lang === 'hi'
          ? 'बातचीत रीसेट कर दी गई है। आप सरकारी नोटिस के बारे में कुछ भी पूछ सकते हैं।'
          : 'Conversation cleared. Feel free to ask any question regarding your notice.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Quick Action Chips in selected language
  const quickPrompts = lang === 'kn' ? [
    'ಈ ನೋಟಿಸ್ ಏನು ಹೇಳುತ್ತದೆ?',
    'ನನ್ನ ಕೊನೆಯ ದಿನಾಂಕ ಯಾವುದು?',
    'ದಂಡ ಅಥವಾ ಪರಿಣಾಮವೇನು?',
    'ಯಾವ ಅಗತ್ಯ ದಾಖಲೆಗಳನ್ನು ಸಲ್ಲಿಸಬೇಕು?',
    'ನನ್ನ ಕಾನೂನುಬದ್ಧ ಹಕ್ಕುಗಳೇನು?',
    'ಕ್ಯಾಲೆಂಡರ್‌ಗೆ ಜ್ಞಾಪನೆ ಸೇರಿಸಿ'
  ] : lang === 'hi' ? [
    'यह नोटिस किस बारे में है?',
    'मेरी अंतिम तिथि कब है?',
    'जुर्माना या परिणाम क्या होगा?',
    'कौन से दस्तावेज़ चाहिए?',
    'मेरे वैधानिक अधिकार व अपील के विकल्प बताएं',
    'कैलेंडर में रिमाइंडर जोड़ें'
  ] : [
    'What is this notice about?',
    'When is my statutory deadline?',
    'What is the penalty if I miss the date?',
    'What exact documents must I attach?',
    'What are my legal rights under Section 148A(b)?',
    'Add this deadline to my Google Calendar'
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      
      {/* Top Controller Bar */}
      <div className="bg-slate-800/90 rounded-2xl border border-slate-700/80 p-4 shadow-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Microphone Permission Status */}
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${
            micPermissionStatus === 'granted'
              ? 'bg-emerald-400'
              : micPermissionStatus === 'denied'
              ? 'bg-rose-500 animate-pulse'
              : 'bg-amber-400'
          }`} />
          <span className="text-slate-300 font-medium">Mic:</span>
          <span className="font-mono text-cyan-300">
            {micPermissionStatus === 'granted' ? 'Active ✓' : micPermissionStatus === 'denied' ? 'Blocked ✕' : 'Ready'}
          </span>
          <button
            onClick={onRequestPermissionsGuide}
            className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer ml-1"
          >
            Check Access
          </button>
        </div>

        {/* Speed Controls & Audio Stop */}
        <div className="flex items-center gap-2">
          {isSpeaking && (
            <button
              onClick={stopAudio}
              className="px-2.5 py-1 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
            >
              <VolumeX className="w-3 h-3 text-rose-400" />
              <span>Stop Audio</span>
            </button>
          )}

          {/* Speech Speed Toggle */}
          <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-700 text-[11px]">
            <span className="px-2 text-slate-400">Speed:</span>
            {[0.8, 1.0, 1.2].map((spd) => (
              <button
                key={spd}
                onClick={() => setSpeechSpeed(spd)}
                className={`px-2 py-0.5 rounded font-mono transition cursor-pointer ${
                  speechSpeed === spd ? 'bg-cyan-500 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          <button
            onClick={clearHistory}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-700 text-slate-400 hover:text-rose-400 border border-slate-700 transition cursor-pointer"
            title="Clear Chat History"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* Main Conversation Container */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-700/80 shadow-2xl flex flex-col h-[480px] overflow-hidden">
        
        {/* Messages Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
          {messages.map((msg) => {
            const isAgent = msg.sender === 'agent';
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 max-w-[85%] ${isAgent ? 'self-start mr-auto' : 'self-end ml-auto flex-row-reverse'}`}
              >
                {/* Avatar Icon */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white shadow-md ${
                  isAgent
                    ? 'bg-gradient-to-tr from-cyan-600 to-sky-400 text-slate-950 font-black'
                    : 'bg-slate-700 text-slate-200'
                }`}>
                  {isAgent ? <Sparkles className="w-4 h-4 text-white" /> : 'You'}
                </div>

                {/* Message Bubble */}
                <div className={`p-3.5 rounded-2xl space-y-1.5 shadow-md ${
                  isAgent
                    ? 'bg-slate-800 border border-slate-700 text-slate-100 rounded-tl-xs'
                    : 'bg-cyan-600 text-white rounded-tr-xs'
                }`}>
                  <p className="leading-relaxed font-sans text-xs sm:text-[13px] whitespace-pre-wrap">
                    {msg.text}
                  </p>

                  {/* Metadata and Citations (for Agent) */}
                  {isAgent && (
                    <div className="pt-2 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-[10px]">
                      {msg.legal_references && msg.legal_references.length > 0 && (
                        <span className="font-mono text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                          {msg.legal_references[0]}
                        </span>
                      )}

                      {msg.tool_called && (
                        <span className="font-mono text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800 flex items-center gap-1">
                          <Cpu className="w-3 h-3" />
                          <span>{msg.tool_called}()</span>
                        </span>
                      )}

                      <div className="flex items-center gap-2 text-slate-400 ml-auto">
                        <span>{msg.timestamp}</span>
                        <button
                          onClick={() => replayMessage(msg.text)}
                          className="text-cyan-400 hover:text-cyan-300 cursor-pointer p-0.5"
                          title="Replay Voice"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {!isAgent && (
                    <div className="text-[10px] text-cyan-200 text-right">
                      {msg.timestamp}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isProcessing && (
            <div className="flex gap-2.5 items-center text-xs text-cyan-400 animate-pulse bg-slate-800/60 p-3 rounded-xl border border-slate-700 w-fit">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>Gemma 4 reasoning with statutory legal rulebook...</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Quick Action Suggestion Chips */}
        <div className="px-4 py-2 border-t border-slate-800 bg-slate-950/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[10px] uppercase font-bold text-slate-500 shrink-0">Ask:</span>
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(p)}
              disabled={isProcessing}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] whitespace-nowrap transition cursor-pointer shrink-0 disabled:opacity-50"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Bottom Input & Push-To-Talk Bar */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
          
          {/* Push-to-Talk Mic Button */}
          <button
            onMouseDown={handleStartPushToTalk}
            onMouseUp={handleStopPushToTalk}
            onTouchStart={handleStartPushToTalk}
            onTouchEnd={handleStopPushToTalk}
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition select-none cursor-pointer ${
              isListening
                ? 'bg-rose-600 text-white ring-4 ring-rose-600/40 animate-pulse'
                : isSpeaking
                ? 'bg-amber-600 text-white ring-2 ring-amber-600/40'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md'
            }`}
            title="Hold to Speak"
          >
            <Mic className="w-5 h-5" />
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage(inputQuery);
            }}
            placeholder={
              lang === 'kn'
                ? 'ಪ್ರಶ್ನೆಯನ್ನು ಟೈಪ್ ಮಾಡಿ ಅಥವಾ ಮಾತನಾಡಲು ಮೈಕ್ ಒತ್ತಿ ಹಿಡಿಯಿರಿ...'
                : lang === 'hi'
                ? 'प्रश्न टाइप करें या बोलने के लिए माइक दबाए रखें...'
                : 'Type legal question or hold mic to speak...'
            }
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />

          {/* Send Button */}
          <button
            onClick={() => handleSendMessage(inputQuery)}
            disabled={!inputQuery.trim() || isProcessing}
            className="w-11 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 disabled:opacity-40 disabled:hover:bg-slate-800 flex items-center justify-center transition cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

      </div>

    </div>
  );
};
