/**
 * WiFi Hotspot File Transfer Server
 * ----------------------------------
 * Phone pe ye server chalega. Phone WiFi hotspot on karega.
 * TV (ya koi bhi device) us hotspot se connect karke
 * browser me phone ka IP kholega aur files transfer kar sakta hai.
 */

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const multer = require("multer");
const QRCode = require("qrcode");
const path = require("path");
const fs = require("fs");
const os = require("os");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = path.join(__dirname, "uploads");

// uploads folder bana do agar nahi hai
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer config - file upload handle karega
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    // original naam rakho, agar same naam ka file hai to number lagao
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    let filename = file.originalname;
    let counter = 1;
    while (fs.existsSync(path.join(UPLOAD_DIR, filename))) {
      filename = `${base} (${counter})${ext}`;
      counter++;
    }
    cb(null, filename);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 * 1024 }, // 5GB max
});

// Static files serve karo (web UI)
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(UPLOAD_DIR));

/**
 * Helper: machine ke saare IP addresses nikalo
 * Taaki user ko pata chale ki dusre device ko kaunsa IP kholna hai
 */
function getNetworkIPs() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // IPv4 aur internal (localhost) nahi chahiye
      if (iface.family === "IPv4" && !iface.internal) {
        ips.push({ interface: name, address: iface.address });
      }
    }
  }
  return ips;
}

/**
 * Helper: file ka size human-readable format me convert karo
 */
function formatFileSize(bytes) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(2) + " " + units[i];
}

// -------------------------------------------------------
// API ROUTES
// -------------------------------------------------------

/**
 * GET /api/info
 * Server info + saare IP addresses + QR code return karta hai
 */
app.get("/api/info", async (req, res) => {
  const ips = getNetworkIPs();
  const primaryIp = ips.length > 0 ? ips[0].address : "localhost";
  const url = `http://${primaryIp}:${PORT}`;

  try {
    const qrDataUrl = await QRCode.toDataURL(url, { width: 300, margin: 2 });
    res.json({
      port: PORT,
      ips,
      url,
      qrCode: qrDataUrl,
    });
  } catch (err) {
    res.json({ port: PORT, ips, url, qrCode: null });
  }
});

/**
 * GET /api/files
 * Uploads folder ke saare files list karta hai
 */
app.get("/api/files", (req, res) => {
  try {
    const items = fs.readdirSync(UPLOAD_DIR, { withFileTypes: true });
    const files = items
      .filter((item) => item.isFile())
      .map((item) => {
        const filePath = path.join(UPLOAD_DIR, item.name);
        const stats = fs.statSync(filePath);
        const ext = path.extname(item.name).toLowerCase().slice(1);
        return {
          name: item.name,
          size: stats.size,
          sizeFormatted: formatFileSize(stats.size),
          extension: ext,
          modified: stats.mtime,
          url: `/uploads/${encodeURIComponent(item.name)}`,
        };
      })
      .sort((a, b) => new Date(b.modified) - new Date(a.modified));

    res.json({ files, total: files.length });
  } catch (err) {
    res.status(500).json({ error: "Files list nahi kar paye: " + err.message });
  }
});

/**
 * POST /api/upload
 * File upload handle karta hai (Socket.io se real-time progress)
 */
app.post("/api/upload", (req, res) => {
  upload.array("files")(req, res, (err) => {
    if (err) {
      return res.status(500).json({ error: "Upload fail: " + err.message });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "Koi file nahi mili" });
    }
    const uploaded = req.files.map((f) => ({
      name: f.filename,
      size: f.size,
      sizeFormatted: formatFileSize(f.size),
    }));
    // sab connected clients ko notify karo
    io.emit("files-updated");
    res.json({ success: true, files: uploaded });
  });
});

/**
 * GET /api/download/:filename
 * Single file download
 */
app.get("/api/download/:filename", (req, res) => {
  const filePath = path.join(UPLOAD_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File nahi mili" });
  }
  res.download(filePath, req.params.filename);
});

/**
 * DELETE /api/delete/:filename
 * File delete karna
 */
app.delete("/api/delete/:filename", (req, res) => {
  const filePath = path.join(UPLOAD_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File nahi mili" });
  }
  try {
    fs.unlinkSync(filePath);
    io.emit("files-updated");
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Delete nahi kar paye: " + err.message });
  }
});

// -------------------------------------------------------
// SOCKET.IO - real-time communication
// -------------------------------------------------------
io.on("connection", (socket) => {
  console.log(`Device connected: ${socket.id}`);
  socket.on("disconnect", () => {
    console.log(`Device disconnected: ${socket.id}`);
  });
});

// -------------------------------------------------------
// SERVER START
// -------------------------------------------------------
server.listen(PORT, "0.0.0.0", () => {
  console.log("\n========================================");
  console.log("  WiFi File Transfer Server Chal Raha Hai");
  console.log("========================================\n");

  const ips = getNetworkIPs();
  if (ips.length === 0) {
    console.log("  Local:  http://localhost:" + PORT);
    console.log("\n  ⚠️  Koi network IP nahi mili.");
    console.log("  WiFi hotspot on karo aur dobara start karo.\n");
  } else {
    ips.forEach((ip) => {
      console.log(`  📡 ${ip.interface}:  http://${ip.address}:${PORT}`);
    });
  }

  console.log("\n  📱 Phone: Ye terminal me IP dekho");
  console.log("  📺 TV: Browser me upar wala IP kholo");
  console.log("  🔗 Ya QR code scan karo (web page pe milega)");
  console.log("\n========================================\n");
});
