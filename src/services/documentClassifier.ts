import { ExtractionJSON, DocumentSummarySheetData, SupportedLanguage, UrgencyLevel } from '../types';

export interface DocumentClassificationResult {
  category: string;
  subType: string;
  jurisdiction: 'Central Government' | 'State Government' | 'Municipal / Local Body' | 'Judicial / Quasi-Judicial';
  authorityName: string;
  governingAct: string;
  confidence: number;
}

export const DocumentClassifier = {
  /**
   * Classify document type and build a comprehensive Summary Sheet
   * explaining "What's going on" in the citizen's language.
   */
  generateSummarySheet(
    extraction: ExtractionJSON,
    lang: SupportedLanguage = 'en'
  ): DocumentSummarySheetData {
    const text = (
      (extraction.raw_ocr_text || '') + ' ' +
      (extraction.notice_type || '') + ' ' +
      (extraction.issuing_authority || '') + ' ' +
      (extraction.summary_in_user_language || '')
    ).toLowerCase();

    // 1. Detect Category & Sub-Type
    const classification = classifyText(text, extraction);

    // 2. Compute Days Remaining & Urgency
    let criticalDeadline = extraction.deadlines?.[0]?.date_iso || '';
    let daysRemaining = 14;
    let urgency: UrgencyLevel = 'amber';

    if (criticalDeadline) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const target = new Date(criticalDeadline);
      const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      daysRemaining = diff;
      if (diff <= 7) urgency = 'red';
      else if (diff <= 30) urgency = 'amber';
      else urgency = 'green';
    } else {
      // Default fallback deadline 14 days ahead
      const fallbackDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      criticalDeadline = fallbackDate.toISOString().split('T')[0];
    }

    // 3. Formulate "What's Going On?" in user language
    const whatsGoingOn = generateWhatsGoingOn(classification, extraction, lang, daysRemaining);

    // 4. Formulate Action Roadmap
    const roadmap = generateActionRoadmap(classification, extraction, lang);

    // 5. Citizen Rights & Safeguards
    const rights = generateCitizenRights(classification, lang);

    return {
      document_category: classification.category,
      document_sub_type: classification.subType,
      issuing_jurisdiction: classification.jurisdiction,
      issuing_authority_name: extraction.issuing_authority || classification.authorityName,
      reference_identifier: extraction.notice_reference_no || 'DIN/' + Date.now().toString().slice(-6),
      issue_date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      whats_going_on: whatsGoingOn,
      urgency_status: urgency,
      critical_deadline_date: criticalDeadline,
      days_remaining: daysRemaining,
      statutory_governing_act: classification.governingAct,
      citizen_rights: rights,
      action_roadmap: roadmap,
      required_documents: extraction.documents_needed.length > 0
        ? extraction.documents_needed
        : ['Identity proof (Aadhaar/PAN)', 'Copy of this notice', 'Relevant financial/income certificates'],
      disclaimer: lang === 'kn'
        ? 'ಇದು ಕಾನೂನು ಮಾರ್ಗದರ್ಶನವಾಗಿದೆ, ಕಾನೂನು ಸಲಹೆಯಲ್ಲ. ದಯವಿಟ್ಟು ಸಂಬಂಧಪಟ್ಟ ಸರ್ಕಾರಿ ಕಚೇರಿಯಲ್ಲಿ ದೃಢೀಕರಿಸಿ.'
        : lang === 'hi'
        ? 'यह एक कानूनी सूचना मार्गदर्शन है, विधिक सलाह नहीं। कृपया संबंधित सरकारी कार्यालय में पुष्टि कर लें।'
        : 'This summary sheet is an informational guide, not legal advice. Verify all actions with the issuing authority.'
    };
  }
};

