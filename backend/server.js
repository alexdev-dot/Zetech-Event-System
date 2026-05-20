import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import NodeCache from "node-cache";
import { supabase, testConnection } from "./db.js";

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "zetech-event-hub-secret-2024-change-in-prod";
const JWT_EXPIRES_IN = "24h";

const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

app.use(cors());
app.use(express.json({ limit: "2mb" }));

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
      registered_count:  regCountMap?.[ev.id] ?? 0,
      created_by_email:  admin.email  ?? null,
      created_by_name:   admin.name   ?? null,
      creator_role:      admin.role   ?? null,
      creator_club:      admin.club   ?? null,
    };
  });
}

/** Build a map from event_id → registration count (status='registered'). */
async function fetchRegCounts(eventIds) {
  if (!eventIds || eventIds.length === 0) return {};
  const { data, error } = await supabase
    .from("event_registrations")
    .select("event_id")
    .in("event_id", eventIds)
    .eq("status", "registered");
  if (error) return {};
  const map = {};
  for (const { event_id } of data || []) {
    map[event_id] = (map[event_id] || 0) + 1;
  }
  return map;
}

/** Build a map from admin.id → admin row. */
async function fetchAdminMap() {
  const { data } = await supabase
    .from("admins")
    .select("id, admin_email, name, role, club");
  const map = {};
  for (const a of data || []) {
    map[a.id] = { ...a, email: a.admin_email };
  }
  return map;
}

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Authentication required" });
  try {
    req.authUser = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
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
      return res.status(403).json({ message: "Admin or club leader access required" });
    next();
  });
}

// ─── HEALTH ───────────────────────────────────────────────────────────────────

app.get("/api/health", async (_req, res) => {
  try {
    await testConnection();
    res.json({ status: "ok", database: "connected" });
  } catch (err) {
    res.status(500).json({ message: "Database connection failed", detail: err.message });
  }
});

// ─── STUDENT AUTH ─────────────────────────────────────────────────────────────

