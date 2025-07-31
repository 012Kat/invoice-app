import express from 'express';
import bcrypt from 'bcrypt';
import { db } from './invoices.js';

const router = express.Router();

// Protect routes
router.use((req, res, next) => {
  if (!req.session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

router.get('/', async (req, res) => {
  const users = await db.all('SELECT id, username FROM admin_users');
  res.json(users);
});

router.post('/', async (req, res) => {
  const { username, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.run('INSERT INTO admin_users (username, password) VALUES (?, ?)', [username, hashedPassword]);
    res.json({ success: true });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ error: 'Username already exists' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

router.delete('/:id', async (req, res) => {
  const result = await db.run('DELETE FROM admin_users WHERE id = ?', [req.params.id]);
  result.changes === 0 ? res.status(404).json({ error: 'Not found' }) : res.json({ success: true });
});

export default router;
