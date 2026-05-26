import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { createServer as createViteServer } from 'vite';
import cors from 'cors';

const DB_FILE = path.join(process.cwd(), 'server', 'data', 'db.json');

// --- DATABASE SYNCHRONIZATION QUEUE ---
// Prevents concurrent read-modify-write operations and overlapping fs.writeFile calls
class DBQueue {
  private queue: Promise<void> = Promise.resolve();

  async execute<T>(task: () => Promise<T>): Promise<T> {
    let resolveQueue!: () => void;
    const nextQueue = new Promise<void>((res) => { resolveQueue = res; });
    
    // Wait for the previous task to finish
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
const INITIAL_DB = { users: [], policies: [], claims: [], activities: [], notifications: [] };

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
        console.error('DB Corruption Detected. Creating backup and returning empty schema.');
        try {
          await fs.writeFile(`${DB_FILE}.corrupted.${Date.now()}`, rawData, 'utf-8');
        } catch (e) {
          console.error('Failed to write corrupted backup', e);
        }
        return JSON.parse(JSON.stringify(INITIAL_DB));
      }
      throw error;
    }
  });
}

// Centralized safe database write function
async function writeDB(data: any) {
  return dbQueue.execute(async () => {
    try {
      const jsonString = JSON.stringify(data, null, 2);
      
      // Automatic JSON validation before saving
      JSON.parse(jsonString);

      // Atomic write: write to temp file, then rename.
      // This prevents appending errors and multiple async writes corrupting the main file.
      const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
      await fs.writeFile(tempFile, jsonString, 'utf-8');
      await fs.rename(tempFile, DB_FILE);
    } catch (error) {
      console.error("Critical error during writeDB:", error);
      throw error;
    }
  });
}

