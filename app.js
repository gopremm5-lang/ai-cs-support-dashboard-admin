require('dotenv').config();
const express = require("express");
const session = require("express-session");
const open = require("open");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs").promises;
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 9011;
const ADMIN_PASS = process.env.ADMIN_PASS || "Konfirmasi"; // .env

// ================== SETUP ==================
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'vylozzone_secret_12345',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 8 * 60 * 60 * 1000 }
}));
app.use('/buyers', require('./routes/buyers'));
app.use("/stock", require('./routes/stock'));

// --- Helper: login required ---
function requireLogin(req, res, next) {
  if (req.session && req.session.isLoggedIn) return next();
  res.redirect("/login");
}

// --- Helper: show toast ---
function setToast(req, type, msg) {
  req.session.toast = { type, msg };
}

// --- Helper: load JSON file ---
async function loadJson(file) {
  try {
    const content = await fs.readFile(path.join(__dirname, "data", file), "utf8");
    return JSON.parse(content);
  } catch {
    return [];
  }
}
// --- Helper: save JSON file ---
async function saveJson(file, data) {
  await fs.writeFile(path.join(__dirname, "data", file), JSON.stringify(data, null, 2), "utf8");
}

// --- Helper: produk ---
const produkDir = path.join(__dirname, "data/produk");
async function listProdukFiles() {
  try {
    const files = await fs.readdir(produkDir);
    return files.filter(f => f.endsWith(".txt")).map(f => f.replace(".txt", ""));
  } catch {
    return [];
  }
}
async function loadProdukData() {
  const files = await listProdukFiles();
  const produk = [];
  for (let name of files) {
    let content = "";
    try {
      content = await fs.readFile(path.join(produkDir, name + ".txt"), "utf8");
    } catch {}
    produk.push({ name, content });
  }
  return produk;
}

// ================== ROUTES ==================

// --- LOGIN ---
app.get("/login", (req, res) => {
  res.render("login", { error: null });
});
app.post("/login", (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASS) {
    req.session.isLoggedIn = true;
    res.redirect("/dashboard");
  } else {
    res.render("login", { error: "Password salah!" });
  }
});

// --- LOGOUT ---
app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});

// --- DASHBOARD ---
app.get(["/", "/dashboard"], requireLogin, async (req, res) => {
  // Stat: total produk, promo, faq, claim (auto dari file)
  const [produk, promo, faq, sop, claim] = await Promise.all([
    listProdukFiles(),
    loadJson("promo.json"),
    loadJson("faq.json"),
    loadJson("sop.json"),
    loadJson("log_claim.json")
  ]);
  const stats = {
    produk: produk.length,
    promo: Array.isArray(promo) ? promo.length : 0,
    faq: Array.isArray(faq) ? faq.length : 0,
    sop: Array.isArray(sop) ? sop.length : 0,
    claim: Array.isArray(claim) ? claim.length : 0
  };
  const toast = req.session.toast || null;
  delete req.session.toast;
  res.render("dashboard", { stats, toast });
});

// --- PRODUK VIEW & CRUD ---
app.get("/produk", requireLogin, async (req, res) => {
  const produk = await loadProdukData();
  const toast = req.session.toast || null;
  delete req.session.toast;
  res.render("produk", { produk, toast });
});
app.post("/produk/save", requireLogin, async (req, res) => {
  const { produk, content } = req.body;
  if (!produk || !content) {
    setToast(req, "danger", "Nama produk & konten wajib diisi!");
    return res.redirect("/produk");
  }
  await fs.writeFile(path.join(produkDir, produk.toLowerCase() + ".txt"), content, "utf8");
  setToast(req, "success", "Produk berhasil disimpan.");
  res.redirect("/produk");
});
app.post("/produk/delete", requireLogin, async (req, res) => {
  const { produk } = req.body;
  try { await fs.unlink(path.join(produkDir, produk.toLowerCase() + ".txt")); } catch {}
  setToast(req, "success", "Produk berhasil dihapus.");
  res.redirect("/produk");
});

// --- FAQ ---
app.get("/faq", requireLogin, async (req, res) => {
  const faq = await loadJson("faq.json");
  const toast = req.session.toast || null;
  delete req.session.toast;
  res.render("faq", { faq, toast }); // <--- toast DIKIRIM
});

app.post("/faq/save", requireLogin, async (req, res) => {
  let { idx, question, answer } = req.body;
  let faq = await loadJson("faq.json");
  if (!faq || !Array.isArray(faq)) faq = [];
  if (idx === "") { faq.push({ question, answer }); }
  else { faq[idx] = { question, answer }; }
  await saveJson("faq.json", faq);
  setToast(req, "success", "FAQ berhasil disimpan.");
  res.redirect("/faq");
});
app.post("/faq/delete", requireLogin, async (req, res) => {
  let { idx } = req.body;
  let faq = await loadJson("faq.json");
  faq.splice(idx, 1);
  await saveJson("faq.json", faq);
  setToast(req, "success", "FAQ dihapus.");
  res.redirect("/faq");
});

// --- SOP ---
app.get("/sop", requireLogin, async (req, res) => {
  const sop = await loadJson("sop.json");
  const toast = req.session.toast || null;
  delete req.session.toast;
  res.render("sop", { sop, toast }); // <--- toast DIKIRIM
});

app.post("/sop/save", requireLogin, async (req, res) => {
  let { idx, trigger, response } = req.body;
  let sop = await loadJson("sop.json");
  if (!sop || !Array.isArray(sop)) sop = [];
  if (idx === "") { sop.push({ trigger: trigger.split(","), response: [response] }); }
  else { sop[idx] = { trigger: trigger.split(","), response: [response] }; }
  await saveJson("sop.json", sop);
  setToast(req, "success", "SOP berhasil disimpan.");
  res.redirect("/sop");
});
app.post("/sop/delete", requireLogin, async (req, res) => {
  let { idx } = req.body;
  let sop = await loadJson("sop.json");
  sop.splice(idx, 1);
  await saveJson("sop.json", sop);
  setToast(req, "success", "SOP dihapus.");
  res.redirect("/sop");
});

