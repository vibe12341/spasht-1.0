# Go Vision — Offline Multilingual Government Notice Assistant

> **Core Model**: `google/gemma-4-E4B-it` (Open Weights, Multimodal Vision + Audio + Function Calling)  
> **Offline First**: Works 100% in Airplane Mode with local SQLite memory & PWA Service Worker.  
> **Languages**: English, हिन्दी (Hindi), ಕನ್ನಡ (Kannada)  
> **Stack**: Python 3.11 / FastAPI / SQLite / iCalendar (.ics) / PWA

---

## 🌟 Architecture & Features

1. **Gemma 4 Multimodal Vision**:
   - Reads notice photographs, official stamps, multilingual tables, and circular numbers directly without third-party OCR engines.
   - Extracts structured JSON strictly conforming to the data contract.
2. **Date Arithmetic & Timelines**:
   - Relative rules (e.g. *"within 30 days of this notice"*, *"within 15 days"*) are calculated in Python arithmetic, never hallucinated by the model.
   - Urgency tags:
     - 🔴 **Urgent (< 7 days)**
     - 🟡 **Pending (< 30 days)**
     - 🟢 **Scheduled (30+ days)**
3. **Calendar Reminders (.ics)**:
   - Exports RFC 5545 `.ics` files with `VALARM` triggers at 7 days, 1 day, and on the day of the deadline.
   - Zero proprietary APIs; directly imports into Google Calendar, Apple Calendar, or Outlook.
4. **Push-To-Talk Multimodal Voice Agent**:
   - Gemma 4 native function calling loop: Speech in -> Gemma identifies intent -> invokes tool -> executes -> short spoken reply returned.
   - Spoken audio replies (offline TTS switchable between `indic-parler-tts` and `espeak-ng`).
5. **Rulebook & Legal Rights Reasoning (Thinking Mode)**:
   - Gemma 4 thinking mode is engaged to reason against `data/rulebook.json`.
   - Discovers missing citizen benefits, cure periods, and grievance remedies citing exact Act sections and rule IDs.
   - Always displays: *"This is guidance, not legal advice. Verify at the concerned office."*
6. **Privacy & Offline Proof**:
   - Aadhaar & PAN numbers masked in UI and logs (e.g. `•••• •••• 6742`, `••••••819K`).
   - Verhoeff checksum algorithm for 12-digit Aadhaar format validation.
   - Explicit citizen consent before storing data in local SQLite database.
   - "Delete all my data" purges all local records.
   - `/health` endpoint and UI proof showing `Network Required: NO`.

---

## 🚀 Setup & Execution Guide

### 1. Standalone Python FastAPI Backend
```bash
# 1. Create and activate a Python 3.11 virtual environment
python3.11 -m venv venv
source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Download Gemma 4 E4B weights (One-time setup with internet)
# Either via Ollama:
# ollama pull gemma4:e4b
# Or via Hugging Face Transformers:
# python -c "from transformers import AutoProcessor, AutoModelForMultimodalLM; AutoProcessor.from_pretrained('google/gemma-4-E4B-it'); AutoModelForMultimodalLM.from_pretrained('google/gemma-4-E4B-it')"

# 4. Start the FastAPI offline server
python main.py
# Or: uvicorn main:app --host 0.0.0.0 --port 8000
```

### 2. Frontend PWA Web Interface
```bash
# Install node dependencies
npm install

# Run development server (accessible at http://localhost:3000)
npm run dev

# Or build static production bundle
npm run build
```

---

## ⏱️ 3-Minute Demo Script

| Minute | Step | Action | Expected Output |
|---|---|---|---|
| **0:00 - 0:45** | **1. Scan Notice** | Click **"2. SSP Karnataka Scholarship"** sample notice (or snap a photo with Camera). | Gemma 4 vision processes the Kannada + English notice, extracts RD discrepancy, sets 15-day timeline, displays amount eligible (Rs. 18,500), and shows required documents. |
| **0:45 - 1:15** | **2. Switch Language to Kannada** | Click the **"ಕನ್ನಡ"** language button in top bar. | UI strings, document summary, and action checklist switch immediately to clean, fluent Kannada. Click audio speaker icon to hear the spoken explanation. |
| **1:15 - 1:45** | **3. Push-to-Talk Voice Agent in Hindi** | Switch to **"हिन्दी"**, open the **Voice Agent** tab, press and hold **"Hold To Talk"** and say: *"मेरी अंतिम तिथि कब है?"* (When is my deadline?) | Gemma 4 identifies intent, executes `list_deadlines()`, and returns spoken audio: *"आपकी सबसे नजदीकी अंतिम तिथि 16-10-2026 है... 12 दिन शेष हैं।"* |
| **1:45 - 2:15** | **4. Export Calendar Reminder (.ics)** | Click **"Add to Calendar (.ics)"**. | An RFC 5545 `.ics` file is instantly generated with alarms at -7 days, -1 day, and on the day. Open the downloaded file to see it load into Google Calendar without any API setup. |
| **2:15 - 2:45** | **5. Legal Rights Check (Thinking Mode)** | Click **"Check My Legal Rights"**. | Gemma 4 enters Thinking Mode, reviews `data/rulebook.json`, and highlights `RULE-SCHOLARSHIP-SSP`: the statutory right under the Karnataka Citizen Charter to cure revenue RD certificate discrepancies within 15 days before any scholarship can be cancelled. |
| **2:45 - 3:00** | **6. Airplane Mode Test** | Disconnect Wi-Fi / enable Airplane mode on your device. Refresh the page. | The PWA service worker and local SQLite memory continue to function seamlessly. The green badge displays: **"Airplane Mode Active — 100% Offline with Gemma 4 & Local SQLite"**. |

---

## 🛠️ Tools Exposed to Gemma 4 Function Calling

1. `extract_deadlines`: Evaluates relative date expressions and assigns red/amber/green urgency levels via code arithmetic.
2. `validate_id_number`: Runs the Verhoeff checksum algorithm on 12-digit Aadhaar, PAN regex, and IFSC regex. (Strict format verification; never claims identity validation).
3. `save_deadline`: Persists structured deadline into local SQLite database if user consent is active.
4. `list_deadlines`: Returns upcoming deadlines ordered by urgency.
5. `create_ics`: Produces standard iCalendar string with 3-tier notification alarms (`VALARM`).
6. `check_rights`: Matches notice type, keywords, and citizen profile against `data/rulebook.json`.
7. `update_checklist`: Marks required citizen document tasks as completed.
8. `set_language`: Switches active language between `en`, `hi`, and `kn`.

---

## ⚠️ Known Limitations

1. **Local Hardware Constraints**: Running multimodal Gemma 4 E4B locally requires at least 8 GB unified memory on Apple Silicon or 12 GB RAM with modern CPU/GPU for real-time audio/vision latency.
2. **Audio Utterance Length**: Gemma 4 multimodal audio window accepts single utterances up to 30 seconds; longer audio recordings should be split across calls.
3. **Rulebook Scope**: `data/rulebook.json` entries are verified against current state and central acts, but users must always confirm with the local tehsildar or nodal office (statutory disclaimer enforced).
4. **Identity Verification**: Aadhaar Verhoeff validation checks mathematical checksum and structure only; actual biometric authentication requires official UIDAI authorization.
