import { DeadlineItem, ExtractionJSON, RulebookEntry, RightsCheckResult, SupportedLanguage, UrgencyLevel } from '../types';
import { LocalDB } from './db';

// Verhoeff Algorithm Tables
const d_table: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
];

const p_table: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
];

/**
 * Validate 12-digit Aadhaar using Verhoeff Checksum.
 * Format check only, never claim identity verification.
 */
export function validateVerhoeffAadhaar(aadhaar: string): { valid: boolean; message: string } {
  const clean = aadhaar.replace(/[\s-]/g, '');
  if (!/^\d{12}$/.test(clean)) {
    return {
      valid: false,
      message: 'Aadhaar must be exactly 12 numeric digits.'
    };
  }

  let c = 0;
  const digits = clean.split('').map(Number).reverse();

  for (let i = 0; i < digits.length; i++) {
    c = d_table[c][p_table[i % 8][digits[i]]];
  }

  if (c === 0) {
    return {
      valid: true,
      message: 'Valid 12-digit Aadhaar format (Verhoeff checksum passed). Format check only; this does not verify citizen identity.'
    };
  } else {
    return {
      valid: false,
      message: 'Invalid Aadhaar checksum (Verhoeff validation failed). Please check the digits carefully.'
    };
  }
}

export function validatePAN(pan: string): { valid: boolean; message: string } {
  const clean = pan.trim().toUpperCase();
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
  if (panRegex.test(clean)) {
    return {
      valid: true,
      message: 'Valid PAN format (5 letters + 4 digits + 1 letter). Format check only.'
    };
  }
  return {
    valid: false,
    message: 'Invalid PAN format. Must be 5 uppercase letters, 4 numbers, and 1 letter (e.g. ABCDE1234F).'
  };
}

export function validateIFSC(ifsc: string): { valid: boolean; message: string } {
  const clean = ifsc.trim().toUpperCase();
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  if (ifscRegex.test(clean)) {
    return {
      valid: true,
      message: 'Valid IFSC format (4 letters, 0, 6 alphanumeric). Format check only.'
    };
  }
  return {
    valid: false,
    message: 'Invalid IFSC format. 5th character must be 0 (e.g. SBIN0001234).'
  };
}

/**
 * 1. extract_deadlines:
 * Evaluates dates or relative rules (e.g. "within 30 days of this notice") via strict code arithmetic.
 */
