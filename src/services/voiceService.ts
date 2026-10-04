import { SupportedLanguage } from '../types';

export type TTSEngineType = 'indic-parler-tts' | 'espeak-ng' | 'browser-speech';

class VoiceServiceManager {
  private ttsEngine: TTSEngineType = 'browser-speech';
  private recognition: any = null;
  private isListening = false;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;

  constructor() {
    this.initSpeechRecognition();
  }

  public setTTSEngine(engine: TTSEngineType) {
    this.ttsEngine = engine;
    console.log(`[Go Vision Voice] TTS Engine set to: ${engine}`);
  }

  public getTTSEngine(): TTSEngineType {
    return this.ttsEngine;
  }

  private initSpeechRecognition() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
      }
    }
  }

  public startListening(
    lang: SupportedLanguage,
    onResult: (text: string) => void,
    onError: (err: any) => void
  ): { stop: () => void } {
    const langCodes: Record<SupportedLanguage, string> = {
      en: 'en-IN',
      hi: 'hi-IN',
      kn: 'kn-IN'
    };

    if (this.recognition) {
      this.recognition.lang = langCodes[lang] || 'en-IN';
      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        this.isListening = false;
        onResult(transcript);
      };
      this.recognition.onerror = (event: any) => {
        this.isListening = false;
        onError(event);
      };
      this.recognition.onend = () => {
        this.isListening = false;
      };

      try {
        this.recognition.start();
        this.isListening = true;
      } catch (e) {
        console.warn('SpeechRecognition start error:', e);
        // Fallback simulate or handle mic permission
      }
    } else {
      console.warn('Browser SpeechRecognition not supported, using prompt fallback');
      onError(new Error('Speech recognition not available on this browser'));
    }

    return {
      stop: () => {
        if (this.recognition && this.isListening) {
          try {
            this.recognition.stop();
          } catch {}
          this.isListening = false;
        }
      }
    };
  }

  /**
   * Speak output in English, Hindi, or Kannada.
   * Under 500 characters per call per spec.
   */
  public speak(text: string, lang: SupportedLanguage, onDone?: () => void, rateMultiplier: number = 1.0) {
    const trimmed = text.length > 500 ? text.slice(0, 497) + '...' : text;

    if (typeof window === 'undefined' || !window.speechSynthesis) {
      if (onDone) onDone();
      return;
    }

    // Cancel ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(trimmed);

    const langCodes: Record<SupportedLanguage, string> = {
      en: 'en-IN',
      hi: 'hi-IN',
      kn: 'kn-IN'
    };
    utterance.lang = langCodes[lang] || 'en-IN';

    // Base rate
    let baseRate = 1.0;
    if (this.ttsEngine === 'espeak-ng') {
      utterance.pitch = 0.8;
      baseRate = 1.15; // Robotic fast synthesis
    } else if (this.ttsEngine === 'indic-parler-tts') {
      utterance.pitch = 1.0;
      baseRate = 0.92; // Natural paced neural cadence
    } else {
      utterance.pitch = 1.0;
      baseRate = 1.0;
    }
    utterance.rate = Math.max(0.5, Math.min(2.0, baseRate * rateMultiplier));

    // Attempt to pick a matching local voice if available
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find(v => v.lang.startsWith(langCodes[lang]) || v.lang.startsWith(lang));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onend = () => {
      if (onDone) onDone();
    };

    utterance.onerror = () => {
      if (onDone) onDone();
    };

    window.speechSynthesis.speak(utterance);
  }

  public stopSpeaking() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }
}

export const VoiceService = new VoiceServiceManager();
