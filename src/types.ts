export type SupportedLanguage = 'en' | 'hi' | 'kn';

export type UrgencyLevel = 'red' | 'amber' | 'green';

export interface DeadlineItem {
  id: string;
  notice_id?: string;
  title: string;
  date_iso: string;
  relative_rule?: string;
  action: string;
  authority: string;
  penalty?: string;
  urgency: UrgencyLevel;
  days_remaining: number;
}

export interface ExtractionJSON {
  notice_type: string;
  issuing_authority: string;
  notice_reference_no: string;
  summary_in_user_language: string;
  required_actions: string[];
  documents_needed: string[];
  deadlines: Array<{
    title?: string;
    date_iso?: string;
    relative_rule?: string;
    action: string;
    penalty?: string;
    urgency?: UrgencyLevel;
  }>;
  amount_due: string | null;
  contact: string;
  confidence: number; // 0.0 - 1.0
  unclear_fields: string[];
  thinking_process?: string;
  raw_ocr_text?: string;
  legal_assessment?: string;
  detected_stamps?: string[];
  detected_language?: string;
  summary_sheet?: DocumentSummarySheetData;
}

export interface DocumentSummarySheetData {
  document_category: string;
  document_sub_type: string;
  issuing_jurisdiction: 'Central Government' | 'State Government' | 'Municipal / Local Body' | 'Judicial / Quasi-Judicial';
  issuing_authority_name: string;
  reference_identifier: string;
  issue_date?: string;
  whats_going_on: {
    core_headline: string;
    plain_explanation: string;
    why_issued: string;
    allegation_or_query: string;
    financial_impact: string;
  };
  urgency_status: UrgencyLevel;
  critical_deadline_date: string;
  days_remaining: number;
  statutory_governing_act: string;
  citizen_rights: string[];
  action_roadmap: Array<{
    step_number: number;
    title: string;
    description: string;
    portal_link?: string;
  }>;
  required_documents: string[];
  disclaimer: string;
}

export interface VoiceChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  tool_called?: string;
  legal_references?: string[];
  isThinking?: boolean;
}

export interface CitizenProfile {
  name: string;
  language: SupportedLanguage;
  state: string;
  age: number;
  category: 'General' | 'OBC' | 'SC' | 'ST' | 'EWS';
  masked_aadhaar?: string;
  masked_pan?: string;
  consent: boolean;
}

export interface RulebookEntry {
  id: string;
  title: string;
  applies_when: {
    notice_type?: string;
    keywords?: string[];
    profile_conditions?: {
      category?: string[];
      min_age?: number;
      state?: string[];
    };
  };
  rule_text: string;
  action_for_user: string;
  deadline_days: number;
  source: string;
  last_verified: string;
  status: 'VERIFIED' | 'TODO_VERIFY';
}

export interface RightsCheckResult {
  matches: Array<{
    rule: RulebookEntry;
    reason: string;
    action_recommended: string;
    deadline_info: string;
  }>;
  disclaimer: string;
  thinking_trace: string;
}

export interface ChecklistItem {
  id: string;
  notice_id?: string;
  task: string;
  completed: boolean;
}

export interface SystemHealth {
  model_name: string;
  model_loaded: boolean;
  active_language: SupportedLanguage;
  tts_engine: 'indic-parler-tts' | 'espeak-ng' | 'browser-speech';
  network_required: 'NO';
  vad_engine: 'silero-vad' | 'push-to-talk';
  offline_cache_status: 'ready' | 'syncing';
}
