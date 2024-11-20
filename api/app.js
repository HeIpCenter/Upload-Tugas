const express = require("express");
const multer = require("multer");
const session = require("express-session");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

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
app.set("views", path.join(__dirname, "../views")); // Mengatur path ke folder views

// Mengatur penyimpanan berkas
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

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

// Rute untuk mengunggah berkas (hanya untuk admin)
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.redirect("/login");
  }
  const fullname = req.body.fullname;
  uploadedFiles.push({
    filename: req.file.filename,
    originalname: req.file.originalname,
    fullname: fullname,
  });
  console.log(uploadedFiles);
  res.redirect("/admin");
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
  const { name, question1, question2, question3, filename } = req.body;

  // Cari file berdasarkan nama file dan temukan fullname
  const fileEntry = uploadedFiles.find((file) => file.filename === filename);
  if (fileEntry) {
    questions.push({
      name,
      question1,
      question2,
      question3,
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

// Ekspor aplikasi agar dapat digunakan oleh Vercel
module.exports = app;
