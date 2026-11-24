const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial sample data if no data exists
const initialData = {
  vehicles: [
    {
      id: 'v_1',
      name: 'Royal Enfield Classic 350',
      category: 'bike',
      plate_number: 'BA 03 PA 9901',
      photo: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80',
      rate_per_day: 2500,
      status: 'rented',
      current_rental: {
        customer_name: 'Bikash Thapa',
        phone1: '9845012345',
        phone2: '9801234567',
        phone3: '',
        phone4: '',
        start_date_bs: '2083-08-04',
        expected_return_date_bs: '2083-08-09',
        total_days: 5,
        status: 'rented',
        advance_amount: 5000,
        notes: 'Deposit license submitted'
      },
      created_at: new Date().toISOString()
    },
    {
      id: 'v_2',
      name: 'TVS Ntorq 125 Race Edition',
      category: 'scooty',
      plate_number: 'BA 03 PA 4521',
      photo: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80',
      rate_per_day: 1200,
      status: 'available',
      current_rental: null,
      created_at: new Date().toISOString()
    },
    {
      id: 'v_3',
      name: 'Yamaha MT-15 V2',
      category: 'bike',
      plate_number: 'NA 48 PA 1290',
      photo: 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?auto=format&fit=crop&w=800&q=80',
      rate_per_day: 2200,
      status: 'booked',
      current_rental: {
        customer_name: 'Suman Shrestha',
        phone1: '9855023456',
        phone2: '9812345678',
        phone3: '9845678901',
        phone4: '',
        start_date_bs: '2083-08-10',
        expected_return_date_bs: '2083-08-13',
        total_days: 3,
        status: 'booked',
        advance_amount: 2000,
        notes: 'Booked for Sauraha trip'
      },
      created_at: new Date().toISOString()
    },
    {
      id: 'v_4',
      name: 'Honda Dio 110',
      category: 'scooty',
      plate_number: 'BA 02 PA 7890',
      photo: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80',
      rate_per_day: 1000,
      status: 'available',
      current_rental: null,
      created_at: new Date().toISOString()
    },
    {
      id: 'v_5',
      name: 'Hyundai Creta SX',
      category: 'car',
      plate_number: 'BA 02 CHA 3312',
      photo: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
      rate_per_day: 6500,
      status: 'rented',
      current_rental: {
        customer_name: 'Ramesh Adhikari',
        phone1: '9855011223',
        phone2: '9845099887',
        phone3: '',
        phone4: '',
        start_date_bs: '2083-08-05',
        expected_return_date_bs: '2083-08-08',
        total_days: 3,
        status: 'rented',
        advance_amount: 10000,
        notes: 'Self drive Bharatpur to Pokhara'
      },
      created_at: new Date().toISOString()
    },
    {
      id: 'v_6',
      name: 'Maruti Suzuki Swift ZXi',
      category: 'car',
      plate_number: 'BA 03 CHA 8721',
      photo: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
      rate_per_day: 4500,
      status: 'available',
      current_rental: null,
      created_at: new Date().toISOString()
    }
  ],
  history: [
    {
      id: 'hist_1',
      vehicle_id: 'v_2',
      vehicle_name: 'TVS Ntorq 125 Race Edition',
      vehicle_plate: 'BA 03 PA 4521',
      vehicle_category: 'scooty',
      customer_name: 'Anup Poudel',
      phone1: '9845112233',
      phone2: '9804556677',
      phone3: '',
      phone4: '',
      start_date_bs: '2083-08-01',
      return_date_bs: '2083-08-03',
      total_days: 2,
      amount_paid: 2400,
      notes: 'Returned on time in good condition',
      created_at: new Date(Date.now() - 2 * 86400000).toISOString()
    },
    {
      id: 'hist_2',
      vehicle_id: 'v_1',
      vehicle_name: 'Royal Enfield Classic 350',
      vehicle_plate: 'BA 03 PA 9901',
      vehicle_category: 'bike',
      customer_name: 'Prakash Gurung',
      phone1: '9855044556',
      phone2: '9812998877',
      phone3: '9845001122',
      phone4: '',
      start_date_bs: '2083-07-25',
      return_date_bs: '2083-07-28',
      total_days: 3,
      amount_paid: 7500,
      notes: 'Trip to Chitwan National Park',
      created_at: new Date(Date.now() - 7 * 86400000).toISOString()
    }
  ]
};

