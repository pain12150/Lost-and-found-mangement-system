import express from 'express';
import cors from 'cors';
import pg from 'pg';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOADS_DIR));

// Multer storage configuration for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Database configuration (Exclusively PostgreSQL)
let db;

async function initDb() {
  if (!process.env.DATABASE_URL) {
    console.error('FATAL CONFIGURATION ERROR: DATABASE_URL environment variable is missing.');
    console.error('The application requires an online cloud database connection (e.g. Supabase Postgres) to start.');
    process.exit(1);
  }

  console.log('Connecting to remote PostgreSQL database...');
  
  // Set up Postgres connection pool
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Required for platforms like Render/Supabase
    }
  });

  // Translate "?" placeholders to Postgres "$1, $2" style
  const pgTranslate = (sql) => {
    let index = 1;
    return sql.replace(/\?/g, () => `$${index++}`);
  };

  db = {
    get: async (sql, params = []) => {
      const result = await pool.query(pgTranslate(sql), params);
      return result.rows[0] || null;
    },
    all: async (sql, params = []) => {
      const result = await pool.query(pgTranslate(sql), params);
      return result.rows;
    },
    run: async (sql, params = []) => {
      const translated = pgTranslate(sql);
      let querySql = translated;
      
      const isInsert = sql.trim().toUpperCase().startsWith('INSERT');
      if (isInsert) {
        querySql = `${translated} RETURNING id`;
      }

      const result = await pool.query(querySql, params);
      const lastID = isInsert && result.rows[0] ? result.rows[0].id : null;
      return { lastID, changes: result.rowCount };
    },
    exec: async (sql) => {
      await pool.query(sql);
    }
  };

  // Create Postgres schemas
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      student_id TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS items (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      type TEXT CHECK(type IN ('lost', 'found')) NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      location TEXT NOT NULL,
      date_lost_found TEXT NOT NULL,
      image_url TEXT,
      status TEXT CHECK(status IN ('open', 'claimed', 'resolved')) DEFAULT 'open',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS claims (
      id SERIAL PRIMARY KEY,
      item_id INTEGER NOT NULL,
      claimant_id INTEGER NOT NULL,
      proof_description TEXT NOT NULL,
      contact_info TEXT NOT NULL,
      status TEXT CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(item_id) REFERENCES items(id),
      FOREIGN KEY(claimant_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);

  // Seed default database parameters if empty
  const userCount = await db.get('SELECT COUNT(*) as count FROM users');
  if (parseInt(userCount.count) === 0) {
    console.log('Seeding database with university mock data...');

    // Helper to hash passwords
    const hashPassword = (password) => crypto.createHash('sha256').update(password).digest('hex');

    // Create mock students
    await db.run(
      'INSERT INTO users (name, email, student_id, password_hash) VALUES (?, ?, ?, ?)',
      ['Alice Smith', 'alice@student.edu', 'STU-2026-001', hashPassword('password123')]
    );
    await db.run(
      'INSERT INTO users (name, email, student_id, password_hash) VALUES (?, ?, ?, ?)',
      ['Bob Johnson', 'bob@student.edu', 'STU-2026-002', hashPassword('password123')]
    );
    await db.run(
      'INSERT INTO users (name, email, student_id, password_hash) VALUES (?, ?, ?, ?)',
      ['Charlie Brown', 'charlie@student.edu', 'STU-2026-003', hashPassword('password123')]
    );

    // Create mock items (associated with university)
    await db.run(`
      INSERT INTO items (user_id, type, title, description, category, location, date_lost_found, image_url, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [1, 'lost', 'Casio Scientific Calculator fx-991EX', 'Left my scientific calculator in Physics Lab 3 on the front bench. It has a small sticker of a black cat on the back cover.', 'Electronics & Laptops', 'Physics Lab 3', '2026-06-14', '', 'open']
    );

    await db.run(`
      INSERT INTO items (user_id, type, title, description, category, location, date_lost_found, image_url, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [3, 'found', 'Calculus: Early Transcendentals Textbook', 'Found a thick calculus textbook on a study table in the library reading room. It has a student name "S. Patel" written on the first page.', 'Books & Stationery', 'Central Library (Reading Room)', '2026-06-15', '', 'open']
    );

    await db.run(`
      INSERT INTO items (user_id, type, title, description, category, location, date_lost_found, image_url, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [1, 'lost', 'Hostel Dorm Access Card & Key', 'Lost my blue lanyard with student ID card and Hostel Room A-102 access key card. Must have dropped it between the main cafeteria and Hostel block A.', 'Keys & Dorm Access', 'Hostel A Pathway', '2026-06-15', '', 'open']
    );

    await db.run(`
      INSERT INTO items (user_id, type, title, description, category, location, date_lost_found, image_url, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [2, 'found', 'Black Laptop USB-C Charger', 'Found a USB-C laptop charger plugged into the wall outlet in Seminar Hall 1.', 'Electronics & Laptops', 'Seminar Hall 1', '2026-06-16', '', 'open']
    );

    // Seed mock claims (Bob claims Charlie\'s found textbook)
    await db.run(`
      INSERT INTO claims (item_id, claimant_id, proof_description, contact_info, status) 
      VALUES (?, ?, ?, ?, ?)`,
      [2, 2, 'It is my textbook, the name "S. Patel" is my roommate\'s book which I borrowed for my midterms, and I can confirm the back cover has a coffee stain on page 100.', '+1 555-0199 / bob@student.edu', 'pending']
    );

    // Seed mock notifications
    await db.run(`
      INSERT INTO notifications (user_id, title, message) 
      VALUES (?, ?, ?)`,
      [3, 'New Claim Submitted', 'Bob Johnson (STU-2026-002) submitted a claim verification for your item "Calculus: Early Transcendentals Textbook".']
    );
  }
}

// ------------------- API ENDPOINTS -------------------

// Authentication API
app.post('/api/auth/register', async (req, res) => {
  const { name, email, student_id, password } = req.body;
  if (!name || !email || !student_id || !password) {
    return res.status(400).json({ error: 'Please provide all details' });
  }

  try {
    const password_hash = crypto.createHash('sha256').update(password).digest('hex');
    const result = await db.run(
      'INSERT INTO users (name, email, student_id, password_hash) VALUES (?, ?, ?, ?)',
      [name, email, student_id, password_hash]
    );
    res.status(201).json({ id: result.lastID, name, email, student_id });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed') || err.message.includes('unique constraint')) {
      if (err.message.includes('student_id')) {
        return res.status(400).json({ error: 'Student ID already registered' });
      }
      return res.status(400).json({ error: 'Email already registered' });
    }
    res.status(500).json({ error: 'Registration failed: ' + err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide email and password' });
  }

  try {
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const password_hash = crypto.createHash('sha256').update(password).digest('hex');
    if (user.password_hash !== password_hash) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    res.json({ id: user.id, name: user.name, email: user.email, student_id: user.student_id });
  } catch (err) {
    res.status(500).json({ error: 'Login failed: ' + err.message });
  }
});

// Items API
app.get('/api/items', async (req, res) => {
  const { search, category, type, status } = req.query;
  let query = `
    SELECT items.*, users.name as reporter_name, users.email as reporter_email, users.student_id as reporter_student_id
    FROM items 
    JOIN users ON items.user_id = users.id
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    query += ' AND (items.title LIKE ? OR items.description LIKE ? OR items.location LIKE ?)';
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam, searchParam);
  }
  if (category) {
    query += ' AND items.category = ?';
    params.push(category);
  }
  if (type) {
    query += ' AND items.type = ?';
    params.push(type);
  }
  if (status) {
    query += ' AND items.status = ?';
    params.push(status);
  }

  query += ' ORDER BY items.created_at DESC';

  try {
    const items = await db.all(query, params);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch items: ' + err.message });
  }
});

app.get('/api/items/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const item = await db.get(`
      SELECT items.*, users.name as reporter_name, users.email as reporter_email, users.student_id as reporter_student_id
      FROM items 
      JOIN users ON items.user_id = users.id
      WHERE items.id = ?
    `, [id]);

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch item: ' + err.message });
  }
});

app.post('/api/items', upload.single('image'), async (req, res) => {
  const { user_id, type, title, description, category, location, date_lost_found } = req.body;

  if (!user_id || !type || !title || !description || !category || !location || !date_lost_found) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  let image_url = '';
  if (req.file) {
    image_url = `/uploads/${req.file.filename}`;
  }

  try {
    const result = await db.run(`
      INSERT INTO items (user_id, type, title, description, category, location, date_lost_found, image_url, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open')
    `, [user_id, type, title, description, category, location, date_lost_found, image_url]);

    // Check matches
    const oppositeType = type === 'lost' ? 'found' : 'lost';
    const matches = await db.all(`
      SELECT items.*, users.name as user_name 
      FROM items 
      JOIN users ON items.user_id = users.id
      WHERE type = ? AND status = 'open' AND category = ? AND (title LIKE ? OR ? LIKE '%' || title || '%')
    `, [oppositeType, category, `%${title}%`, title]);

    if (matches.length > 0) {
      await db.run(`
        INSERT INTO notifications (user_id, title, message)
        VALUES (?, ?, ?)
      `, [user_id, 'Potential Match Found!', `We found ${matches.length} item(s) matching "${title}". Check: ${matches[0].title}.`]);

      for (const match of matches) {
        await db.run(`
          INSERT INTO notifications (user_id, title, message)
          VALUES (?, ?, ?)
        `, [match.user_id, 'Potential Match Reported!', `A new item "${title}" matching yours has been reported.`]);
      }
    }

    res.status(201).json({ id: result.lastID, image_url });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create item report: ' + err.message });
  }
});

// Claims / Finders Reports API
app.post('/api/items/:id/claims', async (req, res) => {
  const { id: item_id } = req.params;
  const { claimant_id, proof_description, contact_info } = req.body;

  if (!claimant_id || !proof_description || !contact_info) {
    return res.status(400).json({ error: 'Missing claim details' });
  }

  try {
    const item = await db.get('SELECT * FROM items WHERE id = ?', [item_id]);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    if (item.status !== 'open') {
      return res.status(400).json({ error: 'Item is not open for claims' });
    }
    if (item.user_id === parseInt(claimant_id)) {
      return res.status(400).json({ error: 'You cannot claim your own reported item' });
    }

    const existingClaim = await db.get('SELECT id FROM claims WHERE item_id = ? AND claimant_id = ? AND status = ?', [item_id, claimant_id, 'pending']);
    if (existingClaim) {
      return res.status(400).json({ error: 'You already have a pending claim for this item' });
    }

    const result = await db.run(`
      INSERT INTO claims (item_id, claimant_id, proof_description, contact_info, status)
      VALUES (?, ?, ?, ?, 'pending')
    `, [item_id, claimant_id, proof_description, contact_info]);

    const claimant = await db.get('SELECT name, student_id FROM users WHERE id = ?', [claimant_id]);

    const notifTitle = item.type === 'lost' ? 'Item Found Alert' : 'New Claim Submitted';
    const notifMessage = item.type === 'lost'
      ? `${claimant.name} (${claimant.student_id}) reported finding your lost item "${item.title}".`
      : `${claimant.name} (${claimant.student_id}) submitted a claim verification for your item "${item.title}".`;

    await db.run(`
      INSERT INTO notifications (user_id, title, message)
      VALUES (?, ?, ?)
    `, [item.user_id, notifTitle, notifMessage]);

    res.status(201).json({ id: result.lastID });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit claim: ' + err.message });
  }
});

app.get('/api/claims', async (req, res) => {
  const { user_id, role } = req.query;
  if (!user_id || !role) {
    return res.status(400).json({ error: 'Missing user_id or role' });
  }

  try {
    let query = '';
    const params = [user_id];

    if (role === 'received') {
      query = `
        SELECT claims.*, 
               items.title as item_title, items.image_url as item_image_url, items.status as item_status, items.type as item_type,
               claimants.name as claimant_name, claimants.email as claimant_email, claimants.student_id as claimant_student_id
        FROM claims
        JOIN items ON claims.item_id = items.id
        JOIN users as claimants ON claims.claimant_id = claimants.id
        WHERE items.user_id = ?
        ORDER BY claims.created_at DESC
      `;
    } else if (role === 'made') {
      query = `
        SELECT claims.*, 
               items.title as item_title, items.image_url as item_image_url, items.status as item_status, items.type as item_type,
               reporters.name as reporter_name, reporters.email as reporter_email, reporters.student_id as reporter_student_id
        FROM claims
        JOIN items ON claims.item_id = items.id
        JOIN users as reporters ON items.user_id = reporters.id
        WHERE claims.claimant_id = ?
        ORDER BY claims.created_at DESC
      `;
    } else {
      return res.status(400).json({ error: 'Invalid role parameter' });
    }

    const claims = await db.all(query, params);
    res.json(claims);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch claims: ' + err.message });
  }
});

// Update Claim Status (Accept/Reject)
app.put('/api/claims/:id', async (req, res) => {
  const { id } = req.params;
  const { status, user_id } = req.body;

  if (!status || !['approved', 'rejected'].includes(status) || !user_id) {
    return res.status(400).json({ error: 'Invalid parameters' });
  }

  try {
    const claim = await db.get(`
      SELECT claims.*, items.user_id as reporter_id, items.title as item_title, items.id as item_id, items.type as item_type
      FROM claims
      JOIN items ON claims.item_id = items.id
      WHERE claims.id = ?
    `, [id]);

    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    if (claim.reporter_id !== parseInt(user_id)) {
      return res.status(403).json({ error: 'Unauthorized.' });
    }

    await db.run(
      'UPDATE claims SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );

    if (status === 'approved') {
      await db.run(
        "UPDATE items SET status = 'resolved' WHERE id = ?",
        [claim.item_id]
      );

      const otherClaims = await db.all(
        "SELECT * FROM claims WHERE item_id = ? AND id != ? AND status = 'pending'",
        [claim.item_id, id]
      );

      for (const other of otherClaims) {
        await db.run(
          "UPDATE claims SET status = 'rejected', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
          [other.id]
        );
        
        const closeTitle = claim.item_type === 'lost' ? 'Report Closed' : 'Claim Closed';
        const closeMsg = claim.item_type === 'lost'
          ? `The report for "${claim.item_title}" has been closed because the owner accepted another finder's verification.`
          : `Your claim for "${claim.item_title}" was closed because it was returned to another claimant.`;

        await db.run(`
          INSERT INTO notifications (user_id, title, message)
          VALUES (?, ?, ?)
        `, [other.claimant_id, closeTitle, closeMsg]);
      }

      const appNotifTitle = claim.item_type === 'lost' ? 'Recovery Verified!' : 'Claim Approved!';
      const appNotifMsg = claim.item_type === 'lost'
        ? `Great news! The owner has verified your recovery report for "${claim.item_title}".`
        : `Great news! Your claim for "${claim.item_title}" has been approved. Contact the reporter to coordinate item collection.`;

      await db.run(`
        INSERT INTO notifications (user_id, title, message)
        VALUES (?, ?, ?)
      `, [claim.claimant_id, appNotifTitle, appNotifMsg]);

    } else if (status === 'rejected') {
      const rejNotifTitle = claim.item_type === 'lost' ? 'Recovery Rejected' : 'Claim Rejected';
      const rejNotifMsg = claim.item_type === 'lost'
        ? `Your recovery report for "${claim.item_title}" was not verified by the owner.`
        : `Your claim for "${claim.item_title}" has been rejected. The reporter did not accept your verification proof.`;

      await db.run(`
        INSERT INTO notifications (user_id, title, message)
        VALUES (?, ?, ?)
      `, [claim.claimant_id, rejNotifTitle, rejNotifMsg]);
    }

    res.json({ message: `Claim successfully ${status}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update claim: ' + err.message });
  }
});

// Notifications API
app.get('/api/notifications', async (req, res) => {
  const { user_id } = req.query;
  if (!user_id) {
    return res.status(400).json({ error: 'Missing user_id' });
  }

  try {
    const notifications = await db.all(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
      [user_id]
    );
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications: ' + err.message });
  }
});

app.put('/api/notifications/:id/read', async (req, res) => {
  const { id } = req.params;
  try {
    await db.run(
      'UPDATE notifications SET is_read = 1 WHERE id = ?',
      [id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark notification as read: ' + err.message });
  }
});

// Statically serve the Vite frontend React build (if it exists)
const DIST_DIR = path.join(__dirname, 'dist');
if (fs.existsSync(DIST_DIR)) {
  console.log('Serving production static build from:', DIST_DIR);
  app.use(express.static(DIST_DIR));
  app.get('*', (req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

// Start Express server
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
});