function classifyText(text: string, extraction: ExtractionJSON): DocumentClassificationResult {
  // Aadhaar Card
  if (text.includes('aadhaar') || text.includes('uidai') || text.includes('unique identification') || text.includes('मेरा आधार') || text.includes('ನನ್ನ ಆಧಾರ್')) {
    return {
      category: 'Identity & National Registry (UIDAI)',
      subType: 'Official Aadhaar Card / UIDAI Identification Document',
      jurisdiction: 'Central Government',
      authorityName: 'Unique Identification Authority of India (UIDAI)',
      governingAct: 'Aadhaar (Targeted Delivery of Financial and Other Subsidies, Benefits and Services) Act, 2016',
      confidence: 0.99
    };
  }

  // PAN Card
  if ((text.includes('permanent account number') && text.includes('income tax')) || (text.includes('pan') && text.includes('income tax department') && text.includes('govt. of india'))) {
    return {
      category: 'Direct Taxes & Financial Identification',
      subType: 'Permanent Account Number (PAN) Card',
      jurisdiction: 'Central Government',
      authorityName: 'Income Tax Department, Ministry of Finance, Govt of India',
      governingAct: 'Income Tax Act, 1961 - Section 139A',
      confidence: 0.99
    };
  }

  // Electricity / Utility Disconnection Notice
  if (text.includes('electricity') || text.includes('disconnection') || text.includes('power supply') || text.includes('bescom') || text.includes('meter reading') || text.includes('section 56') || text.includes('ವಿದ್ಯುತ್')) {
    return {
      category: 'Public Utilities & Energy Services',
      subType: 'Electricity Bill Disconnection / Arrears Demand Notice',
      jurisdiction: 'State Government',
      authorityName: 'State Electricity Supply Company / Power Board',
      governingAct: 'Electricity Act, 2003 - Section 56(1) (Notice before disconnection)',
      confidence: 0.95
    };
  }

  // Court Summons / Legal Notice
  if (text.includes('court') || text.includes('summons') || text.includes('magistrate') || text.includes('civil judge') || text.includes('plaintiff') || text.includes('defendant') || text.includes('warrant') || text.includes('न्यायालय') || text.includes('ನ್ಯಾಯಾಲಯ')) {
    return {
      category: 'Judicial & Legal Proceedings',
      subType: 'Judicial Court Summons / Formal Legal Notice',
      jurisdiction: 'Judicial / Quasi-Judicial',
      authorityName: 'Court of Civil Judge / Judicial Magistrate',
      governingAct: 'Code of Civil Procedure, 1908 (Order V) / Criminal Procedure Code, 1973',
      confidence: 0.96
    };
  }

  // Land Revenue / RTC / Pahani
  if (text.includes('rtc') || text.includes('pahani') || text.includes('bhoomi') || text.includes('survey no') || text.includes('hissa') || text.includes('ಪಹಣಿ') || text.includes('ಖಾತಾ')) {
    return {
      category: 'Land Revenue & Land Records',
      subType: 'Record of Rights, Tenancy and Crops (RTC / Pahani) / Land Registry Extract',
      jurisdiction: 'State Government',
      authorityName: 'Department of Revenue & Land Records (Bhoomi)',
      governingAct: 'State Land Revenue Act & Digitized Bhoomi Land Code',
      confidence: 0.95
    };
  }

  // Income Tax & Assessment
  if (text.includes('148a') || text.includes('income tax') || text.includes('itba') || text.includes('ay 20') || text.includes('incometax.gov.in') || text.includes('pan:')) {
    return {
      category: 'Taxation & Assessment (Direct Taxes)',
      subType: 'Section 148A(b) Show Cause Notice for Income Reassessment',
      jurisdiction: 'Central Government',
      authorityName: 'Income Tax Department, Ministry of Finance, Govt of India',
      governingAct: 'Income Tax Act, 1961 - Section 148A(b) & Section 144',
      confidence: 0.98
    };
  }

  // Scholarship & Student Welfare
  if (text.includes('ssp') || text.includes('scholarship') || text.includes('post-matric') || text.includes('social welfare') || text.includes('rd number') || text.includes('ವಿದ್ಯಾರ್ಥಿವೇತನ')) {
    return {
      category: 'State Welfare & Education Scholarships',
      subType: 'State Scholarship Portal (SSP) Revenue Certificate Discrepancy Notice',
      jurisdiction: 'State Government',
      authorityName: 'Social Welfare Department, Government of Karnataka',
      governingAct: 'Karnataka State Post-Matric Scholarship Citizen Charter 2024',
      confidence: 0.96
    };
  }

  // Ration Card & Food Civil Supplies
  if (text.includes('ration') || text.includes('nfsa') || text.includes('fair price') || text.includes('biometric') || text.includes('ekyc') || text.includes('ಪಡಿತರ') || text.includes('राशन')) {
    return {
      category: 'Food Security & Public Distribution (PDS)',
      subType: 'National Food Security Act (NFSA) Mandatory Biometric e-KYC Verification',
      jurisdiction: 'State Government',
      authorityName: 'Department of Food, Civil Supplies & Consumer Affairs',
      governingAct: 'National Food Security Act, 2013 - Section 7 & Section 12',
      confidence: 0.95
    };
  }

  // GST & Indirect Taxes
  if (text.includes('gst') || text.includes('cgst') || text.includes('sgst') || text.includes('gstr') || text.includes('input tax credit') || text.includes('itc')) {
    return {
      category: 'Indirect Taxes & Commercial Taxes (GST)',
      subType: 'Show Cause Notice under Section 73 / 74 for Tax Discrepancy',
      jurisdiction: 'Central Government',
      authorityName: 'Central Board of Indirect Taxes & Customs (CBIC)',
      governingAct: 'Central Goods and Services Tax Act, 2017 - Section 73',
      confidence: 0.94
    };
  }

  // Land Revenue / Municipal Property Notice
  if (text.includes('khata') || text.includes('property tax') || text.includes('panchayat') || text.includes('bbmp') || text.includes('encroachment') || text.includes('tahsildar') || text.includes('ಖಾತಾ')) {
    return {
      category: 'Municipal & Land Revenue Administration',
      subType: 'Revenue Invalidation / Property Tax Arrears Demand Notice',
      jurisdiction: 'Municipal / Local Body',
      authorityName: 'Revenue Department / Municipal Corporation',
      governingAct: 'State Land Revenue Code & Municipal Corporations Act',
      confidence: 0.92
    };
  }

  // General Government Communication
  return {
    category: 'Government Administrative Order / Statutory Notice',
    subType: 'Statutory Administrative Direction & Verification Order',
    jurisdiction: 'State Government',
    authorityName: extraction.issuing_authority || 'Competent Administrative Authority',
    governingAct: 'Public Records and Administrative Compliance Guidelines',
    confidence: 0.88
  };
}

