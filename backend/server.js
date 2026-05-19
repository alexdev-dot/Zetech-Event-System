import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import NodeCache from "node-cache";
import { pool, testConnection } from "./db.js";

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "zetech-event-hub-secret-2024-change-in-prod";
const JWT_EXPIRES_IN = "24h";

// In-memory cache: stdTTL = 60s, check expired keys every 120s
const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

app.use(cors());
app.use(express.json({ limit: "2mb" }));

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function invalidateCache(...keys) {
  keys.forEach((k) => cache.del(k));
}

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────

/** Verifies JWT and attaches decoded payload to req.authUser */
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Authentication required" });
  try {
    req.authUser = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

/** Only full admins */
function requireAdmin(req, res, next) {
  authenticateToken(req, res, () => {
    if (req.authUser?.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  });
}

/** Admins OR club leaders */
function requireAdminOrLeader(req, res, next) {
  authenticateToken(req, res, () => {
    if (req.authUser?.role !== "admin" && req.authUser?.role !== "club_leader") {
      return res.status(403).json({ message: "Admin or club leader access required" });
    }
    next();
  });
}

// ─── HEALTH ───────────────────────────────────────────────────────────────────

app.get("/api/health", async (_req, res) => {
  try {
    await testConnection();
    res.json({ status: "ok", database: "connected" });
  } catch {
    res.status(500).json({ message: "Database connection failed" });
  }
});

// ─── STUDENT AUTH ─────────────────────────────────────────────────────────────

app.post("/api/auth/register", async (req, res) => {
  const { firstName, lastName, email, admissionNumber, password } = req.body;

  if (!firstName || !lastName || !email || !admissionNumber || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }
  if (typeof firstName !== "string" || firstName.trim().length < 2) {
    return res.status(400).json({ message: "First name must be at least 2 characters" });
  }
  if (typeof lastName !== "string" || lastName.trim().length < 2) {
    return res.status(400).json({ message: "Last name must be at least 2 characters" });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email address" });
  }
  if (typeof admissionNumber !== "string" || admissionNumber.trim().length < 3) {
    return res.status(400).json({ message: "Invalid admission number" });
  }
  if (typeof password !== "string" || password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  try {
    const [existing] = await pool.execute(
      "SELECT id FROM student_registrations WHERE admission_number = ? OR email = ? LIMIT 1",
      [admissionNumber.trim(), email.trim().toLowerCase()]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: "Admission number or email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const [result] = await pool.execute(
      `INSERT INTO student_registrations (first_name, last_name, admission_number, email, password)
       VALUES (?, ?, ?, ?, ?)`,
      [firstName.trim(), lastName.trim(), admissionNumber.trim(), email.trim().toLowerCase(), hashedPassword]
    );

    const user = {
      id: result.insertId,
      email: email.trim().toLowerCase(),
      adminNumber: admissionNumber.trim(),
      name: `${firstName.trim()} ${lastName.trim()}`,
      role: "user",
    };
    const token = generateToken({ id: user.id, role: "user" });

    res.status(201).json({ message: "Student registered successfully", user, token });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Registration failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { admissionNumber, password } = req.body;

  if (!admissionNumber || !password) {
    return res.status(400).json({ message: "Admission number and password are required" });
  }
  if (typeof admissionNumber !== "string" || typeof password !== "string") {
    return res.status(400).json({ message: "Invalid input" });
  }

  try {
    const [students] = await pool.execute(
      `SELECT id, first_name, last_name, admission_number, email, password, status
       FROM student_registrations WHERE admission_number = ? LIMIT 1`,
      [admissionNumber.trim()]
    );
    if (students.length === 0) {
      return res.status(401).json({ message: "Invalid admission number or password" });
    }

    const student = students[0];
    if (student.status === "deleted") {
      return res.status(401).json({ message: "Account has been deactivated" });
    }

    const isPasswordValid = await bcrypt.compare(password, student.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid admission number or password" });
    }

    await pool.execute("UPDATE student_registrations SET last_login = NOW() WHERE id = ?", [student.id]);

    const user = {
      id: student.id,
      email: student.email,
      adminNumber: student.admission_number,
      name: `${student.first_name} ${student.last_name}`,
      role: "user",
    };
    const token = generateToken({ id: student.id, role: "user" });

    res.json({ message: "Login successful", user, token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed" });
  }
});

// ─── ADMIN / CLUB LEADER AUTH ────────────────────────────────────────────────

app.post("/api/auth/admin/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }
  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ message: "Invalid input" });
  }

  try {
    const [admins] = await pool.execute(
      "SELECT id, email, password, role, name, club FROM admins WHERE email = ? LIMIT 1",
      [email.trim().toLowerCase()]
    );
    if (admins.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const admin = admins[0];

    // Support legacy plain-text password (first-run upgrade)
    let isPasswordValid = false;
    if (admin.password === "admin123") {
      isPasswordValid = password === "admin123";
    } else {
      isPasswordValid = await bcrypt.compare(password, admin.password);
    }
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Upgrade plain-text password on first login
    if (admin.password === "admin123") {
      const hashedPassword = await bcrypt.hash(password, 12);
      await pool.execute("UPDATE admins SET password = ? WHERE id = ?", [hashedPassword, admin.id]);
    }

    const role = admin.role || "admin";
    const user = {
      id: admin.id,
      email: admin.email,
      adminNumber: role === "club_leader" ? `CL-${admin.id}` : "ADMIN001",
      name: admin.name || (role === "admin" ? "Admin User" : "Club Leader"),
      role,
      club: admin.club || null,
    };
    const token = generateToken({ id: admin.id, role, club: admin.club || null });

    res.json({ message: "Login successful", user, token });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ message: "Login failed" });
  }
});

// Verify token endpoint (for session restore)
app.get("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    const { id, role } = req.authUser;
    if (role === "user") {
      const [rows] = await pool.execute(
        "SELECT id, first_name, last_name, admission_number, email, status FROM student_registrations WHERE id = ? LIMIT 1",
        [id]
      );
      if (!rows.length || rows[0].status === "deleted") {
        return res.status(401).json({ message: "Account not found" });
      }
      const s = rows[0];
      return res.json({
        user: {
          id: s.id, email: s.email,
          adminNumber: s.admission_number,
          name: `${s.first_name} ${s.last_name}`,
          role: "user",
        },
      });
    } else {
      const [rows] = await pool.execute(
        "SELECT id, email, role, name, club FROM admins WHERE id = ? LIMIT 1",
        [id]
      );
      if (!rows.length) return res.status(401).json({ message: "Account not found" });
      const a = rows[0];
      return res.json({
        user: {
          id: a.id, email: a.email,
          adminNumber: a.role === "club_leader" ? `CL-${a.id}` : "ADMIN001",
          name: a.name || (a.role === "admin" ? "Admin User" : "Club Leader"),
          role: a.role,
          club: a.club || null,
        },
      });
    }
  } catch (error) {
    console.error("Auth/me error:", error);
    res.status(500).json({ message: "Failed to verify session" });
  }
});

