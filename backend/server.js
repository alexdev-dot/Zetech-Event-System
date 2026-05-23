import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import NodeCache from "node-cache";
import { createServer } from "http";
import { Server } from "socket.io";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pool, testConnection } from "./db.js";

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET =
  process.env.JWT_SECRET || "zetech-event-hub-secret-2024-change-in-prod";
const JWT_EXPIRES_IN = "24h";

const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

// ─── SMS HELPER (Africa's Talking) ────────────────────────────────────────────

let smsClient = null;
async function initSMS() {
  try {
    const apiKey = process.env.AT_API_KEY;
    const username = process.env.AT_USERNAME || "sandbox";
    if (!apiKey) return null;
    const AfricasTalkingModule = await import("africastalking");
    const AfricasTalking = AfricasTalkingModule.default || AfricasTalkingModule;
    const at = AfricasTalking({ apiKey, username });
    return at.SMS;
  } catch (e) {
    console.warn("SMS client not available:", e.message);
    return null;
  }
}

async function sendSMS(to, message) {
  try {
    if (!smsClient) smsClient = await initSMS();
    if (!smsClient) return { success: false, reason: "SMS not configured" };
    const numbers = Array.isArray(to) ? to : [to];
    const formatted = numbers.map((n) => (n.startsWith("+") ? n : `+254${n.replace(/^0/, "")}`));
    const result = await smsClient.send({ to: formatted, message });
    return { success: true, result };
  } catch (e) {
    console.error("SMS error:", e.message);
    return { success: false, reason: e.message };
  }
}

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "public", "uploads");

fs.mkdirSync(uploadDir, { recursive: true });

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-originalname
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter to validate image types
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.",
      ),
      false,
    );
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// ─── SECURITY MIDDLEWARE ───────────────────────────────────────────────────────

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
  }),
);

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:3001",
  process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : null,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.some((o) => origin.startsWith(o))) return cb(null, true);
      cb(null, true); // allow all in dev; tighten in prod via env
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ─── RATE LIMITERS ────────────────────────────────────────────────────────────

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
  skip: (req) => req.path === "/api/health",
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts, please try again in 15 minutes." },
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { message: "Upload rate limit exceeded." },
});

app.use(globalLimiter);
app.use(express.json({ limit: "2mb" }));

// Serve static files from public directory
app.use("/uploads", express.static(path.join(__dirname, "public", "uploads")));

// ─── SOCKET.IO SETUP ───────────────────────────────────────────────────────────

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Store connected users by their user ID
const connectedUsers = new Map();

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Join user-specific room for personal notifications
  socket.on("join", (userId) => {
    if (userId) {
      socket.join(`user:${userId}`);
      connectedUsers.set(userId, socket.id);
      console.log(`User ${userId} joined their room`);
    }
  });

  // Join admin room for admin notifications
  socket.on("join-admin", () => {
    socket.join("admins");
    console.log("User joined admin room");
  });

  // Join club leader room
  socket.on("join-club-leader", (club) => {
    if (club) {
      socket.join(`club:${club}`);
      console.log(`User joined club room: ${club}`);
    }
  });

  socket.on("disconnect", () => {
    // Remove user from connected users
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
    console.log("Client disconnected:", socket.id);
  });
});

// Helper function to emit events to specific users
function emitToUser(userId, event, data) {
  io.to(`user:${userId}`).emit(event, data);
}

// Helper function to emit events to all admins
function emitToAdmins(event, data) {
  io.to("admins").emit(event, data);
}

// Helper function to emit events to a specific club
function emitToClub(club, event, data) {
  io.to(`club:${club}`).emit(event, data);
}

