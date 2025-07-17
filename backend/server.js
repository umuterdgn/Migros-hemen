const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

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
app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "Eksik bilgi" });
  }

  try {
    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
      if (err) return res.status(500).json({ success: false, message: "Sunucu hatası" });

      if (results.length > 0) {
        return res.status(409).json({ success: false, message: "Bu e-posta zaten kayıtlı." });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      db.query(
        "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
        [name, email, hashedPassword, "user"],
        (err, result) => {
          if (err) return res.status(500).json({ success: false, message: "Kayıt başarısız" });
          res.status(201).json({ success: true, message: "Kayıt başarılı" });
        }
      );
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Sunucu hatası" });
  }
});

//burdan devam 


// Tüm kategorileri getir
app.get("/api/categories", (req, res) => {
    db.query("SELECT * FROM categories", (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// Bir kategoriye ait alt kategoriler
app.get("/api/subcategories/:categoryId", (req, res) => {
    const { categoryId } = req.params;
    db.query("SELECT * FROM subcategories WHERE category_id = ?", [categoryId], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// Bir alt kategoriye ait ürünler
app.get("/api/products/:subcategoryId", (req, res) => {
    const { subcategoryId } = req.params;
    db.query("SELECT * FROM products WHERE subcategory_id = ?", [subcategoryId], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// Belirli bir kategoriye ait tüm ürünler (alt kategorilere bakılmaksızın)
app.get("/api/category-products/:categoryId", (req, res) => {
    const { categoryId } = req.params;
    db.query(`
        SELECT p.* FROM products p 
        JOIN subcategories s ON p.subcategory_id = s.id
        WHERE s.category_id = ?
    `, [categoryId], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});
// burdan devam
const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor`);
});