// ─── EVENT ROUTES ─────────────────────────────────────────────────────────────

app.get("/api/events", async (req, res) => {
  const cacheKey = "events:all";
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const [events] = await pool.execute(`
      SELECT e.*,
             COUNT(er.id) AS registered_count,
             a.email AS created_by_email,
             a.name AS created_by_name,
             a.role AS creator_role,
             a.club AS creator_club
      FROM events e
      LEFT JOIN event_registrations er ON e.id = er.event_id AND er.status = 'registered'
      LEFT JOIN admins a ON e.created_by = a.id
      WHERE e.status != 'cancelled'
      GROUP BY e.id
      ORDER BY e.date ASC, e.time ASC
    `);
    cache.set(cacheKey, events);
    res.json(events);
  } catch (error) {
    console.error("Get events error:", error);
    res.status(500).json({ message: "Failed to fetch events" });
  }
});

app.get("/api/events/:id", async (req, res) => {
  const { id } = req.params;
  if (isNaN(parseInt(id))) return res.status(400).json({ message: "Invalid event ID" });

  const cacheKey = `event:${id}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const [events] = await pool.execute(`
      SELECT e.*,
             COUNT(er.id) AS registered_count,
             a.email AS created_by_email,
             a.name AS created_by_name
      FROM events e
      LEFT JOIN event_registrations er ON e.id = er.event_id AND er.status = 'registered'
      LEFT JOIN admins a ON e.created_by = a.id
      WHERE e.id = ?
      GROUP BY e.id
    `, [id]);

    if (events.length === 0) return res.status(404).json({ message: "Event not found" });
    cache.set(cacheKey, events[0]);
    res.json(events[0]);
  } catch (error) {
    console.error("Get event error:", error);
    res.status(500).json({ message: "Failed to fetch event" });
  }
});

// Create event — admin or club leader
app.post("/api/events", requireAdminOrLeader, async (req, res) => {
  const { title, description, date, time, location, category, maxParticipants, imageUrl } = req.body;

  if (!title || !description || !date || !time || !location || !category) {
    return res.status(400).json({ message: "title, description, date, time, location, and category are required" });
  }
  if (typeof title !== "string" || title.trim().length < 3) {
    return res.status(400).json({ message: "Title must be at least 3 characters" });
  }
  if (typeof description !== "string" || description.trim().length < 10) {
    return res.status(400).json({ message: "Description must be at least 10 characters" });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ message: "Invalid date format (expected YYYY-MM-DD)" });
  }
  if (maxParticipants !== undefined && maxParticipants !== null) {
    const cap = parseInt(maxParticipants);
    if (isNaN(cap) || cap < 1) return res.status(400).json({ message: "maxParticipants must be a positive number" });
  }

  // Club leaders can only create events for their own club category
  if (req.authUser.role === "club_leader" && req.authUser.club) {
    if (category !== req.authUser.club) {
      return res.status(403).json({ message: `Club leaders can only create events for their club: ${req.authUser.club}` });
    }
  }

  try {
    const createdBy = req.authUser.id;
    const [result] = await pool.execute(
      `INSERT INTO events (title, description, date, time, location, category, max_participants, image_url, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title.trim(), description.trim(), date, time, location.trim(), category, maxParticipants || null, imageUrl || null, createdBy]
    );

    invalidateCache("events:all", "admin:stats");
    res.status(201).json({ message: "Event created successfully", eventId: result.insertId });
  } catch (error) {
    console.error("Create event error:", error);
    res.status(500).json({ message: "Failed to create event" });
  }
});