// Helper function to emit events to all connected clients
function emitToAll(event, data) {
  io.emit(event, data);
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function invalidateCache(...keys) {
  keys.forEach((k) => cache.del(k));
}

/**
 * Merge event rows with admin info + registration counts.
 * Both adminMap and regCountMap are keyed by their respective IDs.
 */
function mergeEventData(events, adminMap, regCountMap) {
  return (events || []).map((ev) => {
    const admin = adminMap?.[ev.created_by] ?? {};
    return {
      ...ev,
      registered_count: regCountMap?.[ev.id] ?? 0,
      created_by_email: admin.email ?? null,
      created_by_name: admin.name ?? null,
      creator_role: admin.role ?? null,
      creator_club: admin.club ?? null,
    };
  });
}

/** Build a map from event_id → registration count (status='registered'). */
async function fetchRegCounts(eventIds) {
  if (!eventIds || eventIds.length === 0) return {};
  const q = `SELECT event_id FROM event_registrations WHERE event_id = ANY($1::int[]) AND status = $2`;
  const res = await pool.query(q, [eventIds, "registered"]);
  const map = {};
  for (const row of res.rows || []) {
    const id = row.event_id;
    map[id] = (map[id] || 0) + 1;
  }
  return map;
}

/** Build a map from admin.id → admin row. */
async function fetchAdminMap() {
  const res = await pool.query(
    `SELECT id, admin_email, name, role, club FROM admins`,
  );
  const map = {};
  for (const a of res.rows || []) {
    map[a.id] = {
      id: a.id,
      admin_email: a.admin_email,
      name: a.name,
      role: a.role,
      club: a.club,
      email: a.admin_email,
    };
  }
  return map;
}

async function fetchEventCreatorClub(createdBy) {
  if (!createdBy) return null;
  const res = await pool.query(
    `SELECT club FROM admins WHERE id = $1 LIMIT 1`,
    [createdBy],
  );
  return res.rows?.[0]?.club ?? null;
}

async function ensureDatabaseSchema() {
  // Ensure admins table exists first (it may already exist)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admins (
      id            SERIAL PRIMARY KEY,
      admin_email   VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      name          VARCHAR(100),
      role          VARCHAR(20)  NOT NULL DEFAULT 'admin'
                      CHECK (role IN ('admin','club_leader')),
      club          VARCHAR(100),
      created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    )
  `);

  // Ensure student_registrations table exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS student_registrations (
      id               SERIAL PRIMARY KEY,
      first_name       VARCHAR(100)  NOT NULL,
      last_name        VARCHAR(100)  NOT NULL,
      admission_number VARCHAR(50)   NOT NULL UNIQUE,
      email            VARCHAR(255)  NOT NULL UNIQUE,
      password         VARCHAR(255)  NOT NULL,
      phone            VARCHAR(20),
      status           VARCHAR(20)   NOT NULL DEFAULT 'active'
                         CHECK (status IN ('active','deleted')),
      last_login       TIMESTAMPTZ,
      created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
    )
  `);

  // Ensure events table exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS events (
      id               SERIAL PRIMARY KEY,
      title            VARCHAR(255) NOT NULL,
      description      TEXT         NOT NULL,
      date             DATE         NOT NULL,
      time             TIME         NOT NULL,
      location         VARCHAR(255) NOT NULL,
      category         VARCHAR(100) NOT NULL DEFAULT 'General',
      max_participants INT,
      image_url        VARCHAR(500),
      status           VARCHAR(20)  NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending','upcoming','ongoing','completed','cancelled','rejected')),
      created_by       INT          NOT NULL REFERENCES admins(id),
      created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    )
  `);

  // Ensure event_registrations table exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS event_registrations (
      id                SERIAL PRIMARY KEY,
      event_id          INT         NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      student_id        INT         NOT NULL REFERENCES student_registrations(id) ON DELETE CASCADE,
      registration_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      status            VARCHAR(20) NOT NULL DEFAULT 'registered'
                          CHECK (status IN ('registered','attended','cancelled')),
      UNIQUE (event_id, student_id)
    )
  `);

  // Auto-update updated_at trigger
  await pool.query(`
    CREATE OR REPLACE FUNCTION set_updated_at()
    RETURNS TRIGGER LANGUAGE plpgsql AS $$
    BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
    $$
  `);
  await pool.query(`
    DROP TRIGGER IF EXISTS events_updated_at ON events;
    CREATE TRIGGER events_updated_at
      BEFORE UPDATE ON events
      FOR EACH ROW EXECUTE FUNCTION set_updated_at()
  `);

  // Safe column additions (for existing DBs)
  await pool.query(`
    ALTER TABLE events
      ADD COLUMN IF NOT EXISTS category VARCHAR(100) NOT NULL DEFAULT 'General',
      ADD COLUMN IF NOT EXISTS max_participants INT,
      ADD COLUMN IF NOT EXISTS image_url VARCHAR(500)
  `);

  // Add phone number column to students for SMS
  await pool.query(`
    ALTER TABLE student_registrations
      ADD COLUMN IF NOT EXISTS phone VARCHAR(20)
  `);

  // System settings table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS system_settings (
      key   VARCHAR(100) PRIMARY KEY,
      value TEXT         NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // Insert default settings if missing
  await pool.query(`
    INSERT INTO system_settings (key, value)
    VALUES
      ('system_name',        'Zetech Events Hub'),
      ('system_description', 'Campus event management platform for Zetech University'),
      ('sms_enabled',        'false'),
      ('registration_open',  'true'),
      ('maintenance_mode',   'false'),
      ('sms_sender_id',      'ZetechHub'),
      ('max_events_per_club','50'),
      ('contact_email',      'events@zetech.ac.ke')
    ON CONFLICT (key) DO NOTHING
  `);

  // Performance indexes for 10,000+ students
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_student_reg_admission  ON student_registrations(admission_number);
    CREATE INDEX IF NOT EXISTS idx_student_reg_email      ON student_registrations(email);
    CREATE INDEX IF NOT EXISTS idx_student_reg_status     ON student_registrations(status);
    CREATE INDEX IF NOT EXISTS idx_student_reg_created    ON student_registrations(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_events_status          ON events(status);
    CREATE INDEX IF NOT EXISTS idx_events_date            ON events(date ASC);
    CREATE INDEX IF NOT EXISTS idx_events_created_by      ON events(created_by);
    CREATE INDEX IF NOT EXISTS idx_events_created_at      ON events(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_event_reg_event_id     ON event_registrations(event_id);
    CREATE INDEX IF NOT EXISTS idx_event_reg_student_id   ON event_registrations(student_id);
    CREATE INDEX IF NOT EXISTS idx_event_reg_status       ON event_registrations(status);
  `);

  console.log("Database schema and indexes ensured ✓");
}

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token)
    return res.status(401).json({ message: "Authentication required" });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    // Normalize payload
    const userId = payload?.id;
    const role = payload?.role;
    if (!userId || !role)
      return res.status(401).json({ message: "Invalid token payload" });

    // Verify against DB to avoid forged tokens where role was tampered client-side
    if (role === "user") {
      pool
        .query(
          `SELECT id, status FROM student_registrations WHERE id = $1 LIMIT 1`,
          [userId],
        )
        .then((studentsRes) => {
          const s = studentsRes.rows?.[0];
          if (!s || s.status === "deleted")
            return res.status(401).json({ message: "Account not found" });
          req.authUser = { id: s.id, role: "user" };
          return next();
        })
        .catch((err) => {
          console.error("Auth lookup error:", err);
          return res.status(500).json({ message: "Auth lookup failed" });
        });
      return;
    }

    // admin / club leader
    if (role === "admin" || role === "club_leader") {
      pool
        .query(
          `SELECT id, role, admin_email, club FROM admins WHERE id = $1 LIMIT 1`,
          [userId],
        )
        .then((adminsRes) => {
          const a = adminsRes.rows?.[0];
          if (!a) return res.status(401).json({ message: "Account not found" });
          // ensure role hasn't been downgraded/changed
          const verifiedRole = a.role || "admin";
          req.authUser = {
            id: a.id,
            role: verifiedRole,
            email: a.admin_email,
            club: a.club || null,
          };
          return next();
        })
        .catch((err) => {
          console.error("Auth lookup error:", err);
          return res.status(500).json({ message: "Auth lookup failed" });
        });
      return;
    }

    return res.status(401).json({ message: "Invalid token role" });
  } catch (e) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

function requireAdmin(req, res, next) {
  authenticateToken(req, res, () => {
    if (req.authUser?.role !== "admin")
      return res.status(403).json({ message: "Admin access required" });
    next();
  });
}

function requireAdminOrLeader(req, res, next) {
  authenticateToken(req, res, () => {
    if (req.authUser?.role !== "admin" && req.authUser?.role !== "club_leader")
      return res
        .status(403)
        .json({ message: "Admin or club leader access required" });
    next();
  });
}

// ─── HEALTH ───────────────────────────────────────────────────────────────────

app.get("/api/health", async (_req, res) => {
  try {
    await testConnection();
    res.json({ status: "ok", database: "connected" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Database connection failed", detail: err.message });
  }
});

// ─── STUDENT AUTH ─────────────────────────────────────────────────────────────

app.post("/api/auth/register", authLimiter, async (req, res) => {
  const { firstName, lastName, email, admissionNumber, password } = req.body;

  if (!firstName || !lastName || !email || !admissionNumber || !password)
    return res.status(400).json({ message: "All fields are required" });
  if (typeof firstName !== "string" || firstName.trim().length < 2)
    return res
      .status(400)
      .json({ message: "First name must be at least 2 characters" });
  if (typeof lastName !== "string" || lastName.trim().length < 2)
    return res
      .status(400)
      .json({ message: "Last name must be at least 2 characters" });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ message: "Invalid email address" });
  if (typeof admissionNumber !== "string" || admissionNumber.trim().length < 3)
    return res.status(400).json({ message: "Invalid admission number" });
  if (typeof password !== "string" || password.length < 6)
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters" });

  try {
    const existingRes = await pool.query(
      `SELECT id FROM student_registrations WHERE admission_number = $1 OR email = $2 LIMIT 1`,
      [admissionNumber.trim(), email.trim().toLowerCase()],
    );
    if (existingRes.rows?.length > 0)
      return res
        .status(409)
        .json({ message: "Admission number or email already registered" });

    const hashed = await bcrypt.hash(password, 12);
    const insertRes = await pool.query(
      `INSERT INTO student_registrations (first_name, last_name, admission_number, email, password)
       VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [
        firstName.trim(),
        lastName.trim(),
        admissionNumber.trim(),
        email.trim().toLowerCase(),
        hashed,
      ],
    );
    const inserted = insertRes.rows[0];

    const user = {
      id: inserted.id,
      email: email.trim().toLowerCase(),
      adminNumber: admissionNumber.trim(),
      name: `${firstName.trim()} ${lastName.trim()}`,
      role: "user",
    };
    res.status(201).json({
      message: "Student registered successfully",
      user,
      token: generateToken({ id: user.id, role: "user" }),
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Registration failed: " + error.message });
  }
});

