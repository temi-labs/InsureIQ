import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import cors from 'cors';

const DB_FILE = path.join(process.cwd(), 'data', 'db.json');

// --- DATABASE SYNCHRONIZATION QUEUE ---
class DBQueue {
  private queue: Promise<void> = Promise.resolve();

  async execute<T>(task: () => Promise<T>): Promise<T> {
    let resolveQueue!: () => void;

    const nextQueue = new Promise<void>((res) => {
      resolveQueue = res;
    });

    const prevQueue = this.queue;
    this.queue = nextQueue;

    await prevQueue.catch(() => {});

    try {
      return await task();
    } finally {
      resolveQueue();
    }
  }
}

const dbQueue = new DBQueue();

const INITIAL_DB = {
  users: [],
  policies: [],
  claims: [],
  activities: [],
  notifications: [],
};

// --- READ DATABASE ---
async function readDB() {
  return dbQueue.execute(async () => {
    let rawData = '';

    try {
      rawData = await fs.readFile(DB_FILE, 'utf-8');
      return JSON.parse(rawData);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return JSON.parse(JSON.stringify(INITIAL_DB));
      }

      if (error instanceof SyntaxError) {
        console.error('DB corruption detected.');

        try {
          await fs.writeFile(
            `${DB_FILE}.corrupted.${Date.now()}`,
            rawData,
            'utf-8'
          );
        } catch (backupError) {
          console.error('Failed to backup corrupted DB:', backupError);
        }

        return JSON.parse(JSON.stringify(INITIAL_DB));
      }

      throw error;
    }
  });
}

// --- WRITE DATABASE ---
async function writeDB(data: any) {
  return dbQueue.execute(async () => {
    try {
      const jsonString = JSON.stringify(data, null, 2);

      JSON.parse(jsonString);

      const tempFile = `${DB_FILE}.tmp.${Date.now()}`;

      await fs.writeFile(tempFile, jsonString, 'utf-8');
      await fs.rename(tempFile, DB_FILE);
    } catch (error) {
      console.error('Critical DB write error:', error);
      throw error;
    }
  });
}

// --- SAFE DB MUTATION ---
async function updateDB<T>(
  mutator: (db: any) => T | Promise<T>
): Promise<T> {
  return dbQueue.execute(async () => {
    let db;
    let rawData = '';

    try {
      rawData = await fs.readFile(DB_FILE, 'utf-8');
      db = JSON.parse(rawData);
    } catch (error: any) {
      if (error.code === 'ENOENT' || error instanceof SyntaxError) {
        db = JSON.parse(JSON.stringify(INITIAL_DB));
      } else {
        throw error;
      }
    }

    const result = await mutator(db);

    const jsonString = JSON.stringify(db, null, 2);

    JSON.parse(jsonString);

    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;

    await fs.writeFile(tempFile, jsonString, 'utf-8');
    await fs.rename(tempFile, DB_FILE);

    return result;
  });
}

async function startServer() {
  const app = express();

  const PORT = process.env.PORT
    ? parseInt(process.env.PORT, 10)
    : 3000;

  app.use(cors({ origin: '*' }));

  app.use(express.json({ limit: '10mb' }));

  app.use(
    express.urlencoded({
      limit: '10mb',
      extended: true,
    })
  );

  // --- REQUEST LOGGER ---
  app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
      console.log(
        `[${new Date().toISOString()}] ${req.method} ${req.url}`
      );
    }

    next();
  });

  // --- HEALTH CHECK ---
  app.get('/', (req, res) => {
    res.json({
      status: 'Backend running successfully',
    });
  });

  // =========================
  // AUTH ROUTES
  // =========================

  app.post('/api/register', async (req, res) => {
    try {
      const { name, email, password, role } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({
          error: 'Missing required fields',
        });
      }

      let existingUser = false;

      const newUser = {
        id: `USR-${Date.now()}`,
        name,
        email,
        password,
        role: role || 'user',
        createdAt: new Date().toISOString(),
      };

      await updateDB((db) => {
        if (
          db.users.find((u: any) => u.email === email)
        ) {
          existingUser = true;
          return;
        }

        db.users.push(newUser);
      });

      if (existingUser) {
        return res.status(400).json({
          error: 'User already exists',
        });
      }

      const { password: _, ...userData } = newUser;

      res.status(201).json(userData);
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error: 'Internal server error',
      });
    }
  });

  app.post('/api/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      const db = await readDB();

      const user = db.users.find(
        (u: any) =>
          u.email === email &&
          u.password === password
      );

      if (!user) {
        return res.status(401).json({
          error: 'Invalid credentials',
        });
      }

      const { password: _, ...userData } = user;

      res.json(userData);
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error: 'Internal server error',
      });
    }
  });

  // =========================
  // USERS
  // =========================

  app.get('/api/users', async (req, res) => {
    try {
      const db = await readDB();

      res.json(db.users || []);
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error: 'Internal server error',
      });
    }
  });

  // =========================
  // POLICIES
  // =========================

  app.get('/api/policies', async (req, res) => {
    try {
      const db = await readDB();

      res.json(db.policies || []);
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error: 'Internal server error',
      });
    }
  });

  app.post('/api/policies', async (req, res) => {
    try {
      const policy = req.body;

      await updateDB((db) => {
        db.policies.push(policy);
      });

      res.status(201).json(policy);
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error: 'Failed to create policy',
      });
    }
  });

  // =========================
  // CLAIMS
  // =========================

  app.get('/api/claims', async (req, res) => {
    try {
      const db = await readDB();

      res.json(db.claims || []);
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error: 'Internal server error',
      });
    }
  });

  app.post('/api/claims', async (req, res) => {
    try {
      const claim = req.body;

      await updateDB((db) => {
        db.claims.push(claim);
      });

      res.status(201).json(claim);
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error: 'Failed to create claim',
      });
    }
  });

  // =========================
  // START SERVER
  // =========================

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();