// Update event — admin only (or club leader's own events)
app.put("/api/events/:id", requireAdminOrLeader, async (req, res) => {
  const { id } = req.params;
  if (isNaN(parseInt(id))) return res.status(400).json({ message: "Invalid event ID" });

  const { title, description, date, time, location, category, maxParticipants, imageUrl, status } = req.body;

  if (!title || !description || !date || !time || !location || !category) {
    return res.status(400).json({ message: "All event fields are required" });
  }

  try {
    // Club leaders can only edit their own events
    if (req.authUser.role === "club_leader") {
      const [rows] = await pool.execute("SELECT created_by FROM events WHERE id = ?", [id]);
      if (!rows.length) return res.status(404).json({ message: "Event not found" });
      if (rows[0].created_by !== req.authUser.id) {
        return res.status(403).json({ message: "You can only edit your own events" });
      }
    }

    const validStatuses = ["upcoming", "ongoing", "completed", "cancelled"];
    const safeStatus = validStatuses.includes(status) ? status : "upcoming";

    const [result] = await pool.execute(
      `UPDATE events
       SET title = ?, description = ?, date = ?, time = ?, location = ?,
           category = ?, max_participants = ?, image_url = ?, status = ?
       WHERE id = ?`,
      [title.trim(), description.trim(), date, time, location.trim(), category, maxParticipants || null, imageUrl || null, safeStatus, id]
    );

    if (result.affectedRows === 0) return res.status(404).json({ message: "Event not found" });
    invalidateCache("events:all", `event:${id}`, "admin:stats");
    res.json({ message: "Event updated successfully" });
  } catch (error) {
    console.error("Update event error:", error);
    res.status(500).json({ message: "Failed to update event" });
  }
});

// Delete event — admin only
app.delete("/api/events/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  if (isNaN(parseInt(id))) return res.status(400).json({ message: "Invalid event ID" });

  try {
    const [result] = await pool.execute("DELETE FROM events WHERE id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: "Event not found" });
    invalidateCache("events:all", `event:${id}`, "admin:stats");
    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Delete event error:", error);
    res.status(500).json({ message: "Failed to delete event" });
  }
});

// ─── EVENT REGISTRATION ───────────────────────────────────────────────────────