app.post("/api/auth/register", async (req, res) => {
  const { firstName, lastName, email, admissionNumber, password } = req.body;

  if (!firstName || !lastName || !email || !admissionNumber || !password)
    return res.status(400).json({ message: "All fields are required" });
  if (typeof firstName !== "string" || firstName.trim().length < 2)
    return res.status(400).json({ message: "First name must be at least 2 characters" });
  if (typeof lastName !== "string" || lastName.trim().length < 2)
    return res.status(400).json({ message: "Last name must be at least 2 characters" });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ message: "Invalid email address" });
  if (typeof admissionNumber !== "string" || admissionNumber.trim().length < 3)
    return res.status(400).json({ message: "Invalid admission number" });
  if (typeof password !== "string" || password.length < 6)
    return res.status(400).json({ message: "Password must be at least 6 characters" });

  try {
    const { data: existing } = await supabase
      .from("student_registrations")
      .select("id")
      .or(`admission_number.eq.${admissionNumber.trim()},email.eq.${email.trim().toLowerCase()}`)
      .limit(1);

    if (existing?.length > 0)
      return res.status(409).json({ message: "Admission number or email already registered" });

    const hashed = await bcrypt.hash(password, 12);
    const { data: inserted, error } = await supabase
      .from("student_registrations")
      .insert({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        admission_number: admissionNumber.trim(),
        email: email.trim().toLowerCase(),
        password: hashed,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);

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

app.post("/api/auth/login", async (req, res) => {
  const { admissionNumber, password } = req.body;
  if (!admissionNumber || !password)
    return res.status(400).json({ message: "Admission number and password are required" });
  if (typeof admissionNumber !== "string" || typeof password !== "string")
    return res.status(400).json({ message: "Invalid input" });

  try {
    const { data: students, error } = await supabase
      .from("student_registrations")
      .select("id, first_name, last_name, admission_number, email, password, status")
      .eq("admission_number", admissionNumber.trim())
      .limit(1);

    if (error) throw new Error(error.message);
    if (!students?.length)
      return res.status(401).json({ message: "Invalid admission number or password" });

    const student = students[0];
    if (student.status === "deleted")
      return res.status(401).json({ message: "Account has been deactivated" });

    const valid = await bcrypt.compare(password, student.password);
    if (!valid)
      return res.status(401).json({ message: "Invalid admission number or password" });

    await supabase
      .from("student_registrations")
      .update({ last_login: new Date().toISOString() })
      .eq("id", student.id);

    const user = {
      id: student.id,
      email: student.email,
      adminNumber: student.admission_number,
      name: `${student.first_name} ${student.last_name}`,
      role: "user",
    };
    res.json({ message: "Login successful", user, token: generateToken({ id: student.id, role: "user" }) });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed" });
  }
});

// ─── ADMIN / CLUB LEADER AUTH ─────────────────────────────────────────────────

app.post("/api/auth/admin/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email and password are required" });
  if (typeof email !== "string" || typeof password !== "string")
    return res.status(400).json({ message: "Invalid input" });

  try {
    // Select only base columns (always exist); role/name/club are added by schema migration
    const { data: admins, error } = await supabase
      .from("admins")
      .select("id, admin_email, password_hash")
      .eq("admin_email", email.trim().toLowerCase())
      .limit(1);

    if (error) throw new Error(error.message);
    if (!admins?.length)
      return res.status(401).json({ message: "Invalid credentials" });

    const admin = admins[0];
    let valid = false;
    const hash = admin.password_hash || "";
    if (hash.startsWith("$2")) {
      valid = await bcrypt.compare(password, hash);
    } else {
      valid = password === hash;
    }
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });

    // Try to read extra columns if they exist (graceful fallback)
    let role = "admin", adminName = "Admin User", club = null;
    try {
      const { data: ext } = await supabase
        .from("admins")
        .select("role, name, club")
        .eq("id", admin.id)
        .limit(1);
      if (ext?.[0]) {
        role      = ext[0].role  || "admin";
        adminName = ext[0].name  || (role === "club_leader" ? "Club Leader" : "Admin User");
        club      = ext[0].club  || null;
      }
    } catch { /* columns not yet added via migration — use defaults */ }

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
      const { data: students, error } = await supabase
        .from("student_registrations")
        .select("id, first_name, last_name, admission_number, email, status")
        .eq("id", id)
        .limit(1);

      if (error) throw new Error(error.message);
      const s = students?.[0];
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
      const { data: admins, error } = await supabase
        .from("admins")
        .select("id, admin_email")
        .eq("id", id)
        .limit(1);

      if (error) throw new Error(error.message);
      const a = admins?.[0];
      if (!a) return res.status(401).json({ message: "Account not found" });

      let meRole = "admin", meName = "Admin User", meClub = null;
      try {
        const { data: ext } = await supabase
          .from("admins").select("role, name, club").eq("id", id).limit(1);
        if (ext?.[0]) {
          meRole = ext[0].role  || "admin";
          meName = ext[0].name  || (meRole === "club_leader" ? "Club Leader" : "Admin User");
          meClub = ext[0].club  || null;
        }
      } catch { /* migration pending */ }

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
    const { data: events, error } = await supabase
      .from("events")
      .select("id, title, description, date, time, location, category, max_participants, image_url, status, created_by")
      .eq("status", "upcoming")
      .order("date", { ascending: true })
      .limit(limit);

    if (error) throw new Error(error.message);

    const eventIds  = (events || []).map((e) => e.id);
    const [adminMap, regCountMap] = await Promise.all([fetchAdminMap(), fetchRegCounts(eventIds)]);
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
    const { data: events, error } = await supabase
      .from("events")
      .select("*")
      .in("status", ["upcoming", "ongoing", "completed"])
      .order("date", { ascending: true });

    if (error) throw new Error(error.message);

    const eventIds  = (events || []).map((e) => e.id);
    const [adminMap, regCountMap] = await Promise.all([fetchAdminMap(), fetchRegCounts(eventIds)]);
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
    const { data: events, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .limit(1);

    if (error) throw new Error(error.message);
    if (!events?.length) return res.status(404).json({ message: "Event not found" });

    const ev = events[0];
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

// Create event:
//   Admin       → status='upcoming' (auto-approved, immediately visible)
//   Club leader → status='pending' (awaits admin approval)
app.post("/api/events", requireAdminOrLeader, async (req, res) => {
  const { title, description, date, time, location, category, maxParticipants, imageUrl } = req.body;

  if (!title || !description || !date || !time || !location || !category)
    return res.status(400).json({ message: "title, description, date, time, location, and category are required" });
  if (typeof title !== "string" || title.trim().length < 3)
    return res.status(400).json({ message: "Title must be at least 3 characters" });
  if (typeof description !== "string" || description.trim().length < 10)
    return res.status(400).json({ message: "Description must be at least 10 characters" });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
    return res.status(400).json({ message: "Invalid date format (expected YYYY-MM-DD)" });
  if (maxParticipants !== undefined && maxParticipants !== null) {
    const cap = parseInt(maxParticipants);
    if (isNaN(cap) || cap < 1)
      return res.status(400).json({ message: "maxParticipants must be a positive number" });
  }

  const isAdmin    = req.authUser.role === "admin";
  const eventStatus = isAdmin ? "upcoming" : "pending";

  try {
    const { data: inserted, error } = await supabase
      .from("events")
      .insert({
        title: title.trim(),
        description: description.trim(),
        date,
        time,
        location: location.trim(),
        category,
        max_participants: maxParticipants || null,
        image_url: imageUrl || null,
        created_by: req.authUser.id,
        status: eventStatus,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    invalidateCache("events:all", "admin:stats", "events:recent:12");
    res.status(201).json({
      message: isAdmin ? "Event created successfully" : "Event submitted for admin approval",
      eventId: inserted.id,
      status: eventStatus,
    });
  } catch (error) {
    console.error("Create event error:", error);
    res.status(500).json({ message: "Failed to create event: " + error.message });
  }
});

app.put("/api/events/:id", requireAdminOrLeader, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: "Invalid event ID" });

  const { title, description, date, time, location, category, maxParticipants, imageUrl, status } = req.body;
  if (!title || !description || !date || !time || !location || !category)
    return res.status(400).json({ message: "All event fields are required" });

  try {
    if (req.authUser.role === "club_leader") {
      const { data: evs } = await supabase.from("events").select("created_by").eq("id", id).limit(1);
      if (!evs?.length) return res.status(404).json({ message: "Event not found" });
      if (evs[0].created_by !== req.authUser.id)
        return res.status(403).json({ message: "You can only edit your own events" });
    }

    const validStatuses = req.authUser.role === "admin"
      ? ["pending", "upcoming", "ongoing", "completed", "cancelled", "rejected"]
      : ["pending", "upcoming", "ongoing", "completed", "cancelled"];
    const safeStatus = validStatuses.includes(status) ? status : "upcoming";

    const { data: updated, error } = await supabase
      .from("events")
      .update({
        title: title.trim(), description: description.trim(),
        date, time, location: location.trim(), category,
        max_participants: maxParticipants || null,
        image_url: imageUrl || null,
        status: safeStatus,
      })
      .eq("id", id)
      .select("id");

    if (error) throw new Error(error.message);
    if (!updated?.length) return res.status(404).json({ message: "Event not found" });

    invalidateCache("events:all", `event:${id}`, "admin:stats", "events:recent:12");
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
      const { data: evs } = await supabase.from("events").select("created_by").eq("id", id).limit(1);
      if (!evs?.length) return res.status(404).json({ message: "Event not found" });
      if (evs[0].created_by !== req.authUser.id)
        return res.status(403).json({ message: "You can only delete your own events" });
    }

    const { data: deleted, error } = await supabase
      .from("events")
      .delete()
      .eq("id", id)
      .select("id");

    if (error) throw new Error(error.message);
    if (!deleted?.length) return res.status(404).json({ message: "Event not found" });

    invalidateCache("events:all", `event:${id}`, "admin:stats", "events:recent:12");
    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Delete event error:", error);
    res.status(500).json({ message: "Failed to delete event" });
  }
});

