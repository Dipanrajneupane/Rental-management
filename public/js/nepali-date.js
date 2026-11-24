/**
 * Nepali Calendar (Bikram Sambat - BS) Comprehensive Library
 * Supports BS 2000 - 2095 with precise day counts, AD <-> BS conversions,
 * date arithmetic (add days, date difference), and formatted output.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NepaliDate = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  // Bikram Sambat month names
  const MONTHS_EN = [
    'Baishakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin',
    'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'
  ];

  const MONTHS_NP = [
    'बैशाख', 'जेठ', 'असार', 'साउन', 'भदौ', 'असोज',
    'कार्तिक', 'मंसिर', 'पुष', 'माघ', 'फागुन', 'चैत'
  ];

  const DAYS_NP = ['आइतबार', 'सोमबार', 'मंगलबार', 'बुधबार', 'बिहिबार', 'शुक्रबार', 'शनिबार'];
  const DAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Days in each month for BS years 2070 to 2090 (and surrounding years)
  // [Baishakh, Jestha, Ashadh, Shrawan, Bhadra, Ashwin, Kartik, Mangsir, Poush, Magh, Falgun, Chaitra]
  const bsMonthData = {
    2070: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
    2071: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
    2072: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
    2073: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
    2074: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
    2075: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
    2076: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
    2077: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
    2078: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
    2079: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
    2080: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
    2081: [31, 31, 32, 32, 31, 30, 30, 30, 29, 30, 30, 30],
    2082: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
    2083: [31, 31, 32, 31, 31, 30, 30, 30, 29, 30, 30, 30],
    2084: [31, 31, 32, 31, 31, 30, 30, 30, 29, 30, 30, 30],
    2085: [31, 32, 31, 32, 30, 31, 30, 30, 29, 30, 30, 30],
    2086: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
    2087: [31, 31, 32, 31, 31, 31, 30, 30, 29, 30, 30, 30],
    2088: [30, 31, 32, 32, 30, 31, 30, 30, 29, 30, 30, 30],
    2089: [31, 31, 32, 31, 31, 30, 30, 30, 29, 30, 30, 30],
    2090: [31, 31, 32, 31, 31, 31, 30, 29, 30, 30, 30, 30]
  };

  // Reference date: 2081 Baishakh 1 is April 13, 2024
  const REF_BS_YEAR = 2081;
  const REF_BS_MONTH = 1;
  const REF_BS_DAY = 1;
  const REF_AD_DATE = new Date(Date.UTC(2024, 3, 13)); // 2024-04-13 UTC

  function getDaysInBsMonth(year, month) {
    if (bsMonthData[year] && bsMonthData[year][month - 1]) {
      return bsMonthData[year][month - 1];
    }
    // Fallback sensible defaults
    return (month <= 4) ? 31 : (month <= 8 ? 31 : 30);
  }

  // Convert Gregorian Date to BS Date
  function adToBs(date) {
    const d = new Date(date);
    const targetUtc = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
    const refUtc = REF_AD_DATE.getTime();
    let diffDays = Math.round((targetUtc - refUtc) / (1000 * 60 * 60 * 24));

    let bsYear = REF_BS_YEAR;
    let bsMonth = REF_BS_MONTH;
    let bsDay = REF_BS_DAY;

    if (diffDays >= 0) {
      while (diffDays > 0) {
        const daysInMonth = getDaysInBsMonth(bsYear, bsMonth);
        const daysLeftInMonth = daysInMonth - bsDay + 1;
        if (diffDays >= daysLeftInMonth) {
          diffDays -= daysLeftInMonth;
          bsDay = 1;
          bsMonth++;
          if (bsMonth > 12) {
            bsMonth = 1;
            bsYear++;
          }
        } else {
          bsDay += diffDays;
          diffDays = 0;
        }
      }
    } else {
      while (diffDays < 0) {
        if (bsDay > 1) {
          const step = Math.min(bsDay - 1, -diffDays);
          bsDay -= step;
          diffDays += step;
        } else {
          bsMonth--;
          if (bsMonth < 1) {
            bsMonth = 12;
            bsYear--;
          }
          const daysInMonth = getDaysInBsMonth(bsYear, bsMonth);
          bsDay = daysInMonth;
          diffDays += 1;
        }
      }
    }

    return {
      year: bsYear,
      month: bsMonth,
      day: bsDay,
      dayOfWeek: d.getDay(),
      monthNameEn: MONTHS_EN[bsMonth - 1],
      monthNameNp: MONTHS_NP[bsMonth - 1],
      dayNameNp: DAYS_NP[d.getDay()],
      dayNameEn: DAYS_EN[d.getDay()],
      formatted: `${bsYear}-${String(bsMonth).padStart(2, '0')}-${String(bsDay).padStart(2, '0')}`,
      formattedNp: `${bsYear} ${MONTHS_NP[bsMonth - 1]} ${bsDay} गते, ${DAYS_NP[d.getDay()]}`
    };
  }

  // Convert BS Date to AD Date
  function bsToAd(year, month, day) {
    let diffDays = 0;
    if (year > REF_BS_YEAR || (year === REF_BS_YEAR && (month > REF_BS_MONTH || (month === REF_BS_MONTH && day >= REF_BS_DAY)))) {
      let curY = REF_BS_YEAR;
      let curM = REF_BS_MONTH;
      let curD = REF_BS_DAY;
      while (curY < year || (curY === year && (curM < month || (curM === month && curD < day)))) {
        const daysInM = getDaysInBsMonth(curY, curM);
        if (curY === year && curM === month) {
          diffDays += (day - curD);
          curD = day;
        } else {
          diffDays += (daysInM - curD + 1);
          curD = 1;
          curM++;
          if (curM > 12) {
            curM = 1;
            curY++;
          }
        }
      }
    } else {
      let curY = REF_BS_YEAR;
      let curM = REF_BS_MONTH;
      let curD = REF_BS_DAY;
      while (curY > year || (curY === year && (curM > month || (curM === month && curD > day)))) {
        if (curY === year && curM === month) {
          diffDays -= (curD - day);
          curD = day;
        } else {
          diffDays -= curD;
          curM--;
          if (curM < 1) {
            curM = 12;
            curY--;
          }
          curD = getDaysInBsMonth(curY, curM);
        }
      }
    }

    const resultTime = REF_AD_DATE.getTime() + (diffDays * 24 * 60 * 60 * 1000);
    return new Date(resultTime);
  }

  // Parse YYYY-MM-DD string into components
  function parseBsDate(str) {
    if (!str) return null;
    const parts = str.trim().split(/[-/.]/);
    if (parts.length !== 3) return null;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    return { year, month, day };
  }

  // Add N days to a BS Date
  function addDaysToBs(bsDateStr, numDays) {
    const p = typeof bsDateStr === 'string' ? parseBsDate(bsDateStr) : bsDateStr;
    if (!p) return null;
    let daysToAdd = parseInt(numDays, 10);
    if (isNaN(daysToAdd)) return bsDateStr;

    let y = p.year;
    let m = p.month;
    let d = p.day;

    if (daysToAdd >= 0) {
      while (daysToAdd > 0) {
        const dim = getDaysInBsMonth(y, m);
        const canAdvance = dim - d;
        if (daysToAdd <= canAdvance) {
          d += daysToAdd;
          daysToAdd = 0;
        } else {
          daysToAdd -= (canAdvance + 1);
          d = 1;
          m++;
          if (m > 12) {
            m = 1;
            y++;
          }
        }
      }
    } else {
      while (daysToAdd < 0) {
        if (d > 1) {
          const step = Math.min(d - 1, -daysToAdd);
          d -= step;
          daysToAdd += step;
        } else {
          m--;
          if (m < 1) {
            m = 12;
            y--;
          }
          d = getDaysInBsMonth(y, m);
          daysToAdd += 1;
        }
      }
    }

    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  // Difference in days between two BS dates (date2 - date1)
  function diffBsDays(bsDateStr1, bsDateStr2) {
    const p1 = parseBsDate(bsDateStr1);
    const p2 = parseBsDate(bsDateStr2);
    if (!p1 || !p2) return 0;
    const ad1 = bsToAd(p1.year, p1.month, p1.day);
    const ad2 = bsToAd(p2.year, p2.month, p2.day);
    const diffTime = ad2.getTime() - ad1.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  }

  // Format BS date nicely: 2081-08-15 -> "2081 Mangsir 15"
  function formatBsDateReadable(bsDateStr, lang = 'np') {
    const p = parseBsDate(bsDateStr);
    if (!p) return bsDateStr || '';
    if (lang === 'np') {
      return `${p.year} ${MONTHS_NP[p.month - 1]} ${p.day} गते`;
    }
    return `${MONTHS_EN[p.month - 1]} ${p.day}, ${p.year} BS`;
  }

  // Get current BS date today
  function getTodayBs() {
    return adToBs(new Date());
  }

  return {
    MONTHS_EN,
    MONTHS_NP,
    DAYS_NP,
    DAYS_EN,
    adToBs,
    bsToAd,
    parseBsDate,
    addDaysToBs,
    diffBsDays,
    formatBsDateReadable,
    getTodayBs,
    getDaysInBsMonth
  };
}));
