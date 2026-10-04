"""
Go Vision - SQLite Memory Layer (Offline Local Only)
Tables: profile, notices, deadlines, checklist_items
Explicit consent required before persistence.
Aadhaar & PAN are masked in logs and UI except last 4 characters.
"""
import sqlite3
import os
import re
from typing import Optional, Dict, Any, List

DB_PATH = os.path.join(os.path.dirname(__file__), "govision.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    # 1. Profile table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS profile (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        name TEXT,
        language TEXT DEFAULT 'en',
        state TEXT DEFAULT 'Karnataka',
        age INTEGER DEFAULT 35,
        category TEXT DEFAULT 'General',
        masked_aadhaar TEXT,
        masked_pan TEXT,
        consent INTEGER DEFAULT 0
    )
    """)
    
    # 2. Notices table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS notices (
        id TEXT PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notice_type TEXT,
        issuing_authority TEXT,
        reference_no TEXT,
        summary TEXT,
        raw_json TEXT
    )
    """)
    
    # 3. Deadlines table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS deadlines (
        id TEXT PRIMARY KEY,
        notice_id TEXT,
        title TEXT,
        date_iso TEXT,
        relative_rule TEXT,
        action TEXT,
        authority TEXT,
        penalty TEXT,
        urgency TEXT,
        FOREIGN KEY(notice_id) REFERENCES notices(id) ON DELETE CASCADE
    )
    """)
    
    # 4. Checklist items
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS checklist_items (
        id TEXT PRIMARY KEY,
        notice_id TEXT,
        task TEXT,
        completed INTEGER DEFAULT 0
    )
    """)
    
    conn.commit()
    conn.close()

def mask_aadhaar(val: str) -> str:
    if not val:
        return ""
    digits = re.sub(r"\D", "", str(val))
    if len(digits) < 4:
        return "••••"
    return f"•••• •••• {digits[-4:]}"

def mask_pan(val: str) -> str:
    if not val:
        return ""
    clean = str(val).strip().upper()
    if len(clean) < 4:
        return "••••••"
    return f"••••••{clean[-4:]}"

def get_profile() -> Optional[Dict[str, Any]]:
    conn = get_connection()
    row = conn.execute("SELECT * FROM profile WHERE id = 1").fetchone()
    conn.close()
    if row:
        return dict(row)
    return {
        "id": 1,
        "name": "Citizen",
        "language": "en",
        "state": "Karnataka",
        "age": 35,
        "category": "General",
        "masked_aadhaar": "•••• •••• 1234",
        "masked_pan": "••••••567A",
        "consent": 1
    }

def update_profile(data: Dict[str, Any]) -> bool:
    consent = 1 if data.get("consent") else 0
    if not consent:
        delete_all_data()
        return False
    
    conn = get_connection()
    masked_aadhaar = mask_aadhaar(data.get("aadhaar", "")) if "aadhaar" in data else data.get("masked_aadhaar", "")
    masked_pan = mask_pan(data.get("pan", "")) if "pan" in data else data.get("masked_pan", "")
    
    conn.execute("""
    INSERT INTO profile (id, name, language, state, age, category, masked_aadhaar, masked_pan, consent)
    VALUES (1, :name, :language, :state, :age, :category, :masked_aadhaar, :masked_pan, :consent)
    ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        language = excluded.language,
        state = excluded.state,
        age = excluded.age,
        category = excluded.category,
        masked_aadhaar = excluded.masked_aadhaar,
        masked_pan = excluded.masked_pan,
        consent = excluded.consent
    """, {
        "name": data.get("name", "Citizen"),
        "language": data.get("language", "en"),
        "state": data.get("state", "Karnataka"),
        "age": data.get("age", 35),
        "category": data.get("category", "General"),
        "masked_aadhaar": masked_aadhaar,
        "masked_pan": masked_pan,
        "consent": consent
    })
    conn.commit()
    conn.close()
    return True

def delete_all_data():
    conn = get_connection()
    conn.execute("DELETE FROM checklist_items")
    conn.execute("DELETE FROM deadlines")
    conn.execute("DELETE FROM notices")
    conn.execute("DELETE FROM profile")
    conn.commit()
    conn.close()

# Initialize tables on import
init_db()