let memData = null;
let mysqlPool = null;
let isMysqlConnected = false;

// Load file data
function loadFileData() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf8');
      memData = JSON.parse(content);
      return;
    } catch (e) {
      console.error('Error reading JSON DB file, using fallback:', e);
    }
  }
  memData = JSON.parse(JSON.stringify(initialData));
  saveFileData();
}

function saveFileData() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(memData, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving DB file:', e);
  }
}

// MySQL Configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'bharatpur_rental',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Initialize MySQL if running
async function initMysql() {
  try {
    // Attempt connecting to MySQL server (without database first)
    const conn = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      port: dbConfig.port
    });

    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\`;`);
    await conn.end();

    mysqlPool = mysql.createPool(dbConfig);

    // Create tables
    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        category VARCHAR(30) NOT NULL,
        plate_number VARCHAR(100) NOT NULL,
        photo LONGTEXT,
        rate_per_day DECIMAL(10,2) DEFAULT 0,
        status VARCHAR(30) DEFAULT 'available',
        current_rental JSON,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS rental_history (
        id VARCHAR(64) PRIMARY KEY,
        vehicle_id VARCHAR(64),
        vehicle_name VARCHAR(150),
        vehicle_plate VARCHAR(100),
        vehicle_category VARCHAR(50),
        customer_name VARCHAR(150),
        phone1 VARCHAR(30) NOT NULL,
        phone2 VARCHAR(30),
        phone3 VARCHAR(30),
        phone4 VARCHAR(30),
        start_date_bs VARCHAR(20),
        return_date_bs VARCHAR(20),
        total_days INT,
        amount_paid DECIMAL(10,2) DEFAULT 0,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Check if mysql has vehicles, if not populate from memData
    const [rows] = await mysqlPool.query('SELECT COUNT(*) as cnt FROM vehicles');
    if (rows[0].cnt === 0 && memData && memData.vehicles) {
      for (const v of memData.vehicles) {
        await mysqlPool.query(
          'INSERT INTO vehicles (id, name, category, plate_number, photo, rate_per_day, status, current_rental, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [v.id, v.name, v.category, v.plate_number, v.photo, v.rate_per_day, v.status, JSON.stringify(v.current_rental || null), new Date()]
        );
      }
      for (const h of memData.history) {
        await mysqlPool.query(
          'INSERT INTO rental_history (id, vehicle_id, vehicle_name, vehicle_plate, vehicle_category, customer_name, phone1, phone2, phone3, phone4, start_date_bs, return_date_bs, total_days, amount_paid, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [h.id, h.vehicle_id, h.vehicle_name, h.vehicle_plate, h.vehicle_category, h.customer_name, h.phone1, h.phone2, h.phone3, h.phone4, h.start_date_bs, h.return_date_bs, h.total_days, h.amount_paid, h.notes, new Date()]
        );
      }
    }

    isMysqlConnected = true;
    console.log('✅ Connected to MySQL database:', dbConfig.database);
  } catch (err) {
    isMysqlConnected = false;
    console.log('ℹ️ MySQL not connected (' + err.code + '). Using instant internal persistent JSON DB engine. Ready immediately!');
  }
}