app.post("/api/events/:id/register", authenticateToken, async (req, res) => {
  const { id } = req.params;
  if (isNaN(parseInt(id))) return res.status(400).json({ message: "Invalid event ID" });

  if (req.authUser.role !== "user") {
    return res.status(403).json({ message: "Only students can register for events" });
  }

  const studentId = req.authUser.id;

  try {
    const [events] = await pool.execute(
      "SELECT id, max_participants, status FROM events WHERE id = ? AND status = 'upcoming' LIMIT 1",
      [id]
    );
    if (events.length === 0) {
      return res.status(404).json({ message: "Event not found or not available for registration" });
    }

    const event = events[0];

    const [existing] = await pool.execute(
      "SELECT id FROM event_registrations WHERE event_id = ? AND student_id = ?",
      [id, studentId]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: "Already registered for this event" });
    }

    if (event.max_participants) {
      const [countRows] = await pool.execute(
        "SELECT COUNT(*) AS count FROM event_registrations WHERE event_id = ? AND status = 'registered'",
        [id]
      );
      if (countRows[0].count >= event.max_participants) {
        return res.status(409).json({ message: "Event is full" });
      }
    }

    const [result] = await pool.execute(
      "INSERT INTO event_registrations (event_id, student_id) VALUES (?, ?)",
      [id, studentId]
    );

    invalidateCache("events:all", `event:${id}`);
    res.status(201).json({ message: "Successfully registered for event", registrationId: result.insertId });
  } catch (error) {
    console.error("Register event error:", error);
    res.status(500).json({ message: "Failed to register for event" });
  }
});

app.delete("/api/events/:eventId/register/:studentId", authenticateToken, async (req, res) => {
  const { eventId, studentId } = req.params;
  if (isNaN(parseInt(eventId)) || isNaN(parseInt(studentId))) {
    return res.status(400).json({ message: "Invalid IDs" });
  }

  // Students can only cancel their own registration
  if (req.authUser.role === "user" && req.authUser.id !== parseInt(studentId)) {
    return res.status(403).json({ message: "You can only cancel your own registration" });
  }

  try {
    const [result] = await pool.execute(
      "DELETE FROM event_registrations WHERE event_id = ? AND student_id = ?",
      [eventId, studentId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: "Registration not found" });
    invalidateCache("events:all", `event:${eventId}`);
    res.json({ message: "Registration cancelled successfully" });
  } catch (error) {
    console.error("Cancel registration error:", error);
    res.status(500).json({ message: "Failed to cancel registration" });
  }
});

app.get("/api/students/:studentId/registrations", authenticateToken, async (req, res) => {
  const { studentId } = req.params;
  if (isNaN(parseInt(studentId))) return res.status(400).json({ message: "Invalid student ID" });

  // Students can only view their own registrations
  if (req.authUser.role === "user" && req.authUser.id !== parseInt(studentId)) {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const [registrations] = await pool.execute(`
      SELECT er.*, e.title, e.date, e.time, e.location, e.category, e.status AS event_status, e.image_url
      FROM event_registrations er
      JOIN events e ON er.event_id = e.id
      WHERE er.student_id = ?
      ORDER BY e.date ASC, e.time ASC
    `, [studentId]);

    res.json(registrations);
  } catch (error) {
    console.error("Get registrations error:", error);
    res.status(500).json({ message: "Failed to fetch registrations" });
  }
});

// ─── ADMIN ROUTES ─────────────────────────────────────────────────────────────

app.get("/api/admin/dashboard/stats", requireAdmin, async (req, res) => {
  const cacheKey = "admin:stats";
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const [[{ count: totalEvents }]] = await pool.execute("SELECT COUNT(*) AS count FROM events");
    const [[{ count: totalStudents }]] = await pool.execute("SELECT COUNT(*) AS count FROM student_registrations WHERE status = 'active'");
    const [[{ count: upcomingEvents }]] = await pool.execute("SELECT COUNT(*) AS count FROM events WHERE status = 'upcoming'");
    const [[{ count: totalRegistrations }]] = await pool.execute("SELECT COUNT(*) AS count FROM event_registrations WHERE status = 'registered'");

    const [recentEvents] = await pool.execute(`
      SELECT e.*, COUNT(er.id) AS registered_count
      FROM events e
      LEFT JOIN event_registrations er ON e.id = er.event_id AND er.status = 'registered'
      GROUP BY e.id
      ORDER BY e.created_at DESC
      LIMIT 5
    `);

    const result = { totalEvents, totalStudents, upcomingEvents, totalRegistrations, recentEvents };
    cache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ message: "Failed to fetch dashboard stats" });
  }
});