app.post("/api/auth/login", authLimiter, async (req, res) => {
  const { admissionNumber, password } = req.body;
  if (!admissionNumber || !password)
    return res
      .status(400)
      .json({ message: "Admission number and password are required" });
  if (typeof admissionNumber !== "string" || typeof password !== "string")
    return res.status(400).json({ message: "Invalid input" });

  try {
    const studentsRes = await pool.query(
      `SELECT id, first_name, last_name, admission_number, email, password, status FROM student_registrations WHERE admission_number = $1 LIMIT 1`,
      [admissionNumber.trim()],
    );
    if (!studentsRes.rows?.length)
      return res
        .status(401)
        .json({ message: "Invalid admission number or password" });
    const student = studentsRes.rows[0];
    if (student.status === "deleted")
      return res.status(401).json({ message: "Account has been deactivated" });

    const valid = await bcrypt.compare(password, student.password);
    if (!valid)
      return res
        .status(401)
        .json({ message: "Invalid admission number or password" });

    await pool.query(
      `UPDATE student_registrations SET last_login = $1 WHERE id = $2`,
      [new Date().toISOString(), student.id],
    );

    const user = {
      id: student.id,
      email: student.email,
      adminNumber: student.admission_number,
      name: `${student.first_name} ${student.last_name}`,
      role: "user",
    };
    res.json({
      message: "Login successful",
      user,
      token: generateToken({ id: student.id, role: "user" }),
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed" });
  }
});

// ─── ADMIN / CLUB LEADER AUTH ─────────────────────────────────────────────────

app.post("/api/auth/admin/login", authLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email and password are required" });
  if (typeof email !== "string" || typeof password !== "string")
    return res.status(400).json({ message: "Invalid input" });

  try {
    // Select only base columns (always exist); role/name/club are added by schema migration
    const adminsRes = await pool.query(
      `SELECT id, admin_email, password_hash FROM admins WHERE admin_email = $1 LIMIT 1`,
      [email.trim().toLowerCase()],
    );
    if (!adminsRes.rows?.length)
      return res.status(401).json({ message: "Invalid credentials" });
    const admin = adminsRes.rows[0];
    let valid = false;
    const hash = admin.password_hash || "";
    if (hash.startsWith("$2")) {
      valid = await bcrypt.compare(password, hash);
    } else {
      valid = password === hash;
    }
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });

    // Try to read extra columns if they exist (graceful fallback)
    let role = "admin",
      adminName = "Admin User",
      club = null;
    try {
      const extRes = await pool.query(
        `SELECT role, name, club FROM admins WHERE id = $1 LIMIT 1`,
        [admin.id],
      );
      if (extRes.rows?.[0]) {
        role = extRes.rows[0].role || "admin";
        adminName =
          extRes.rows[0].name ||
          (role === "club_leader" ? "Club Leader" : "Admin User");
        club = extRes.rows[0].club || null;
      }
    } catch {
      /* columns not yet added via migration — use defaults */
    }

    const user = {
      id: admin.id,
      email: admin.admin_email,
      adminNumber: role === "club_leader" ? `CL-${admin.id}` : "ADMIN001",
      name: adminName,
      role,
      club,
    };
    res.json({
      message: "Login successful",
      user,
      token: generateToken({ id: admin.id, role, club: admin.club || null }),
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ message: "Login failed" });
  }
});

// Session restore — always validated server-side
app.get("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    const { id, role } = req.authUser;

    if (role === "user") {
      const studentsRes = await pool.query(
        `SELECT id, first_name, last_name, admission_number, email, status FROM student_registrations WHERE id = $1 LIMIT 1`,
        [id],
      );
      const s = studentsRes.rows?.[0];
      if (!s || s.status === "deleted")
        return res.status(401).json({ message: "Account not found" });

      return res.json({
        user: {
          id: s.id,
          email: s.email,
          adminNumber: s.admission_number,
          name: `${s.first_name} ${s.last_name}`,
          role: "user",
        },
      });
    } else {
      const adminsRes = await pool.query(
        `SELECT id, admin_email FROM admins WHERE id = $1 LIMIT 1`,
        [id],
      );
      const a = adminsRes.rows?.[0];
      if (!a) return res.status(401).json({ message: "Account not found" });

      let meRole = "admin",
        meName = "Admin User",
        meClub = null;
      try {
        const extRes = await pool.query(
          `SELECT role, name, club FROM admins WHERE id = $1 LIMIT 1`,
          [id],
        );
        if (extRes.rows?.[0]) {
          meRole = extRes.rows[0].role || "admin";
          meName =
            extRes.rows[0].name ||
            (meRole === "club_leader" ? "Club Leader" : "Admin User");
          meClub = extRes.rows[0].club || null;
        }
      } catch {
        /* migration pending */
      }

      return res.json({
        user: {
          id: a.id,
          email: a.admin_email,
          adminNumber: meRole === "club_leader" ? `CL-${a.id}` : "ADMIN001",
          name: meName,
          role: meRole,
          club: meClub,
        },
      });
    }
  } catch (error) {
    console.error("Auth/me error:", error);
    res.status(500).json({ message: "Failed to verify session" });
  }
});

// ─── PUBLIC EVENT ROUTES ──────────────────────────────────────────────────────

app.get("/api/events/recent", async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 12, 24);
  const cacheKey = `events:recent:${limit}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const eventsRes = await pool.query(
      `SELECT id, title, description, date, time, location, category, max_participants, image_url, status, created_by
       FROM events WHERE status = $1 ORDER BY date ASC LIMIT $2`,
      ["upcoming", limit],
    );
    const events = eventsRes.rows;

    const eventIds = (events || []).map((e) => e.id);
    const [adminMap, regCountMap] = await Promise.all([
      fetchAdminMap(),
      fetchRegCounts(eventIds),
    ]);
    const result = mergeEventData(events, adminMap, regCountMap);

    cache.set(cacheKey, result, 60);
    res.json(result);
  } catch (error) {
    console.error("Get recent events error:", error);
    res.status(500).json({ message: "Failed to fetch events" });
  }
});

app.get("/api/events", async (req, res) => {
  const cacheKey = "events:all";
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const eventsRes = await pool.query(
      `SELECT * FROM events WHERE status = ANY($1::text[]) ORDER BY date ASC`,
      [["upcoming", "ongoing", "completed"]],
    );
    const events = eventsRes.rows || [];
    const eventIds = events.map((e) => e.id);
    const [adminMap, regCountMap] = await Promise.all([
      fetchAdminMap(),
      fetchRegCounts(eventIds),
    ]);
    const result = mergeEventData(events, adminMap, regCountMap);

    cache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    console.error("Get events error:", error);
    res.status(500).json({ message: "Failed to fetch events" });
  }
});

app.get("/api/events/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: "Invalid event ID" });

  const cacheKey = `event:${id}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const evRes = await pool.query(
      `SELECT * FROM events WHERE id = $1 LIMIT 1`,
      [id],
    );
    const ev = evRes.rows?.[0];
    if (!ev) return res.status(404).json({ message: "Event not found" });

    // Check if event is pending and user is not authenticated or is a regular student
    // Only admins and club leaders can see pending events
    const token = req.headers.authorization?.replace("Bearer ", "");
    let user = null;
    if (token) {
      try {
        user = jwt.verify(token, JWT_SECRET);
      } catch (e) {
        // Invalid token, treat as unauthenticated
      }
    }

    // If event is pending, only allow access to admins and the creator (club leader)
    if (ev.status === "pending") {
      if (!user) {
        return res.status(404).json({ message: "Event not found" });
      }
      if (user.role !== "admin" && user.id !== ev.created_by) {
        return res.status(404).json({ message: "Event not found" });
      }
    }

    const [adminMap, regCountMap] = await Promise.all([
      fetchAdminMap(),
      fetchRegCounts([id]),
    ]);
    const [result] = mergeEventData([ev], adminMap, regCountMap);

    cache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    console.error("Get event error:", error);
    res.status(500).json({ message: "Failed to fetch event" });
  }
});