// ─── ADMIN EVENT APPROVAL ─────────────────────────────────────────────────────

app.get("/api/admin/events/pending", requireAdmin, async (req, res) => {
  try {
    const { data: events, error } = await supabase
      .from("events")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);

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
    const { data: updated, error } = await supabase
      .from("events")
      .update({ status: "upcoming" })
      .eq("id", id)
      .eq("status", "pending")
      .select("id");

    if (error) throw new Error(error.message);
    if (!updated?.length)
      return res.status(404).json({ message: "Pending event not found" });

    invalidateCache("events:all", `event:${id}`, "admin:stats", "events:recent:12");
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
    const { data: updated, error } = await supabase
      .from("events")
      .update({ status: "rejected" })
      .eq("id", id)
      .eq("status", "pending")
      .select("id");

    if (error) throw new Error(error.message);
    if (!updated?.length)
      return res.status(404).json({ message: "Pending event not found" });

    invalidateCache("events:all", `event:${id}`, "admin:stats");
    res.json({ message: "Event rejected" });
  } catch (error) {
    console.error("Reject event error:", error);
    res.status(500).json({ message: "Failed to reject event" });
  }
});

// All events including pending — for admin management view
app.get("/api/admin/events", requireAdmin, async (req, res) => {
  try {
    const { data: events, error } = await supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    const eventIds  = (events || []).map((e) => e.id);
    const [adminMap, regCountMap] = await Promise.all([fetchAdminMap(), fetchRegCounts(eventIds)]);
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
    return res.status(403).json({ message: "Only students can register for events" });

  const studentId = req.authUser.id;

  try {
    const { data: events } = await supabase
      .from("events")
      .select("id, max_participants, status")
      .eq("id", id)
      .eq("status", "upcoming")
      .limit(1);

    if (!events?.length)
      return res.status(404).json({ message: "Event not found or not available for registration" });

    const { data: existing } = await supabase
      .from("event_registrations")
      .select("id")
      .eq("event_id", id)
      .eq("student_id", studentId)
      .limit(1);

    if (existing?.length > 0)
      return res.status(409).json({ message: "Already registered for this event" });

    if (events[0].max_participants) {
      const { count } = await supabase
        .from("event_registrations")
        .select("*", { count: "exact", head: true })
        .eq("event_id", id)
        .eq("status", "registered");

      if ((count || 0) >= events[0].max_participants)
        return res.status(409).json({ message: "Event is full" });
    }

    const { data: reg, error } = await supabase
      .from("event_registrations")
      .insert({ event_id: id, student_id: studentId })
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    invalidateCache("events:all", `event:${id}`, "events:recent:12");
    res.status(201).json({
      message: "Successfully registered for event",
      registrationId: reg.id,
    });
  } catch (error) {
    console.error("Register event error:", error);
    res.status(500).json({ message: "Failed to register for event" });
  }
});

app.delete("/api/events/:eventId/register/:studentId", authenticateToken, async (req, res) => {
  const eventId   = parseInt(req.params.eventId);
  const studentId = parseInt(req.params.studentId);
  if (isNaN(eventId) || isNaN(studentId))
    return res.status(400).json({ message: "Invalid IDs" });
  if (req.authUser.role === "user" && req.authUser.id !== studentId)
    return res.status(403).json({ message: "You can only cancel your own registration" });

  try {
    const { data: deleted, error } = await supabase
      .from("event_registrations")
      .delete()
      .eq("event_id", eventId)
      .eq("student_id", studentId)
      .select("id");

    if (error) throw new Error(error.message);
    if (!deleted?.length)
      return res.status(404).json({ message: "Registration not found" });

    invalidateCache("events:all", `event:${eventId}`, "events:recent:12");
    res.json({ message: "Registration cancelled successfully" });
  } catch (error) {
    console.error("Cancel registration error:", error);
    res.status(500).json({ message: "Failed to cancel registration" });
  }
});

app.get("/api/students/:studentId/registrations", authenticateToken, async (req, res) => {
  const studentId = parseInt(req.params.studentId);
  if (isNaN(studentId)) return res.status(400).json({ message: "Invalid student ID" });
  if (req.authUser.role === "user" && req.authUser.id !== studentId)
    return res.status(403).json({ message: "Access denied" });

  try {
    const { data: regs, error } = await supabase
      .from("event_registrations")
      .select("*, events(title, date, time, location, category, status, image_url)")
      .eq("student_id", studentId)
      .order("registration_date", { ascending: false });

    if (error) throw new Error(error.message);

    // Flatten nested events object
    const result = (regs || []).map((r) => ({
      ...r,
      title:        r.events?.title,
      date:         r.events?.date,
      time:         r.events?.time,
      location:     r.events?.location,
      category:     r.events?.category,
      event_status: r.events?.status,
      image_url:    r.events?.image_url,
      events:       undefined,
    }));

    res.json(result);
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
    const [
      { count: totalEvents },
      { count: totalStudents },
      { count: upcomingEvents },
      { count: pendingEvents },
      { count: totalRegistrations },
      { data: recentEvents },
    ] = await Promise.all([
      supabase.from("events").select("*", { count: "exact", head: true }),
      supabase.from("student_registrations").select("*", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("events").select("*", { count: "exact", head: true }).eq("status", "upcoming"),
      supabase.from("events").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("event_registrations").select("*", { count: "exact", head: true }).eq("status", "registered"),
      supabase.from("events").select("id, title, date, status, created_at").order("created_at", { ascending: false }).limit(5),
    ]);

    const result = {
      totalEvents:        totalEvents    ?? 0,
      totalStudents:      totalStudents  ?? 0,
      upcomingEvents:     upcomingEvents ?? 0,
      pendingEvents:      pendingEvents  ?? 0,
      totalRegistrations: totalRegistrations ?? 0,
      recentEvents:       recentEvents   ?? [],
    };
    cache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ message: "Failed to fetch dashboard stats" });
  }
});