app.get("/api/admin/events/:eventId/registrations", requireAdmin, async (req, res) => {
  const { eventId } = req.params;
  if (isNaN(parseInt(eventId))) return res.status(400).json({ message: "Invalid event ID" });

  try {
    const [registrations] = await pool.execute(`
      SELECT er.*, sr.first_name, sr.last_name, sr.admission_number, sr.email
      FROM event_registrations er
      JOIN student_registrations sr ON er.student_id = sr.id
      WHERE er.event_id = ?
      ORDER BY er.registration_date ASC
    `, [eventId]);
    res.json(registrations);
  } catch (error) {
    console.error("Get event registrations error:", error);
    res.status(500).json({ message: "Failed to fetch event registrations" });
  }
});

app.get("/api/admin/students", requireAdmin, async (req, res) => {
  try {
    const [students] = await pool.execute(`
      SELECT id, first_name, last_name, admission_number, email, status, created_at, last_login
      FROM student_registrations
      ORDER BY created_at DESC
    `);
    res.json(students);
  } catch (error) {
    console.error("Get students error:", error);
    res.status(500).json({ message: "Failed to fetch students" });
  }
});

app.delete("/api/admin/students/:studentId", requireAdmin, async (req, res) => {
  const { studentId } = req.params;
  if (isNaN(parseInt(studentId))) return res.status(400).json({ message: "Invalid student ID" });

  try {
    const [result] = await pool.execute("DELETE FROM student_registrations WHERE id = ?", [studentId]);
    if (result.affectedRows === 0) return res.status(404).json({ message: "Student not found" });
    res.json({ message: "Student deleted successfully" });
  } catch (error) {
    console.error("Delete student error:", error);
    res.status(500).json({ message: "Failed to delete student" });
  }
});