// ─── IMAGE UPLOAD ENDPOINT ─────────────────────────────────────────────────────

// Upload image endpoint - requires authentication
app.post(
  "/api/upload",
  requireAdminOrLeader,
  uploadLimiter,
  upload.single("image"),
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Construct the URL to access the uploaded file
      const imageUrl = `/uploads/${req.file.filename}`;

      res.status(200).json({
        message: "Image uploaded successfully",
        imageUrl: imageUrl,
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Failed to upload image" });
    }
  },
);

// Handle multer errors
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "File size exceeds 5MB limit" });
    }
    return res.status(400).json({ message: error.message });
  }
  if (
    error.message ===
    "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed."
  ) {
    return res.status(400).json({ message: error.message });
  }
  next(error);
});

// Create event:
//   Admin       → status='upcoming' (auto-approved, immediately visible)
//   Club leader → status='pending' (awaits admin approval)
app.post("/api/events", requireAdminOrLeader, async (req, res) => {
  const { title, description, date, time, location, category } = req.body;
  const maxParticipants = req.body.maxParticipants ?? req.body.max_participants;
  const imageUrl = req.body.imageUrl ?? req.body.image_url;

  if (!title || !description || !date || !time || !location || !category)
    return res.status(400).json({
      message:
        "title, description, date, time, location, and category are required",
    });
  if (typeof title !== "string" || title.trim().length < 3)
    return res
      .status(400)
      .json({ message: "Title must be at least 3 characters" });
  if (typeof description !== "string" || description.trim().length < 10)
    return res
      .status(400)
      .json({ message: "Description must be at least 10 characters" });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
    return res
      .status(400)
      .json({ message: "Invalid date format (expected YYYY-MM-DD)" });
  if (maxParticipants !== undefined && maxParticipants !== null) {
    const cap = parseInt(maxParticipants);
    if (isNaN(cap) || cap < 1)
      return res
        .status(400)
        .json({ message: "maxParticipants must be a positive number" });
  }

  const isAdmin = req.authUser.role === "admin";
  const eventStatus = isAdmin ? "upcoming" : "pending";

  try {
    const insertRes = await pool.query(
      `INSERT INTO events (title, description, date, time, location, category, max_participants, image_url, created_by, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [
        title.trim(),
        description.trim(),
        date,
        time,
        location.trim(),
        category,
        maxParticipants || null,
        imageUrl || null,
        req.authUser.id,
        eventStatus,
      ],
    );
    const inserted = insertRes.rows[0];

    invalidateCache("events:all", "admin:stats", "events:recent:12");
    res.status(201).json({
      message: isAdmin
        ? "Event created successfully"
        : "Event submitted for admin approval",
      eventId: inserted.id,
      status: eventStatus,
      imageUrl: imageUrl || null,
    });
  } catch (error) {
    console.error("Create event error:", error);
    res
      .status(500)
      .json({ message: "Failed to create event: " + error.message });
  }
});

app.put("/api/events/:id", requireAdminOrLeader, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: "Invalid event ID" });

  const { title, description, date, time, location, category, status } =
    req.body;
  const maxParticipants = req.body.maxParticipants ?? req.body.max_participants;
  const imageUrl = req.body.imageUrl ?? req.body.image_url;
  if (!title || !description || !date || !time || !location || !category)
    return res.status(400).json({ message: "All event fields are required" });

  try {
    if (req.authUser.role === "club_leader") {
      const evsRes = await pool.query(
        `SELECT created_by FROM events WHERE id = $1 LIMIT 1`,
        [id],
      );
      if (!evsRes.rows?.length)
        return res.status(404).json({ message: "Event not found" });
      if (evsRes.rows[0].created_by !== req.authUser.id)
        return res
          .status(403)
          .json({ message: "You can only edit your own events" });
    }

    const validStatuses =
      req.authUser.role === "admin"
        ? [
            "pending",
            "upcoming",
            "ongoing",
            "completed",
            "cancelled",
            "rejected",
          ]
        : ["pending", "upcoming", "ongoing", "completed", "cancelled"];
    const safeStatus = validStatuses.includes(status) ? status : "upcoming";

    const updRes = await pool.query(
      `UPDATE events SET title=$1, description=$2, date=$3, time=$4, location=$5, category=$6, max_participants=$7, image_url=COALESCE($8, image_url), status=$9 WHERE id=$10 RETURNING id`,
      [
        title.trim(),
        description.trim(),
        date,
        time,
        location.trim(),
        category,
        maxParticipants || null,
        imageUrl || null,
        safeStatus,
        id,
      ],
    );
    if (!updRes.rows?.length)
      return res.status(404).json({ message: "Event not found" });

    invalidateCache(
      "events:all",
      `event:${id}`,
      "admin:stats",
      "events:recent:12",
    );
    res.json({ message: "Event updated successfully" });
  } catch (error) {
    console.error("Update event error:", error);
    res.status(500).json({ message: "Failed to update event" });
  }
});

app.delete("/api/events/:id", requireAdminOrLeader, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: "Invalid event ID" });

  try {
    if (req.authUser.role === "club_leader") {
      const evsRes = await pool.query(
        `SELECT created_by FROM events WHERE id = $1 LIMIT 1`,
        [id],
      );
      if (!evsRes.rows?.length)
        return res.status(404).json({ message: "Event not found" });
      if (evsRes.rows[0].created_by !== req.authUser.id)
        return res
          .status(403)
          .json({ message: "You can only delete your own events" });
    }
    const delRes = await pool.query(
      `DELETE FROM events WHERE id = $1 RETURNING id`,
      [id],
    );
    if (!delRes.rows?.length)
      return res.status(404).json({ message: "Event not found" });

    invalidateCache(
      "events:all",
      `event:${id}`,
      "admin:stats",
      "events:recent:12",
    );
    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Delete event error:", error);
    res.status(500).json({ message: "Failed to delete event" });
  }
});

// ─── ADMIN EVENT APPROVAL ─────────────────────────────────────────────────────

app.get("/api/admin/events/pending", requireAdmin, async (req, res) => {
  try {
    const eventsRes = await pool.query(
      `SELECT * FROM events WHERE status = $1 ORDER BY created_at ASC`,
      ["pending"],
    );
    const events = eventsRes.rows || [];
    const adminMap = await fetchAdminMap();
    const result = mergeEventData(events, adminMap, {});
    res.json(result);
  } catch (error) {
    console.error("Get pending events error:", error);
    res.status(500).json({ message: "Failed to fetch pending events" });
  }
});

app.patch("/api/admin/events/:id/approve", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: "Invalid event ID" });

  try {
    const updRes = await pool.query(
      `UPDATE events SET status = $1 WHERE id = $2 AND status = $3 RETURNING id, title, created_by`,
      ["upcoming", id, "pending"],
    );
    if (!updRes.rows?.length)
      return res.status(404).json({ message: "Pending event not found" });

    const event = updRes.rows[0];
    event.creator_club = await fetchEventCreatorClub(event.created_by);

    invalidateCache(
      "events:all",
      `event:${id}`,
      "admin:stats",
      "events:recent:12",
    );

    // Emit Socket.io events for real-time updates
    emitToAll("event:approved", {
      eventId: id,
      eventTitle: event.title,
      timestamp: new Date().toISOString(),
    });

    if (event.created_by) {
      emitToUser(event.created_by, "event:your-event-approved", {
        eventId: id,
        eventTitle: event.title,
      });
    }

    if (event.creator_club) {
      emitToClub(event.creator_club, "event:approved", {
        eventId: id,
        eventTitle: event.title,
      });
    }

    res.json({ message: "Event approved and published" });
  } catch (error) {
    console.error("Approve event error:", error);
    res.status(500).json({ message: "Failed to approve event" });
  }
});

app.patch("/api/admin/events/:id/reject", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: "Invalid event ID" });

  try {
    const updRes = await pool.query(
      `UPDATE events SET status = $1 WHERE id = $2 AND status = $3 RETURNING id, title, created_by`,
      ["rejected", id, "pending"],
    );
    if (!updRes.rows?.length)
      return res.status(404).json({ message: "Pending event not found" });

    const event = updRes.rows[0];
    event.creator_club = await fetchEventCreatorClub(event.created_by);

    invalidateCache("events:all", `event:${id}`, "admin:stats");

    // Emit Socket.io events for real-time updates
    if (event.created_by) {
      emitToUser(event.created_by, "event:your-event-rejected", {
        eventId: id,
        eventTitle: event.title,
      });
    }

    if (event.creator_club) {
      emitToClub(event.creator_club, "event:rejected", {
        eventId: id,
        eventTitle: event.title,
      });
    }

    res.json({ message: "Event rejected" });
  } catch (error) {
    console.error("Reject event error:", error);
    res.status(500).json({ message: "Failed to reject event" });
  }
});

// All events including pending — for admin management view
app.get("/api/admin/events", requireAdmin, async (req, res) => {
  try {
    const eventsRes = await pool.query(
      `SELECT * FROM events ORDER BY created_at DESC`,
    );
    const events = eventsRes.rows || [];
    const eventIds = events.map((e) => e.id);
    const [adminMap, regCountMap] = await Promise.all([
      fetchAdminMap(),
      fetchRegCounts(eventIds),
    ]);
    res.json(mergeEventData(events, adminMap, regCountMap));
  } catch (error) {
    console.error("Admin get all events error:", error);
    res.status(500).json({ message: "Failed to fetch events" });
  }
});

// ─── EVENT REGISTRATION ───────────────────────────────────────────────────────

app.post("/api/events/:id/register", authenticateToken, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: "Invalid event ID" });
  if (req.authUser.role !== "user")
    return res
      .status(403)
      .json({ message: "Only students can register for events" });

  const studentId = req.authUser.id;

  try {
    const evRes = await pool.query(
      `SELECT id, max_participants, status FROM events WHERE id = $1 AND status = $2 LIMIT 1`,
      [id, "upcoming"],
    );
    if (!evRes.rows?.length)
      return res
        .status(404)
        .json({ message: "Event not found or not available for registration" });

    const existingRes = await pool.query(
      `SELECT id FROM event_registrations WHERE event_id = $1 AND student_id = $2 LIMIT 1`,
      [id, studentId],
    );
    if (existingRes.rows?.length > 0)
      return res
        .status(409)
        .json({ message: "Already registered for this event" });

    const maxp = evRes.rows[0].max_participants;
    if (maxp) {
      const countRes = await pool.query(
        `SELECT COUNT(*) FROM event_registrations WHERE event_id = $1 AND status = $2`,
        [id, "registered"],
      );
      const count = parseInt(countRes.rows[0].count || 0, 10);
      if (count >= maxp)
        return res.status(409).json({ message: "Event is full" });
    }

    const regRes = await pool.query(
      `INSERT INTO event_registrations (event_id, student_id) VALUES ($1,$2) RETURNING id`,
      [id, studentId],
    );
    const reg = regRes.rows[0];

    invalidateCache("events:all", `event:${id}`, "events:recent:12");

    // Get event details for Socket.io notification
    const eventDetailsRes = await pool.query(
      `SELECT e.id, e.title, a.club AS creator_club
       FROM events e
       LEFT JOIN admins a ON a.id = e.created_by
       WHERE e.id = $1`,
      [id],
    );
    const eventDetails = eventDetailsRes.rows[0];

    // Emit Socket.io events for real-time updates
    emitToUser(studentId, "registration:success", {
      eventId: id,
      eventTitle: eventDetails?.title,
      registrationId: reg.id,
    });

    emitToAdmins("event:new-registration", {
      eventId: id,
      eventTitle: eventDetails?.title,
      studentId,
      timestamp: new Date().toISOString(),
    });

    if (eventDetails?.creator_club) {
      emitToClub(eventDetails.creator_club, "event:new-registration", {
        eventId: id,
        eventTitle: eventDetails?.title,
        studentId,
        timestamp: new Date().toISOString(),
      });
    }

    emitToAll("event:registration-count-update", {
      eventId: id,
      increment: true,
    });

    res.status(201).json({
      message: "Successfully registered for event",
      registrationId: reg.id,
    });
  } catch (error) {
    console.error("Register event error:", error);
    res.status(500).json({ message: "Failed to register for event" });
  }
});

app.delete(
  "/api/events/:eventId/register/:studentId",
  authenticateToken,
  async (req, res) => {
    const eventId = parseInt(req.params.eventId);
    const studentId = parseInt(req.params.studentId);
    if (isNaN(eventId) || isNaN(studentId))
      return res.status(400).json({ message: "Invalid IDs" });
    if (req.authUser.role === "user" && req.authUser.id !== studentId)
      return res
        .status(403)
        .json({ message: "You can only cancel your own registration" });

    try {
      const delRes = await pool.query(
        `DELETE FROM event_registrations WHERE event_id = $1 AND student_id = $2 RETURNING id`,
        [eventId, studentId],
      );
      if (!delRes.rows?.length)
        return res.status(404).json({ message: "Registration not found" });

      invalidateCache("events:all", `event:${eventId}`, "events:recent:12");
      res.json({ message: "Registration cancelled successfully" });
    } catch (error) {
      console.error("Cancel registration error:", error);
      res.status(500).json({ message: "Failed to cancel registration" });
    }
  },
);

app.get(
  "/api/students/:studentId/registrations",
  authenticateToken,
  async (req, res) => {
    const studentId = parseInt(req.params.studentId);
    if (isNaN(studentId))
      return res.status(400).json({ message: "Invalid student ID" });
    if (req.authUser.role === "user" && req.authUser.id !== studentId)
      return res.status(403).json({ message: "Access denied" });

    try {
      const regsRes = await pool.query(
        `
      SELECT er.*, e.title, e.date, e.time, e.location, e.category, e.status AS event_status, e.image_url
      FROM event_registrations er
      LEFT JOIN events e ON er.event_id = e.id
      WHERE er.student_id = $1
      ORDER BY er.registration_date DESC`,
        [studentId],
      );
      const result = (regsRes.rows || []).map((r) => ({
        ...r,
        title: r.title,
        date: r.date,
        time: r.time,
        location: r.location,
        category: r.category,
        event_status: r.event_status,
        image_url: r.image_url,
      }));
      res.json(result);
    } catch (error) {
      console.error("Get registrations error:", error);
      res.status(500).json({ message: "Failed to fetch registrations" });
    }
  },
);

// ─── ADMIN ROUTES ─────────────────────────────────────────────────────────────

app.get("/api/admin/dashboard/stats", requireAdmin, async (req, res) => {
  const cacheKey = "admin:stats";
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const [
      totalEventsRes,
      totalStudentsRes,
      upcomingEventsRes,
      pendingEventsRes,
      totalRegistrationsRes,
      recentEventsRes,
    ] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM events`),
      pool.query(
        `SELECT COUNT(*) FROM student_registrations WHERE status = $1`,
        ["active"],
      ),
      pool.query(`SELECT COUNT(*) FROM events WHERE status = $1`, ["upcoming"]),
      pool.query(`SELECT COUNT(*) FROM events WHERE status = $1`, ["pending"]),
      pool.query(`SELECT COUNT(*) FROM event_registrations WHERE status = $1`, [
        "registered",
      ]),
      pool.query(
        `SELECT id, title, date, status, created_at FROM events ORDER BY created_at DESC LIMIT 5`,
      ),
    ]);

    const result = {
      totalEvents: parseInt(totalEventsRes.rows[0].count || 0, 10),
      totalStudents: parseInt(totalStudentsRes.rows[0].count || 0, 10),
      upcomingEvents: parseInt(upcomingEventsRes.rows[0].count || 0, 10),
      pendingEvents: parseInt(pendingEventsRes.rows[0].count || 0, 10),
      totalRegistrations: parseInt(
        totalRegistrationsRes.rows[0].count || 0,
        10,
      ),
      recentEvents: recentEventsRes.rows || [],
    };
    cache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ message: "Failed to fetch dashboard stats" });
  }
});

