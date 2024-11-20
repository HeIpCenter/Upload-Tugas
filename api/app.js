const express = require("express");
const multer = require("multer");
const session = require("express-session");
const TelegramBot = require("node-telegram-bot-api");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

// Token dari Bot Telegram
const token = "7756972324:AAHzn5JS-1W2xZvwNsKITUz7DxNcbYWXR1g"; // Ganti dengan token bot Anda
const chatId = "-1002341054048"; // Ganti dengan chat ID yang sesuai
const bot = new TelegramBot(token, { polling: true }); // Inisialisasi bot

// Middleware untuk menguraikan data
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: true,
  })
);

// Mengatur view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views")); // Menunjuk ke folder views

// Mengatur penyimpanan berkas
const storage = multer.memoryStorage(); // Simpan file dalam buffer
const upload = multer({ storage });

// Menyimpan data berkas yang diunggah dalam memori
let uploadedFiles = [];
let questions = [];

// Rute default
app.get("/", (req, res) => {
  res.redirect("/login");
});

// Rute login
app.get("/login", (req, res) => {
  res.render("login");
});

// Login handler
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (username === "admin" && password === "admin") {
    req.session.user = { username, role: "admin" };
    return res.redirect("/admin");
  } else if (username === "user" && password === "user") {
    req.session.user = { username, role: "user" };
    return res.redirect("/user");
  }
  res.send("Username atau password salah.");
});

// Rute untuk admin
app.get("/admin", (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.redirect("/login");
  }
  res.render("admin", { uploadedFiles });
});

// Rute untuk mengunggah berkas dan mengirim ke Telegram
app.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.redirect("/login");
  }

  const fullname = req.body.fullname;
  const fileBuffer = req.file.buffer; // Ambil buffer file dari multer

  // Kirim berkas ke Telegram
  try {
    const sentMessage = await bot.sendDocument(chatId, fileBuffer, {
      caption: `Diunggah oleh: ${fullname}`,
      filename: req.file.originalname,
    });

    uploadedFiles.push({
      filename: req.file.originalname,
      originalname: req.file.originalname,
      fullname: fullname,
    });

    console.log(uploadedFiles);
    res.redirect("/admin");
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send(
        "Gagal mengunggah berkas ke Telegram. Pastikan koneksi internet baik."
      );
  }
});

// Rute untuk user
app.get("/user", (req, res) => {
  if (!req.session.user || req.session.user.role !== "user") {
    return res.redirect("/login");
  }
  res.render("user", { uploadedFiles });
});

// Rute untuk mengirim pertanyaan
app.post("/submit-questions", (req, res) => {
  const { name, question, filename } = req.body; // Mengambil satu pertanyaan

  const fileEntry = uploadedFiles.find(
    (file) => file.originalname === filename
  );
  if (fileEntry) {
    questions.push({
      name,
      question,
      filename,
      fullname: fileEntry.fullname,
    });
  }

  res.json({ message: "Pertanyaan berhasil dikirim!" });
});

// Rute untuk menampilkan pertanyaan
app.get("/questions", (req, res) => {
  res.render("questions", { questions });
});

// Rute logout
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});

// Jalankan server
app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
