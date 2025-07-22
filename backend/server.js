const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");
const app = express();
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const { log } = require("console");
const bodyParser = require('body-parser');
 
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));
// app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); 
// JSON tipinde gelen body'yi ayrıştırır
app.use(bodyParser.json());

// URL encoded (form verisi gibi) body'yi ayrıştırır
app.use(bodyParser.urlencoded({ extended: true }));
// MySQL bağlantısı
const db = mysql.createConnection({
  host: "localhost",
  user: "root", // kendi MySQL kullanıcı adını yaz
  password: "Hopekutay064431", // kendi MySQL şifreni yaz
  database: "migros" // veritabanı adın
});

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor`);
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

// Görsellerin yükleneceği klasör ayarı
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "uploads/"); // uploads klasörüne kaydedecek
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
//     cb(null, uniqueSuffix + path.extname(file.originalname)); // eşsiz dosya ismi
//   }
// });

// const upload = multer({ storage: storage });
// Tüm kategorileri getir
app.get("/api/categories", (req, res) => {
    db.query("SELECT * FROM categories", (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});
// tüm örnekler bitince ayriyeten body parser ile on taraftan post atılarak çalışacak hale getiirilecek.
// Bir kategoriye ait alt kategoriler
app.get("/api/getSubCategories", (req, res) => {
    var categoryId = req.query.kategori;
    console.log("Category ID:", categoryId);
    db.query("SELECT * FROM subcategories WHERE kategori_id = ?", [categoryId], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.get("/api/products", (req, res) => {
    // const { subcategory_id } = req.query;
    db.query("SELECT * FROM products", (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// Kategoriye ait tüm ürünler (alt kategorileri de dahil)
app.get("/api/products-category", (req, res) => {
  const categoryId = req.query.categoryId;  // query'den alıyoruz

  if (!categoryId) {
    return res.status(400).json({ message: "categoryId query parametresi gerekli" });
  }

  const sql = `
    SELECT * FROM products
    WHERE category = ?
  `;

  db.query(sql, [categoryId], (err, results) => {
    if (err) {
      console.error("Veritabanı hatası:", err);
      return res.status(500).json({ error: "Veritabanı hatası" });
    }
    res.json(results);
  });
});

//ürün ekleme
app.post("/api/products", (req, res) => {
  const { name, price, stock, base64, subcategory_id, discount_type, discount_value, category } = req.body;

  if (!name || !price || !stock || !category) {
    return res.status(400).json({ success: false, message: "Eksik bilgi var." });
  }

  const sql = `
    INSERT INTO products (name, price, stock, base64, subcategory_id, discount_type, discount_value, category)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [name, price, stock, base64, subcategory_id, discount_type, discount_value, category], (err, result) => {
    if (err) {
      console.error("Ürün ekleme hatası:", err); // Hata detayını konsola yazdır
      return res.status(500).json({ success: false, message: "Ürün eklenemedi", error: err.message });
    }
    res.status(201).json({ success: true, message: "Ürün başarıyla eklendi", productId: result.insertId });
  });
});



// Ürün güncelleme (id query parametre olarak geliyor)

app.put("/api/products", (req, res) => {
  const id = req.query.id;
  const { name, price, stock, image_url, subcategory_id, discount_type, discount_value, category } = req.body;

  if (!id) {
    return res.status(400).json({ success: false, message: "ID belirtilmeli" });
  }

  const sql = `
    UPDATE products SET name=?, price=?, stock=?, image_url=?, subcategory_id=?, discount_type=?, discount_value=?, category=?
    WHERE id=?
  `;

  db.query(sql, [name, price, stock, image_url, subcategory_id, discount_type, discount_value, category, id], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: "Güncelleme başarısız" });
    res.json({ success: true, message: "Ürün başarıyla güncellendi" });
  });
});

// Ürün silme (id query parametre olarak geliyor)
app.delete("/api/products", (req, res) => {
  const id = req.query.id;

  if (!id) {
    return res.status(400).json({ success: false, message: "ID belirtilmeli" });
  }

  db.query("DELETE FROM products WHERE id=?", [id], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: "Silme başarısız" });
    res.json({ success: true, message: "Ürün başarıyla silindi" });
    

    app.post("/api/uploads", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "Dosya yüklenemedi" });
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  res.status(200).json({ success: true, imageUrl: fileUrl });
});

  });
});

app.use(express.json({ limit: '50mb' }));  // veya daha fazlası: '20mb'
app.use(express.urlencoded({ extended: true, limit: '50mb' }));





app.post("/api/addProduct", (req, res) => {
  
     const { name, price, stock, base64, subcategory_id, discount_type, discount_value, category } = req.body;

  if (!name || !price || !stock || !category) {
    return res.status(400).json({ success: false, message: "Eksik bilgi var." });
  }

  const sql = `
    INSERT INTO products (name, price, stock, base64, subcategory_id, discount_type, discount_value, category)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [name, price, stock, base64, subcategory_id, discount_type, discount_value, category], (err, result) => {
    if (err) {
      console.error("Ürün ekleme hatası:", err); // Hata detayını konsola yazdır
      return res.status(500).json({ success: false, message: "Ürün eklenemedi", error: err.message });
    }
    res.status(201).json({ success: true, message: "Ürün başarıyla eklendi", productId: result.insertId });
  });
     });
   

  // const buffer = Buffer.from(file, "base64"); // base64'ü binary veriye dönüştür
  // const filename = uuidv4() + ".png"; // benzersiz isim
  // const filePath = path.join(__dirname, "uploads", filename);

  // fs.writeFile(filePath, buffer, (err) => {
  //   if (err) {
  //     console.error("Dosya yazma hatası:", err);
  //     return res.status(500).json({ success: false, message: "Dosya kaydedilemedi" });
  //   }

  //   const imageUrl = `/image_url/${filename}`; // veritabanında saklanacak yol
  //   return res.status(200).json({ success: true, imageUrl }); // UI5 bu URL'yi kullanarak image_url olarak set ediyor
  // });
 
// fotoğraf indirme için
// const multer = require("multer");
// const path = require("path");

// Upload klasörü
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "uploads/");
//   },
//   filename: function (req, file, cb) {
//     const ext = path.extname(file.originalname);
//     const fileName = Date.now() + ext;
//     cb(null, fileName);
//   }
// });

// const upload = multer({ storage: storage });

// app.use("/uploads", express.static("uploads")); // resimlere dışarıdan erişim

// // Görsel yükleme endpoint’i
// app.post("/api/products", upload.single("image"), (req, res) => {
//   const { ad, fiyat, stok, altkategori_id, indirim_turu, indirim_degeri } = req.body;
//   const image_url = req.file ? `/uploads/${req.file.filename}` : null;

//   if (!ad || !fiyat || !stok || !altkategori_id || !image_url) {
//     return res.status(400).json({ message: "Lütfen tüm alanları doldurun." });
//   }

//   const sql = `
//     INSERT INTO products (ad, fiyat, stok, image_url, altkategori_id, indirim_turu, indirim_degeri)
//     VALUES (?, ?, ?, ?, ?, ?, ?)
//   `;

//   db.query(sql, [ad, fiyat, stok, image_url, altkategori_id, indirim_turu, indirim_degeri], (err, result) => {
//     if (err) {
//       console.error("Ürün eklenemedi:", err);
//       return res.status(500).json({ message: "Sunucu hatası" });
//     }

//     res.json({ message: "Ürün başarıyla eklendi", productId: result.insertId });
//   });


//   const fileUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;
//   res.status(200).json({ success: true, imageUrl: fileUrl });
// });