app.get("/api/admin/events/:eventId/registrations", requireAdmin, async (req, res) => {
  const eventId = parseInt(req.params.eventId);
  if (isNaN(eventId)) return res.status(400).json({ message: "Invalid event ID" });

  try {
    const { data: regs, error } = await supabase
      .from("event_registrations")
      .select("*, student_registrations(first_name, last_name, admission_number, email)")
      .eq("event_id", eventId)
      .order("registration_date", { ascending: true });

    if (error) throw new Error(error.message);

    const result = (regs || []).map((r) => ({
      ...r,
      first_name:       r.student_registrations?.first_name,
      last_name:        r.student_registrations?.last_name,
      admission_number: r.student_registrations?.admission_number,
      email:            r.student_registrations?.email,
      student_registrations: undefined,
    }));

    res.json(result);
  } catch (error) {
    console.error("Get event registrations error:", error);
    res.status(500).json({ message: "Failed to fetch event registrations" });
  }
});

app.get("/api/admin/students", requireAdmin, async (req, res) => {
  try {
    const { data: students, error } = await supabase
      .from("student_registrations")
      .select("id, first_name, last_name, admission_number, email, status, created_at, last_login")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    res.json(students || []);
  } catch (error) {
    console.error("Get students error:", error);
    res.status(500).json({ message: "Failed to fetch students" });
  }
});