function generateWhatsGoingOn(
  classification: DocumentClassificationResult,
  extraction: ExtractionJSON,
  lang: SupportedLanguage,
  daysRemaining: number
) {
  const category = classification.category;

  if (category.includes('Taxation')) {
    const amt = extraction.amount_due || '₹42,50,000';
    if (lang === 'kn') {
      return {
        core_headline: `ಆದಾಯ ತೆರಿಗೆ ಇಲಾಖೆಯು ನಿಮ್ಮ ಖಾತೆಯಲ್ಲಿನ ${amt} ವಹಿವಾಟಿಗೆ ಸಂಬಂಧಿಸಿದಂತೆ ವಿವರಣೆ ಕೇಳಿದೆ.`,
        plain_explanation: 'ನೀವು ಸಲ್ಲಿಸಿದ ಐಟಿಆರ್ (ITR) ರಿಟರ್ನ್ಸ್ ಮತ್ತು ಬ್ಯಾಂಕ್ ದಾಖಲೆಗಳ ನಡುವೆ ವ್ಯತ್ಯಾಸ ಕಂಡುಬಂದಿದೆ. ತೆರಿಗೆ ಮರುಪರಿಶೀಲನೆ ಆರಂಭಿಸುವ ಮುನ್ನ ನಿಮಗೆ ಉತ್ತರ ನೀಡಲು ಅವಕಾಶ ನೀಡಲಾಗಿದೆ.',
        why_issued: 'ವಾರ್ಷಿಕ ಮಾಹಿತಿ ಹೇಳಿಕೆ (AIS) ಯಲ್ಲಿ ನಮೂದಾದ ದೊಡ್ಡ ಮೊತ್ತದ ನಗದು ಠೇವಣಿ ಅಥವಾ ಆಸ್ತಿ ಖರೀದಿಗೆ ಮೂಲ ವಿವರಣೆ ಇಲ್ಲದಿರುವುದು.',
        allegation_or_query: 'ಈ ಹಣದ ಕಾನೂನುಬದ್ಧ ಮೂಲ, ಬ್ಯಾಂಕ್ ಸ್ಟೇಟ್‌ಮೆಂಟ್ ಮತ್ತು ಲೆಕ್ಕಪತ್ರ ದಾಖಲೆಗಳನ್ನು ಇ-ಫೈಲಿಂಗ್ ಮೂಲಕ ಸಲ್ಲಿಸುವುದು.',
        financial_impact: `ಉತ್ತರಿಸದಿದ್ದರೆ ದಂಡ ಮತ್ತು ಏಕಪಕ್ಷೀಯ ಆದೇಶ (Ex-parte Order) ಹೊರಡಿಸಿ ಶೇಕಡಾ 200 ರಷ್ಟು ದಂಡ ವಿಧಿಸಬಹುದು.`
      };
    } else if (lang === 'hi') {
      return {
        core_headline: `आयकर विभाग ने ${amt} के वित्तीय लेनदेन के संबंध में कारण बताओ नोटिस जारी किया है।`,
        plain_explanation: 'आपके द्वारा भरे गए आईटीआर रिटर्न और बैंक खातों के वित्तीय आंकड़ों में अंतर पाया गया है। विभाग धारा 148 के तहत मामला फिर से खोलने से पहले आपका पक्ष जानना चाहता है।',
        why_issued: 'वित्तीय वर्ष के दौरान उच्च-मूल्य के लेन-देन (AIS रिकॉर्ड) के अनुसार घोषित आय से मेल न खाना।',
        allegation_or_query: 'धन के वैध स्रोत, बैंक विवरण व प्रासंगिक साक्ष्य ई-फाइलिंग पोर्टल पर अपलोड करना।',
        financial_impact: `समय पर जवाब न देने पर धारा 144 के तहत एकतरफा कर निर्धारण और 200% तक जुर्माना संभव है।`
      };
    } else {
      return {
        core_headline: `Income Tax Department is questioning ${amt} in financial transactions from your account.`,
        plain_explanation: 'The tax authority detected a mismatch between your filed ITR and third-party financial reporting (AIS/TIS). Before officially opening reassessment, they are giving you a statutory chance to explain.',
        why_issued: 'High-value transactions (bank deposits, mutual funds, or property) reported under your PAN were not reconciled in your tax return.',
        allegation_or_query: 'Explain the source of funds and provide supporting bank statements/invoices through the e-filing portal.',
        financial_impact: `Failure to reply in ${daysRemaining} days may result in an adverse ex-parte tax demand plus up to 200% penalty.`
      };
    }
  }

  if (category.includes('Scholarship')) {
    if (lang === 'kn') {
      return {
        core_headline: 'ವಿದ್ಯಾರ್ಥಿವೇತನ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ (SSP) ಜಾತಿ/ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ ಸಂಖ್ಯೆ ಅಮಾನ್ಯವಾಗಿದೆ.',
        plain_explanation: 'ನಿಮ್ಮ ಅರ್ಜಿ ತಡೆಹಿಡಿಯಲಾಗಿದೆ ಏಕೆಂದರೆ ನೀವು ನೀಡಿದ RD ಸಂಖ್ಯೆಯು ಕಂದಾಯ ಇಲಾಖೆಯ (ನಾಡಕಛೇರಿ) ಡೇಟಾಬೇಸ್‌ನಲ್ಲಿ ತಾಳೆಯಾಗುತ್ತಿಲ್ಲ.',
        why_issued: 'ಹಳೆಯ ಅಥವಾ ಅವಧಿ ಮೀರಿದ ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ ಸಂಖ್ಯೆಯನ್ನು ಅರ್ಜಿಯಲ್ಲಿ ನಮೂದಿಸಿರುವುದು.',
        allegation_or_query: 'ಮಾನ್ಯವಾಗಿರುವ ಹೊಸ RD ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ ವಿದ್ಯಾರ್ಥಿವೇತನ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ತಕ್ಷಣ ನವೀಕರಿಸಬೇಕು.',
        financial_impact: 'ಸಮಯಕ್ಕೆ ಸರಿಪಡಿಸದಿದ್ದರೆ ಈ ವರ್ಷದ ಪೋಸ್ಟ್-ಮೆಟ್ರಿಕ್ ವಿದ್ಯಾರ್ಥಿವೇತನ ಮತ್ತು ಕಾಲೇಜು ಶುಲ್ಕ ಮರುಪಾವತಿ ರದ್ದಾಗುತ್ತದೆ.'
      };
    } else if (lang === 'hi') {
      return {
        core_headline: 'छात्रवृत्ति पोर्टल (SSP) पर आय/जाति प्रमाण पत्र आरडी संख्या सत्यापित नहीं हो पाई है।',
        plain_explanation: 'आपका छात्रवृत्ति आवेदन रोक दिया गया है क्योंकि दर्ज किया गया प्रमाण पत्र नंबर राजस्व विभाग के डेटाबेस से मेल नहीं खाता है।',
        why_issued: 'आवेदन में अमान्य या समाप्त हो चुके आय प्रमाण पत्र की प्रविष्टि होना।',
        allegation_or_query: 'सक्रिय राजस्व प्रमाण पत्र (RD Number) प्राप्त कर पोर्टल पर अपडेट करना।',
        financial_impact: 'निर्धारित समय में सुधार न करने पर छात्रवृत्ति राशि व शुल्क प्रतिपूर्ति निरस्त हो जाएगी।'
      };
    } else {
      return {
        core_headline: 'SSP Scholarship application is put on hold due to invalid Caste/Income RD Certificate.',
        plain_explanation: 'The Social Welfare Department was unable to verify your parental income through the Revenue Department (Nadakacheri) database.',
        why_issued: 'The RD certificate number entered is either expired, misspelled, or pending renewal.',
        allegation_or_query: 'Obtain a valid 15-digit RD number from Nadakacheri and update it on the SSP portal.',
        financial_impact: 'If not rectified before the deadline, your tuition fee reimbursement and maintenance allowance will be forfeited.'
      };
    }
  }

  if (category.includes('Food Security')) {
    if (lang === 'kn') {
      return {
        core_headline: 'ಪಡಿತರ ಚೀಟಿಯಲ್ಲಿ ಕುಟುಂಬದ ಸದಸ್ಯರ ಬಯೋಮೆಟ್ರಿಕ್ (ಇ-ಕೆವೈಸಿ) ನವೀಕರಣ ಬಾಕಿಯಿದೆ.',
        plain_explanation: 'ಆಹಾರ ಇಲಾಖೆಯ ನಿಯಮಾವಳಿಯಂತೆ ನಕಲಿ ಪಡಿತರ ಚೀಟಿಗಳನ್ನು ತಡೆಯಲು ಎಲ್ಲಾ ಸದಸ್ಯರ ಆಧಾರ್ ಬಯೋಮೆಟ್ರಿಕ್ ಪರಿಶೀಲನೆ ಕಡ್ಡಾಯವಾಗಿದೆ.',
        why_issued: 'ನಿಮ್ಮ ಪಡಿತರ ಚೀಟಿಯಲ್ಲಿ 1 ಅಥವಾ ಹೆಚ್ಚಿನ ಸದಸ್ಯರು ನಿಗದಿತ ಅವಧಿಯಲ್ಲಿ ಫೇರ್‌ಪ್ರೈಸ್ ಶಾಪ್‌ನಲ್ಲಿ ಹೆಬ್ಬೆರಳು ಮುದ್ರೆ ನೀಡಿಲ್ಲ.',
        allegation_or_query: 'ಕುಟುಂಬದ ಎಲ್ಲ ಸದಸ್ಯರು ಪಡಿತರ ಅಂಗಡಿಗೆ ತೆರಳಿ ಇ-ಪಿಒಎಸ್ (e-PoS) ಯಂತ್ರದಲ್ಲಿ ಬಯೋಮೆಟ್ರಿಕ್ ಒದಗಿಸುವುದು.',
        financial_impact: 'ಗಡುವಿನೊಳಗೆ ನವೀಕರಿಸದಿದ್ದರೆ ಪಡಿತರ ಹಂಚಿಕೆ (ಅನ್ನಭಾಗ್ಯ / ಉಚಿತ ಧಾನ್ಯಗಳು) ತಾತ್ಕಾಲಿಕವಾಗಿ ಸ್ಥಗಿತಗೊಳ್ಳುತ್ತದೆ.'
      };
    } else if (lang === 'hi') {
      return {
        core_headline: 'राशन कार्ड में परिवार के सदस्यों का बायोमेट्रिक ई-केवाईसी (e-KYC) लंबित है।',
        plain_explanation: 'खाद्य विभाग के नियमानुसार राशन कार्ड को सक्रिय रखने के लिए आधार आधारित बायोमेट्रिक सत्यापन अनिवार्य है।',
        why_issued: 'कार्ड में दर्ज कुछ सदस्यों का काफी समय से बायोमेट्रिक प्रमाणीकरण नहीं हुआ है।',
        allegation_or_query: 'निकटतम राशन डीलर (FPS) के पास जाकर ई-पॉस मशीन पर अंगूठा लगाकर सत्यापन पूरा करें।',
        financial_impact: 'अंतिम तिथि तक सत्यापन न कराने पर राशन का आवंटन रोक दिया जाएगा और नाम कट सकता है।'
      };
    } else {
      return {
        core_headline: 'Mandatory Aadhaar biometric e-KYC is pending for members on your Ration Card.',
        plain_explanation: 'Under the National Food Security Act (NFSA), all beneficiaries must authenticate their fingerprints to eliminate duplicates.',
        why_issued: 'One or more family members have not authenticated on the e-PoS device at the Fair Price Shop.',
        allegation_or_query: 'All unverified members must visit their Fair Price Shop with Aadhaar to complete biometric verification.',
        financial_impact: 'Subsidized grain allocation and Direct Benefit Transfer (DBT) will be suspended if not completed.'
      };
    }
  }

  // Generic fallback
  return {
    core_headline: extraction.summary_in_user_language.slice(0, 100),
    plain_explanation: extraction.summary_in_user_language,
    why_issued: 'Routine statutory compliance check or inquiry by competent authority.',
    allegation_or_query: 'Submit written explanation and supporting identity records.',
    financial_impact: 'Administrative penalties or dismissal of request if not responded to within statutory deadline.'
  };
}

