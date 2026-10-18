const express = require("express");
const multer = require("multer");
const helmet = require("helmet");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_KEY = process.env.ADMIN_KEY;
const MAX_MB = Number(process.env.MAX_APK_MB || 250);
const PUBLIC_DIR = path.join(__dirname, "public");
const UPLOAD_DIR = path.join(__dirname, "uploads");
const DATA_FILE = path.join(__dirname, "apps.json");

fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]");

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "1mb" }));
app.use(express.static(PUBLIC_DIR));

function readApps() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, "utf8")); }
  catch { return []; }
}
function saveApps(apps) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(apps, null, 2));
}
function safeText(value, max = 100) {
  return String(value || "").trim().replace(/[<>]/g, "").slice(0, max);
}
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(5).toString("hex")}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: MAX_MB * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== ".apk") return cb(new Error("Only .apk files are accepted."));
    cb(null, true);
  }
});

app.get("/api/apps", (_req, res) => {
  const apps = readApps().map(({ storedFile, ...item }) => item);
  res.json(apps.sort((a, b) => b.createdAt - a.createdAt));
});

app.post("/api/apps", (req, res, next) => {
  if (!ADMIN_KEY) return res.status(503).json({ error: "Upload is disabled until the site owner sets ADMIN_KEY on the server." });
  if (!req.get("x-admin-key") || !crypto.timingSafeEqual(
    Buffer.from(String(req.get("x-admin-key"))),
    Buffer.from(String(ADMIN_KEY))
  )) return res.status(401).json({ error: "Admin key is incorrect." });
  upload.single("apk")(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message || "Upload failed." });
    next();
  });
}, (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Choose an APK file first." });
  const name = safeText(req.body.name, 80) || path.basename(req.file.originalname, ".apk");
  const description = safeText(req.body.description, 500);
  const version = safeText(req.body.version, 30) || "Latest";
  const appItem = {
    id: crypto.randomUUID(),
    name,
    description,
    version,
    fileName: path.basename(req.file.originalname),
    size: req.file.size,
    createdAt: Date.now(),
    downloadUrl: `/download/${encodeURIComponent(req.file.filename)}`
  };
  const apps = readApps();
  apps.push({ ...appItem, storedFile: req.file.filename });
  saveApps(apps);
  res.status(201).json(appItem);
});

app.get("/download/:file", (req, res) => {
  const file = path.basename(req.params.file);
  const appItem = readApps().find(item => item.storedFile === file);
  if (!appItem) return res.status(404).send("APK not found.");
  const fullPath = path.join(UPLOAD_DIR, file);
  if (!fs.existsSync(fullPath)) return res.status(404).send("APK file is missing.");
  res.download(fullPath, appItem.fileName || "app.apk");
});

app.delete("/api/apps/:id", (req, res) => {
  if (!ADMIN_KEY) return res.status(503).json({ error: "Admin actions are disabled." });
  const provided = String(req.get("x-admin-key") || "");
  const expected = String(ADMIN_KEY);
  if (provided.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected))) {
    return res.status(401).json({ error: "Admin key is incorrect." });
  }
  const apps = readApps();
  const item = apps.find(app => app.id === req.params.id);
  if (!item) return res.status(404).json({ error: "App not found." });
  const fullPath = path.join(UPLOAD_DIR, path.basename(item.storedFile || ""));
  if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  saveApps(apps.filter(app => app.id !== req.params.id));
  res.json({ ok: true });
});

app.use((err, _req, res, _next) => {
  console.error(err.message);
  res.status(400).json({ error: err.message || "Unexpected error." });
});

app.listen(PORT, () => console.log(`Hasim Apk running on http://localhost:${PORT}`));
