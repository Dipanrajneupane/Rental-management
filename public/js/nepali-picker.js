/**
 * Interactive Bikram Sambat (BS) Nepali Date Picker
 * Connects to input fields, provides interactive calendar popup with months and gates.
 */

class NepaliDatePicker {
  constructor(inputElement, options = {}) {
    this.input = inputElement;
    this.options = Object.assign({
      onSelect: null,
      minYear: 2070,
      maxYear: 2090
    }, options);

    this.dropdown = null;
    this.currentViewYear = 2083;
    this.currentViewMonth = 8;
    this.selectedDate = null;

    this.init();
  }

  init() {
    // Determine initial view year/month
    const today = NepaliDate.getTodayBs();
    this.todayBs = today;
    this.currentViewYear = today.year;
    this.currentViewMonth = today.month;

    if (this.input.value) {
      const p = NepaliDate.parseBsDate(this.input.value);
      if (p) {
        this.currentViewYear = p.year;
        this.currentViewMonth = p.month;
        this.selectedDate = this.input.value;
      }
    }

    this.buildDropdown();
    this.bindEvents();
  }

  buildDropdown() {
    const parent = this.input.parentElement;
    this.dropdown = document.createElement('div');
    this.dropdown.className = 'nepali-picker-dropdown';
    parent.appendChild(this.dropdown);
    this.render();
  }

  render() {
    const isEn = (window.I18n && window.I18n.currentLang === 'en');
    const months = isEn ? NepaliDate.MONTHS_EN : NepaliDate.MONTHS_NP;
    const daysInMonth = NepaliDate.getDaysInBsMonth(this.currentViewYear, this.currentViewMonth);

    // Calculate starting day of week for this month
    const firstDayAd = NepaliDate.bsToAd(this.currentViewYear, this.currentViewMonth, 1);
    const startDayOfWeek = firstDayAd.getDay(); // 0 = Sunday

    let yearsHtml = '';
    for (let y = this.options.minYear; y <= this.options.maxYear; y++) {
      yearsHtml += `<option value="${y}" ${y === this.currentViewYear ? 'selected' : ''}>${y} BS</option>`;
    }

    let monthsHtml = '';
    for (let m = 1; m <= 12; m++) {
      monthsHtml += `<option value="${m}" ${m === this.currentViewMonth ? 'selected' : ''}>${months[m - 1]} (${m})</option>`;
    }

    const dayHeadersList = isEn 
      ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      : ['आइत', 'सोम', 'मंगल', 'बुध', 'बिहि', 'शुक्र', 'शनि'];

    let dayHeaders = dayHeadersList
      .map(d => `<div class="picker-day-head">${d}</div>`).join('');

    let gridHtml = '';
    // Empty cells before start day
    for (let i = 0; i < startDayOfWeek; i++) {
      gridHtml += `<div></div>`;
    }

    // Days 1 to daysInMonth
    for (let gate = 1; gate <= daysInMonth; gate++) {
      const dateStr = `${this.currentViewYear}-${String(this.currentViewMonth).padStart(2, '0')}-${String(gate).padStart(2, '0')}`;
      const isToday = (this.currentViewYear === this.todayBs.year && this.currentViewMonth === this.todayBs.month && gate === this.todayBs.day);
      const isSelected = (this.selectedDate === dateStr);

      gridHtml += `
        <button type="button" class="picker-gate-btn ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}" data-gate="${gate}">
          ${gate}
        </button>
      `;
    }

    this.dropdown.innerHTML = `
      <div class="picker-header">
        <select class="picker-select year-select">${yearsHtml}</select>
        <select class="picker-select month-select">${monthsHtml}</select>
      </div>
      <div class="picker-grid">
        ${dayHeaders}
        ${gridHtml}
      </div>
      <div class="picker-footer">
        <button type="button" class="btn btn-secondary today-btn" style="padding: 4px 10px; font-size: 0.75rem;">${isEn ? 'Today' : 'आज'} (${this.todayBs.formatted})</button>
        <button type="button" class="btn btn-secondary close-btn" style="padding: 4px 10px; font-size: 0.75rem;">${isEn ? 'Close' : 'बन्द'}</button>
      </div>
    `;

    // Dropdown internal events
    const yearSelect = this.dropdown.querySelector('.year-select');
    const monthSelect = this.dropdown.querySelector('.month-select');

    yearSelect.addEventListener('change', (e) => {
      this.currentViewYear = parseInt(e.target.value, 10);
      this.render();
    });

    monthSelect.addEventListener('change', (e) => {
      this.currentViewMonth = parseInt(e.target.value, 10);
      this.render();
    });

    this.dropdown.querySelectorAll('.picker-gate-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const gate = parseInt(btn.dataset.gate, 10);
        this.selectDate(this.currentViewYear, this.currentViewMonth, gate);
      });
    });

    this.dropdown.querySelector('.today-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      this.selectDate(this.todayBs.year, this.todayBs.month, this.todayBs.day);
    });

    this.dropdown.querySelector('.close-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      this.close();
    });
  }

  selectDate(year, month, gate) {
    const formatted = `${year}-${String(month).padStart(2, '0')}-${String(gate).padStart(2, '0')}`;
    this.selectedDate = formatted;
    this.input.value = formatted;
    this.input.dispatchEvent(new Event('input', { bubbles: true }));
    this.input.dispatchEvent(new Event('change', { bubbles: true }));
    if (typeof this.options.onSelect === 'function') {
      this.options.onSelect(formatted, { year, month, gate });
    }
    this.close();
  }

  open() {
    // Close other pickers
    document.querySelectorAll('.nepali-picker-dropdown.active').forEach(el => {
      if (el !== this.dropdown) el.classList.remove('active');
    });

    if (this.input.value) {
      const p = NepaliDate.parseBsDate(this.input.value);
      if (p) {
        this.currentViewYear = p.year;
        this.currentViewMonth = p.month;
        this.selectedDate = this.input.value;
      }
    }
    this.render();
    this.dropdown.classList.add('active');
  }

  close() {
    this.dropdown.classList.remove('active');
  }

  toggle() {
    if (this.dropdown.classList.contains('active')) {
      this.close();
    } else {
      this.open();
    }
  }

  bindEvents() {
    this.input.addEventListener('focus', () => this.open());
    this.input.addEventListener('click', (e) => {
      e.stopPropagation();
      this.open();
    });

    const toggleBtn = this.input.parentElement.querySelector('.bs-calendar-toggle-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggle();
      });
    }

    document.addEventListener('click', (e) => {
      if (!this.dropdown.contains(e.target) && e.target !== this.input && (!toggleBtn || !toggleBtn.contains(e.target))) {
        this.close();
      }
    });
  }
}

window.NepaliDatePicker = NepaliDatePicker;
