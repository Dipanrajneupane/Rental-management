/**
 * Bharatpur Bike and Car Rental - Frontend Application Logic
 * Full dynamic real-time synchronization, Nepali BS calendar,
 * bilingual (English & Nepali) language switching,
 * vehicle rental, booking, return, and past customer history management.
 */

// Application State
let appState = {
  vehicles: [],
  history: [],
  selectedCategory: 'all',
  selectedStatus: 'all',
  searchQuery: '',
  historySearchQuery: '',
  currentVehicleModalId: null,
  isMysql: false
};

// Real-time communication channels
let socket = null;
const broadcastSync = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('bharatpur_rental_sync') : null;

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initLanguage();
  initNepaliHeaderDate();
  initSocket();
  fetchInitialState();
  setupEventListeners();
});

// Language Management (English <-> Nepali)
function initLanguage() {
  const savedLang = localStorage.getItem('bharatpur_lang') || 'np';
  I18n.setLanguage(savedLang);
}

window.switchLanguage = function(lang) {
  I18n.setLanguage(lang);
  initNepaliHeaderDate();
  renderAll();

  // If a modal is open, re-render it
  if (appState.currentVehicleModalId) {
    const v = appState.vehicles.find(x => x.id === appState.currentVehicleModalId);
    if (v) renderVehicleActionModalContent(v);
  }

  showToast(lang === 'np' ? 'भाषा परिवर्तन गरियो: नेपाली' : 'Language switched: English');
};

// Theme Management (Dark / Light)
function initTheme() {
  const savedTheme = localStorage.getItem('bharatpur_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  const toggleBtn = document.getElementById('themeToggleBtn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('bharatpur_theme', next);
      updateThemeIcon(next);
      showToast(next === 'dark' ? (I18n.currentLang === 'np' ? 'डार्क मोड सक्रिय' : 'Dark Mode Activated') : (I18n.currentLang === 'np' ? 'लाइट मोड सक्रिय' : 'Light Mode Activated'));
    });
  }
}