function generateActionRoadmap(
  classification: DocumentClassificationResult,
  extraction: ExtractionJSON,
  lang: SupportedLanguage
) {
  const category = classification.category;

  if (category.includes('Taxation')) {
    return [
      {
        step_number: 1,
        title: lang === 'kn' ? 'ಇ-ಫೈಲಿಂಗ್ ಪೋರ್ಟಲ್‌ಗೆ ಲಾಗಿನ್ ಆಗಿ' : lang === 'hi' ? 'ई-फाइलिंग पोर्टल पर लॉगिन करें' : 'Login to Income Tax e-Filing Portal',
        description: 'Visit eportal.incometax.gov.in using your PAN and password.',
        portal_link: 'https://eportal.incometax.gov.in'
      },
      {
        step_number: 2,
        title: lang === 'kn' ? 'ಪೆಂಡಿಂಗ್ ಆಕ್ಷನ್ (Pending Actions) ವಿಭಾಗಕ್ಕೆ ತೆರಳಿ' : lang === 'hi' ? 'Pending Actions टैब खोलें' : 'Navigate to Pending Actions > e-Proceedings',
        description: 'Locate DIN ' + (extraction.notice_reference_no || '') + ' and click "View Notice".',
        portal_link: 'https://eportal.incometax.gov.in'
      },
      {
        step_number: 3,
        title: lang === 'kn' ? 'ಲಿಖಿತ ಉತ್ತರ ಮತ್ತು ಬ್ಯಾಂಕ್ ಸ್ಟೇಟ್‌ಮೆಂಟ್ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ' : lang === 'hi' ? 'लिखित स्पष्टीकरण व बैंक विवरण अपलोड करें' : 'Submit Written Explanation with Bank Proofs',
        description: 'Provide a clear source breakdown in PDF format before the deadline.'
      }
    ];
  }

  if (category.includes('Scholarship')) {
    return [
      {
        step_number: 1,
        title: lang === 'kn' ? 'ನಾಡಕಛೇರಿ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ RD ಪರಿಶೀಲಿಸಿ' : lang === 'hi' ? 'नाडकचेरी पोर्टल पर आरडी नंबर सत्यापित करें' : 'Verify Certificate on Nadakacheri Portal',
        description: 'Check if your Caste/Income certificate is active (valid for 5 years).',
        portal_link: 'https://nadakacheri.karnataka.gov.in'
      },
      {
        step_number: 2,
        title: lang === 'kn' ? 'SSP ವಿದ್ಯಾರ್ಥಿ ಪೋರ್ಟಲ್‌ಗೆ ಲಾಗಿನ್ ಆಗಿ' : lang === 'hi' ? 'SSP छात्र पोर्टल पर लॉगिन करें' : 'Login to SSP Post-Matric Portal',
        description: 'Use your Student ID and password at ssp.postmatric.karnataka.gov.in.',
        portal_link: 'https://ssp.postmatric.karnataka.gov.in'
      },
      {
        step_number: 3,
        title: lang === 'kn' ? 'ಹೊಸ RD ಸಂಖ್ಯೆ ನಮೂದಿಸಿ ಅಪ್ಲಿಕೇಶನ್ ಮರು-ಸಲ್ಲಿಸಿ' : lang === 'hi' ? 'नया आरडी नंबर दर्ज कर आवेदन री-सबमिट करें' : 'Update RD Number and Re-submit Application',
        description: 'Ensure name on Aadhaar and Nadakacheri certificate match exactly.'
      }
    ];
  }

  if (category.includes('Food Security')) {
    return [
      {
        step_number: 1,
        title: lang === 'kn' ? 'ಆಹಾರ ಇಲಾಖೆಯ ವೆಬ್‌ಸೈಟ್‌ನಲ್ಲಿ ಸ್ಥಿತಿ ಪರಿಶೀಲಿಸಿ' : lang === 'hi' ? 'खाद्य पोर्टल पर आरसी स्थिति देखें' : 'Check Ration Card Status on Ahara Portal',
        description: 'Enter your RC number on ahara.kar.nic.in to see which member e-KYC is pending.',
        portal_link: 'https://ahara.kar.nic.in'
      },
      {
        step_number: 2,
        title: lang === 'kn' ? 'ಫೇರ್‌ಪ್ರೈಸ್ ಶಾಪ್‌ಗೆ ಭೇಟಿ ನೀಡಿ' : lang === 'hi' ? 'राशन डीलर की दुकान पर जाएं' : 'Visit Fair Price Shop with Aadhaar',
        description: 'All family members whose names are flagged must appear with original Aadhaar cards.'
      },
      {
        step_number: 3,
        title: lang === 'kn' ? 'ಇ-ಪಿಒಎಸ್ ಯಂತ್ರದಲ್ಲಿ ಹೆಬ್ಬೆರಳು ಮುದ್ರೆ ನೀಡಿ ರಸೀದಿ ಪಡೆಯಿರಿ' : lang === 'hi' ? 'ई-पॉस मशीन पर अंगूठा लगाकर पावती प्राप्त करें' : 'Authenticate Fingerprint on e-PoS Device',
        description: 'Verify instant success slip from dealer to prevent ration suspension.'
      }
    ];
  }

  // Generic
  return [
    {
      step_number: 1,
      title: 'Review Notice Details & Reference Number',
      description: 'Check the issuing officer and exact date of receipt.'
    },
    {
      step_number: 2,
      title: 'Gather All Supporting Identification Documents',
      description: 'Keep Aadhaar, original notice, and relevant proof ready.'
    },
    {
      step_number: 3,
      title: 'Submit Formal Written Reply Before Deadline',
      description: 'Deliver response either online or in person with acknowledgment copy.'
    }
  ];
}