app.get(
  "/api/admin/events/:eventId/registrations",
  requireAdmin,
  async (req, res) => {
    const eventId = parseInt(req.params.eventId);
    if (isNaN(eventId))
      return res.status(400).json({ message: "Invalid event ID" });

    try {
      const regsRes = await pool.query(
        `
      SELECT er.*, sr.first_name, sr.last_name, sr.admission_number, sr.email
      FROM event_registrations er
      LEFT JOIN student_registrations sr ON er.student_id = sr.id
      WHERE er.event_id = $1
      ORDER BY er.registration_date ASC`,
        [eventId],
      );

      const result = (regsRes.rows || []).map((r) => ({
        ...r,
        first_name: r.first_name,
        last_name: r.last_name,
        admission_number: r.admission_number,
        email: r.email,
      }));
      res.json(result);
    } catch (error) {
      console.error("Get event registrations error:", error);
      res.status(500).json({ message: "Failed to fetch event registrations" });
    }
  },
);

app.get("/api/admin/students", requireAdmin, async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(Math.max(1, parseInt(req.query.limit) || 50), 200);
  const offset = (page - 1) * limit;
  const search = (req.query.search || "").trim();

  try {
    let countQuery = `SELECT COUNT(*) FROM student_registrations`;
    let dataQuery  = `SELECT id, first_name, last_name, admission_number, email, phone, status, created_at, last_login FROM student_registrations`;
    const params = [];
    let idx = 1;

    if (search) {
      const clause = ` WHERE (first_name ILIKE $${idx} OR last_name ILIKE $${idx} OR admission_number ILIKE $${idx} OR email ILIKE $${idx})`;
      countQuery += clause;
      dataQuery  += clause;
      params.push(`%${search}%`);
      idx++;
    }

    dataQuery += ` ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`;
    const dataParams = [...params, limit, offset];

    const [countRes, studentsRes] = await Promise.all([
      pool.query(countQuery, params),
      pool.query(dataQuery, dataParams),
    ]);

    res.json({
      students: studentsRes.rows || [],
      total: parseInt(countRes.rows[0].count, 10),
      page,
      limit,
      totalPages: Math.ceil(parseInt(countRes.rows[0].count, 10) / limit),
    });
  } catch (error) {
    console.error("Get students error:", error);
    res.status(500).json({ message: "Failed to fetch students" });
  }
});