// --- PROMO ---
app.get("/promo", requireLogin, async (req, res) => {
  const promo = await loadJson("promo.json");
  const toast = req.session.toast || null;
  delete req.session.toast;
  res.render("promo", { promo, toast }); // <--- toast DIKIRIM
});
app.post("/promo/save", requireLogin, async (req, res) => {
  let { idx, banner, active } = req.body;
  let promo = await loadJson("promo.json");
  if (!promo || !Array.isArray(promo)) promo = [];
  if (idx === "") { promo.push({ banner, active: !!active }); }
  else { promo[idx] = { banner, active: !!active }; }
  await saveJson("promo.json", promo);
  setToast(req, "success", "Promo berhasil disimpan.");
  res.redirect("/promo");
});
app.post("/promo/delete", requireLogin, async (req, res) => {
  let { idx } = req.body;
  let promo = await loadJson("promo.json");
  promo.splice(idx, 1);
  await saveJson("promo.json", promo);
  setToast(req, "success", "Promo dihapus.");
  res.redirect("/promo");
});

// --- CLAIM LOG ---
app.get("/claim", requireLogin, async (req, res) => {
  const claim = await loadJson("claim.json");
  const toast = req.session.toast || null;
  delete req.session.toast;
  res.render("claim", { claim, toast }); // <--- toast DIKIRIM
});
app.post("/claim/resolve", requireLogin, async (req, res) => {
  let { idx } = req.body;
  let claim = await loadJson("log_claim.json");
  claim[idx].status = "RESOLVED";
  await saveJson("log_claim.json", claim);
  setToast(req, "success", "Claim di-mark as resolved.");
  res.redirect("/claim");
});

// --- BLACKLIST ---
app.get("/blacklist", requireLogin, async (req, res) => {
  const blacklist = await loadJson("blacklist.json");
  const toast = req.session.toast || null;
  delete req.session.toast;
  res.render("blacklist", { blacklist, toast }); // <--- toast DIKIRIM
});
app.post("/blacklist/save", requireLogin, async (req, res) => {
  let { user, reason } = req.body;
  let blacklist = await loadJson("blacklist.json");
  if (!blacklist || !Array.isArray(blacklist)) blacklist = [];
  blacklist.push({ user, reason, date: new Date().toISOString() });
  await saveJson("blacklist.json", blacklist);
  setToast(req, "success", "User masuk blacklist.");
  res.redirect("/blacklist");
});
app.post("/blacklist/delete", requireLogin, async (req, res) => {
  let { idx } = req.body;
  let blacklist = await loadJson("blacklist.json");
  blacklist.splice(idx, 1);
  await saveJson("blacklist.json", blacklist);
  setToast(req, "success", "Blacklist dihapus.");
  res.redirect("/blacklist");
});

// --- BUYERS (USER ROYAL) ---
app.get("/buyers", requireLogin, async (req, res) => {
  // Load raw buyer entries from JSON
  let buyers = await loadJson("buyers.json");
  if (!Array.isArray(buyers)) buyers = [];
  // Aggregasi yang baru: pakai field statistik langsung!
  const buyersAggregated = buyers.map(user => ({
    user: user.user,
    total: user.data?.length || 0,
    statistik: user.statistik || {}
  }));
  const toast = req.session.toast || null;
  delete req.session.toast;
  res.render("buyers", { buyers, buyersAggregated, toast });
});

// --- CLAIM REPLACE ---
app.get("/claims-replace", requireLogin, async (req, res) => {
  let claimsReplace = await loadJson("claimsReplace.json");
  if (!Array.isArray(claimsReplace)) claimsReplace = [];
  const toast = req.session.toast || null;
  delete req.session.toast;
  res.render("claims_replace", { claimsReplace, toast });
});

app.post("/claims-replace/resolve", requireLogin, async (req, res) => {
  const { index } = req.body;
  let claimsReplace = await loadJson("claimsReplace.json");
  if (!Array.isArray(claimsReplace)) claimsReplace = [];
  if (claimsReplace[index]) claimsReplace[index].status = "RESOLVED";
  await saveJson("claimsReplace.json", claimsReplace);
  setToast(req, "success", "Claim ditandai selesai.");
  res.redirect("/claims-replace");
});

// --- CLAIM RESET ---
app.get("/claims-reset", requireLogin, async (req, res) => {
  let claimsReset = await loadJson("claimsReset.json");
  if (!Array.isArray(claimsReset)) claimsReset = [];
  const toast = req.session.toast || null;
  delete req.session.toast;
  res.render("claims_reset", { claimsReset, toast });
});

app.post("/claims-reset/mark", requireLogin, async (req, res) => {
  const { index } = req.body;
  let claimsReset = await loadJson("claimsReset.json");
  if (!Array.isArray(claimsReset)) claimsReset = [];
  if (claimsReset[index]) claimsReset[index].done = true;
  await saveJson("claimsReset.json", claimsReset);
  setToast(req, "success", "Reset ditandai selesai.");
  res.redirect("/claims-reset");
});

// ========== 404 ==========
app.use((req, res) => {
  res.status(404).render("404");
});

// ========== START ==========
(async () => {
  await fs.mkdir(produkDir, { recursive: true });
  app.listen(PORT, () => {
  console.log(`Admin Panel running on http://31.220.108.145:${PORT}/login`);
  // open(`http://31.220.108.145:${PORT}/login`); // Boleh dihapus kalau di VPS
});
})();