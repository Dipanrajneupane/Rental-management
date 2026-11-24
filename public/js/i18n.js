/**
 * Bilingual Support: English (en) & Nepali (np)
 * Comprehensive translation dictionary and live switching engine.
 */

const I18n = {
  currentLang: localStorage.getItem('bharatpur_lang') || 'np',

  translations: {
    np: {
      brandTagline: 'Drive More, Spend Less',
      locationHeader: 'Gaindakot-4, Congress Chowk',
      branchLocation: 'Bharatpur-10, Balmandir Road',
      todayPrefix: 'आज',
      statAvailTitle: 'उपलब्ध सवारी साधन (Available)',
      statRentTitle: 'भाडामा गएको (On Rent)',
      statBookTitle: 'अग्रिम बुकिङ (Booked)',
      statTotalTitle: 'कुल सवारी साधन (Total Fleet)',
      breakdown: 'विभाजन:',
      tabFleet: 'सवारी साधनहरू (Fleet)',
      tabHistory: 'ग्राहक भाडा इतिहास (History)',
      btnAddVehicle: 'नयाँ सवारी थप्नुहोस् (Add Vehicle)',
      catAll: 'सबै (All)',
      catScooty: '🛵 स्कुटी (Scooty)',
      catBike: '🏍️ बाइक (Bike)',
      catCar: '🚗 कार (Car)',
      searchPlaceholder: 'सवारी नाम, नम्बर वा ग्राहक खोज्नुहोस्...',
      statusAll: 'सबै स्थिति',
      statusAvail: '🟢 उपलब्ध',
      statusRent: '🔴 भाडामा',
      statusBook: '🟣 बुकिङ',
      fleetTitle: 'सवारी साधन सूची (Vehicle Fleet)',
      fleetSubtitle: 'कुनै पनि सवारीमा क्लिक गरेर भाडामा दिन, बुकिङ गर्न वा फिर्ता लिन सकिन्छ।',
      historyTitle: 'ग्राहक भाडा इतिहास (Past Customer Rental History)',
      historySubtitle: 'कुन ग्राहकले कुन सवारी कहिले देखि कहिले सम्म लगेका थिए सोको पूर्ण विवरण',
      historySearchPlaceholder: 'ग्राहकको नाम, मोबाइल वा गाडी नम्बर खोज्नुहोस्...',
      thVehicle: 'सवारी साधन विवरण',
      thCustomer: 'ग्राहकको नाम',
      thPhone: 'सम्पर्क नम्बरहरू (१-४)',
      thStartDate: 'भाडा सुरु मिति (BS)',
      thReturnDate: 'फिर्ता मिति (BS)',
      thDaysAmt: 'दिन / रकम',
      thAction: 'कार्य (Action)',
      btnDelete: 'हटाउनुहोस्',
      footerCopyright: '© Bharatpur Bike and Car Rental. All Rights Reserved.',
      footerTagline: 'नेपाली क्यालेन्डर (बिक्रम संवत् - BS) सहितको पूर्ण स्वचालित प्रणाली',
      modalTitleRent: 'सवारी साधन भाडा / बुकिङ विवरण',
      actionChoiceLabel: 'कार्य छनौट गर्नुहोस्:',
      rentNowOption: '🔥 अहिले भाडामा दिने (Rent Out)',
      bookAdvanceOption: '📅 अग्रिम बुकिङ (Advance Booking)',
      custNameLabel: 'ग्राहकको पूरा नाम',
      compulsory: '(अनिवार्य)',
      optional: '(ऐच्छिक)',
      custPhoneSectionLabel: 'ग्राहकको सम्पर्क नम्बरहरू (४ वटा सम्म लेख्न सकिने):',
      phone1Label: 'मोबाइल नम्बर १',
      phone2Label: 'मोबाइल नम्बर २',
      phone3Label: 'मोबाइल नम्बर ३',
      phone4Label: 'मोबाइल नम्बर ४',
      startDateBsLabel: 'भाडा सुरु मिति (नेपाली क्यालेन्डर)',
      directDaysLabel: 'कति दिनको लागि? (Direct Days)',
      returnDateBsLabel: 'फिर्ता गर्ने मिति (नेपाली क्यालेन्डर)',
      advancePaymentLabel: 'अग्रिम भुक्तानी (रु.) / Advance',
      notesLabel: 'कैफियत / टिप्पणी (Notes / Driving License No)',
      notesPlaceholder: 'नागरिकता नं, लाइसेन्स वा अन्य जानकारी...',
      btnCancel: 'रद्द गर्नुहोस्',
      btnConfirmRent: 'सुरक्षित गर्नुहोस् (Confirm)',
      currentlyOnRent: '🔥 हाल यो सवारी साधन भाडामा गएको छ (Currently on Rent)',
      currentlyBooked: '📅 हाल यो सवारी साधन बुकिङ गरिएको छ (Currently Booked)',
      labelCustName: 'ग्राहकको नाम',
      labelPhones: 'सम्पर्क नम्बरहरू',
      labelStartDate: 'भाडा सुरु मिति',
      labelReturnDate: 'फिर्ता गर्ने तोकिएको मिति',
      labelTimeStatus: 'बाँकी समय स्थिति',
      labelAdvance: 'अग्रिम भुक्तानी',
      labelNotes: 'कैफियत',
      overdueAlert: 'दिन नाघिसक्यो (Overdue)',
      todayDueAlert: 'आज फिर्ता हुने मिति',
      daysLeft: 'दिन बाँकी छ',
      returnFormTitle: 'सवारी साधन फिर्ता लिने फारम (Mark as Returned):',
      returnFormDesc: 'गाडी फिर्ता आइसकेपछि तलको विवरण भरेर सुरक्षित गर्नुहोस्। यो विवरण ग्राहक इतिहास (History) मा सुरक्षित हुनेछ र सवारी साधन तत्काल उपलब्ध हुनेछ।',
      actualReturnDateLabel: 'कति गते फिर्ता आयो? (फिर्ता मिति)',
      actualTotalDaysLabel: 'जम्मा चलाएको दिन (Total Days)',
      finalRentAmountLabel: 'अन्तिम कुल भाडा रकम (रु.)',
      returnRemarksLabel: 'फिर्ता गर्दाको अवस्था / टिप्पणी',
      returnRemarksPlaceholder: 'उदा: राम्रो अवस्थामा फिर्ता, पेट्रोल चेक गरियो...',
      btnConfirmReturn: 'फिर्ता सुरक्षित गर्नुहोस् र History मा सार्नुहोस्',
      rentNewCustPrompt: 'गाडी फिर्ता आइसकेको छ र अहिले उपलब्ध छ। के तपाईं नयाँ ग्राहकलाई तुरुन्तै भाडामा दिन चाहनुहुन्छ?',
      deleteHistConfirm: 'के तपाईं यो ग्राहकको भाडा इतिहास विवरण मेटाउन निश्चित हुनुहुन्छ?',
      deleteVehConfirm: 'के तपाईं यो सवारी साधन मेटाउन निश्चित हुनुहुन्छ?',
      vehOnRentDeleteWarn: 'यो सवारी साधन हाल भाडामा वा बुकिङमा छ। मेटाउनु अघि कृपया पहिले फिर्ता लिनुहोस्।',
      addVehicleModalTitle: 'नयाँ सवारी साधन थप्नुहोस्',
      editVehicleModalTitle: 'सवारी साधन सम्पादन गर्नुहोस्',
      labelVehCategory: 'सवारी वर्ग (Category)',
      labelVehName: 'सवारीको नाम / मोडल',
      labelVehPlate: 'सवारी नम्बर प्लेट',
      labelVehRate: 'दैनिक भाडा दर (रु. प्रति दिन)',
      labelVehPhoto: 'फोटो अपलोड गर्नुहोस् वा फोटो लिंक (Photo)',
      quickPresets: 'वा छिटो फोटो छनौट गर्नुहोस्:',
      btnSaveVehicle: 'सवारी सुरक्षित गर्नुहोस्',
      perDay: '/ दिन',
      clickPromptAvail: 'भाडामा दिन क्लिक गर्नुहोस्',
      clickPromptActive: 'विवरण / फिर्ता लिन क्लिक गर्नुहोस्',
      noVehFound: 'कुनै सवारी साधन फेला परेन',
      noVehDesc: 'तपाईंले खोज्नुभएको फिल्टर अनुसार सवारी साधन उपलब्ध छैन।',
      noHistFound: 'कुनै भाडा इतिहास फेला परेन।',
      daysTagSuffix: 'दिन',
      liveSyncText: 'Live Connected'
    },
    en: {
      brandTagline: 'Drive More, Spend Less',
      locationHeader: 'Gaindakot-4, Congress Chowk',
      branchLocation: 'Bharatpur-10, Balmandir Road',
      todayPrefix: 'Today',
      statAvailTitle: 'Available Vehicles',
      statRentTitle: 'On Rent',
      statBookTitle: 'Advance Booked',
      statTotalTitle: 'Total Fleet',
      breakdown: 'Breakdown:',
      tabFleet: 'Vehicles Fleet',
      tabHistory: 'Customer Rental History',
      btnAddVehicle: '+ Add Vehicle',
      catAll: 'All',
      catScooty: '🛵 Scooty',
      catBike: '🏍️ Bike',
      catCar: '🚗 Car',
      searchPlaceholder: 'Search vehicle name, plate, or customer...',
      statusAll: 'All Status',
      statusAvail: '🟢 Available',
      statusRent: '🔴 On Rent',
      statusBook: '🟣 Booked',
      fleetTitle: 'Vehicle Fleet',
      fleetSubtitle: 'Click on any vehicle to rent out, advance book, or return.',
      historyTitle: 'Customer Rental History',
      historySubtitle: 'Complete records of past customer vehicle rentals and dates.',
      historySearchPlaceholder: 'Search customer name, mobile or plate number...',
      thVehicle: 'Vehicle Details',
      thCustomer: 'Customer Name',
      thPhone: 'Contact Numbers (1-4)',
      thStartDate: 'Rent Start Date (BS)',
      thReturnDate: 'Return Date (BS)',
      thDaysAmt: 'Days / Amount',
      thAction: 'Action',
      btnDelete: 'Delete',
      footerCopyright: '© Bharatpur Bike and Car Rental. All Rights Reserved.',
      footerTagline: 'Fully dynamic automatic system with Nepali Bikram Sambat (BS) Calendar',
      modalTitleRent: 'Vehicle Rental & Booking Details',
      actionChoiceLabel: 'Select Action:',
      rentNowOption: '🔥 Rent Out Now',
      bookAdvanceOption: '📅 Advance Booking',
      custNameLabel: 'Customer Full Name',
      compulsory: '(Compulsory)',
      optional: '(Optional)',
      custPhoneSectionLabel: 'Customer Contact Numbers (Up to 4 numbers):',
      phone1Label: 'Mobile Number 1',
      phone2Label: 'Mobile Number 2',
      phone3Label: 'Mobile Number 3',
      phone4Label: 'Mobile Number 4',
      startDateBsLabel: 'Rent Start Date (Nepali Calendar)',
      directDaysLabel: 'Duration (Direct Days)',
      returnDateBsLabel: 'Expected Return Date (Nepali Calendar)',
      advancePaymentLabel: 'Advance Payment (Rs.)',
      notesLabel: 'Remarks / Notes (Driving License / Citizen ID)',
      notesPlaceholder: 'License No., ID or other notes...',
      btnCancel: 'Cancel',
      btnConfirmRent: 'Confirm Rental / Booking',
      currentlyOnRent: '🔥 This vehicle is currently On Rent',
      currentlyBooked: '📅 This vehicle is currently Booked',
      labelCustName: 'Customer Name',
      labelPhones: 'Contact Numbers',
      labelStartDate: 'Rent Start Date',
      labelReturnDate: 'Expected Return Date',
      labelTimeStatus: 'Time Remaining / Status',
      labelAdvance: 'Advance Paid',
      labelNotes: 'Remarks / Notes',
      overdueAlert: 'days OVERDUE',
      todayDueAlert: 'Due to return today',
      daysLeft: 'days remaining',
      returnFormTitle: 'Vehicle Return Form (Mark as Returned):',
      returnFormDesc: 'Fill in return date and days below. This record will be archived to History and the vehicle becomes Available immediately.',
      actualReturnDateLabel: 'Returned On Date (Nepali Calendar)',
      actualTotalDaysLabel: 'Total Days Used',
      finalRentAmountLabel: 'Final Total Rental Amount (Rs.)',
      returnRemarksLabel: 'Vehicle Return Condition / Notes',
      returnRemarksPlaceholder: 'e.g. Returned in good condition, fuel checked...',
      btnConfirmReturn: 'Confirm Return & Move to History',
      rentNewCustPrompt: 'Vehicle has returned and is now Available. Do you want to rent it to a new customer immediately?',
      deleteHistConfirm: 'Are you sure you want to delete this customer rental history record?',
      deleteVehConfirm: 'Are you sure you want to delete this vehicle?',
      vehOnRentDeleteWarn: 'This vehicle is currently on rent or booked. Please return it before deleting.',
      addVehicleModalTitle: 'Add New Vehicle',
      editVehicleModalTitle: 'Edit Vehicle Details',
      labelVehCategory: 'Vehicle Category',
      labelVehName: 'Vehicle Name / Model',
      labelVehPlate: 'Vehicle Plate Number',
      labelVehRate: 'Daily Rate (Rs. / day)',
      labelVehPhoto: 'Upload Photo or Paste Image URL',
      quickPresets: 'Or choose quick preset:',
      btnSaveVehicle: 'Save Vehicle',
      perDay: '/ day',
      clickPromptAvail: 'Click to Rent Out / Book',
      clickPromptActive: 'Click to View / Return',
      noVehFound: 'No Vehicles Found',
      noVehDesc: 'No vehicles match your active search or category filter.',
      noHistFound: 'No customer rental history found.',
      daysTagSuffix: 'days',
      liveSyncText: 'Live Connected'
    }
  },

  t(key) {
    const lang = this.currentLang;
    if (this.translations[lang] && this.translations[lang][key]) {
      return this.translations[lang][key];
    }
    return this.translations['en'][key] || key;
  },

  setLanguage(lang) {
    this.currentLang = lang === 'en' ? 'en' : 'np';
    localStorage.setItem('bharatpur_lang', this.currentLang);
    document.documentElement.setAttribute('lang', this.currentLang);
    this.applyTranslations();
  },

  applyTranslations() {
    // Translate all elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const translation = this.t(key);
      if (translation) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          if (el.hasAttribute('placeholder')) {
            el.setAttribute('placeholder', translation);
          }
        } else {
          el.textContent = translation;
        }
      }
    });

    // Translate placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const translation = this.t(key);
      if (translation) {
        el.setAttribute('placeholder', translation);
      }
    });

    // Update switcher UI
    document.querySelectorAll('.lang-btn').forEach(btn => {
      if (btn.dataset.lang === this.currentLang) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }
};

window.I18n = I18n;