app.delete("/api/admin/students/:studentId", requireAdmin, async (req, res) => {
  const studentId = parseInt(req.params.studentId);
  if (isNaN(studentId)) return res.status(400).json({ message: "Invalid student ID" });

  try {
    const { data: deleted, error } = await supabase
      .from("student_registrations")
      .delete()
      .eq("id", studentId)
      .select("id");

    if (error) throw new Error(error.message);
    if (!deleted?.length) return res.status(404).json({ message: "Student not found" });
    res.json({ message: "Student deleted successfully" });
  } catch (error) {
    console.error("Delete student error:", error);
    res.status(500).json({ message: "Failed to delete student" });
  }
});

app.get("/api/admin/activity", requireAdmin, async (req, res) => {
  try {
    const [
      { count: activeStudents },
      { count: totalEvents },
      { count: upcomingEvents },
      { count: pendingEvents },
      { count: totalEventRegistrations },
    ] = await Promise.all([
      supabase.from("student_registrations").select("*", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("events").select("*", { count: "exact", head: true }),
      supabase.from("events").select("*", { count: "exact", head: true }).eq("status", "upcoming"),
      supabase.from("events").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("event_registrations").select("*", { count: "exact", head: true }).eq("status", "registered"),
    ]);

    res.json({
      newRegistrationsToday:   0,
      activeStudents:          activeStudents ?? 0,
      activeSessions:          Math.max(1, Math.floor((activeStudents ?? 0) * 0.2)),
      recentEventRegistrations: totalEventRegistrations ?? 0,
      pendingApprovals:        pendingEvents  ?? 0,
      totalEvents:             totalEvents    ?? 0,
      lastUpdated:             new Date().toISOString(),
    });
  } catch (error) {
    console.error("Activity error:", error);
    res.status(500).json({ message: "Failed to fetch activity data" });
  }
});

app.get("/api/admin/recent-registrations", requireAdmin, async (req, res) => {
  const limit = Math.min(Math.max(1, parseInt(req.query.limit) || 10), 100);
  try {
    const { data: students, error } = await supabase
      .from("student_registrations")
      .select("id, first_name, last_name, admission_number, email, created_at")
      .eq("status", "active")
      .order("id", { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);
    res.json(students || []);
  } catch (error) {
    console.error("Recent registrations error:", error);
    res.status(500).json({ message: "Failed to fetch recent registrations" });
  }
});

app.get("/api/admin/active-sessions", requireAdmin, async (req, res) => {
  const { includeInactive } = req.query;
  try {
    let query = supabase
      .from("student_registrations")
      .select("id, first_name, last_name, admission_number, email, last_login, created_at")
      .eq("status", "active")
      .order("last_login", { ascending: false })
      .limit(20);

    if (includeInactive !== "true") {
      // Only those who logged in within the last 30 minutes
      const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      query = query.gte("last_login", cutoff);
    }

    const { data: students, error } = await query;
    if (error) throw new Error(error.message);

    const result = (students || []).map((s) => ({
      ...s,
      session_start: s.last_login || s.created_at,
      login_status:  s.last_login ? "active" : "never_logged_in",
    }));
    res.json(result);
  } catch (error) {
    console.error("Active sessions error:", error);
    res.status(500).json({ message: "Failed to fetch active sessions" });
  }
});

app.put("/api/admin/account", requireAdmin, async (req, res) => {
  const { currentPassword, newEmail, newPassword, confirmNewPassword } = req.body;
  if (!currentPassword)
    return res.status(400).json({ message: "Current password is required" });
  if (!newEmail && !newPassword)
    return res.status(400).json({ message: "Provide a new email or password" });
  if (newPassword && newPassword !== confirmNewPassword)
    return res.status(400).json({ message: "Passwords do not match" });
  if (newPassword && newPassword.length < 6)
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  if (newEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail))
    return res.status(400).json({ message: "Invalid email format" });

  try {
    const { data: admins } = await supabase
      .from("admins")
      .select("id, admin_email, password_hash")
      .eq("id", req.authUser.id)
      .limit(1);

    if (!admins?.length)
      return res.status(404).json({ message: "Admin account not found" });

    const admin = admins[0];
    const hash2 = admin.password_hash || "";
    const valid = hash2.startsWith("$2")
      ? await bcrypt.compare(currentPassword, hash2)
      : currentPassword === hash2;
    if (!valid)
      return res.status(401).json({ message: "Current password is incorrect" });

    if (newEmail && newEmail !== admin.admin_email) {
      const { data: existing } = await supabase
        .from("admins")
        .select("id")
        .eq("admin_email", newEmail.trim().toLowerCase())
        .neq("id", admin.id)
        .limit(1);
      if (existing?.length > 0)
        return res.status(409).json({ message: "Email already in use" });
    }

    const updates = {};
    if (newEmail)    updates.admin_email    = newEmail.trim().toLowerCase();
    if (newPassword) updates.password_hash = await bcrypt.hash(newPassword, 12);

    const { error } = await supabase.from("admins").update(updates).eq("id", admin.id);
    if (error) throw new Error(error.message);
    res.json({ message: "Account updated successfully" });
  } catch (error) {
    console.error("Update account error:", error);
    res.status(500).json({ message: "Failed to update account" });
  }
});

// ─── CLUB LEADER MANAGEMENT (admin only) ─────────────────────────────────────

app.get("/api/admin/club-leaders", requireAdmin, async (req, res) => {
  try {
    const { data: leaders, error } = await supabase
      .from("admins")
      .select("id, admin_email, name, club, created_at")
      .eq("role", "club_leader")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    res.json(leaders || []);
  } catch (error) {
    console.error("Get club leaders error:", error);
    res.status(500).json({ message: "Failed to fetch club leaders" });
  }
});

app.post("/api/admin/club-leaders", requireAdmin, async (req, res) => {
  const { email, password, name, club } = req.body;
  if (!email || !password || !name || !club)
    return res.status(400).json({ message: "email, password, name, and club are required" });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ message: "Invalid email address" });
  if (typeof password !== "string" || password.length < 6)
    return res.status(400).json({ message: "Password must be at least 6 characters" });

  try {
    const { data: existing } = await supabase
      .from("admins")
      .select("id")
      .eq("admin_email", email.trim().toLowerCase())
      .limit(1);

    if (existing?.length > 0)
      return res.status(409).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 12);
    const { data: inserted, error } = await supabase
      .from("admins")
      .insert({
        admin_email: email.trim().toLowerCase(),
        password_hash: hashed,
        name: name.trim(),
        club: club.trim(),
        role: "club_leader",
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    res.status(201).json({
      message: "Club leader created successfully",
      leader: {
        id:    inserted.id,
        email: email.trim().toLowerCase(),
        name:  name.trim(),
        club:  club.trim(),
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
    const { data: deleted, error } = await supabase
      .from("admins")
      .delete()
      .eq("id", id)
      .eq("role", "club_leader")
      .select("id");

    if (error) throw new Error(error.message);
    if (!deleted?.length)
      return res.status(404).json({ message: "Club leader not found" });
    res.json({ message: "Club leader deleted successfully" });
  } catch (error) {
    console.error("Delete club leader error:", error);
    res.status(500).json({ message: "Failed to delete club leader" });
  }
});

// ─── CLUB LEADER DASHBOARD ────────────────────────────────────────────────────

app.get("/api/club-leader/dashboard", requireAdminOrLeader, async (req, res) => {
  if (req.authUser.role !== "club_leader")
    return res.status(403).json({ message: "Club leader access only" });

  const cacheKey = `cl:${req.authUser.id}:dashboard`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const leaderId = req.authUser.id;

    const { data: myEvents, error: evErr } = await supabase
      .from("events")
      .select("*")
      .eq("created_by", leaderId)
      .order("created_at", { ascending: false });

    if (evErr) throw new Error(evErr.message);

    const eventIds = (myEvents || []).map((e) => e.id);
    const regCountMap = await fetchRegCounts(eventIds);

    const eventsWithCounts = (myEvents || []).map((ev) => ({
      ...ev,
      registered_count: regCountMap[ev.id] ?? 0,
    }));

    const totalMyEvents     = myEvents?.length ?? 0;
    const pendingCount      = (myEvents || []).filter((e) => e.status === "pending").length;
    const upcomingCount     = (myEvents || []).filter((e) => e.status === "upcoming").length;
    const totalRegistrations = Object.values(regCountMap).reduce((s, n) => s + n, 0);

    const result = {
      club:   req.authUser.club,
      stats:  { totalMyEvents, pendingCount, upcomingCount, totalRegistrations },
      myEvents: eventsWithCounts,
    };
    cache.set(cacheKey, result, 30);
    res.json(result);
  } catch (error) {
    console.error("Club leader dashboard error:", error);
    res.status(500).json({ message: "Failed to fetch dashboard" });
  }
});

// Registrations for a specific event (club leader can only see their own)
app.get("/api/club-leader/events/:eventId/registrations", requireAdminOrLeader, async (req, res) => {
  const eventId = parseInt(req.params.eventId);
  if (isNaN(eventId)) return res.status(400).json({ message: "Invalid event ID" });

  try {
    if (req.authUser.role === "club_leader") {
      const { data: evs } = await supabase
        .from("events")
        .select("created_by")
        .eq("id", eventId)
        .limit(1);
      if (!evs?.length) return res.status(404).json({ message: "Event not found" });
      if (evs[0].created_by !== req.authUser.id)
        return res.status(403).json({ message: "Access denied" });
    }

    const { data: regs, error } = await supabase
      .from("event_registrations")
      .select("registration_date, status, student_registrations(first_name, last_name, admission_number, email)")
      .eq("event_id", eventId)
      .eq("status", "registered")
      .order("registration_date", { ascending: true });

    if (error) throw new Error(error.message);

    const result = (regs || []).map((r) => ({
      registration_date: r.registration_date,
      status:            r.status,
      first_name:        r.student_registrations?.first_name,
      last_name:         r.student_registrations?.last_name,
      admission_number:  r.student_registrations?.admission_number,
      email:             r.student_registrations?.email,
    }));

    res.json(result);
  } catch (error) {
    console.error("Club leader event registrations error:", error);
    res.status(500).json({ message: "Failed to fetch registrations" });
  }
});

app.put("/api/club-leader/account", requireAdminOrLeader, async (req, res) => {
  if (req.authUser.role !== "club_leader")
    return res.status(403).json({ message: "Club leader access only" });

  const { currentPassword, newPassword, confirmNewPassword } = req.body;
  if (!currentPassword || !newPassword)
    return res.status(400).json({ message: "All password fields are required" });
  if (newPassword !== confirmNewPassword)
    return res.status(400).json({ message: "Passwords do not match" });
  if (newPassword.length < 6)
    return res.status(400).json({ message: "Password must be at least 6 characters" });

  try {
    const { data: admins } = await supabase
      .from("admins")
      .select("id, password_hash")
      .eq("id", req.authUser.id)
      .limit(1);

    if (!admins?.length) return res.status(404).json({ message: "Account not found" });

    const hashCL = admins[0].password_hash || "";
    const valid = hashCL.startsWith("$2")
      ? await bcrypt.compare(currentPassword, hashCL)
      : currentPassword === hashCL;
    if (!valid) return res.status(401).json({ message: "Current password is incorrect" });

    const hashed = await bcrypt.hash(newPassword, 12);
    const { error } = await supabase
      .from("admins")
      .update({ password_hash: hashed })
      .eq("id", req.authUser.id);

    if (error) throw new Error(error.message);
    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Club leader account update error:", error);
    res.status(500).json({ message: "Failed to update password" });
  }
});

// ─── START SERVER ─────────────────────────────────────────────────────────────

app.listen(PORT, async () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  try {
    await testConnection();
    console.log("Database: Supabase connected ✓");
  } catch (error) {
    console.error("Database connection failed:", error.message);
  }
});