// Helper to safely modify DB atomically: Read -> Mutate -> Write
async function updateDB<T>(mutator: (db: any) => T | Promise<T>): Promise<T> {
  return dbQueue.execute(async () => {
    let db;
    let rawData = '';
    try {
      rawData = await fs.readFile(DB_FILE, 'utf-8');
      db = JSON.parse(rawData);
    } catch (error: any) {
      if (error.code === 'ENOENT' || error instanceof SyntaxError) {
        if (error instanceof SyntaxError) {
          console.error("DB Corruption Detected in updateDB. Recovering backup.");
          try {
             await fs.writeFile(`${DB_FILE}.bak.${Date.now()}`, rawData, 'utf-8');
          } catch(e){}
        }
        db = JSON.parse(JSON.stringify(INITIAL_DB));
      } else {
        throw error;
      }
    }

    const result = await mutator(db);

    const jsonString = JSON.stringify(db, null, 2);
    JSON.parse(jsonString); // validate
    
    // Atomic Write
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    await fs.writeFile(tempFile, jsonString, 'utf-8');
    await fs.rename(tempFile, DB_FILE);
    
    return result;
  });
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(cors({ origin: '*' }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Request Logging Middleware
  app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    }
    next();
  });

  // API Routes for Authentication (only focus on auth right now)

  // POST /register
  app.post('/api/register', async (req, res) => {
    try {
      const { name, email, password, role } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      let existingUser = false;
      const newUser = {
        id: `USR-${Date.now()}`,
        name,
        email,
        password, // Hashing is optional for now
        role: role || 'user', // Default role
        createdAt: new Date().toISOString()
      };

      await updateDB(db => {
        if (db.users.find((u: any) => u.email === email)) {
          existingUser = true;
          return;
        }
        db.users.push(newUser);
      });

      if (existingUser) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }

      // Return user data (excluding password)
      const { password: _, ...userData } = newUser;
      res.status(201).json(userData);
    } catch (error) {
      console.error('Error in /api/register:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST /login
  app.post('/api/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Missing email or password' });
      }

      const db = await readDB();
      const user = db.users.find((u: any) => u.email === email && u.password === password);

      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Return user data (excluding password)
      const { password: _, ...userData } = user;
      res.json(userData);
    } catch (error) {
      console.error('Error in /api/login:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Update profile
  app.put('/api/users/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { name, firstName, lastName, email, phone, password, avatarUrl, settings } = req.body;
      
      let userData: any;
      let notFound = false;

      await updateDB(db => {
        const index = db.users.findIndex((u: any) => u.id === id);
        
        if (index === -1) {
          notFound = true;
          return;
        }

        const user = db.users[index];
        
        db.users[index] = {
          ...user,
          name: name || user.name,
          firstName: firstName !== undefined ? firstName : user.firstName,
          lastName: lastName !== undefined ? lastName : user.lastName,
          email: email || user.email,
          phone: phone !== undefined ? phone : user.phone,
          password: password || user.password,
          avatarUrl: avatarUrl !== undefined ? avatarUrl : user.avatarUrl,
          settings: settings !== undefined ? { ...user.settings, ...settings } : user.settings
        };
        
        const { password: _, ...rest } = db.users[index];
        userData = rest;
      });
      
      if (notFound) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(userData);
    } catch (error) {
      console.error('Error in PUT /api/users/:id:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /users
  app.get('/api/users', async (req, res) => {
    try {
      const db = await readDB();
      res.json(db.users || []);
    } catch (error) {
      console.error('Error in GET /api/users:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // DELETE /users/:id
  app.delete('/api/users/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await updateDB(db => {
        db.users = (db.users || []).filter((u: any) => u.id !== id);
      });
      res.status(204).send();
    } catch (error) {
      console.error('Error in DELETE /api/users/:id:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /policies
  app.get('/api/policies', async (req, res) => {
    try {
      const db = await readDB();
      res.json(db.policies || []);
    } catch (error) {
      console.error('Error in GET /api/policies:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST /policies
  app.post('/api/policies', async (req, res) => {
    try {
      const policy = req.body;
      await updateDB(db => {
        db.policies = db.policies || [];
        db.policies.push(policy);
      });
      res.status(201).json(policy);
    } catch (error) {
      console.error('Error in POST /api/policies:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // PUT /policies/:id
  app.put('/api/policies/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      let policy: any;
      let notFound = false;
      await updateDB(db => {
        const index = db.policies.findIndex((p: any) => p.id === id);
        if (index === -1) {
          notFound = true;
          return;
        }
        db.policies[index] = { ...db.policies[index], ...updates };
        policy = db.policies[index];
      });
      if (notFound) return res.status(404).json({ error: 'Policy not found' });
      res.json(policy);
    } catch (error) {
      console.error('Error in PUT /api/policies/:id:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // DELETE /policies/:id
  app.delete('/api/policies/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await updateDB(db => {
        db.policies = (db.policies || []).filter((p: any) => p.id !== id);
      });
      res.status(204).send();
    } catch (error) {
      console.error('Error in DELETE /api/policies/:id:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });


  // GET /claims
  app.get('/api/claims', async (req, res) => {
    try {
      const db = await readDB();
      res.json(db.claims || []);
    } catch (error) {
      console.error('Error in GET /api/claims:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST /claims
  app.post('/api/claims', async (req, res) => {
    try {
      const claim = req.body;
      await updateDB(db => {
        db.claims = db.claims || [];
        db.claims.push(claim);
      });
      res.status(201).json(claim);
    } catch (error) {
      console.error('Error in POST /api/claims:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // PUT /claims/:id
  app.put('/api/claims/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      let claim: any;
      let notFound = false;
      await updateDB(db => {
        const index = db.claims.findIndex((c: any) => c.id === id);
        if (index === -1) {
          notFound = true;
          return;
        }
        db.claims[index] = { ...db.claims[index], ...updates };
        claim = db.claims[index];
      });
      if (notFound) return res.status(404).json({ error: 'Claim not found' });
      res.json(claim);
    } catch (error) {
      console.error('Error in PUT /api/claims/:id:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // DELETE /claims/:id
  app.delete('/api/claims/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await updateDB(db => {
        db.claims = (db.claims || []).filter((c: any) => c.id !== id);
      });
      res.status(204).send();
    } catch (error) {
      console.error('Error in DELETE /api/claims/:id:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /activities
  app.get('/api/activities', async (req, res) => {
    try {
      const db = await readDB();
      res.json(db.activities || []);
    } catch (error) {
      console.error('Error in GET /api/activities:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST /activities
  app.post('/api/activities', async (req, res) => {
    try {
      const activity = req.body;
      await updateDB(db => {
        db.activities = db.activities || [];
        db.activities.push(activity);
      });
      res.status(201).json(activity);
    } catch (error) {
      console.error('Error in POST /api/activities:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /notifications
  app.get('/api/notifications', async (req, res) => {
    try {
      const db = await readDB();
      res.json(db.notifications || []);
    } catch (error) {
      console.error('Error in GET /api/notifications:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST /notifications
  app.post('/api/notifications', async (req, res) => {
    try {
      const notification = req.body;
      await updateDB(db => {
        db.notifications = db.notifications || [];
        db.notifications.push(notification);
      });
      res.status(201).json(notification);
    } catch (error) {
      console.error('Error in POST /api/notifications:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // PUT /notifications/:id
  app.put('/api/notifications/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      let notification: any;
      let notFound = false;
      await updateDB(db => {
        const index = db.notifications.findIndex((n: any) => n.id === id);
        if (index === -1) {
          notFound = true;
          return;
        }
        db.notifications[index] = { ...db.notifications[index], ...updates };
        notification = db.notifications[index];
      });
      if (notFound) return res.status(404).json({ error: 'Notification not found' });
      res.json(notification);
    } catch (error) {
      console.error('Error in PUT /api/notifications/:id:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // PUT /notifications/read-all/:userId
  app.put('/api/notifications/read-all/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      await updateDB(db => {
        db.notifications = (db.notifications || []).map((n: any) => {
          if (n.userId === userId) {
            return { ...n, read: true };
          }
          return n;
        });
      });
      res.json({ success: true });
    } catch (error) {
      console.error('Error in PUT /api/notifications/read-all/:userId:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // DELETE /notifications/:id
  app.delete('/api/notifications/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await updateDB(db => {
        db.notifications = (db.notifications || []).filter((n: any) => n.id !== id);
      });
      res.status(204).send();
    } catch (error) {
      console.error('Error in DELETE /api/notifications/:id:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Vite middleware for development or fallback in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      root: path.join(process.cwd(), 'client'),
      server: { 
        middlewareMode: true,
        hmr: false 
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'client', 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
