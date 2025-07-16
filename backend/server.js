const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
// MySQL bağlantısı
const db = mysql.createConnection({
  host: "localhost",
  user: "root", // kendi MySQL kullanıcı adını yaz
  password: "Hopekutay064431", // kendi MySQL şifreni yaz
  database: "migros" // veritabanı adın
});

// Giriş API'si
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;

  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
    if (err) return res.status(500).json({ success: false, message: "Sunucu hatası" });

    if (results.length === 0) {
      return res.status(401).json({ success: false, message: "E-posta kayıtlı değil" });
    }
    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Şifre hatalı" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      "gizliAnahtar", // bunu .env içinde de saklayabilirsin
      { expiresIn: "1h" }
    );

    res.json({
      success: true,
      token,
      user: {
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor`);
});