// Get all data
async function getState() {
  if (isMysqlConnected && mysqlPool) {
    try {
      const [vRows] = await mysqlPool.query('SELECT * FROM vehicles ORDER BY created_at DESC');
      const [hRows] = await mysqlPool.query('SELECT * FROM rental_history ORDER BY created_at DESC');

      const vehicles = vRows.map(r => ({
        id: r.id,
        name: r.name,
        category: r.category,
        plate_number: r.plate_number,
        photo: r.photo,
        rate_per_day: parseFloat(r.rate_per_day) || 0,
        status: r.status,
        current_rental: typeof r.current_rental === 'string' ? JSON.parse(r.current_rental) : r.current_rental,
        created_at: r.created_at
      }));

      const history = hRows.map(r => ({
        id: r.id,
        vehicle_id: r.vehicle_id,
        vehicle_name: r.vehicle_name,
        vehicle_plate: r.vehicle_plate,
        vehicle_category: r.vehicle_category,
        customer_name: r.customer_name,
        phone1: r.phone1,
        phone2: r.phone2,
        phone3: r.phone3,
        phone4: r.phone4,
        start_date_bs: r.start_date_bs,
        return_date_bs: r.return_date_bs,
        total_days: r.total_days,
        amount_paid: parseFloat(r.amount_paid) || 0,
        notes: r.notes,
        created_at: r.created_at
      }));

      // Keep memData synced
      memData.vehicles = vehicles;
      memData.history = history;
      saveFileData();

      return { vehicles, history, isMysql: true };
    } catch (e) {
      console.error('MySQL query error, using local fallback:', e);
    }
  }

  return { vehicles: memData.vehicles, history: memData.history, isMysql: false };
}

// Add vehicle
async function addVehicle(vData) {
  const newV = {
    id: 'v_' + Date.now(),
    name: vData.name || 'Untitled Vehicle',
    category: vData.category || 'bike',
    plate_number: vData.plate_number || '',
    photo: vData.photo || '',
    rate_per_day: parseFloat(vData.rate_per_day) || 0,
    status: 'available',
    current_rental: null,
    created_at: new Date().toISOString()
  };

  memData.vehicles.unshift(newV);
  saveFileData();

  if (isMysqlConnected && mysqlPool) {
    try {
      await mysqlPool.query(
        'INSERT INTO vehicles (id, name, category, plate_number, photo, rate_per_day, status, current_rental, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [newV.id, newV.name, newV.category, newV.plate_number, newV.photo, newV.rate_per_day, newV.status, null, new Date()]
      );
    } catch (e) {
      console.error('MySQL addVehicle error:', e);
    }
  }

  return newV;
}

// Update vehicle
async function updateVehicle(id, updates) {
  const index = memData.vehicles.findIndex(v => v.id === id);
  if (index === -1) return null;

  const current = memData.vehicles[index];
  const updated = {
    ...current,
    name: updates.name !== undefined ? updates.name : current.name,
    category: updates.category !== undefined ? updates.category : current.category,
    plate_number: updates.plate_number !== undefined ? updates.plate_number : current.plate_number,
    photo: updates.photo !== undefined ? updates.photo : current.photo,
    rate_per_day: updates.rate_per_day !== undefined ? parseFloat(updates.rate_per_day) : current.rate_per_day,
    status: updates.status !== undefined ? updates.status : current.status,
    current_rental: updates.current_rental !== undefined ? updates.current_rental : current.current_rental,
    updated_at: new Date().toISOString()
  };

  memData.vehicles[index] = updated;
  saveFileData();

  if (isMysqlConnected && mysqlPool) {
    try {
      await mysqlPool.query(
        'UPDATE vehicles SET name = ?, category = ?, plate_number = ?, photo = ?, rate_per_day = ?, status = ?, current_rental = ? WHERE id = ?',
        [updated.name, updated.category, updated.plate_number, updated.photo, updated.rate_per_day, updated.status, JSON.stringify(updated.current_rental || null), id]
      );
    } catch (e) {
      console.error('MySQL updateVehicle error:', e);
    }
  }

  return updated;
}

// Delete vehicle
async function deleteVehicle(id) {
  const index = memData.vehicles.findIndex(v => v.id === id);
  if (index === -1) return false;

  memData.vehicles.splice(index, 1);
  saveFileData();

  if (isMysqlConnected && mysqlPool) {
    try {
      await mysqlPool.query('DELETE FROM vehicles WHERE id = ?', [id]);
    } catch (e) {
      console.error('MySQL deleteVehicle error:', e);
    }
  }

  return true;
}

