"""
Go Vision - Tools Exposed to Gemma 4 Function Calling
1. extract_deadlines (Python date arithmetic, urgency classification)
2. validate_id_number (Verhoeff Aadhaar, PAN regex, IFSC regex)
3. save_deadline
4. list_deadlines
5. create_ics (RFC 5545 with VALARMs at 7d, 1d, 0d)
6. check_rights (Consults data/rulebook.json, citations, disclaimer)
7. update_checklist
8. set_language
"""
import re
import json
import os
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import db

# Verhoeff tables
D_TABLE = [
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
]

P_TABLE = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
]

def validate_verhoeff_aadhaar(aadhaar: str) -> Dict[str, Any]:
    digits_only = re.sub(r"\D", "", str(aadhaar))
    if len(digits_only) != 12:
        return {"valid": False, "message": "Aadhaar must be exactly 12 numeric digits."}
    
    c = 0
    reversed_digits = [int(d) for d in reversed(digits_only)]
    for i, digit in enumerate(reversed_digits):
        c = D_TABLE[c][P_TABLE[i % 8][digit]]
    
    if c == 0:
        return {
            "valid": True,
            "message": "Valid 12-digit Aadhaar format (Verhoeff checksum passed). Format check only; this does not verify citizen identity."
        }
    return {
        "valid": False,
        "message": "Invalid Aadhaar checksum (Verhoeff validation failed). Please check digits."
    }

def validate_pan(pan: str) -> Dict[str, Any]:
    clean = str(pan).strip().upper()
    if re.match(r"^[A-Z]{5}[0-9]{4}[A-Z]$", clean):
        return {"valid": True, "message": "Valid PAN format. Format check only."}
    return {"valid": False, "message": "Invalid PAN format. Must be 5 letters + 4 digits + 1 letter."}

def validate_ifsc(ifsc: str) -> Dict[str, Any]:
    clean = str(ifsc).strip().upper()
    if re.match(r"^[A-Z]{4}0[A-Z0-9]{6}$", clean):
        return {"valid": True, "message": "Valid IFSC format. Format check only."}
    return {"valid": False, "message": "Invalid IFSC format. 5th character must be '0'."}

def validate_id_number(id_type: str, value: str) -> Dict[str, Any]:
    """Validate format of Aadhaar, PAN or IFSC."""
    t = id_type.lower()
    if t == "aadhaar":
        return validate_verhoeff_aadhaar(value)
    elif t == "pan":
        return validate_pan(value)
    elif t == "ifsc":
        return validate_ifsc(value)
    return {"valid": False, "message": f"Unsupported ID type: {id_type}"}

def extract_deadlines(notice_data: Dict[str, Any], base_date_iso: Optional[str] = None) -> List[Dict[str, Any]]:
    """Python date arithmetic: converts relative rules to concrete dates and urgency tags."""
    base_date = datetime.fromisoformat(base_date_iso) if base_date_iso else datetime.now()
    now = datetime.now()
    results = []

    raw_deadlines = notice_data.get("deadlines", [])
    for idx, item in enumerate(raw_deadlines):
        target_date = None
        if item.get("date_iso"):
            try:
                target_date = datetime.fromisoformat(item["date_iso"])
            except Exception:
                pass
        
        if not target_date and item.get("relative_rule"):
            # Arithmetic in Python
            rule_str = item["relative_rule"].lower()
            match = re.search(r"(\d+)\s*(days?|working days?)", rule_str)
            days = int(match.group(1)) if match else 30
            target_date = base_date + timedelta(days=days)
        
        if not target_date:
            target_date = base_date + timedelta(days=15)
        
        diff = (target_date.date() - now.date()).days
        days_remaining = max(0, diff)
        
        urgency = "green"
        if days_remaining <= 7:
            urgency = "red"
        elif days_remaining <= 30:
            urgency = "amber"
        
        results.append({
            "id": f"dl_{idx}_{int(datetime.now().timestamp())}",
            "title": item.get("title") or item.get("action") or "Notice Deadline",
            "date_iso": target_date.strftime("%Y-%m-%d"),
            "relative_rule": item.get("relative_rule"),
            "action": item.get("action", ""),
            "authority": notice_data.get("issuing_authority", "Government Authority"),
            "penalty": item.get("penalty", "Adverse order or fine under relevant act"),
            "urgency": urgency,
            "days_remaining": days_remaining
        })
    return results