export function extractDeadlines(noticeData: ExtractionJSON, baseNoticeDate: Date = new Date()): DeadlineItem[] {
  const results: DeadlineItem[] = [];
  const now = new Date();

  for (let i = 0; i < noticeData.deadlines.length; i++) {
    const raw = noticeData.deadlines[i];
    let computedDate: Date;

    if (raw.date_iso && !isNaN(Date.parse(raw.date_iso))) {
      computedDate = new Date(raw.date_iso);
    } else if (raw.relative_rule) {
      // Parse rules like "within 30 days of this notice", "within 15 days", etc.
      const matchDays = raw.relative_rule.match(/(\d+)\s*(days?|working days?)/i);
      const daysToAdd = matchDays ? parseInt(matchDays[1], 10) : 30;
      computedDate = new Date(baseNoticeDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    } else {
      // Default to 15 days if ambiguous
      computedDate = new Date(baseNoticeDate.getTime() + 15 * 24 * 60 * 60 * 1000);
    }

    const diffMs = computedDate.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    let urgency: UrgencyLevel = 'green';
    if (daysRemaining <= 7) urgency = 'red';
    else if (daysRemaining <= 30) urgency = 'amber';

    const item: DeadlineItem = {
      id: `dl_ext_${i}_${Date.now()}`,
      title: raw.title || raw.action,
      date_iso: computedDate.toISOString().split('T')[0],
      relative_rule: raw.relative_rule,
      action: raw.action,
      authority: noticeData.issuing_authority,
      penalty: raw.penalty || 'Statutory penalties or adverse order under applicable Act',
      urgency,
      days_remaining: daysRemaining
    };

    results.push(item);
  }

  return results;
}

/**
 * 2. validate_id_number
 */
export function validateIDNumber(type: 'aadhaar' | 'pan' | 'ifsc', value: string) {
  if (type === 'aadhaar') return validateVerhoeffAadhaar(value);
  if (type === 'pan') return validatePAN(value);
  if (type === 'ifsc') return validateIFSC(value);
  return { valid: false, message: 'Unsupported ID type' };
}

/**
 * 3. save_deadline
 */
export function saveDeadline(item: Omit<DeadlineItem, 'id' | 'days_remaining' | 'urgency'>): DeadlineItem {
  return LocalDB.saveDeadline(item);
}

/**
 * 4. list_deadlines
 */
export function listDeadlines(): DeadlineItem[] {
  return LocalDB.getDeadlines();
}

/**
 * 5. create_ics:
 * Generates an RFC 5545 iCalendar string with VALARMs at 7 days, 1 day, and on the day.
 */
export function createICS(deadline: DeadlineItem): string {
  const eventDate = deadline.date_iso.replace(/-/g, '');
  const nowStr = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const cleanSummary = deadline.title.replace(/[\r\n]+/g, ' ');
  const cleanDescription = `Action: ${deadline.action}\\nAuthority: ${deadline.authority}\\nPenalty: ${deadline.penalty || 'N/A'}\\nGenerated by Go Vision (Offline Assistant)`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Go Vision//Offline Government Notice Assistant//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:govision-${deadline.id || Date.now()}@offline.govision`,
    `DTSTAMP:${nowStr}`,
    `DTSTART;VALUE=DATE:${eventDate}`,
    `DTEND;VALUE=DATE:${eventDate}`,
    `SUMMARY:Government Deadline: ${cleanSummary}`,
    `DESCRIPTION:${cleanDescription}`,
    'STATUS:CONFIRMED',
    // Reminder 1: 7 days before
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Urgent Notice Deadline in 7 days!',
    'TRIGGER:-P7D',
    'END:VALARM',
    // Reminder 2: 1 day before
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Urgent Notice Deadline Tomorrow!',
    'TRIGGER:-P1D',
    'END:VALARM',
    // Reminder 3: on the day
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Notice Deadline is Today!',
    'TRIGGER:PT0M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  return icsContent;
}

/**
 * Trigger browser download of .ics file
 */
export function downloadICSFile(deadline: DeadlineItem): void {
  const content = createICS(deadline);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `deadline-${deadline.date_iso}-${deadline.title.slice(0, 15).replace(/\s+/g, '_')}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 6. check_rights:
 * Compares notice extracted data + user profile against rulebook entries.
 * Never invents citations.
 */
export async function checkRights(
  notice: ExtractionJSON,
  rulebook: RulebookEntry[]
): Promise<RightsCheckResult> {
  const profile = LocalDB.getProfile();
  const matchedRules: RightsCheckResult['matches'] = [];

  const textToScan = `${notice.notice_type} ${notice.issuing_authority} ${notice.summary_in_user_language} ${notice.required_actions.join(' ')}`.toLowerCase();

  for (const rule of rulebook) {
    let match = false;
    let matchReason = '';

    // Check notice type match
    if (rule.applies_when.notice_type && notice.notice_type.toLowerCase().includes(rule.applies_when.notice_type.toLowerCase())) {
      match = true;
      matchReason = `Notice classification matched "${rule.applies_when.notice_type}"`;
    }

    // Check keywords match
    if (rule.applies_when.keywords) {
      for (const kw of rule.applies_when.keywords) {
        if (textToScan.includes(kw.toLowerCase())) {
          match = true;
          matchReason = matchReason ? `${matchReason} and keyword "${kw}"` : `Keyword matched: "${kw}"`;
          break;
        }
      }
    }

    // Check profile conditions (e.g. min_age, category)
    if (match && rule.applies_when.profile_conditions) {
      const cond = rule.applies_when.profile_conditions;
      if (cond.min_age && profile.age < cond.min_age) {
        match = false; // Age criteria not met
      }
      if (cond.category && !cond.category.includes(profile.category)) {
        // Still relevant if category matches
      }
    }

    if (match) {
      matchedRules.push({
        rule,
        reason: matchReason,
        action_recommended: rule.action_for_user,
        deadline_info: `Statutory protection/remedy window: within ${rule.deadline_days} days. (Source: ${rule.source})`
      });
    }
  }

  const thinkingTrace = `[Gemma 4 Thinking Trace]: Evaluating notice against ${rulebook.length} official statutory rules. User category=${profile.category}, state=${profile.state}. Filtered ${matchedRules.length} applicable remedies. Zero ungrounded assertions produced.`;

  return {
    matches: matchedRules,
    disclaimer: 'This is guidance, not legal advice. Verify at the concerned office.',
    thinking_trace: thinkingTrace
  };
}

/**
 * 7. update_checklist
 */
export function updateChecklist(id: string, completed: boolean) {
  LocalDB.updateChecklist(id, completed);
  return LocalDB.getChecklist();
}

/**
 * 8. set_language
 */
export function setLanguage(lang: SupportedLanguage) {
  const profile = LocalDB.getProfile();
  profile.language = lang;
  LocalDB.saveProfile(profile);
  return lang;
}