app.get("/api/admin/activity", requireAdmin, async (req, res) => {
  try {
    const [[{ count: activeStudents }]] = await pool.execute(
      "SELECT COUNT(*) AS count FROM student_registrations WHERE status = 'active'"
    );
    const [[{ count: totalStudents }]] = await pool.execute(
      "SELECT COUNT(*) AS count FROM student_registrations"
    );
    const [[{ count: totalEvents }]] = await pool.execute("SELECT COUNT(*) AS count FROM events");
    const [[{ count: upcomingEvents }]] = await pool.execute("SELECT COUNT(*) AS count FROM events WHERE status = 'upcoming'");
    const [[{ count: totalEventRegistrations }]] = await pool.execute(
      "SELECT COUNT(*) AS count FROM event_registrations WHERE status = 'registered'"
    );

    const activeSessions = Math.max(1, Math.floor(activeStudents * 0.2));

    res.json({
      newRegistrationsToday: 0,
      activeStudents,
      activeSessions,
      recentEventRegistrations: totalEventRegistrations,
      pendingApprovals: upcomingEvents,
      totalEvents,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Activity error:", error);
    res.status(500).json({ message: "Failed to fetch activity data" });
  }
});

app.get("/api/admin/recent-registrations", requireAdmin, async (req, res) => {
  const limitParam = parseInt(req.query.limit) || 10;
  const limit = Math.min(Math.max(1, limitParam), 100); // clamp 1–100

  try {
    const [rows] = await pool.execute(
      `SELECT id, first_name, last_name, admission_number, email, created_at
       FROM student_registrations WHERE status = 'active'
       ORDER BY id DESC LIMIT ?`,
      [limit]
    );
    res.json(rows);
  } catch (error) {
    console.error("Recent registrations error:", error);
    res.status(500).json({ message: "Failed to fetch recent registrations" });
  }
});

app.get("/api/admin/active-sessions", requireAdmin, async (req, res) => {
  const { includeInactive } = req.query;

  try {
    let query;
    if (includeInactive === "true") {
      query = `
        SELECT id, first_name, last_name, admission_number, email,
               COALESCE(last_login, created_at) AS session_start,
               last_login, created_at,
               CASE
                 WHEN last_login IS NOT NULL AND TIMESTAMPDIFF(MINUTE, last_login, NOW()) <= 30 THEN 'active'
                 WHEN last_login IS NOT NULL THEN 'inactive'
                 ELSE 'never_logged_in'
               END AS login_status
        FROM student_registrations WHERE status = 'active'
        ORDER BY CASE WHEN last_login IS NOT NULL THEN last_login ELSE created_at END DESC
        LIMIT 20
      `;
    } else {
      query = `
        SELECT id, first_name, last_name, admission_number, email,
               COALESCE(last_login, created_at) AS session_start,
               last_login, created_at, 'active' AS login_status
        FROM student_registrations
        WHERE status = 'active' AND last_login IS NOT NULL
          AND TIMESTAMPDIFF(MINUTE, last_login, NOW()) <= 30
        ORDER BY last_login DESC
        LIMIT 10
      `;
    }

    const [users] = await pool.execute(query);
    res.json(users);
  } catch (error) {
    console.error("Active sessions error:", error);
    res.status(500).json({ message: "Failed to fetch active sessions" });
  }
});

app.put("/api/admin/account", requireAdmin, async (req, res) => {
  const { currentPassword, newEmail, newPassword, confirmNewPassword } = req.body;

  if (!currentPassword) return res.status(400).json({ message: "Current password is required" });
  if (!newEmail && !newPassword) return res.status(400).json({ message: "Provide a new email or new password" });
  if (newPassword && newPassword !== confirmNewPassword) {
    return res.status(400).json({ message: "New password and confirmation do not match" });
  }
  if (newPassword && (typeof newPassword !== "string" || newPassword.length < 6)) {
    return res.status(400).json({ message: "New password must be at least 6 characters" });
  }
  if (newEmail) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) return res.status(400).json({ message: "Invalid email format" });
  }

  try {
    const adminId = req.authUser.id;
    const [admins] = await pool.execute("SELECT id, email, password FROM admins WHERE id = ?", [adminId]);
    if (admins.length === 0) return res.status(404).json({ message: "Admin account not found" });

    const admin = admins[0];
    const isPasswordValid = admin.password === "admin123" || await bcrypt.compare(currentPassword, admin.password);
    if (!isPasswordValid) return res.status(401).json({ message: "Current password is incorrect" });

    if (newEmail && newEmail !== admin.email) {
      const [existingEmail] = await pool.execute(
        "SELECT id FROM admins WHERE email = ? AND id != ?",
        [newEmail.trim().toLowerCase(), admin.id]
      );
      if (existingEmail.length > 0) return res.status(409).json({ message: "Email is already in use" });
    }

    const updateFields = [];
    const updateValues = [];
    if (newEmail) { updateFields.push("email = ?"); updateValues.push(newEmail.trim().toLowerCase()); }
    if (newPassword) {
      const hashed = await bcrypt.hash(newPassword, 12);
      updateFields.push("password = ?");
      updateValues.push(hashed);
    }

    await pool.execute(`UPDATE admins SET ${updateFields.join(", ")} WHERE id = ?`, [...updateValues, admin.id]);
    res.json({ message: "Account updated successfully" });
  } catch (error) {
    console.error("Update account error:", error);
    res.status(500).json({ message: "Failed to update account" });
  }
});

// ─── CLUB LEADER MANAGEMENT (admin only) ─────────────────────────────────────

app.get("/api/admin/club-leaders", requireAdmin, async (req, res) => {
  try {
    const [leaders] = await pool.execute(
      "SELECT id, email, name, club, created_at FROM admins WHERE role = 'club_leader' ORDER BY created_at DESC"
    );
    res.json(leaders);
  } catch (error) {
    console.error("Get club leaders error:", error);
    res.status(500).json({ message: "Failed to fetch club leaders" });
  }
});