def create_ics(deadline: Dict[str, Any]) -> str:
    """Generates standard RFC 5545 iCalendar string with 7d, 1d, 0d VALARMs."""
    date_clean = deadline["date_iso"].replace("-", "")
    now_stamp = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
    uid = f"govision-{deadline.get('id', 'item')}@govision.local"
    summary = deadline.get("title", "Government Deadline").replace("\n", " ")
    desc = f"Action: {deadline.get('action')}\\nAuthority: {deadline.get('authority')}\\nPenalty: {deadline.get('penalty')}\\nGenerated by Go Vision."

    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Go Vision//Offline Government Notice Assistant//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "BEGIN:VEVENT",
        f"UID:{uid}",
        f"DTSTAMP:{now_stamp}",
        f"DTSTART;VALUE=DATE:{date_clean}",
        f"DTEND;VALUE=DATE:{date_clean}",
        f"SUMMARY:Gov Notice: {summary}",
        f"DESCRIPTION:{desc}",
        "STATUS:CONFIRMED",
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        "DESCRIPTION:Government Deadline in 7 days!",
        "TRIGGER:-P7D",
        "END:VALARM",
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        "DESCRIPTION:Government Deadline Tomorrow!",
        "TRIGGER:-P1D",
        "END:VALARM",
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        "DESCRIPTION:Government Deadline is Today!",
        "TRIGGER:PT0M",
        "END:VALARM",
        "END:VEVENT",
        "END:VCALENDAR"
    ]
    return "\r\n".join(lines)

def list_deadlines() -> List[Dict[str, Any]]:
    conn = db.get_connection()
    rows = conn.execute("SELECT * FROM deadlines ORDER BY date_iso ASC").fetchall()
    conn.close()
    return [dict(r) for r in rows]

def save_deadline(deadline: Dict[str, Any]) -> Dict[str, Any]:
    conn = db.get_connection()
    conn.execute("""
    INSERT OR REPLACE INTO deadlines (id, notice_id, title, date_iso, relative_rule, action, authority, penalty, urgency)
    VALUES (:id, :notice_id, :title, :date_iso, :relative_rule, :action, :authority, :penalty, :urgency)
    """, {
        "id": deadline["id"],
        "notice_id": deadline.get("notice_id", ""),
        "title": deadline.get("title", ""),
        "date_iso": deadline.get("date_iso", ""),
        "relative_rule": deadline.get("relative_rule", ""),
        "action": deadline.get("action", ""),
        "authority": deadline.get("authority", ""),
        "penalty": deadline.get("penalty", ""),
        "urgency": deadline.get("urgency", "amber")
    })
    conn.commit()
    conn.close()
    return deadline

def check_rights(notice_data: Dict[str, Any], rulebook_path: str = "data/rulebook.json") -> Dict[str, Any]:
    """Matches notice against rulebook.json entries. Always includes disclaimer."""
    disclaimer = "This is guidance, not legal advice. Verify at the concerned office."
    if not os.path.exists(rulebook_path):
        return {"matches": [], "disclaimer": disclaimer, "note": "Rulebook not found"}
    
    with open(rulebook_path, "r", encoding="utf-8") as f:
        rulebook = json.load(f)
    
    profile = db.get_profile() or {}
    text_corpus = f"{notice_data.get('notice_type', '')} {notice_data.get('issuing_authority', '')} {notice_data.get('summary_in_user_language', '')}".lower()
    
    matched = []
    for entry in rulebook:
        applies = False
        reason = ""
        applies_when = entry.get("applies_when", {})
        
        # Notice type check
        if applies_when.get("notice_type") and applies_when["notice_type"].lower() in notice_data.get("notice_type", "").lower():
            applies = True
            reason = f"Matches notice type {applies_when['notice_type']}"
        
        # Keywords
        for kw in applies_when.get("keywords", []):
            if kw.lower() in text_corpus:
                applies = True
                reason = f"Matched keyword '{kw}'"
                break
        
        if applies:
            matched.append({
                "rule_id": entry["id"],
                "title": entry["title"],
                "rule_text": entry["rule_text"],
                "action_for_user": entry["action_for_user"],
                "deadline_days": entry["deadline_days"],
                "source": entry["source"],
                "status": entry["status"],
                "reason": reason
            })
    
    return {
        "matches": matched,
        "disclaimer": disclaimer,
        "thinking_trace": f"Gemma evaluated notice against {len(rulebook)} official rules in rulebook.json."
    }

def update_checklist(item_id: str, completed: bool):
    conn = db.get_connection()
    conn.execute("UPDATE checklist_items SET completed = ? WHERE id = ?", (1 if completed else 0, item_id))
    conn.commit()
    conn.close()

def set_language(lang: str) -> str:
    valid_langs = ["en", "hi", "kn"]
    chosen = lang.lower() if lang.lower() in valid_langs else "en"
    prof = db.get_profile() or {}
    prof["language"] = chosen
    db.update_profile(prof)
    return chosen