function generateCitizenRights(classification: DocumentClassificationResult, lang: SupportedLanguage): string[] {
  if (lang === 'kn') {
    return [
      'ನೈಸರ್ಗಿಕ ನ್ಯಾಯ ತತ್ವದಡಿ ಕನಿಷ್ಠ 7 ರಿಂದ 30 ದಿನಗಳವರೆಗೆ ಲಿಖಿತ ವಿವರಣೆ ನೀಡಲು ಶಾಸನಬದ್ಧ ಹಕ್ಕು.',
      'ಏಕಪಕ್ಷೀಯ ಆದೇಶ ಹೊರಡಿಸುವ ಮುನ್ನ ವೈಯಕ್ತಿಕ ವಿಚಾರಣೆಗೆ (Personal Hearing) ಅವಕಾಶ ಕೇಳುವ ಹಕ್ಕು.',
      'ದೋಷಪೂರಿತ ಅಥವಾ ಅಸ್ಪಷ್ಟ ಮಾಹಿತಿಯಿದ್ದಲ್ಲಿ ದಾಖಲೆಗಳ ನಕಲು ಪ್ರತಿಯನ್ನು ಕೇಳುವ ಹಕ್ಕು.',
      'ಪ್ರತಿಕೂಲ ಆದೇಶ ಬಂದಲ್ಲಿ ಮೇಲ್ಮನವಿ ಪ್ರಾಧಿಕಾರಕ್ಕೆ (Appellate Authority) ಮೇಲ್ಮನವಿ ಸಲ್ಲಿಸುವ ಹಕ್ಕು.'
    ];
  } else if (lang === 'hi') {
    return [
      'प्राकृतिक न्याय के सिद्धांत के तहत लिखित उत्तर देने के लिए 7 से 30 दिनों का वैधानिक समय पाने का अधिकार।',
      'कोई भी प्रतिकूल आदेश पारित करने से पहले व्यक्तिगत सुनवाई (Personal Hearing) की मांग का अधिकार।',
      'यदि नोटिस में आरोप स्पष्ट नहीं हैं, तो संबंधित साक्ष्य व दस्तावेजों की प्रति मांगने का अधिकार।',
      'विभागीय निर्णय के विरुद्ध उच्च अपीलीय अधिकारी या न्यायाधिकरण में अपील दाखिल करने का अधिकार।'
    ];
  } else {
    return [
      'Statutory right to a mandatory response window of 7 to 30 days under principles of natural justice.',
      'Right to request an oral personal hearing (via video conference or in person) before any adverse order is passed.',
      'Right to inspect or obtain copies of all third-party evidence or reports cited against you.',
      'Statutory right of appeal to the Appellate Tribunal or Commissioner within the designated limitation period.'
    ];
  }
}