app.post("/api/admin/club-leaders", requireAdmin, async (req, res) => {
  const { email, password, name, club } = req.body;

  if (!email || !password || !name || !club) {
    return res.status(400).json({ message: "email, password, name, and club are required" });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return res.status(400).json({ message: "Invalid email address" });
  if (typeof password !== "string" || password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  try {
    const [existing] = await pool.execute("SELECT id FROM admins WHERE email = ?", [email.trim().toLowerCase()]);
    if (existing.length > 0) return res.status(409).json({ message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 12);
    const [result] = await pool.execute(
      "INSERT INTO admins (email, password, name, club, role) VALUES (?, ?, ?, ?, 'club_leader')",
      [email.trim().toLowerCase(), hashedPassword, name.trim(), club.trim()]
    );

    res.status(201).json({
      message: "Club leader created successfully",
      leader: { id: result.insertId, email: email.trim().toLowerCase(), name: name.trim(), club: club.trim() },
    });
  } catch (error) {
    console.error("Create club leader error:", error);
    res.status(500).json({ message: "Failed to create club leader" });
  }
});

app.delete("/api/admin/club-leaders/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  if (isNaN(parseInt(id))) return res.status(400).json({ message: "Invalid ID" });

  try {
    const [result] = await pool.execute("DELETE FROM admins WHERE id = ? AND role = 'club_leader'", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: "Club leader not found" });
    res.json({ message: "Club leader deleted successfully" });
  } catch (error) {
    console.error("Delete club leader error:", error);
    res.status(500).json({ message: "Failed to delete club leader" });
  }
});

// ─── CLUB LEADER DASHBOARD ────────────────────────────────────────────────────

app.get("/api/club-leader/dashboard", requireAdminOrLeader, async (req, res) => {
  if (req.authUser.role !== "club_leader") {
    return res.status(403).json({ message: "Club leader access only" });
  }

  const cacheKey = `club-leader:${req.authUser.id}:dashboard`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const club = req.authUser.club;
    const leaderId = req.authUser.id;

    const [myEvents] = await pool.execute(`
      SELECT e.*, COUNT(er.id) AS registered_count
      FROM events e
      LEFT JOIN event_registrations er ON e.id = er.event_id AND er.status = 'registered'
      WHERE e.created_by = ?
      GROUP BY e.id
      ORDER BY e.date DESC
    `, [leaderId]);

    const [[{ count: totalMyEvents }]] = await pool.execute(
      "SELECT COUNT(*) AS count FROM events WHERE created_by = ?", [leaderId]
    );
    const [[{ count: totalRegistrations }]] = await pool.execute(`
      SELECT COUNT(*) AS count FROM event_registrations er
      JOIN events e ON er.event_id = e.id
      WHERE e.created_by = ? AND er.status = 'registered'
    `, [leaderId]);
    const [[{ count: upcomingCount }]] = await pool.execute(
      "SELECT COUNT(*) AS count FROM events WHERE created_by = ? AND status = 'upcoming'", [leaderId]
    );

    const result = {
      club,
      stats: { totalMyEvents, totalRegistrations, upcomingCount },
      myEvents,
    };
    cache.set(cacheKey, result, 30); // 30s cache for leader dashboard
    res.json(result);
  } catch (error) {
    console.error("Club leader dashboard error:", error);
    res.status(500).json({ message: "Failed to fetch dashboard" });
  }
});

// Club leader update their own account password
app.put("/api/club-leader/account", requireAdminOrLeader, async (req, res) => {
  if (req.authUser.role !== "club_leader") {
    return res.status(403).json({ message: "Club leader access only" });
  }

  const { currentPassword, newPassword, confirmNewPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ message: "All password fields are required" });
  if (newPassword !== confirmNewPassword) return res.status(400).json({ message: "Passwords do not match" });
  if (newPassword.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });

  try {
    const [rows] = await pool.execute("SELECT id, password FROM admins WHERE id = ?", [req.authUser.id]);
    if (!rows.length) return res.status(404).json({ message: "Account not found" });

    const isValid = await bcrypt.compare(currentPassword, rows[0].password);
    if (!isValid) return res.status(401).json({ message: "Current password is incorrect" });

    const hashed = await bcrypt.hash(newPassword, 12);
    await pool.execute("UPDATE admins SET password = ? WHERE id = ?", [hashed, req.authUser.id]);
    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Club leader account update error:", error);
    res.status(500).json({ message: "Failed to update password" });
  }
});

// ─── START SERVER ─────────────────────────────────────────────────────────────

app.listen(PORT, async () => {
  try {
    await testConnection();
    console.log(`Backend running on http://localhost:${PORT}`);
  } catch (error) {
    console.error("Failed to connect to database:", error.message);
  }
});
