import express from 'express';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../db/database.sqlite');

let db;

// Setup default admin
const setupAdminUser = async (db) => {
  await db.run(`CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  )`);

  const existing = await db.get(`SELECT * FROM admin_users WHERE username = ?`, ['admin']);
  if (!existing) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    await db.run(`INSERT INTO admin_users (username, password) VALUES (?, ?)`, ['admin', hashedPassword]);
    console.log('Default admin created: admin / password123');
  }
};

(async () => {
  db = await open({ filename: dbPath, driver: sqlite3.Database });

  await db.run(`CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client TEXT,
    amount REAL,
    due_date TEXT,
    status TEXT
  )`);

  await setupAdminUser(db);
})();

// Routes
router.get('/', async (req, res) => {
  const invoices = await db.all('SELECT * FROM invoices');
  res.json(invoices);
});

router.post('/', async (req, res) => {
  const { client, amount, due_date, status } = req.body;
  const result = await db.run(
    'INSERT INTO invoices (client, amount, due_date, status) VALUES (?, ?, ?, ?)',
    [client, amount, due_date, status]
  );
  res.json({ id: result.lastID });
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { client, amount, due_date, status } = req.body;

  const result = await db.run(
    'UPDATE invoices SET client = ?, amount = ?, due_date = ?, status = ? WHERE id = ?',
    [client, amount, due_date, status, id]
  );
  result.changes === 0 ? res.status(404).json({ error: 'Not found' }) : res.json({ success: true });
});

router.delete('/:id', async (req, res) => {
  const result = await db.run('DELETE FROM invoices WHERE id = ?', [req.params.id]);
  result.changes === 0 ? res.status(404).json({ error: 'Not found' }) : res.json({ success: true });
});

router.get('/search', async (req, res) => {
  const { client, status } = req.query;
  let query = 'SELECT * FROM invoices WHERE 1=1';
  const params = [];

  if (client) {
    query += ' AND client LIKE ?';
    params.push(`%${client}%`);
  }
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  const invoices = await db.all(query, params);
  res.json(invoices);
});

export { db };
export default router;
