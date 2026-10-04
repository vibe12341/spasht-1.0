// Go Vision Static Frontend Script
let currentLang = 'en';
let activeData = null;

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/static/sw.js').catch(console.warn);
}

function setAppLang(lang) {
  currentLang = lang;
  fetch(`/static/i18n/${lang}.json`)
    .then(r => r.json())
    .then(strings => {
      document.getElementById('header-title').innerText = strings.app_title;
    });
}

function simulateScan(sampleId) {
  const container = document.getElementById('result-container');
  container.classList.remove('hidden');
  
  if (sampleId === 'sample-tax-148a') {
    activeData = {
      authority: "Income Tax Department, Assessment Unit, New Delhi",
      summary: currentLang === 'kn' ? "ಆದಾಯ ತೆರಿಗೆ ಕಾಯ್ದೆ 148A(b) ನೋಟಿಸ್: ರೂ. 42.5 ಲಕ್ಷ ವಹಿವಾಟಿಗೆ 12-ಅಕ್ಟೋಬರ್-2026 ರೊಳಗೆ ಉತ್ತರ ನೀಡಿ." : currentLang === 'hi' ? "आयकर धारा 148A(b) नोटिस: रु 42.5 लाख लेनदेन पर 12-अक्टूबर-2026 तक ई-फाइलिंग आपत्ति दर्ज करें।" : "Income Tax Sec 148A(b) Notice: Explain transactions of Rs. 42.5 Lakh before 12-Oct-2026.",
      deadline: "2026-10-12 (Urgent: 8 days remaining)",
      action: "Submit objection with bank statements on incometax.gov.in"
    };
  } else if (sampleId === 'sample-scholarship-ssp') {
    activeData = {
      authority: "Social Welfare Department, Karnataka (SSP)",
      summary: currentLang === 'kn' ? "ಮೆಟ್ರಿಕ್ ನಂತರದ ವಿದ್ಯಾರ್ಥಿವೇತನ: ಜಾತಿ/ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ RD ಸಂಖ್ಯೆ ತಿದ್ದುಪಡಿ ಮಾಡಿ." : "SSP Scholarship: Rectify RD number discrepancy within 15 days.",
      deadline: "2026-10-16 (15 days remaining)",
      action: "Update RD number on SSP portal and obtain Nodal Officer sign-off"
    };
  } else {
    activeData = {
      authority: "Department of Food & Civil Supplies (NFSA)",
      summary: currentLang === 'hi' ? "राशन कार्ड अनिवार्य बायोमेट्रिक ई-केवाईसी: 25-अक्टूबर तक कोटेदार के यहां फिंगरप्रिंट लगाएं।" : "Mandatory Ration Card biometric e-KYC before 25-Oct-2026.",
      deadline: "2026-10-25 (24 days remaining)",
      action: "Visit Fair Price Shop for e-PoS fingerprint authentication"
    };
  }

  document.getElementById('res-authority').innerText = activeData.authority;
  document.getElementById('res-summary').innerText = activeData.summary;
  document.getElementById('res-deadline').innerText = "Deadline: " + activeData.deadline;
  document.getElementById('res-action').innerText = "Action: " + activeData.action;
}

function downloadActiveICS() {
  if (!activeData) return;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Go Vision//Offline Government Notice//EN",
    "BEGIN:VEVENT",
    `SUMMARY:Government Notice Deadline`,
    `DESCRIPTION:${activeData.action}`,
    "BEGIN:VALARM",
    "TRIGGER:-P7D",
    "ACTION:DISPLAY",
    "DESCRIPTION:Notice deadline in 7 days!",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");

  const blob = new Blob([lines], { type: "text/calendar" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "govision-deadline.ics";
  a.click();
}