app.delete("/api/admin/students/:studentId", requireAdmin, async (req, res) => {
  const studentId = parseInt(req.params.studentId);
  if (isNaN(studentId))
    return res.status(400).json({ message: "Invalid student ID" });

  try {
    const delRes = await pool.query(
      `DELETE FROM student_registrations WHERE id = $1 RETURNING id`,
      [studentId],
    );
    if (!delRes.rows?.length)
      return res.status(404).json({ message: "Student not found" });
    res.json({ message: "Student deleted successfully" });
  } catch (error) {
    console.error("Delete student error:", error);
    res.status(500).json({ message: "Failed to delete student" });
  }
});

app.get("/api/admin/activity", requireAdmin, async (req, res) => {
  try {
    const [
      activeStudentsRes,
      totalEventsRes,
      upcomingEventsRes,
      pendingEventsRes,
      totalEventRegistrationsRes,
    ] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) FROM student_registrations WHERE status = $1`,
        ["active"],
      ),
      pool.query(`SELECT COUNT(*) FROM events`),
      pool.query(`SELECT COUNT(*) FROM events WHERE status = $1`, ["upcoming"]),
      pool.query(`SELECT COUNT(*) FROM events WHERE status = $1`, ["pending"]),
      pool.query(`SELECT COUNT(*) FROM event_registrations WHERE status = $1`, [
        "registered",
      ]),
    ]);

    const activeStudents = parseInt(activeStudentsRes.rows[0].count || 0, 10);
    const totalEventRegistrations = parseInt(
      totalEventRegistrationsRes.rows[0].count || 0,
      10,
    );

    res.json({
      newRegistrationsToday: 0,
      activeStudents: activeStudents,
      activeSessions: Math.max(1, Math.floor(activeStudents * 0.2)),
      recentEventRegistrations: totalEventRegistrations,
      pendingApprovals: parseInt(pendingEventsRes.rows[0].count || 0, 10),
      totalEvents: parseInt(totalEventsRes.rows[0].count || 0, 10),
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Activity error:", error);
    res.status(500).json({ message: "Failed to fetch activity data" });
  }
});

app.get("/api/admin/recent-registrations", requireAdmin, async (req, res) => {
  const limit = Math.min(Math.max(1, parseInt(req.query.limit) || 10), 100);
  try {
    const studentsRes = await pool.query(
      `SELECT id, first_name, last_name, admission_number, email, created_at FROM student_registrations WHERE status = $1 ORDER BY id DESC LIMIT $2`,
      ["active", limit],
    );
    res.json(studentsRes.rows || []);
  } catch (error) {
    console.error("Recent registrations error:", error);
    res.status(500).json({ message: "Failed to fetch recent registrations" });
  }
});

app.get("/api/admin/active-sessions", requireAdmin, async (req, res) => {
  const { includeInactive } = req.query;
  try {
    let sql = `SELECT id, first_name, last_name, admission_number, email, last_login, created_at FROM student_registrations WHERE status = $1`;
    const params = ["active"];
    if (includeInactive !== "true") {
      const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      sql += ` AND last_login >= $2`;
      params.push(cutoff);
    }
    sql += ` ORDER BY last_login DESC NULLS LAST LIMIT 20`;
    const studentsRes = await pool.query(sql, params);
    const result = (studentsRes.rows || []).map((s) => ({
      ...s,
      session_start: s.last_login || s.created_at,
      login_status: s.last_login ? "active" : "never_logged_in",
    }));
    res.json(result);
  } catch (error) {
    console.error("Active sessions error:", error);
    res.status(500).json({ message: "Failed to fetch active sessions" });
  }
});

app.put("/api/admin/account", requireAdmin, async (req, res) => {
  const { currentPassword, newEmail, newPassword, confirmNewPassword } =
    req.body;
  if (!currentPassword)
    return res.status(400).json({ message: "Current password is required" });
  if (!newEmail && !newPassword)
    return res.status(400).json({ message: "Provide a new email or password" });
  if (newPassword && newPassword !== confirmNewPassword)
    return res.status(400).json({ message: "Passwords do not match" });
  if (newPassword && newPassword.length < 6)
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters" });
  if (newEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail))
    return res.status(400).json({ message: "Invalid email format" });

  try {
    const adminsRes = await pool.query(
      `SELECT id, admin_email, password_hash FROM admins WHERE id = $1 LIMIT 1`,
      [req.authUser.id],
    );
    if (!adminsRes.rows?.length)
      return res.status(404).json({ message: "Admin account not found" });
    const admin = adminsRes.rows[0];
    const hash2 = admin.password_hash || "";
    const valid = hash2.startsWith("$2")
      ? await bcrypt.compare(currentPassword, hash2)
      : currentPassword === hash2;
    if (!valid)
      return res.status(401).json({ message: "Current password is incorrect" });

    if (newEmail && newEmail !== admin.admin_email) {
      const existingRes = await pool.query(
        `SELECT id FROM admins WHERE admin_email = $1 AND id <> $2 LIMIT 1`,
        [newEmail.trim().toLowerCase(), admin.id],
      );
      if (existingRes.rows?.length > 0)
        return res.status(409).json({ message: "Email already in use" });
    }

    const updates = {};
    if (newEmail) updates.admin_email = newEmail.trim().toLowerCase();
    if (newPassword) updates.password_hash = await bcrypt.hash(newPassword, 12);

    const setClauses = [];
    const vals = [];
    let idx = 1;
    for (const k of Object.keys(updates)) {
      setClauses.push(`${k} = $${idx}`);
      vals.push(updates[k]);
      idx++;
    }
    if (setClauses.length > 0) {
      vals.push(admin.id);
      await pool.query(
        `UPDATE admins SET ${setClauses.join(", ")} WHERE id = $${idx}`,
        vals,
      );
    }
    res.json({ message: "Account updated successfully" });
  } catch (error) {
    console.error("Update account error:", error);
    res.status(500).json({ message: "Failed to update account" });
  }
});

// ─── ADMIN: SYSTEM SETTINGS ──────────────────────────────────────────────────

app.get("/api/admin/settings", requireAdmin, async (req, res) => {
  try {
    const settingsRes = await pool.query(`SELECT key, value FROM system_settings ORDER BY key`);
    const settings = {};
    for (const row of settingsRes.rows) settings[row.key] = row.value;
    res.json(settings);
  } catch (error) {
    console.error("Get settings error:", error);
    res.status(500).json({ message: "Failed to fetch settings" });
  }
});

app.put("/api/admin/settings", requireAdmin, async (req, res) => {
  const updates = req.body;
  if (!updates || typeof updates !== "object" || Array.isArray(updates))
    return res.status(400).json({ message: "Settings must be an object" });

  const allowedKeys = [
    "system_name", "system_description", "sms_enabled",
    "registration_open", "maintenance_mode", "sms_sender_id",
    "max_events_per_club", "contact_email",
  ];

  try {
    const promises = [];
    for (const [key, value] of Object.entries(updates)) {
      if (!allowedKeys.includes(key)) continue;
      if (typeof value !== "string") continue;
      promises.push(
        pool.query(
          `INSERT INTO system_settings (key, value, updated_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
          [key, value],
        ),
      );
    }
    await Promise.all(promises);
    invalidateCache("system:settings");
    res.json({ message: "Settings updated successfully" });
  } catch (error) {
    console.error("Update settings error:", error);
    res.status(500).json({ message: "Failed to update settings" });
  }
});

