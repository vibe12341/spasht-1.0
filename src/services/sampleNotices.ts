import { ExtractionJSON } from '../types';

export interface SampleNotice {
  id: string;
  name: string;
  title: string;
  category: string;
  department: string;
  reference_no: string;
  language_primary: 'en' | 'hi' | 'kn';
  thumbnail_accent: string;
  document_text: string;
  official_header_en: string;
  official_header_vernacular: string;
  extracted_data: Record<'en' | 'hi' | 'kn', ExtractionJSON>;
}

export const SAMPLE_NOTICES: SampleNotice[] = [
  {
    id: 'sample-tax-148a',
    name: 'Income Tax Notice u/s 148A(b)',
    title: 'Show Cause Notice for Escaped Assessment u/s 148A(b)',
    category: 'Taxation & Assessment',
    department: 'Income Tax Department, Ministry of Finance, Govt of India',
    reference_no: 'ITD/ACIT/2026-27/148A/892109',
    language_primary: 'en',
    thumbnail_accent: 'border-rose-500 bg-rose-950/20 text-rose-400',
    official_header_en: 'GOVERNMENT OF INDIA • MINISTRY OF FINANCE • INCOME TAX DEPARTMENT',
    official_header_vernacular: 'भारत सरकार • वित्त मंत्रालय • आयकर विभाग',
    document_text: `GOVERNMENT OF INDIA
INCOME TAX DEPARTMENT
OFFICE OF THE ASSESSING OFFICER, ASSESSMENT UNIT, NEW DELHI
Notice under clause (b) of Section 148A of the Income-tax Act, 1961

Date of Issue: 28-Sep-2026
Notice DIN & Notice No: ITBA/AST/S/148A/2026-27/1069824122(1)
PAN: ••••••819K | Assessment Year: 2023-24

To:
Shri Ramesh Kumar,
Bengaluru, Karnataka - 560001

Subject: Show Cause Notice under Section 148A(b) of the Income-tax Act, 1961 - reg.

1. Information available with this office reveals that you have entered into high-value transactions amounting to Rs. 42,50,000/- (Rupees Forty-Two Lakhs Fifty Thousand only) during the Financial Year 2022-23 (AY 2023-24) which appear to have escaped assessment.
2. In accordance with Section 148A(b), you are hereby required to show cause why a notice under Section 148 should not be issued in your case.
3. You are required to submit your explanation along with supporting documentary evidence through your e-filing account on or before 12-Oct-2026.
4. Failure to furnish explanation within the stipulated time shall result in ex-parte proceedings under Section 144 and penalty proceedings under Section 270A/271AAC.

Issued by:
Deputy Commissioner of Income Tax, Assessment Unit - 4(1), New Delhi.`,
    extracted_data: {
      en: {
        notice_type: "income_tax_notice",
        issuing_authority: "Assessment Unit, Income Tax Department, Govt of India",
        notice_reference_no: "ITBA/AST/S/148A/2026-27/1069824122(1)",
        summary_in_user_language: "This is a statutory Show Cause Notice under Section 148A(b) regarding unexplained financial transactions of Rs. 42,50,000 in FY 2022-23. You are given an opportunity to explain before any adverse tax reassessment is opened.",
        required_actions: [
          "Login to the Income Tax e-filing portal (incometax.gov.in)",
          "Upload written submission explaining the source of transaction funds",
          "Attach stamped bank account statement and relevant property/sale deeds",
          "Submit response before the statutory 14-day reply window expires"
        ],
        documents_needed: [
          "Bank statements for FY 2022-23 showing transaction trail",
          "ITR acknowledgement copy for AY 2023-24",
          "Source of funds explanation letter"
        ],
        deadlines: [
          {
            title: "Submit Written Objection u/s 148A(b)",
            date_iso: "2026-10-12",
            action: "Upload response on Income Tax e-filing portal",
            penalty: "Issuance of Sec 148 reassessment notice and penalty proceedings u/s 270A",
            urgency: "red"
          }
        ],
        amount_due: "Rs. 42,50,000 (Transaction under inquiry)",
        contact: "e-filing Helpdesk: 1800-103-0025 / efilingwebmanager@incometax.gov.in",
        confidence: 0.98,
        unclear_fields: []
      },
      hi: {
        notice_type: "income_tax_notice",
        issuing_authority: "मूल्यांकन इकाई, आयकर विभाग, भारत सरकार",
        notice_reference_no: "ITBA/AST/S/148A/2026-27/1069824122(1)",
        summary_in_user_language: "यह आयकर अधिनियम की धारा 148A(b) के तहत कारण बताओ नोटिस है। वित्तीय वर्ष 2022-23 में 42,50,000 रुपये के लेनदेन के संबंध में स्पष्टीकरण मांगा गया है। आपको कर पुनर्मूल्यांकन से पहले अपना पक्ष रखने का वैधानिक अवसर दिया गया है।",
        required_actions: [
          "आयकर ई-फाइलिंग पोर्टल (incometax.gov.in) पर लॉगिन करें",
          "लेनदेन की धनराशि के स्रोत को स्पष्ट करते हुए लिखित आपत्ति दर्ज करें",
          "बैंक खाता विवरण व प्रासंगिक दस्तावेज अपलोड करें",
          "अंतिम तिथि से पहले अनिवार्य रूप से उत्तर प्रेषित करें"
        ],
        documents_needed: [
          "वित्तीय वर्ष 2022-23 का प्रमाणित बैंक स्टेटमेंट",
          "निर्धारण वर्ष 2023-24 की ITR पावती",
          "धनराशि स्रोत का शपथपत्र / व्याख्या पत्र"
        ],
        deadlines: [
          {
            title: "धारा 148A(b) के तहत ई-फाइलिंग आपत्ति दर्ज करें",
            date_iso: "2026-10-12",
            action: "आयकर ई-फाइलिंग पोर्टल पर जवाब अपलोड करें",
            penalty: "धारा 148 के तहत एकतरफा कर आदेश व धारा 270A के तहत भारी जुर्माना",
            urgency: "red"
          }
        ],
        amount_due: "रु 42,50,000 (जांच के अधीन लेनदेन)",
        contact: "हेल्पडेस्क: 1800-103-0025",
        confidence: 0.98,
        unclear_fields: []
      },
      kn: {
        notice_type: "income_tax_notice",
        issuing_authority: "ಮೌಲ್ಯಮಾಪನ ಘಟಕ, ಆದಾಯ ತೆರಿಗೆ ಇಲಾಖೆ, ಭಾರತ ಸರ್ಕಾರ",
        notice_reference_no: "ITBA/AST/S/148A/2026-27/1069824122(1)",
        summary_in_user_language: "ಇದು ಆದಾಯ ತೆರಿಗೆ ಕಾಯ್ದೆ 148A(b) ಅಡಿಯಲ್ಲಿ ಹೊರಡಿಸಲಾದ ಕಾರಣ ಕೇಳುವ ನೋಟಿಸ್ ಆಗಿದೆ. 2022-23 ರ ಆರ್ಥಿಕ ವರ್ಷದಲ್ಲಿ ರೂ. 42,50,000 ವಹಿವಾಟಿಗೆ ಸಂಬಂಧಿಸಿದಂತೆ ವಿವರಣೆ ಕೇಳಲಾಗಿದೆ. ಯಾವುದೇ ತೆರಿಗೆ ಮರುಪರಿಶೀಲನೆ ಪ್ರಾರಂಭಿಸುವ ಮೊದಲು ನಿಮ್ಮ ಸಮಜಾಯಿಷಿ ನೀಡಲು ಅವಕಾಶ ನೀಡಲಾಗಿದೆ.",
        required_actions: [
          "ಆದಾಯ ತೆರಿಗೆ ಇ-ಫೈಲಿಂಗ್ ಪೋರ್ಟಲ್ (incometax.gov.in) ಲಾಗಿನ್ ಮಾಡಿ",
          "ಹಣದ ಮೂಲವನ್ನು ವಿವರಿಸಿ ಲಿಖಿತ ಆಕ್ಷೇಪಣೆ ಸಲ್ಲಿಸಿ",
          "ಬ್ಯಾಂಕ್ ಸ್ಟೇಟ್‌ಮೆಂಟ್ ಮತ್ತು ಪೂರಕ ದಾಖಲೆಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",
          "ನಿಗದಿತ ಗಡುವಿನೊಳಗೆ ಉತ್ತರಿಸಿ"
        ],
        documents_needed: [
          "2022-23 ರ ಆರ್ಥಿಕ ವರ್ಷದ ಅಧಿಕೃತ ಬ್ಯಾಂಕ್ ಸ್ಟೇಟ್‌ಮೆಂಟ್",
          "2023-24 ರ ITR ಸ್ವೀಕೃತಿ ಪ್ರತಿ",
          "ಹಣಕಾಸಿನ ಮೂಲ ವಿವರಣೆ ಪತ್ರ"
        ],
        deadlines: [
          {
            title: "ಸೆಕ್ಷನ್ 148A(b) ಲಿಖಿತ ಆಕ್ಷೇಪಣೆ ಸಲ್ಲಿಕೆ",
            date_iso: "2026-10-12",
            action: "ಇ-ಫೈಲಿಂಗ್ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಉತ್ತರ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",
            penalty: "ಸೆಕ್ಷನ್ 148 ಅಡಿಯಲ್ಲಿ ಮರುಮೌಲ್ಯಮಾಪನ ಮತ್ತು ದಂಡ",
            urgency: "red"
          }
        ],
        amount_due: "ರೂ. 42,50,000 (ತನಿಖೆಯಲ್ಲಿರುವ ವಹಿವಾಟು)",
        contact: "ಸಹಾಯವಾಣಿ: 1800-103-0025",
        confidence: 0.98,
        unclear_fields: []
      }
    }
  },
  {
    id: 'sample-scholarship-ssp',
    name: 'SSP Karnataka Scholarship Discrepancy',
    title: 'State Scholarship Portal (SSP) - Post-Matric Document Verification Notice',
    category: 'Education & Social Welfare',
    department: 'Social Welfare Department, Government of Karnataka',
    reference_no: 'SSP/POST-MATRIC/2026-27/RD-VERIF/4401',
    language_primary: 'kn',
    thumbnail_accent: 'border-amber-500 bg-amber-950/20 text-amber-400',
    official_header_en: 'GOVERNMENT OF KARNATAKA • SOCIAL WELFARE DEPARTMENT',
    official_header_vernacular: 'ಕರ್ನಾಟಕ ಸರ್ಕಾರ • ಸಮಾಜ ಕಲ್ಯಾಣ ಇಲಾಖೆ • ರಾಜ್ಯ ವಿದ್ಯಾರ್ಥಿವೇತನ ತಂತ್ರಾಂಶ',
    document_text: `ಕರ್ನಾಟಕ ಸರ್ಕಾರ
ಸಮಾಜ ಕಲ್ಯಾಣ ಇಲಾಖೆ - ರಾಜ್ಯ ವಿದ್ಯಾರ್ಥಿವೇತನ ತಂತ್ರಾಂಶ (SSP)
ದಿನಾಂಕ: 01-10-2026
ಅರ್ಜಿ ಸಂಖ್ಯೆ (SSP ID): 20260481921 | ವಿದ್ಯಾರ್ಥಿ ಹೆಸರು: ರಮೇಶ್ ಕುಮಾರ್ (Ramesh Kumar)

ವಿಷಯ: 2026-27 ನೇ ಸಾಲಿನ ಮೆಟ್ರಿಕ್ ನಂತರದ ವಿದ್ಯಾರ್ಥಿವೇತನ ಅರ್ಜಿಯಲ್ಲಿನ ಲೋಪದೋಷಗಳ ಸರಿಪಡಿಸುವಿಕೆ ಬಗ್ಗೆ.

ನಿಮ್ಮ SSP ವಿದ್ಯಾರ್ಥಿವೇತನ ಅರ್ಜಿಯನ್ನು ಪರಿಶೀಲಿಸಲಾಗಿದ್ದು, ಈ ಕೆಳಗಿನ ಲೋಪಗಳು ಕಂಡುಬಂದಿವೆ:
1. ಜಾತಿ ಮತ್ತು ಆದಾಯ ಪ್ರಮಾಣಪತ್ರದ RD ಸಂಖ್ಯೆ ಕಂದಾಯ ಇಲಾಖೆಯ (Atalji Janasnehi Kendra) ದತ್ತಾಂಶದೊಂದಿಗೆ ಹೊಂದಿಕೆಯಾಗುತ್ತಿಲ್ಲ.
2. ಇ-ದೃಢೀಕರಣ (e-Attestation) ಕಾಲೇಜು ನೋಡಲ್ ಅಧಿಕಾರಿಯಿಂದ ಬಾಕಿ ಇರುತ್ತದೆ.

ಸೂಚನೆ:
ಮೇಲ್ಕಂಡ ಲೋಪಗಳನ್ನು ಸರಿಪಡಿಸಲು ಈ ಪತ್ರ ತಲುಪಿದ 15 ದಿನಗಳ ಒಳಗಾಗಿ (ಅಂದರೆ 16-10-2026 ರೊಳಗೆ) ಸರಿಯಾದ RD ಸಂಖ್ಯೆಯನ್ನು ತಂತ್ರಾಂಶದಲ್ಲಿ ನಮೂದಿಸಿ ಕಾಲೇಜು ನೋಡಲ್ ಅಧಿಕಾರಿಯಿಂದ ದೃಢೀಕರಿಸಿಕೊಳ್ಳಬೇಕು. ತಪ್ಪಿದಲ್ಲಿ ವಿದ್ಯಾರ್ಥಿವೇತನ ಅರ್ಜಿಯನ್ನು ರದ್ದುಪಡಿಸಲಾಗುವುದು.

ಕಾಲೇಜು ನೋಡಲ್ ಅಧಿಕಾರಿ / ತಾಲ್ಲೂಕು ಸಮಾಜ ಕಲ್ಯಾಣಾಧಿಕಾರಿ, ಬೆಂಗಳೂರು ದಕ್ಷಿಣ.`,
    extracted_data: {
      en: {
        notice_type: "scholarship_letter",
        issuing_authority: "Social Welfare Department, Government of Karnataka (SSP)",
        notice_reference_no: "SSP/POST-MATRIC/2026-27/RD-VERIF/4401",
        summary_in_user_language: "Your Post-Matric Scholarship application for 2026-27 has discrepancies: Caste/Income certificate RD number mismatch with Revenue department records and pending college e-Attestation. You must rectify within 15 days to avoid cancellation.",
        required_actions: [
          "Login to SSP portal (ssp.postmatric.karnataka.gov.in)",
          "Enter valid 15-digit Revenue Department RD number (RD...)",
          "Submit application for college e-Attestation to Nodal Officer",
          "Ensure bank account is Aadhaar seeded (NPCI mapper active)"
        ],
        documents_needed: [
          "Valid Caste & Income Certificate with active RD number",
          "College Fee Receipt & Bonafide Certificate",
          "Aadhaar linked Bank Passbook"
        ],
        deadlines: [
          {
            title: "Cure SSP Caste/Income RD Discrepancy",
            date_iso: "2026-10-16",
            relative_rule: "within 15 days of this notice",
            action: "Update RD number on SSP portal and obtain Nodal Officer sign-off",
            penalty: "Rejection of scholarship grant of Rs. 18,500 for AY 2026-27",
            urgency: "amber"
          }
        ],
        amount_due: "Nil (Eligible Grant: Rs. 18,500)",
        contact: "SSP Helpline: 1902 / 080-35254757 / postmatrichelp@karnataka.gov.in",
        confidence: 0.99,
        unclear_fields: []
      },
      hi: {
        notice_type: "scholarship_letter",
        issuing_authority: "समाज कल्याण विभाग, कर्नाटक सरकार (SSP)",
        notice_reference_no: "SSP/POST-MATRIC/2026-27/RD-VERIF/4401",
        summary_in_user_language: "वर्ष 2026-27 की पोस्ट-मैट्रिक छात्रवृत्ति अर्जी में जाति/आय प्रमाण पत्र का RD नंबर राजस्व रिकॉर्ड से मेल नहीं खा रहा है और कॉलेज ई-सत्यापन लंबित है। छात्रवृत्ति रद्द होने से बचाने हेतु 15 दिनों में सुधार अनिवार्य है।",
        required_actions: [
          "SSP पोर्टल (ssp.postmatric.karnataka.gov.in) पर लॉगिन करें",
          "राजस्व विभाग का वैध RD नंबर दर्ज करें",
          "कॉलेज नोडल अधिकारी से ई-सत्यापन करवाएं",
          "बैंक खाते को आधार व NPCI से लिंक रखें"
        ],
        documents_needed: [
          "वैध जाति व आय प्रमाण पत्र (RD नंबर सहित)",
          "कॉलेज शुल्क रसीद व बोनाफाइड",
          "आधार लिंक बैंक पासबुक"
        ],
        deadlines: [
          {
            title: "SSP छात्रवृत्ति RD नंबर त्रुटि निवारण",
            date_iso: "2026-10-16",
            relative_rule: "नोटिस के 15 दिनों के भीतर",
            action: "SSP पोर्टल पर सही RD नंबर दर्ज कर नोडल सत्यापन प्राप्त करें",
            penalty: "18,500 रुपये की छात्रवृत्ति का निरस्तीकरण",
            urgency: "amber"
          }
        ],
        amount_due: "शून्य (अनुदान राशि: रु 18,500)",
        contact: "हेल्पलाइन: 1902 / 080-35254757",
        confidence: 0.99,
        unclear_fields: []
      },
      kn: {
        notice_type: "scholarship_letter",
        issuing_authority: "ಸಮಾಜ ಕಲ್ಯಾಣ ಇಲಾಖೆ, ಕರ್ನಾಟಕ ಸರ್ಕಾರ (SSP)",
        notice_reference_no: "SSP/POST-MATRIC/2026-27/RD-VERIF/4401",
        summary_in_user_language: "2026-27 ನೇ ಸಾಲಿನ ಮೆಟ್ರಿಕ್ ನಂತರದ ವಿದ್ಯಾರ್ಥಿವೇತನ ಅರ್ಜಿಯಲ್ಲಿ ಜಾತಿ ಮತ್ತು ಆದಾಯ ಪ್ರಮಾಣಪತ್ರದ RD ಸಂಖ್ಯೆ ಹೊಂದಾಣಿಕೆಯಾಗುತ್ತಿಲ್ಲ ಹಾಗೂ ಕಾಲೇಜು ಇ-ದೃಢೀಕರಣ ಬಾಕಿ ಇದೆ. 15 ದಿನಗಳೊಳಗೆ ಸರಿಪಡಿಸದಿದ್ದರೆ ವಿದ್ಯಾರ್ಥಿವೇತನ ರದ್ದಾಗುತ್ತದೆ.",
        required_actions: [
          "SSP ಪೋರ್ಟಲ್‌ಗೆ (ssp.postmatric.karnataka.gov.in) ಲಾಗಿನ್ ಆಗಿ",
          "ಕಂದಾಯ ಇಲಾಖೆಯ ಸರಿಯಾದ 15-ಅಂಕಿಯ RD ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ",
          "ಕಾಲೇಜು ನೋಡಲ್ ಅಧಿಕಾರಿಯಿಂದ ಇ-ದೃಢೀಕರಣ ಪೂರ್ಣಗೊಳಿಸಿ",
          "ಬ್ಯಾಂಕ್ ಖಾತೆಗೆ ಆಧಾರ್ NPCI ಸೀಡಿಂಗ್ ಆಗಿದೆಯೇ ಎಂದು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ"
        ],
        documents_needed: [
          "ಚಾಲ್ತಿಯಲ್ಲಿರುವ ಜಾತಿ ಮತ್ತು ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ (RD ಸಂಖ್ಯೆ)",
          "ಕಾಲೇಜು ಶುಲ್ಕ ರಸೀದಿ ಮತ್ತು ಬೋನಫೈಡ್ ಪ್ರಮಾಣಪತ್ರ",
          "ಆಧಾರ್ ಲಿಂಕ್ ಆದ ಬ್ಯಾಂಕ್ ಪಾಸ್‌ಬುಕ್ ಪ್ರತಿ"
        ],
        deadlines: [
          {
            title: "SSP ವಿದ್ಯಾರ್ಥಿವೇತನ RD ದೋಷ ಸರಿಪಡಿಸುವಿಕೆ",
            date_iso: "2026-10-16",
            relative_rule: "ಈ ಪತ್ರ ತಲುಪಿದ 15 ದಿನಗಳ ಒಳಗಾಗಿ",
            action: "ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ತಿದ್ದುಪಡಿ ಮಾಡಿ ಕಾಲೇಜು ನೋಡಲ್ ಅಧಿಕಾರಿಯ ಅನುಮೋದನೆ ಪಡೆಯುವುದು",
            penalty: "ರೂ. 18,500 ವಿದ್ಯಾರ್ಥಿವೇತನ ಅನುದಾನ ರದ್ದತಿ",
            urgency: "amber"
          }
        ],
        amount_due: "ಯಾವುದೂ ಇಲ್ಲ (ಅರ್ಹ ಅನುದಾನ: ರೂ. 18,500)",
        contact: "SSP ಸಹಾಯವಾಣಿ: 1902 / 080-35254757",
        confidence: 0.99,
        unclear_fields: []
      }
    }
  },
  {
    id: 'sample-ration-ekyc',
    name: 'NFSA Ration Card Biometric e-KYC',
    title: 'Public Notice: Mandatory Biometric e-KYC Verification for Ration Cards',
    category: 'Food, Civil Supplies & Consumer Affairs',
    department: 'Department of Food, Civil Supplies & Consumer Affairs',
    reference_no: 'NFSA/AAY-PHH/EKYC/2026/782',
    language_primary: 'hi',
    thumbnail_accent: 'border-emerald-500 bg-emerald-950/20 text-emerald-400',
    official_header_en: 'GOVERNMENT OF INDIA / STATE FOOD & CIVIL SUPPLIES DEPARTMENT',
    official_header_vernacular: 'खाद्य, नागरिक आपूर्ति एवं उपभोक्ता मामले विभाग • राष्ट्रीय खाद्य सुरक्षा अधिनियम (NFSA)',
    document_text: `खाद्य, नागरिक आपूर्ति एवं उपभोक्ता मामले विभाग
सार्वजनिक सूचना: राशन कार्ड धारकों के लिए अनिवार्य बायोमेट्रिक ई-केवाईसी (e-KYC)

अंतिम तिथि: 25-अक्टूबर-2026
परिपत्र सं: NFSA/AAY-PHH/EKYC/2026/782

समस्त अंत्योदय अन्न योजना (AAY) एवं प्राथमिकता प्राप्त गृहस्थी (PHH) राशन कार्ड धारकों को सूचित किया जाता है:
1. सर्वोच्च न्यायालय एवं मंत्रालय के निर्देशानुसार राशन कार्ड में दर्ज सभी सदस्यों का आधार प्रमाणीकरण (बायोमेट्रिक ई-केवाईसी) उचित दर दुकान (कोटेदार / Fair Price Shop) पर निःशुल्क किया जा रहा है।
2. परिवार के सभी सदस्य अपनी नजदीकी राशन दुकान या जन सेवा केंद्र पर जाकर ई-पॉस (e-PoS) मशीन द्वारा फिंगरप्रिंट/आईरिस प्रमाणीकरण पूर्ण कराएं।
3. वृद्ध/दिव्यांग नागरिकों के लिए घर पर सत्यापन या नॉमिनी सुविधा उपलब्ध है।
4. 25-10-2026 तक ई-केवाईसी न कराने वाले अपुष्ट सदस्यों का राशन अस्थायी रूप से अवरुद्ध किया जा सकता है।

जारीकर्ता:
उप निदेशक, खाद्य एवं नागरिक आपूर्ति विभाग।`,
    extracted_data: {
      en: {
        notice_type: "ration_card_form",
        issuing_authority: "Department of Food, Civil Supplies & Consumer Affairs (NFSA)",
        notice_reference_no: "NFSA/AAY-PHH/EKYC/2026/782",
        summary_in_user_language: "Mandatory biometric e-KYC notice for all Antyodaya (AAY) and Priority (PHH) Ration Card holders. All family members must complete POS biometric authentication by October 25, 2026. Elderly/disabled citizens have right to doorstep or nominee alternatives.",
        required_actions: [
          "Visit designated Fair Price Shop (ration dealer) or Jan Seva Kendra",
          "Carry physical Aadhaar cards of all family members listed on ration card",
          "Place finger on e-PoS machine for biometric e-KYC (free of charge)",
          "Request OTP/iris scan if fingerprints do not read"
        ],
        documents_needed: [
          "Original Ration Card (Ration Card Booklet)",
          "Aadhaar cards of all family members",
          "Registered Mobile Number for OTP alternative"
        ],
        deadlines: [
          {
            title: "Complete Fair Price Shop Biometric e-KYC",
            date_iso: "2026-10-25",
            action: "Biometric e-KYC authentication on e-PoS device at ration shop",
            penalty: "Temporary suspension of subsidized foodgrains for unverified members",
            urgency: "amber"
          }
        ],
        amount_due: "Free of Cost (Govt Mandated)",
        contact: "Toll-Free National Food Helpline: 1967 / 1800-3456-194",
        confidence: 0.97,
        unclear_fields: []
      },
      hi: {
        notice_type: "ration_card_form",
        issuing_authority: "खाद्य, नागरिक आपूर्ति एवं उपभोक्ता मामले विभाग (NFSA)",
        notice_reference_no: "NFSA/AAY-PHH/EKYC/2026/782",
        summary_in_user_language: "सभी अंत्योदय (AAY) एवं प्राथमिकता (PHH) राशन कार्ड धारकों के लिए अनिवार्य बायोमेट्रिक ई-केवाईसी का नोटिस। परिवार के सभी सदस्यों को 25 अक्टूबर 2026 तक उचित दर दुकान पर ई-पॉस मशीन द्वारा बायोमेट्रिक सत्यापन कराना आवश्यक है। वृद्ध व दिव्यांग नागरिकों को नॉमिनी व वैकल्पिक सत्यापन का अधिकार है।",
        required_actions: [
          "निकटतम उचित दर दुकान (राशन कोटेदार) या जन सेवा केंद्र जाएं",
          "राशन कार्ड में दर्ज सभी सदस्यों के मूल आधार कार्ड साथ ले जाएं",
          "ई-पॉस मशीन पर फिंगरप्रिंट लगाकर निःशुल्क ई-केवाईसी पूर्ण कराएं",
          "फिंगरप्रिंट न आने पर ओटीपी या आईरिस विकल्प की मांग करें"
        ],
        documents_needed: [
          "मूल राशन कार्ड (पुस्तिका)",
          "परिवार के सभी सदस्यों के आधार कार्ड",
          "ओटीपी हेतु पंजीकृत मोबाइल नंबर"
        ],
        deadlines: [
          {
            title: "राशन कार्ड बायोमेट्रिक ई-केवाईसी पूर्ण करें",
            date_iso: "2026-10-25",
            action: "राशन दुकान पर ई-पॉस मशीन द्वारा बायोमेट्रिक सत्यापन",
            penalty: "अपुष्ट सदस्यों का रियायती खाद्यान्न अस्थायी रूप से बंद होना",
            urgency: "amber"
          }
        ],
        amount_due: "निःशुल्क (सरकारी निर्देशानुसार)",
        contact: "राष्ट्रीय खाद्य हेल्पलाइन: 1967 / 1800-3456-194",
        confidence: 0.97,
        unclear_fields: []
      },
      kn: {
        notice_type: "ration_card_form",
        issuing_authority: "ಆಹಾರ, ನಾಗರಿಕ ಸರಬರಾಜು ಮತ್ತು ಗ್ರಾಹಕರ ವ್ಯವಹಾರಗಳ ಇಲಾಖೆ (NFSA)",
        notice_reference_no: "NFSA/AAY-PHH/EKYC/2026/782",
        summary_in_user_language: "ಎಲ್ಲಾ ಅಂತ್ಯೋದಯ (AAY) ಮತ್ತು ಆದ್ಯತಾ (PHH) ಪಡಿತರ ಚೀಟಿದಾರರಿಗೆ ಕಡ್ಡಾಯ ಬಯೋಮೆಟ್ರಿಕ್ ಇ-ಕೆವೈಸಿ ನೋಟಿಸ್. ಕುಟುಂಬದ ಎಲ್ಲಾ ಸದಸ್ಯರು ಅಕ್ಟೋಬರ್ 25, 2026 ರೊಳಗೆ ನ್ಯಾಯಬೆಲೆ ಅಂಗಡಿಯಲ್ಲಿ ಬಯೋಮೆಟ್ರಿಕ್ ದೃಢೀಕರಣ ಪೂರ್ಣಗೊಳಿಸಬೇಕು. ಹಿರಿಯ ನಾಗರಿಕರು ಮತ್ತು ಅಂಗವಿಕಲರಿಗೆ ಪರ್ಯಾಯ ಒಟಿಪಿ ಅಥವಾ ನಾಮಿನಿ ಹಕ್ಕು ಇದೆ.",
        required_actions: [
          "ನಿಮ್ಮ ನ್ಯಾಯಬೆಲೆ ಅಂಗಡಿ (ಪಡಿತರ ಅಂಗಡಿ) ಅಥವಾ ಗ್ರಾಮ ಒನ್ ಕೇಂದ್ರಕ್ಕೆ ಭೇಟಿ ನೀಡಿ",
          "ಪಡಿತರ ಚೀಟಿಯಲ್ಲಿರುವ ಎಲ್ಲಾ ಸದಸ್ಯರ ಮೂಲ ಆಧಾರ್ ಕಾರ್ಡ್‌ಗಳನ್ನು ತೆಗೆದುಕೊಂಡು ಹೋಗಿ",
          "ಇ-ಪಾಸ್ ಯಂತ್ರದಲ್ಲಿ ಬೆರಳಚ್ಚು ಇಟ್ಟು ಉಚಿತವಾಗಿ ಇ-ಕೆವೈಸಿ ಮಾಡಿಸಿಕೊಳ್ಳಿ",
          "ಬೆರಳಚ್ಚು ಬಾರದಿದ್ದರೆ ಒಟಿಪಿ ಅಥವಾ ಕಣ್ಣಿನ ಸ್ಕ್ಯಾನ್ ಪರ್ಯಾಯವನ್ನು ಕೋರಿ"
        ],
        documents_needed: [
          "ಮೂಲ ಪಡಿತರ ಚೀಟಿ",
          "ಕುಟುಂಬದ ಎಲ್ಲಾ ಸದಸ್ಯರ ಆಧಾರ್ ಕಾರ್ಡ್‌ಗಳು",
          "ನೋಂದಾಯಿತ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ"
        ],
        deadlines: [
          {
            title: "ನ್ಯಾಯಬೆಲೆ ಅಂಗಡಿ ಬಯೋಮೆಟ್ರಿಕ್ ಇ-ಕೆವೈಸಿ ಪೂರ್ಣಗೊಳಿಸಿ",
            date_iso: "2026-10-25",
            action: "ಪಡಿತರ ಅಂಗಡಿಯ ಇ-ಪಾಸ್ ಯಂತ್ರದಲ್ಲಿ ಬೆರಳಚ್ಚು ದೃಢೀಕರಣ",
            penalty: "ದೃಢೀಕರಿಸದ ಸದಸ್ಯರಿಗೆ ಸಬ್ಸಿಡಿ ಆಹಾರ ಧಾನ್ಯಗಳ ತಾತ್ಕಾಲಿಕ ಸ್ಥಗಿತ",
            urgency: "amber"
          }
        ],
        amount_due: "ಉಚಿತ (ಸರ್ಕಾರದ ಆದೇಶದಂತೆ)",
        contact: "ಪಡಿತರ ಸಹಾಯವಾಣಿ: 1967",
        confidence: 0.97,
        unclear_fields: []
      }
    }
  }
];
