import { CitizenProfile, DeadlineItem, ExtractionJSON, ChecklistItem } from '../types';

const STORAGE_KEYS = {
  PROFILE: 'govision_profile',
  NOTICES: 'govision_notices',
  DEADLINES: 'govision_deadlines',
  CHECKLIST: 'govision_checklist',
  SETTINGS: 'govision_settings'
};

export function maskAadhaar(val: string): string {
  if (!val) return '';
  const digits = val.replace(/\D/g, '');
  if (digits.length < 4) return '••••';
  const last4 = digits.slice(-4);
  return `•••• •••• ${last4}`;
}

export function maskPAN(val: string): string {
  if (!val) return '';
  const clean = val.trim().toUpperCase();
  if (clean.length < 4) return '••••••';
  const last4 = clean.slice(-4);
  return `••••••${last4}`;
}

const DEFAULT_PROFILE: CitizenProfile = {
  name: 'Ramesh Kumar',
  language: 'en',
  state: 'Karnataka',
  age: 38,
  category: 'OBC',
  masked_aadhaar: '•••• •••• 6742',
  masked_pan: '••••••819K',
  consent: true
};

export const LocalDB = {
  getProfile(): CitizenProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('LocalDB getProfile fallback:', e);
    }
    return DEFAULT_PROFILE;
  },

  saveProfile(profile: CitizenProfile): boolean {
    if (!profile.consent) {
      // If consent is revoked, purge saved profile
      localStorage.removeItem(STORAGE_KEYS.PROFILE);
      return false;
    }
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
      return true;
    } catch (e) {
      console.error('Failed to save profile', e);
      return false;
    }
  },

  getConsent(): boolean {
    const p = this.getProfile();
    return !!p.consent;
  },

  setConsent(consent: boolean): void {
    const p = this.getProfile();
    p.consent = consent;
    if (consent) {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(p));
    } else {
      this.deleteAllData();
    }
  },

  getNotices(): Array<{ id: string; scanned_at: string; data: ExtractionJSON; image_preview?: string }> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTICES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveNotice(notice: ExtractionJSON, imagePreview?: string): string {
    if (!this.getConsent()) {
      return 'transitory-session-only';
    }
    const notices = this.getNotices();
    const id = 'notice_' + Date.now();
    notices.unshift({
      id,
      scanned_at: new Date().toISOString(),
      data: notice,
      image_preview: imagePreview ? imagePreview.slice(0, 50000) : undefined // Downscaled preview
    });
    localStorage.setItem(STORAGE_KEYS.NOTICES, JSON.stringify(notices.slice(0, 20))); // Keep last 20 notices
    return id;
  },

  getDeadlines(): DeadlineItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DEADLINES);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }
    // Default initial seeded deadlines if empty
    return [
      {
        id: 'dl-1',
        title: 'Submit Objection u/s 148A(b) Income Tax',
        date_iso: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        action: 'File response with bank statement via IT e-Filing Portal',
        authority: 'Assessment Unit, Income Tax Department',
        penalty: 'Penalty u/s 270A (50% to 200%) or ex-parte assessment',
        urgency: 'red',
        days_remaining: 4
      },
      {
        id: 'dl-2',
        title: 'SSP Scholarship Caste & RD Verification',
        date_iso: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        action: 'Re-upload valid revenue RD number at College Nodal Officer desk',
        authority: 'Social Welfare Department, Karnataka',
        penalty: 'Lapse of scholarship disbursement for AY 2026-27',
        urgency: 'amber',
        days_remaining: 18
      }
    ];
  },

  saveDeadline(item: Omit<DeadlineItem, 'id' | 'days_remaining' | 'urgency'>): DeadlineItem {
    const list = this.getDeadlines();
    const targetDate = new Date(item.date_iso);
    const now = new Date();
    const diffTime = targetDate.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    
    let urgency: 'red' | 'amber' | 'green' = 'green';
    if (daysRemaining <= 7) urgency = 'red';
    else if (daysRemaining <= 30) urgency = 'amber';

    const newItem: DeadlineItem = {
      ...item,
      id: 'dl_' + Date.now(),
      days_remaining: daysRemaining,
      urgency
    };

    if (this.getConsent()) {
      list.push(newItem);
      // Sort by days remaining ascending
      list.sort((a, b) => a.days_remaining - b.days_remaining);
      localStorage.setItem(STORAGE_KEYS.DEADLINES, JSON.stringify(list));
    }
    return newItem;
  },

  deleteDeadline(id: string): void {
    const list = this.getDeadlines().filter(d => d.id !== id);
    localStorage.setItem(STORAGE_KEYS.DEADLINES, JSON.stringify(list));
  },

  getChecklist(): ChecklistItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CHECKLIST);
      if (data) return JSON.parse(data);
    } catch {}
    return [
      { id: 'chk-1', task: 'Download bank statement for FY 2023-24', completed: true },
      { id: 'chk-2', task: 'Obtain Revenue RD Certificate copy from Tahsildar office', completed: false },
      { id: 'chk-3', task: 'Visit Fair Price Shop for biometric e-KYC authentication', completed: false }
    ];
  },

  updateChecklist(id: string, completed: boolean): void {
    const list = this.getChecklist().map(item => item.id === id ? { ...item, completed } : item);
    localStorage.setItem(STORAGE_KEYS.CHECKLIST, JSON.stringify(list));
  },

  addChecklistItem(task: string): ChecklistItem {
    const list = this.getChecklist();
    const newItem = { id: 'chk_' + Date.now(), task, completed: false };
    list.push(newItem);
    localStorage.setItem(STORAGE_KEYS.CHECKLIST, JSON.stringify(list));
    return newItem;
  },

  deleteAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
    localStorage.removeItem(STORAGE_KEYS.NOTICES);
    localStorage.removeItem(STORAGE_KEYS.DEADLINES);
    localStorage.removeItem(STORAGE_KEYS.CHECKLIST);
  }
};