// ─── ADMIN: SMS SENDING ──────────────────────────────────────────────────────

app.post("/api/admin/sms/send", requireAdmin, async (req, res) => {
  const { message, recipients, targetGroup } = req.body;
  if (!message || typeof message !== "string" || message.trim().length < 5)
    return res.status(400).json({ message: "Message must be at least 5 characters" });

  // Check if SMS is enabled in settings
  const settingRes = await pool.query(
    `SELECT value FROM system_settings WHERE key = 'sms_enabled' LIMIT 1`,
  );
  const smsEnabled = settingRes.rows[0]?.value === "true";
  if (!smsEnabled && !process.env.AT_API_KEY)
    return res.status(400).json({ message: "SMS is not configured. Please add Africa's Talking API key and enable SMS in settings." });

  try {
    let phoneNumbers = [];

    if (targetGroup === "all_students") {
      const studentsRes = await pool.query(
        `SELECT phone FROM student_registrations WHERE status = 'active' AND phone IS NOT NULL AND phone != ''`,
      );
      phoneNumbers = studentsRes.rows.map((r) => r.phone);
    } else if (targetGroup === "club_leaders") {
      // Club leaders don't have phones in DB — use manual recipients
      phoneNumbers = (recipients || []).filter(Boolean);
    } else if (Array.isArray(recipients)) {
      phoneNumbers = recipients.filter(Boolean);
    }

    if (phoneNumbers.length === 0)
      return res.status(400).json({ message: "No phone numbers available. Students must have phone numbers registered." });

    const result = await sendSMS(phoneNumbers, message.trim());
    if (result.success) {
      res.json({
        message: `SMS sent to ${phoneNumbers.length} recipient(s)`,
        count: phoneNumbers.length,
        result: result.result,
      });
    } else {
      res.status(500).json({ message: "SMS delivery failed: " + result.reason });
    }
  } catch (error) {
    console.error("SMS send error:", error);
    res.status(500).json({ message: "Failed to send SMS: " + error.message });
  }
});

// Send SMS to specific event registrants
app.post("/api/admin/sms/event/:eventId", requireAdmin, async (req, res) => {
  const eventId = parseInt(req.params.eventId);
  if (isNaN(eventId)) return res.status(400).json({ message: "Invalid event ID" });
  const { message } = req.body;
  if (!message || message.trim().length < 5)
    return res.status(400).json({ message: "Message required (min 5 chars)" });

  try {
    const regsRes = await pool.query(
      `SELECT sr.phone FROM event_registrations er
       JOIN student_registrations sr ON sr.id = er.student_id
       WHERE er.event_id = $1 AND er.status = 'registered' AND sr.phone IS NOT NULL AND sr.phone != ''`,
      [eventId],
    );
    const phones = regsRes.rows.map((r) => r.phone);
    if (phones.length === 0)
      return res.status(400).json({ message: "No phone numbers found for this event's registrants." });

    const result = await sendSMS(phones, message.trim());
    if (result.success) {
      res.json({ message: `SMS sent to ${phones.length} registrant(s)`, count: phones.length });
    } else {
      res.status(500).json({ message: "SMS failed: " + result.reason });
    }
  } catch (error) {
    console.error("Event SMS error:", error);
    res.status(500).json({ message: "Failed to send SMS" });
  }
});

// Admin: update student status (activate / soft-delete)
app.patch("/api/admin/students/:studentId/status", requireAdmin, async (req, res) => {
  const studentId = parseInt(req.params.studentId);
  if (isNaN(studentId)) return res.status(400).json({ message: "Invalid student ID" });
  const { status } = req.body;
  if (!["active", "deleted"].includes(status))
    return res.status(400).json({ message: "Invalid status. Use 'active' or 'deleted'." });
  try {
    const updRes = await pool.query(
      `UPDATE student_registrations SET status = $1 WHERE id = $2 RETURNING id`,
      [status, studentId],
    );
    if (!updRes.rows?.length) return res.status(404).json({ message: "Student not found" });
    res.json({ message: `Student status set to ${status}` });
  } catch (error) {
    console.error("Update student status error:", error);
    res.status(500).json({ message: "Failed to update student status" });
  }
});