function updateThemeIcon(theme) {
  const icon = document.getElementById('themeIcon');
  if (!icon) return;
  icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// Display Current Nepali BS Date in Header (Localized)
function initNepaliHeaderDate() {
  const el = document.getElementById('headerNepaliDate');
  if (el) {
    const today = NepaliDate.getTodayBs();
    if (I18n.currentLang === 'en') {
      el.innerHTML = `<i class="fas fa-calendar-alt"></i> ${I18n.t('todayPrefix')}: ${today.year} ${today.monthNameEn} ${today.day}, ${today.dayNameEn}`;
    } else {
      el.innerHTML = `<i class="fas fa-calendar-alt"></i> ${I18n.t('todayPrefix')}: ${today.year} ${today.monthNameNp} ${today.day} गते, ${today.dayNameNp}`;
    }
  }
}

// Setup WebSocket for Instant Nano-second Updates
function initSocket() {
  const syncStatusEl = document.getElementById('liveSyncText');
  const syncDotEl = document.getElementById('syncDot');

  try {
    if (typeof io !== 'undefined') {
      socket = io();

      socket.on('connect', () => {
        if (syncStatusEl) syncStatusEl.textContent = I18n.t('liveSyncText');
        if (syncDotEl) syncDotEl.style.backgroundColor = '#10B981';
      });

      socket.on('state_update', (payload) => {
        if (payload && payload.state) {
          appState.vehicles = payload.state.vehicles || [];
          appState.history = payload.state.history || [];
          appState.isMysql = payload.state.isMysql || false;
          renderAll();

          // If current open modal vehicle changed, refresh modal content
          if (appState.currentVehicleModalId) {
            const v = appState.vehicles.find(x => x.id === appState.currentVehicleModalId);
            if (v) renderVehicleActionModalContent(v);
          }
        }
      });

      socket.on('disconnect', () => {
        if (syncStatusEl) syncStatusEl.textContent = 'Sync Offline';
        if (syncDotEl) syncDotEl.style.backgroundColor = '#F59E0B';
      });
    }
  } catch (err) {
    console.warn('Socket.io error, operating in local-sync mode:', err);
  }

  // Cross-tab broadcast listener
  if (broadcastSync) {
    broadcastSync.onmessage = (event) => {
      if (event.data && event.data.type === 'REFRESH_STATE') {
        fetchInitialState(false);
      }
    };
  }
}

// Fetch Initial State from Server or Fallback
async function fetchInitialState(showNotify = true) {
  try {
    const res = await fetch('/api/state');
    if (res.ok) {
      const data = await res.json();
      appState.vehicles = data.vehicles || [];
      appState.history = data.history || [];
      appState.isMysql = data.dbStatus ? data.dbStatus.isMysql : false;
      renderAll();
      updateDbStatusBadge();
      return;
    }
  } catch (e) {
    console.warn('Fetch state failed, checking localStorage fallback:', e);
  }

  // LocalStorage Fallback if server is not reached
  const localData = localStorage.getItem('bharatpur_local_backup');
  if (localData) {
    try {
      const parsed = JSON.parse(localData);
      appState.vehicles = parsed.vehicles || [];
      appState.history = parsed.history || [];
    } catch (err) {}
  }
  renderAll();
}

function updateDbStatusBadge() {
  const badge = document.getElementById('dbBadge');
  if (!badge) return;
  if (appState.isMysql) {
    badge.innerHTML = `<i class="fas fa-database"></i> MySQL Connected`;
    badge.style.color = '#10B981';
  } else {
    badge.innerHTML = `<i class="fas fa-bolt"></i> Instant Dynamic Engine`;
    badge.style.color = '#F59E0B';
  }
}

// Save Local Backup
function backupLocal() {
  try {
    localStorage.setItem('bharatpur_local_backup', JSON.stringify({
      vehicles: appState.vehicles,
      history: appState.history
    }));
  } catch (e) {}
}

// Global Re-render
function renderAll() {
  backupLocal();
  I18n.applyTranslations();
  renderStats();
  renderVehicles();
  renderHistory();
}

// Render Top Corner Statistics
function renderStats() {
  const total = appState.vehicles.length;
  let availTotal = 0;
  let rentTotal = 0;
  let bookTotal = 0;

  const catStats = {
    scooty: { total: 0, avail: 0, rent: 0, book: 0 },
    bike: { total: 0, avail: 0, rent: 0, book: 0 },
    car: { total: 0, avail: 0, rent: 0, book: 0 }
  };

  appState.vehicles.forEach(v => {
    const cat = (v.category || 'bike').toLowerCase();
    if (!catStats[cat]) catStats[cat] = { total: 0, avail: 0, rent: 0, book: 0 };
    catStats[cat].total++;

    if (v.status === 'rented') {
      rentTotal++;
      catStats[cat].rent++;
    } else if (v.status === 'booked') {
      bookTotal++;
      catStats[cat].book++;
    } else {
      availTotal++;
      catStats[cat].avail++;
    }
  });

  // Main Counters
  setText('statTotalCount', total);
  setText('statAvailCount', availTotal);
  setText('statRentCount', rentTotal);
  setText('statBookCount', bookTotal);

  // Breakdown details
  setText('statAvailBreakdown', `🛵 ${catStats.scooty.avail} | 🏍️ ${catStats.bike.avail} | 🚗 ${catStats.car.avail}`);
  setText('statRentBreakdown', `🛵 ${catStats.scooty.rent} | 🏍️ ${catStats.bike.rent} | 🚗 ${catStats.car.rent}`);
  setText('statBookBreakdown', `🛵 ${catStats.scooty.book} | 🏍️ ${catStats.bike.book} | 🚗 ${catStats.car.book}`);
  setText('statTotalBreakdown', `🛵 ${catStats.scooty.total} | 🏍️ ${catStats.bike.total} | 🚗 ${catStats.car.total}`);

  // Category Tab Badges
  setText('catBadgeAll', total);
  setText('catBadgeScooty', catStats.scooty.total);
  setText('catBadgeBike', catStats.bike.total);
  setText('catBadgeCar', catStats.car.total);
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

// Render Vehicle Cards Grid
function renderVehicles() {
  const grid = document.getElementById('vehiclesGrid');
  if (!grid) return;

  // Filter vehicles
  const filtered = appState.vehicles.filter(v => {
    // Category match
    if (appState.selectedCategory !== 'all' && v.category !== appState.selectedCategory) {
      return false;
    }
    // Status match
    if (appState.selectedStatus !== 'all' && v.status !== appState.selectedStatus) {
      return false;
    }
    // Search query match
    if (appState.searchQuery) {
      const q = appState.searchQuery.toLowerCase();
      const nameMatch = (v.name || '').toLowerCase().includes(q);
      const plateMatch = (v.plate_number || '').toLowerCase().includes(q);
      const custMatch = v.current_rental && (v.current_rental.customer_name || '').toLowerCase().includes(q);
      const phoneMatch = v.current_rental && (
        (v.current_rental.phone1 || '').includes(q) ||
        (v.current_rental.phone2 || '').includes(q) ||
        (v.current_rental.phone3 || '').includes(q) ||
        (v.current_rental.phone4 || '').includes(q)
      );
      if (!nameMatch && !plateMatch && !custMatch && !phoneMatch) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px 20px; background: var(--bg-surface); border: 1px dashed var(--border-color); border-radius: var(--radius-lg);">
        <i class="fas fa-motorcycle" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 12px; display: block;"></i>
        <h3 style="font-size: 1.2rem; font-weight: 700; margin-bottom: 6px;">${I18n.t('noVehFound')}</h3>
        <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 16px;">${I18n.t('noVehDesc')}</p>
        <button class="btn btn-primary" onclick="openAddVehicleModal()">
          <i class="fas fa-plus"></i> ${I18n.t('btnAddVehicle')}
        </button>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(v => {
    const isAvail = v.status === 'available';
    const isRent = v.status === 'rented';
    const isBook = v.status === 'booked';

    let statusBadgeClass = 'status-badge-avail';
    let statusText = I18n.currentLang === 'en' ? 'Available' : 'उपलब्ध (Available)';
    if (isRent) {
      statusBadgeClass = 'status-badge-rent';
      statusText = I18n.currentLang === 'en' ? 'On Rent' : 'भाडामा (On Rent)';
    } else if (isBook) {
      statusBadgeClass = 'status-badge-book';
      statusText = I18n.currentLang === 'en' ? 'Booked' : 'बुकिङ (Booked)';
    }

    const catIcon = v.category === 'scooty' ? '🛵' : (v.category === 'car' ? '🚗' : '🏍️');
    const photoUrl = v.photo || getDefaultPhoto(v.category);

    let activeRentalHtml = '';
    if ((isRent || isBook) && v.current_rental) {
      const cr = v.current_rental;
      const today = NepaliDate.getTodayBs().formatted;
      const daysLeft = NepaliDate.diffBsDays(today, cr.expected_return_date_bs);
      let overdueBadge = '';
      if (daysLeft < 0) {
        overdueBadge = `<span style="color: #EF4444; font-weight: 800;">[ ${Math.abs(daysLeft)} ${I18n.t('overdueAlert')} ]</span>`;
      } else if (daysLeft === 0) {
        overdueBadge = `<span style="color: #F59E0B; font-weight: 800;">[ ${I18n.t('todayDueAlert')} ]</span>`;
      } else {
        overdueBadge = `<span style="color: #10B981;">(${daysLeft} ${I18n.t('daysLeft')})</span>`;
      }

      activeRentalHtml = `
        <div class="active-rental-box">
          <div class="customer-name-row">
            <span><i class="fas fa-user-check"></i> ${cr.customer_name || 'Customer'}</span>
            <span class="days-tag">${cr.total_days || 1} ${I18n.t('daysTagSuffix')}</span>
          </div>
          <div class="customer-phone-row">
            <i class="fas fa-phone-alt"></i> <b>${cr.phone1 || 'No phone'}</b>
            ${cr.phone2 ? `<span>, ${cr.phone2}</span>` : ''}
          </div>
          <div class="rental-dates-row">
            <span>${I18n.currentLang === 'en' ? 'Dates' : 'मिति'}: ${cr.start_date_bs || ''} - ${cr.expected_return_date_bs || ''}</span>
          </div>
          <div style="font-size: 0.72rem; text-align: right; margin-top: 2px;">
            ${overdueBadge}
          </div>
        </div>
      `;
    }

    return `
      <div class="vehicle-card" onclick="openVehicleActionModal('${v.id}')">
        <div class="card-img-wrap">
          <img src="${escapeHtml(photoUrl)}" alt="${escapeHtml(v.name)}" class="card-img" onerror="this.src='${getDefaultPhoto(v.category)}'">
          <div class="card-cat-badge">
            <span>${catIcon}</span> ${escapeHtml(v.category)}
          </div>
          <div class="card-status-badge ${statusBadgeClass}">
            <i class="fas ${isAvail ? 'fa-check-circle' : (isRent ? 'fa-key' : 'fa-calendar-check')}"></i>
            ${statusText}
          </div>
        </div>
        <div class="card-body">
          <div class="card-vehicle-name">${escapeHtml(v.name)}</div>
          <div class="plate-badge-row">
            <span class="plate-badge">${escapeHtml(v.plate_number)}</span>
            <span class="rate-badge">Rs. ${(v.rate_per_day || 0).toLocaleString()} <small>${I18n.t('perDay')}</small></span>
          </div>
          ${activeRentalHtml}
        </div>
        <div class="card-footer">
          <div class="click-prompt">
            <i class="fas fa-hand-pointer"></i> 
            ${isAvail ? I18n.t('clickPromptAvail') : I18n.t('clickPromptActive')}
          </div>
          <div class="card-actions-mini" onclick="event.stopPropagation()">
            <button type="button" class="btn-icon" title="${I18n.t('editVehicleModalTitle')}" onclick="openEditVehicleModal('${v.id}')">
              <i class="fas fa-edit"></i>
            </button>
            <button type="button" class="btn-icon delete" title="${I18n.t('btnDelete')}" onclick="confirmDeleteVehicle('${v.id}')">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Fallback images by category
function getDefaultPhoto(category) {
  if (category === 'scooty') {
    return 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80';
  } else if (category === 'car') {
    return 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80';
  }
  return 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80';
}

// ==========================================
// VEHICLE CLICK DIRECT POPOUT MODAL
// ==========================================
function openVehicleActionModal(vehicleId) {
  const v = appState.vehicles.find(x => x.id === vehicleId);
  if (!v) return;

  appState.currentVehicleModalId = vehicleId;
  renderVehicleActionModalContent(v);

  const modal = document.getElementById('vehicleActionModal');
  if (modal) modal.classList.add('active');
}

function closeVehicleActionModal() {
  const modal = document.getElementById('vehicleActionModal');
  if (modal) modal.classList.remove('active');
  appState.currentVehicleModalId = null;
}

function renderVehicleActionModalContent(v) {
  const container = document.getElementById('vehicleActionModalBody');
  if (!container) return;

  const isAvail = (v.status === 'available');
  const isRent = (v.status === 'rented');
  const isBook = (v.status === 'booked');
  const catIcon = v.category === 'scooty' ? '🛵' : (v.category === 'car' ? '🚗' : '🏍️');

  let bannerHtml = `
    <div class="vehicle-popup-banner">
      <img src="${escapeHtml(v.photo || getDefaultPhoto(v.category))}" class="vehicle-popup-thumb" alt="${escapeHtml(v.name)}">
      <div class="vehicle-popup-details">
        <div style="font-weight: 800; font-size: 1.15rem; color: var(--text-main);">${catIcon} ${escapeHtml(v.name)}</div>
        <div style="display: flex; gap: 10px; align-items: center; margin-top: 4px; flex-wrap: wrap;">
          <span class="plate-badge">${escapeHtml(v.plate_number)}</span>
          <span style="font-weight: 700; color: var(--primary);">Rs. ${(v.rate_per_day || 0).toLocaleString()} ${I18n.t('perDay')}</span>
          <span class="status-pill ${isAvail ? 'active' : ''}" style="margin: 0; padding: 2px 10px;">${isAvail ? (I18n.currentLang === 'en' ? 'Available' : 'उपलब्ध (Available)') : (isRent ? (I18n.currentLang === 'en' ? 'On Rent' : 'भाडामा गएको') : (I18n.currentLang === 'en' ? 'Booked' : 'बुकिङ भएको'))}</span>
        </div>
      </div>
    </div>
  `;

  if (isAvail) {
    // FORM TO RENT OUT OR BOOK
    const todayBs = NepaliDate.getTodayBs().formatted;
    const tomorrowBs = NepaliDate.addDaysToBs(todayBs, 1);

    container.innerHTML = `
      ${bannerHtml}
      <form id="rentOutForm" onsubmit="handleRentSubmit(event, '${v.id}')">
        <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: var(--radius-md); padding: 12px 16px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
          <span style="font-weight: 700; color: var(--text-main);">${I18n.t('actionChoiceLabel')}</span>
          <div style="display: flex; gap: 14px; flex-wrap: wrap;">
            <label style="cursor: pointer; display: flex; align-items: center; gap: 6px; font-weight: 700; color: #10B981;">
              <input type="radio" name="action_type" value="rented" checked> ${I18n.t('rentNowOption')}
            </label>
            <label style="cursor: pointer; display: flex; align-items: center; gap: 6px; font-weight: 700; color: #A855F7;">
              <input type="radio" name="action_type" value="booked"> ${I18n.t('bookAdvanceOption')}
            </label>
          </div>
        </div>

        <div class="form-grid">
          <div class="form-group full">
            <label class="form-label">${I18n.t('custNameLabel')} <span class="req">* ${I18n.t('compulsory')}</span></label>
            <input type="text" id="custNameInput" class="form-control" placeholder="${I18n.currentLang === 'en' ? 'e.g. Ram Bahadur Shrestha' : 'उदा: राम बहादुर श्रेष्ठ'}" required>
          </div>

          <div class="form-group full">
            <label class="form-label">${I18n.t('custPhoneSectionLabel')}</label>
            <div class="phones-container">
              <div>
                <label style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700;">${I18n.t('phone1Label')} <span class="req">* ${I18n.t('compulsory')}</span></label>
                <input type="tel" id="custPhone1" class="form-control" placeholder="98XXXXXXXX" required>
              </div>
              <div>
                <label style="font-size: 0.75rem; color: var(--text-muted);">${I18n.t('phone2Label')} ${I18n.t('optional')}</label>
                <input type="tel" id="custPhone2" class="form-control" placeholder="${I18n.currentLang === 'en' ? 'Alternative Phone 2' : 'वैकल्पिक नम्बर २'}">
              </div>
              <div>
                <label style="font-size: 0.75rem; color: var(--text-muted);">${I18n.t('phone3Label')} ${I18n.t('optional')}</label>
                <input type="tel" id="custPhone3" class="form-control" placeholder="${I18n.currentLang === 'en' ? 'Alternative Phone 3' : 'वैकल्पिक नम्बर ३'}">
              </div>
              <div>
                <label style="font-size: 0.75rem; color: var(--text-muted);">${I18n.t('phone4Label')} ${I18n.t('optional')}</label>
                <input type="tel" id="custPhone4" class="form-control" placeholder="${I18n.currentLang === 'en' ? 'Alternative Phone 4' : 'वैकल्पिक नम्बर ४'}">
              </div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">${I18n.t('startDateBsLabel')} <span class="req">*</span></label>
            <div class="bs-date-wrapper">
              <input type="text" id="rentStartDateBs" class="form-control" value="${todayBs}" required placeholder="YYYY-MM-DD">
              <button type="button" class="bs-calendar-toggle-btn" title="Calendar"><i class="fas fa-calendar-alt"></i></button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">${I18n.t('directDaysLabel')} <span class="req">*</span></label>
            <input type="number" id="directDaysInput" class="form-control" value="1" min="1" max="365" required>
          </div>

          <div class="form-group">
            <label class="form-label">${I18n.t('returnDateBsLabel')} <span class="req">*</span></label>
            <div class="bs-date-wrapper">
              <input type="text" id="rentReturnDateBs" class="form-control" value="${tomorrowBs}" required placeholder="YYYY-MM-DD">
              <button type="button" class="bs-calendar-toggle-btn" title="Calendar"><i class="fas fa-calendar-alt"></i></button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">${I18n.t('advancePaymentLabel')}</label>
            <input type="number" id="rentAdvanceInput" class="form-control" value="${v.rate_per_day || 0}" min="0">
          </div>

          <div class="form-group full">
            <label class="form-label">${I18n.t('notesLabel')}</label>
            <input type="text" id="rentNotesInput" class="form-control" placeholder="${I18n.t('notesPlaceholder')}">
          </div>
        </div>

        <div style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 12px;">
          <button type="button" class="btn btn-secondary" onclick="closeVehicleActionModal()">${I18n.t('btnCancel')}</button>
          <button type="submit" class="btn btn-primary">
            <i class="fas fa-check-circle"></i> ${I18n.t('btnConfirmRent')}
          </button>
        </div>
      </form>
    `;

    // Hook up pickers and dynamic date/day calculators
    setupDateCalcListeners();

  } else {
    // VEHICLE IS CURRENTLY ON RENT OR BOOKED
    const cr = v.current_rental || {};
    const todayBs = NepaliDate.getTodayBs().formatted;
    const daysLeft = NepaliDate.diffBsDays(todayBs, cr.expected_return_date_bs || todayBs);

    let statusHeader = isRent ? I18n.t('currentlyOnRent') : I18n.t('currentlyBooked');
    let statusColor = isRent ? '#EF4444' : '#A855F7';

    let phonesList = [cr.phone1, cr.phone2, cr.phone3, cr.phone4].filter(Boolean);

    container.innerHTML = `
      ${bannerHtml}
      
      <div class="current-customer-box">
        <div style="font-weight: 800; font-size: 1rem; color: ${statusColor}; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
          <span>${statusHeader}</span>
          <span class="days-tag">${cr.total_days || 1} ${I18n.t('daysTagSuffix')}</span>
        </div>

        <div class="customer-detail-grid">
          <div class="detail-item">
            <span class="label">${I18n.t('labelCustName')}</span>
            <span class="val" style="font-size: 1.1rem; color: var(--primary);">${escapeHtml(cr.customer_name || 'N/A')}</span>
          </div>

          <div class="detail-item">
            <span class="label">${I18n.t('labelPhones')}</span>
            <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px;">
              ${phonesList.map((p, idx) => `
                <a href="tel:${escapeHtml(p)}" class="phone-badge ${idx === 0 ? 'primary' : ''}">
                  <i class="fas fa-phone-alt"></i> ${escapeHtml(p)}
                </a>
                <a href="https://wa.me/977${escapeHtml(p.replace(/[^0-9]/g, ''))}" target="_blank" class="phone-badge" style="color: #25D366; border-color: rgba(37, 211, 102, 0.4);" title="WhatsApp">
                  <i class="fab fa-whatsapp"></i>
                </a>
              `).join('')}
            </div>
          </div>

          <div class="detail-item">
            <span class="label">${I18n.t('labelStartDate')}</span>
            <span class="val">${escapeHtml(cr.start_date_bs || 'N/A')} (${NepaliDate.formatBsDateReadable(cr.start_date_bs, I18n.currentLang)})</span>
          </div>

          <div class="detail-item">
            <span class="label">${I18n.t('labelReturnDate')}</span>
            <span class="val">${escapeHtml(cr.expected_return_date_bs || 'N/A')} (${NepaliDate.formatBsDateReadable(cr.expected_return_date_bs, I18n.currentLang)})</span>
          </div>

          <div class="detail-item">
            <span class="label">${I18n.t('labelTimeStatus')}</span>
            <span class="val">
              ${daysLeft < 0 ? `<b style="color: #EF4444;">${Math.abs(daysLeft)} ${I18n.t('overdueAlert')}</b>` : (daysLeft === 0 ? `<b style="color: #F59E0B;">${I18n.t('todayDueAlert')}</b>` : `<b style="color: #10B981;">${daysLeft} ${I18n.t('daysLeft')}</b>`)}
            </span>
          </div>

          <div class="detail-item">
            <span class="label">${I18n.t('labelAdvance')}</span>
            <span class="val">Rs. ${(cr.advance_amount || 0).toLocaleString()}</span>
          </div>

          ${cr.notes ? `
          <div class="detail-item" style="grid-column: 1 / -1;">
            <span class="label">${I18n.t('labelNotes')}</span>
            <span class="val" style="font-weight: normal; color: var(--text-secondary);">${escapeHtml(cr.notes)}</span>
          </div>` : ''}
        </div>
      </div>

      <!-- RETURN ACTION BOX -->
      <div class="return-box-action">
        <div style="font-weight: 800; font-size: 1rem; color: #10B981; display: flex; align-items: center; gap: 8px;">
          <i class="fas fa-undo-alt"></i> ${I18n.t('returnFormTitle')}
        </div>
        <p style="font-size: 0.82rem; color: var(--text-secondary);">${I18n.t('returnFormDesc')}</p>

        <form id="returnForm" onsubmit="handleReturnSubmit(event, '${v.id}')">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">${I18n.t('actualReturnDateLabel')} <span class="req">*</span></label>
              <div class="bs-date-wrapper">
                <input type="text" id="actualReturnDateBs" class="form-control" value="${todayBs}" required placeholder="YYYY-MM-DD">
                <button type="button" class="bs-calendar-toggle-btn"><i class="fas fa-calendar-alt"></i></button>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">${I18n.t('actualTotalDaysLabel')} <span class="req">*</span></label>
              <input type="number" id="actualTotalDays" class="form-control" value="${cr.total_days || 1}" min="1" required>
            </div>

            <div class="form-group">
              <label class="form-label">${I18n.t('finalRentAmountLabel')}</label>
              <input type="number" id="actualAmountPaid" class="form-control" value="${(v.rate_per_day || 0) * (cr.total_days || 1)}" min="0">
            </div>

            <div class="form-group">
              <label class="form-label">${I18n.t('returnRemarksLabel')}</label>
              <input type="text" id="returnNotes" class="form-control" placeholder="${I18n.t('returnRemarksPlaceholder')}">
            </div>
          </div>

          <div style="margin-top: 16px; display: flex; justify-content: flex-end; gap: 10px;">
            <button type="button" class="btn btn-secondary" onclick="closeVehicleActionModal()">${I18n.t('btnCancel')}</button>
            <button type="submit" class="btn btn-success">
              <i class="fas fa-check"></i> ${I18n.t('btnConfirmReturn')}
            </button>
          </div>
        </form>
      </div>
    `;

    // Initialize date pickers inside return box
    const returnDateInput = document.getElementById('actualReturnDateBs');
    if (returnDateInput) {
      new NepaliDatePicker(returnDateInput, {
        onSelect: (selected) => {
          if (cr.start_date_bs) {
            const diff = NepaliDate.diffBsDays(cr.start_date_bs, selected);
            const daysInput = document.getElementById('actualTotalDays');
            const amtInput = document.getElementById('actualAmountPaid');
            const totalDays = Math.max(1, diff);
            if (daysInput) daysInput.value = totalDays;
            if (amtInput) amtInput.value = (v.rate_per_day || 0) * totalDays;
          }
        }
      });
    }

    const actualDaysInput = document.getElementById('actualTotalDays');
    if (actualDaysInput) {
      actualDaysInput.addEventListener('input', (e) => {
        const days = parseInt(e.target.value, 10) || 1;
        const amtInput = document.getElementById('actualAmountPaid');
        if (amtInput) amtInput.value = (v.rate_per_day || 0) * days;
        if (cr.start_date_bs && returnDateInput) {
          returnDateInput.value = NepaliDate.addDaysToBs(cr.start_date_bs, days);
        }
      });
    }
  }
}

// Dynamic Date and Days Calculations for Rent Form
function setupDateCalcListeners() {
  const startInput = document.getElementById('rentStartDateBs');
  const returnInput = document.getElementById('rentReturnDateBs');
  const daysInput = document.getElementById('directDaysInput');

  if (!startInput || !returnInput || !daysInput) return;

  new NepaliDatePicker(startInput, {
    onSelect: (selected) => {
      const days = parseInt(daysInput.value, 10) || 1;
      returnInput.value = NepaliDate.addDaysToBs(selected, days);
    }
  });

  new NepaliDatePicker(returnInput, {
    onSelect: (selected) => {
      const diff = NepaliDate.diffBsDays(startInput.value, selected);
      daysInput.value = Math.max(1, diff);
    }
  });

  // When user enters Direct Days, auto calculate Return Date
  daysInput.addEventListener('input', (e) => {
    const days = parseInt(e.target.value, 10);
    if (!isNaN(days) && days >= 0 && startInput.value) {
      returnInput.value = NepaliDate.addDaysToBs(startInput.value, days);
    }
  });

  startInput.addEventListener('change', () => {
    const days = parseInt(daysInput.value, 10) || 1;
    if (startInput.value) {
      returnInput.value = NepaliDate.addDaysToBs(startInput.value, days);
    }
  });

  returnInput.addEventListener('change', () => {
    if (startInput.value && returnInput.value) {
      const diff = NepaliDate.diffBsDays(startInput.value, returnInput.value);
      daysInput.value = Math.max(1, diff);
    }
  });
}

// Handle Rent / Book Submission
async function handleRentSubmit(e, vehicleId) {
  e.preventDefault();

  const actionTypeRadio = document.querySelector('input[name="action_type"]:checked');
  const actionType = actionTypeRadio ? actionTypeRadio.value : 'rented';

  const customerName = (document.getElementById('custNameInput').value || '').trim();
  const phone1 = (document.getElementById('custPhone1').value || '').trim();
  const phone2 = (document.getElementById('custPhone2').value || '').trim();
  const phone3 = (document.getElementById('custPhone3').value || '').trim();
  const phone4 = (document.getElementById('custPhone4').value || '').trim();
  const startDateBs = document.getElementById('rentStartDateBs').value.trim();
  const returnDateBs = document.getElementById('rentReturnDateBs').value.trim();
  const totalDays = parseInt(document.getElementById('directDaysInput').value, 10) || 1;
  const advanceAmount = parseFloat(document.getElementById('rentAdvanceInput').value) || 0;
  const notes = (document.getElementById('rentNotesInput').value || '').trim();

  if (!customerName) {
    alert(I18n.currentLang === 'en' ? 'Please enter customer name!' : 'कृपया ग्राहकको नाम अनिवार्य रूपमा लेख्नुहोस्!');
    return;
  }
  if (!phone1) {
    alert(I18n.currentLang === 'en' ? 'Please enter primary mobile number!' : 'कृपया मोबाइल नम्बर १ अनिवार्य रूपमा लेख्नुहोस्!');
    return;
  }

  const payload = {
    vehicle_id: vehicleId,
    action_type: actionType,
    customer_name: customerName,
    phone1,
    phone2,
    phone3,
    phone4,
    start_date_bs: startDateBs,
    expected_return_date_bs: returnDateBs,
    total_days: totalDays,
    advance_amount: advanceAmount,
    notes
  };

  // Immediate Optimistic Update
  const vIndex = appState.vehicles.findIndex(x => x.id === vehicleId);
  if (vIndex !== -1) {
    appState.vehicles[vIndex].status = actionType;
    appState.vehicles[vIndex].current_rental = { ...payload };
    renderAll();
  }

  closeVehicleActionModal();
  showToast(I18n.currentLang === 'en' ? `Vehicle successfully ${actionType === 'booked' ? 'Booked' : 'Rented'}!` : `सवारी सफल रूपमा ${actionType === 'booked' ? 'बुकिङ' : 'भाडामा'} गरियो!`);

  // Sync with server
  try {
    const res = await fetch('/api/rent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.vehicle) {
        appState.vehicles[vIndex] = data.vehicle;
        renderAll();
      }
    }
  } catch (err) {
    console.warn('Server sync error, local cache active:', err);
  }

  if (broadcastSync) {
    broadcastSync.postMessage({ type: 'REFRESH_STATE' });
  }
}

// Handle Return Vehicle Submission
async function handleReturnSubmit(e, vehicleId) {
  e.preventDefault();

  const actualReturnDateBs = document.getElementById('actualReturnDateBs').value.trim();
  const actualTotalDays = parseInt(document.getElementById('actualTotalDays').value, 10) || 1;
  const actualAmountPaid = parseFloat(document.getElementById('actualAmountPaid').value) || 0;
  const returnNotes = (document.getElementById('returnNotes').value || '').trim();

  const payload = {
    vehicle_id: vehicleId,
    return_date_bs: actualReturnDateBs,
    total_days: actualTotalDays,
    amount_paid: actualAmountPaid,
    notes: returnNotes
  };

  // Optimistic Update
  const v = appState.vehicles.find(x => x.id === vehicleId);
  if (v && v.current_rental) {
    const histItem = {
      id: 'hist_' + Date.now(),
      vehicle_id: v.id,
      vehicle_name: v.name,
      vehicle_plate: v.plate_number,
      vehicle_category: v.category,
      customer_name: v.current_rental.customer_name,
      phone1: v.current_rental.phone1,
      phone2: v.current_rental.phone2,
      phone3: v.current_rental.phone3,
      phone4: v.current_rental.phone4,
      start_date_bs: v.current_rental.start_date_bs,
      return_date_bs: actualReturnDateBs,
      total_days: actualTotalDays,
      amount_paid: actualAmountPaid,
      notes: returnNotes,
      created_at: new Date().toISOString()
    };
    appState.history.unshift(histItem);
    v.status = 'available';
    v.current_rental = null;
    renderAll();
  }

  closeVehicleActionModal();
  showToast(I18n.currentLang === 'en' ? 'Vehicle marked as returned and archived to History!' : 'गाडी फिर्ता भयो र ग्राहक इतिहासमा सुरक्षित गरियो!');

  // Server sync
  try {
    const res = await fetch('/api/return', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.vehicle) {
        const idx = appState.vehicles.findIndex(x => x.id === vehicleId);
        if (idx !== -1) appState.vehicles[idx] = data.vehicle;
        renderAll();
      }
    }
  } catch (err) {
    console.warn('Server sync error, local cache active:', err);
  }

  if (broadcastSync) {
    broadcastSync.postMessage({ type: 'REFRESH_STATE' });
  }

  // Option to immediately rent to new customer
  setTimeout(() => {
    if (confirm(I18n.t('rentNewCustPrompt'))) {
      openVehicleActionModal(vehicleId);
    }
  }, 350);
}

// ==========================================
// RENTAL HISTORY MANAGEMENT
// ==========================================
function renderHistory() {
  const tbody = document.getElementById('historyTableBody');
  if (!tbody) return;

  const filtered = appState.history.filter(h => {
    if (!appState.historySearchQuery) return true;
    const q = appState.historySearchQuery.toLowerCase();
    return (
      (h.customer_name || '').toLowerCase().includes(q) ||
      (h.vehicle_name || '').toLowerCase().includes(q) ||
      (h.vehicle_plate || '').toLowerCase().includes(q) ||
      (h.phone1 || '').includes(q) ||
      (h.phone2 || '').includes(q) ||
      (h.phone3 || '').includes(q) ||
      (h.phone4 || '').includes(q) ||
      (h.start_date_bs || '').includes(q) ||
      (h.return_date_bs || '').includes(q)
    );
  });

  const countBadge = document.getElementById('historyCountBadge');
  if (countBadge) countBadge.textContent = filtered.length;

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 32px 16px; color: var(--text-secondary);">
          ${I18n.t('noHistFound')}
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(h => {
    const phones = [h.phone1, h.phone2, h.phone3, h.phone4].filter(Boolean);
    const catIcon = h.vehicle_category === 'scooty' ? '🛵' : (h.vehicle_category === 'car' ? '🚗' : '🏍️');

    return `
      <tr>
        <td>
          <div style="font-weight: 700; color: var(--text-main);">${catIcon} ${escapeHtml(h.vehicle_name || '')}</div>
          <span class="plate-badge" style="font-size: 0.75rem; padding: 1px 6px;">${escapeHtml(h.vehicle_plate || '')}</span>
        </td>
        <td>
          <div style="font-weight: 800; color: var(--primary);">${escapeHtml(h.customer_name || '')}</div>
        </td>
        <td>
          <div class="phone-pills-list">
            ${phones.map((p, idx) => `
              <a href="tel:${escapeHtml(p)}" class="phone-badge ${idx === 0 ? 'primary' : ''}">
                <i class="fas fa-phone-alt"></i> ${escapeHtml(p)}
              </a>
            `).join('')}
          </div>
        </td>
        <td>
          <div style="font-weight: 600;">${escapeHtml(h.start_date_bs || '')}</div>
          <small style="color: var(--text-muted);">${NepaliDate.formatBsDateReadable(h.start_date_bs, I18n.currentLang)}</small>
        </td>
        <td>
          <div style="font-weight: 600; color: #10B981;">${escapeHtml(h.return_date_bs || '')}</div>
          <small style="color: var(--text-muted);">${NepaliDate.formatBsDateReadable(h.return_date_bs, I18n.currentLang)}</small>
        </td>
        <td>
          <span class="days-tag">${h.total_days || 1} ${I18n.t('daysTagSuffix')}</span>
          ${h.amount_paid ? `<div style="font-size: 0.78rem; font-weight: 700; color: var(--text-main); margin-top: 4px;">Rs. ${Number(h.amount_paid).toLocaleString()}</div>` : ''}
        </td>
        <td>
          <button type="button" class="btn btn-danger" style="padding: 6px 12px; font-size: 0.78rem;" onclick="confirmDeleteHistory('${h.id}')" title="${I18n.t('btnDelete')}">
            <i class="fas fa-trash-alt"></i> ${I18n.t('btnDelete')}
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// Delete Customer History Record
async function confirmDeleteHistory(historyId) {
  if (!confirm(I18n.t('deleteHistConfirm'))) {
    return;
  }

  // Optimistic UI update
  const idx = appState.history.findIndex(x => x.id === historyId);
  if (idx !== -1) {
    appState.history.splice(idx, 1);
    renderAll();
  }

  showToast(I18n.currentLang === 'en' ? 'History record deleted!' : 'इतिहास रेकर्ड मेटाइयो!');

  try {
    await fetch(`/api/history/${historyId}`, { method: 'DELETE' });
  } catch (e) {
    console.warn('Delete history server error:', e);
  }

  if (broadcastSync) {
    broadcastSync.postMessage({ type: 'REFRESH_STATE' });
  }
}

// ==========================================
// ADD & EDIT VEHICLE
// ==========================================
function openAddVehicleModal() {
  document.getElementById('vehicleFormModalTitle').innerHTML = `<i class="fas fa-plus-circle"></i> ${I18n.t('addVehicleModalTitle')}`;
  document.getElementById('editVehicleId').value = '';
  document.getElementById('vehicleNameInput').value = '';
  document.getElementById('vehicleCatSelect').value = 'bike';
  document.getElementById('vehiclePlateInput').value = '';
  document.getElementById('vehicleRateInput').value = '1500';
  document.getElementById('vehiclePhotoInput').value = '';
  document.getElementById('photoPreviewImg').style.display = 'none';

  document.getElementById('vehicleFormModal').classList.add('active');
}

function openEditVehicleModal(vehicleId) {
  const v = appState.vehicles.find(x => x.id === vehicleId);
  if (!v) return;

  document.getElementById('vehicleFormModalTitle').innerHTML = `<i class="fas fa-edit"></i> ${I18n.t('editVehicleModalTitle')}`;
  document.getElementById('editVehicleId').value = v.id;
  document.getElementById('vehicleNameInput').value = v.name || '';
  document.getElementById('vehicleCatSelect').value = v.category || 'bike';
  document.getElementById('vehiclePlateInput').value = v.plate_number || '';
  document.getElementById('vehicleRateInput').value = v.rate_per_day || 0;
  document.getElementById('vehiclePhotoInput').value = v.photo || '';

  const prev = document.getElementById('photoPreviewImg');
  if (v.photo) {
    prev.src = v.photo;
    prev.style.display = 'block';
  } else {
    prev.style.display = 'none';
  }

  document.getElementById('vehicleFormModal').classList.add('active');
}

function closeVehicleFormModal() {
  document.getElementById('vehicleFormModal').classList.remove('active');
}

async function handleVehicleFormSubmit(e) {
  e.preventDefault();

  const editId = document.getElementById('editVehicleId').value;
  const name = document.getElementById('vehicleNameInput').value.trim();
  const category = document.getElementById('vehicleCatSelect').value;
  const plate_number = document.getElementById('vehiclePlateInput').value.trim();
  const rate_per_day = parseFloat(document.getElementById('vehicleRateInput').value) || 0;
  let photo = document.getElementById('vehiclePhotoInput').value.trim();

  // If a file was uploaded in file input
  const fileInput = document.getElementById('vehiclePhotoFile');
  if (fileInput && fileInput.files && fileInput.files[0]) {
    const formData = new FormData();
    formData.append('photo', fileInput.files[0]);
    try {
      const upRes = await fetch('/api/upload', { method: 'POST', body: formData });
      if (upRes.ok) {
        const upData = await upRes.json();
        if (upData.photoUrl) photo = upData.photoUrl;
      }
    } catch (err) {
      console.warn('File upload failed, using URL if present');
    }
  }

  if (!name || !plate_number) {
    alert(I18n.currentLang === 'en' ? 'Please fill in vehicle name and plate number!' : 'कृपया सवारीको नाम र नम्बर प्लेट अनिवार्य भर्नुहोस्!');
    return;
  }

  const payload = { name, category, plate_number, rate_per_day, photo };

  if (editId) {
    // Update existing vehicle
    const idx = appState.vehicles.findIndex(x => x.id === editId);
    if (idx !== -1) {
      appState.vehicles[idx] = { ...appState.vehicles[idx], ...payload };
      renderAll();
    }
    closeVehicleFormModal();
    showToast(I18n.currentLang === 'en' ? 'Vehicle details updated!' : 'सवारी साधन विवरण अद्यावधिक गरियो!');

    try {
      await fetch(`/api/vehicles/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e) {}

  } else {
    // Add new vehicle
    const newV = {
      id: 'v_' + Date.now(),
      status: 'available',
      current_rental: null,
      created_at: new Date().toISOString(),
      ...payload
    };
    appState.vehicles.unshift(newV);
    renderAll();
    closeVehicleFormModal();
    showToast(I18n.currentLang === 'en' ? 'New vehicle added successfully!' : 'नयाँ सवारी साधन सफलतापूर्वक थपियो!');

    try {
      await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e) {}
  }

  if (broadcastSync) {
    broadcastSync.postMessage({ type: 'REFRESH_STATE' });
  }
}

// Delete Vehicle
async function confirmDeleteVehicle(vehicleId) {
  const v = appState.vehicles.find(x => x.id === vehicleId);
  if (!v) return;

  if (v.status !== 'available') {
    alert(I18n.t('vehOnRentDeleteWarn'));
    return;
  }

  if (!confirm(`${I18n.t('deleteVehConfirm')} (${v.name} - ${v.plate_number})`)) {
    return;
  }

  const idx = appState.vehicles.findIndex(x => x.id === vehicleId);
  if (idx !== -1) {
    appState.vehicles.splice(idx, 1);
    renderAll();
  }
  showToast(I18n.currentLang === 'en' ? 'Vehicle deleted!' : 'सवारी साधन मेटाइयो!');

  try {
    await fetch(`/api/vehicles/${vehicleId}`, { method: 'DELETE' });
  } catch (e) {}

  if (broadcastSync) {
    broadcastSync.postMessage({ type: 'REFRESH_STATE' });
  }
}

// ==========================================
// EVENT LISTENERS & NAVIGATION
// ==========================================
function setupEventListeners() {
  // Category tabs
  document.querySelectorAll('.cat-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cat-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      appState.selectedCategory = btn.dataset.category;
      renderVehicles();
    });
  });

  // Status pills
  document.querySelectorAll('.status-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.status-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      appState.selectedStatus = pill.dataset.status;
      renderVehicles();
    });
  });

  // Vehicle Search Input
  const searchInput = document.getElementById('vehicleSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      appState.searchQuery = e.target.value.trim();
      renderVehicles();
    });
  }

  // History Search Input
  const histSearchInput = document.getElementById('historySearchInput');
  if (histSearchInput) {
    histSearchInput.addEventListener('input', (e) => {
      appState.historySearchQuery = e.target.value.trim();
      renderHistory();
    });
  }

  // View Toggle: Fleet vs History
  const viewVehiclesBtn = document.getElementById('viewVehiclesBtn');
  const viewHistoryBtn = document.getElementById('viewHistoryBtn');
  const vehiclesSection = document.getElementById('vehiclesSection');
  const historySection = document.getElementById('historySection');

  if (viewVehiclesBtn && viewHistoryBtn) {
    viewVehiclesBtn.addEventListener('click', () => {
      viewVehiclesBtn.classList.add('active');
      viewHistoryBtn.classList.remove('active');
      if (vehiclesSection) vehiclesSection.style.display = 'block';
      if (historySection) historySection.classList.remove('active');
    });

    viewHistoryBtn.addEventListener('click', () => {
      viewHistoryBtn.classList.add('active');
      viewVehiclesBtn.classList.remove('active');
      if (vehiclesSection) vehiclesSection.style.display = 'none';
      if (historySection) historySection.classList.add('active');
      renderHistory();
    });
  }

  // Vehicle Form Submit
  const vehicleForm = document.getElementById('vehicleForm');
  if (vehicleForm) {
    vehicleForm.addEventListener('submit', handleVehicleFormSubmit);
  }

  // Photo URL preview
  const photoUrlInput = document.getElementById('vehiclePhotoInput');
  const photoPrev = document.getElementById('photoPreviewImg');
  if (photoUrlInput && photoPrev) {
    photoUrlInput.addEventListener('input', (e) => {
      if (e.target.value) {
        photoPrev.src = e.target.value;
        photoPrev.style.display = 'block';
      } else {
        photoPrev.style.display = 'none';
      }
    });
  }

  // Photo file upload change preview
  const photoFileInput = document.getElementById('vehiclePhotoFile');
  if (photoFileInput && photoPrev) {
    photoFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = (re) => {
          photoPrev.src = re.target.result;
          photoPrev.style.display = 'block';
        };
        reader.readAsDataURL(e.target.files[0]);
      }
    });
  }
}

// Preset photo setter helper
window.setPresetPhoto = function(url) {
  const photoUrlInput = document.getElementById('vehiclePhotoInput');
  const photoPrev = document.getElementById('photoPreviewImg');
  if (photoUrlInput) photoUrlInput.value = url;
  if (photoPrev) {
    photoPrev.src = url;
    photoPrev.style.display = 'block';
  }
};

// Toast Notifications
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}" style="color: ${type === 'success' ? '#10B981' : '#EF4444'};"></i> <span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Escape HTML for safety
function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