// Rent or Book vehicle
async function rentOrBookVehicle(vehicleId, rentalData) {
  const index = memData.vehicles.findIndex(v => v.id === vehicleId);
  if (index === -1) return null;

  const v = memData.vehicles[index];
  const status = rentalData.action_type === 'booked' ? 'booked' : 'rented';

  const rentalRecord = {
    customer_name: rentalData.customer_name || '',
    phone1: rentalData.phone1 || '',
    phone2: rentalData.phone2 || '',
    phone3: rentalData.phone3 || '',
    phone4: rentalData.phone4 || '',
    start_date_bs: rentalData.start_date_bs || '',
    expected_return_date_bs: rentalData.expected_return_date_bs || '',
    total_days: parseInt(rentalData.total_days, 10) || 1,
    status: status,
    advance_amount: parseFloat(rentalData.advance_amount) || 0,
    notes: rentalData.notes || '',
    created_at: new Date().toISOString()
  };

  v.status = status;
  v.current_rental = rentalRecord;
  saveFileData();

  if (isMysqlConnected && mysqlPool) {
    try {
      await mysqlPool.query(
        'UPDATE vehicles SET status = ?, current_rental = ? WHERE id = ?',
        [status, JSON.stringify(rentalRecord), vehicleId]
      );
    } catch (e) {
      console.error('MySQL rentOrBook error:', e);
    }
  }

  return v;
}

// Return vehicle -> moves active rental to history and marks vehicle available
async function returnVehicle(vehicleId, returnData) {
  const index = memData.vehicles.findIndex(v => v.id === vehicleId);
  if (index === -1) return null;

  const v = memData.vehicles[index];
  const cr = v.current_rental || {};

  const historyItem = {
    id: 'hist_' + Date.now(),
    vehicle_id: v.id,
    vehicle_name: v.name,
    vehicle_plate: v.plate_number,
    vehicle_category: v.category,
    customer_name: cr.customer_name || returnData.customer_name || 'Customer',
    phone1: cr.phone1 || returnData.phone1 || '',
    phone2: cr.phone2 || '',
    phone3: cr.phone3 || '',
    phone4: cr.phone4 || '',
    start_date_bs: cr.start_date_bs || returnData.start_date_bs || '',
    return_date_bs: returnData.return_date_bs || cr.expected_return_date_bs || '',
    total_days: parseInt(returnData.total_days || cr.total_days, 10) || 1,
    amount_paid: parseFloat(returnData.amount_paid !== undefined ? returnData.amount_paid : cr.advance_amount) || 0,
    notes: returnData.notes || cr.notes || '',
    created_at: new Date().toISOString()
  };

  memData.history.unshift(historyItem);
  v.status = 'available';
  v.current_rental = null;
  saveFileData();

  if (isMysqlConnected && mysqlPool) {
    try {
      await mysqlPool.query(
        'UPDATE vehicles SET status = ?, current_rental = NULL WHERE id = ?',
        ['available', vehicleId]
      );
      await mysqlPool.query(
        'INSERT INTO rental_history (id, vehicle_id, vehicle_name, vehicle_plate, vehicle_category, customer_name, phone1, phone2, phone3, phone4, start_date_bs, return_date_bs, total_days, amount_paid, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          historyItem.id, historyItem.vehicle_id, historyItem.vehicle_name, historyItem.vehicle_plate,
          historyItem.vehicle_category, historyItem.customer_name, historyItem.phone1, historyItem.phone2,
          historyItem.phone3, historyItem.phone4, historyItem.start_date_bs, historyItem.return_date_bs,
          historyItem.total_days, historyItem.amount_paid, historyItem.notes, new Date()
        ]
      );
    } catch (e) {
      console.error('MySQL returnVehicle error:', e);
    }
  }

  return { vehicle: v, history: historyItem };
}

// Delete history record
async function deleteHistory(historyId) {
  const index = memData.history.findIndex(h => h.id === historyId);
  if (index === -1) return false;

  memData.history.splice(index, 1);
  saveFileData();

  if (isMysqlConnected && mysqlPool) {
    try {
      await mysqlPool.query('DELETE FROM rental_history WHERE id = ?', [historyId]);
    } catch (e) {
      console.error('MySQL deleteHistory error:', e);
    }
  }

  return true;
}

// Initialize on require
loadFileData();
initMysql();

module.exports = {
  getState,
  addVehicle,
  updateVehicle,
  deleteVehicle,
  rentOrBookVehicle,
  returnVehicle,
  deleteHistory,
  getDbStatus: () => ({ isMysql: isMysqlConnected, host: dbConfig.host, database: dbConfig.database })
};