// ─── CLUB LEADER MANAGEMENT (admin only) ─────────────────────────────────────

app.get("/api/admin/club-leaders", requireAdmin, async (req, res) => {
  try {
    const leadersRes = await pool.query(
      `SELECT id, admin_email, name, club, created_at FROM admins WHERE role = $1 ORDER BY created_at DESC`,
      ["club_leader"],
    );
    res.json(leadersRes.rows || []);
  } catch (error) {
    console.error("Get club leaders error:", error);
    res.status(500).json({ message: "Failed to fetch club leaders" });
  }
});

app.post("/api/admin/club-leaders", requireAdmin, async (req, res) => {
  const { email, password, name, club } = req.body;
  if (!email || !password || !name || !club)
    return res
      .status(400)
      .json({ message: "email, password, name, and club are required" });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ message: "Invalid email address" });
  if (typeof password !== "string" || password.length < 6)
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters" });

  try {
    const existingRes = await pool.query(
      `SELECT id FROM admins WHERE admin_email = $1 LIMIT 1`,
      [email.trim().toLowerCase()],
    );
    if (existingRes.rows?.length > 0)
      return res.status(409).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 12);
    const insertRes = await pool.query(
      `INSERT INTO admins (admin_email, password_hash, name, club, role) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [
        email.trim().toLowerCase(),
        hashed,
        name.trim(),
        club.trim(),
        "club_leader",
      ],
    );
    const inserted = insertRes.rows[0];
    res.status(201).json({
      message: "Club leader created successfully",
      leader: {
        id: inserted.id,
        email: email.trim().toLowerCase(),
        name: name.trim(),
        club: club.trim(),
      },
    });
  } catch (error) {
    console.error("Create club leader error:", error);
    res.status(500).json({ message: "Failed to create club leader" });
  }
});

app.delete("/api/admin/club-leaders/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

  try {
    const delRes = await pool.query(
      `DELETE FROM admins WHERE id = $1 AND role = $2 RETURNING id`,
      [id, "club_leader"],
    );
    if (!delRes.rows?.length)
      return res.status(404).json({ message: "Club leader not found" });
    res.json({ message: "Club leader deleted successfully" });
  } catch (error) {
    console.error("Delete club leader error:", error);
    res.status(500).json({ message: "Failed to delete club leader" });
  }
});

// ─── CLUB LEADER DASHBOARD ────────────────────────────────────────────────────

app.get(
  "/api/club-leader/dashboard",
  requireAdminOrLeader,
  async (req, res) => {
    if (req.authUser.role !== "club_leader")
      return res.status(403).json({ message: "Club leader access only" });

    const cacheKey = `cl:${req.authUser.id}:dashboard`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    try {
      const leaderId = req.authUser.id;
      const myEventsRes = await pool.query(
        `SELECT * FROM events WHERE created_by = $1 ORDER BY created_at DESC`,
        [leaderId],
      );
      const myEvents = myEventsRes.rows || [];
      const eventIds = myEvents.map((e) => e.id);
      const regCountMap = await fetchRegCounts(eventIds);
      const eventsWithCounts = myEvents.map((ev) => ({
        ...ev,
        registered_count: regCountMap[ev.id] ?? 0,
      }));

      const totalMyEvents = myEvents?.length ?? 0;
      const pendingCount = (myEvents || []).filter(
        (e) => e.status === "pending",
      ).length;
      const upcomingCount = (myEvents || []).filter(
        (e) => e.status === "upcoming",
      ).length;
      const totalRegistrations = Object.values(regCountMap).reduce(
        (s, n) => s + n,
        0,
      );

      const result = {
        club: req.authUser.club,
        stats: {
          totalMyEvents,
          pendingCount,
          upcomingCount,
          totalRegistrations,
        },
        myEvents: eventsWithCounts,
      };
      cache.set(cacheKey, result, 30);
      res.json(result);
    } catch (error) {
      console.error("Club leader dashboard error:", error);
      res.status(500).json({ message: "Failed to fetch dashboard" });
    }
  },
);

// Registrations for a specific event (club leader can only see their own)
app.get(
  "/api/club-leader/events/:eventId/registrations",
  requireAdminOrLeader,
  async (req, res) => {
    const eventId = parseInt(req.params.eventId);
    if (isNaN(eventId))
      return res.status(400).json({ message: "Invalid event ID" });

    try {
      if (req.authUser.role === "club_leader") {
        const evsRes = await pool.query(
          `SELECT created_by FROM events WHERE id = $1 LIMIT 1`,
          [eventId],
        );
        if (!evsRes.rows?.length)
          return res.status(404).json({ message: "Event not found" });
        if (evsRes.rows[0].created_by !== req.authUser.id)
          return res.status(403).json({ message: "Access denied" });
      }
      const regsRes = await pool.query(
        `
      SELECT er.registration_date, er.status, sr.first_name, sr.last_name, sr.admission_number, sr.email
      FROM event_registrations er
      LEFT JOIN student_registrations sr ON er.student_id = sr.id
      WHERE er.event_id = $1 AND er.status = $2
      ORDER BY er.registration_date ASC`,
        [eventId, "registered"],
      );
      const result = (regsRes.rows || []).map((r) => ({
        registration_date: r.registration_date,
        status: r.status,
        first_name: r.first_name,
        last_name: r.last_name,
        admission_number: r.admission_number,
        email: r.email,
      }));
      res.json(result);
    } catch (error) {
      console.error("Club leader event registrations error:", error);
      res.status(500).json({ message: "Failed to fetch registrations" });
    }
  },
);

app.put("/api/club-leader/account", requireAdminOrLeader, async (req, res) => {
  if (req.authUser.role !== "club_leader")
    return res.status(403).json({ message: "Club leader access only" });

  const { currentPassword, newPassword, confirmNewPassword } = req.body;
  if (!currentPassword || !newPassword)
    return res
      .status(400)
      .json({ message: "All password fields are required" });
  if (newPassword !== confirmNewPassword)
    return res.status(400).json({ message: "Passwords do not match" });
  if (newPassword.length < 6)
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters" });

  try {
    const adminsRes = await pool.query(
      `SELECT id, password_hash FROM admins WHERE id = $1 LIMIT 1`,
      [req.authUser.id],
    );
    if (!adminsRes.rows?.length)
      return res.status(404).json({ message: "Account not found" });
    const hashCL = adminsRes.rows[0].password_hash || "";
    const valid = hashCL.startsWith("$2")
      ? await bcrypt.compare(currentPassword, hashCL)
      : currentPassword === hashCL;
    if (!valid)
      return res.status(401).json({ message: "Current password is incorrect" });

    const hashed = await bcrypt.hash(newPassword, 12);
    await pool.query(`UPDATE admins SET password_hash = $1 WHERE id = $2`, [
      hashed,
      req.authUser.id,
    ]);
    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Club leader account update error:", error);
    res.status(500).json({ message: "Failed to update password" });
  }
});

// ─── START SERVER ─────────────────────────────────────────────────────────────

async function startServer() {
  try {
    await testConnection();
    await ensureDatabaseSchema();
    console.log("Database: connected ✓");
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }

  httpServer.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
    console.log(`Socket.io server running on same port`);
  });
}

startServer();

// Serve client `dist` if present (production)
const clientDist = path.join(__dirname, "..", "dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));

  // Fallback to index.html for SPA routes, but keep API and uploads routes intact
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads"))
      return next();
    res.sendFile(path.join(clientDist, "index.html"));
  });
}
