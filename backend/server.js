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


// app.put("/api/products", (req, res) => {
//   const {
//     id, name, price, stock, base64,
//     subcategory_id,
//     discount_type, discount_value, discount_scope,
//     category
//   } = req.body;
//   // …
//   const sql = `
//     UPDATE products
//     SET name=?, price=?, stock=?, base64=?,
//         subcategory_id=?, discount_type=?, discount_value=?, discount_scope=?, category=?
//     WHERE id=?
//   `;
//   db.query(sql, [
//     name, price, stock, base64,
//     subcategory_id, discount_type, discount_value, discount_scope, category,
//     id
//   ], (err) => { /* … */ });
// });
app.get("/api/brands-by-subcategory", (req, res) => {
  const subId = parseInt(req.query.subId, 10);
  if (!subId) {
    return res.status(400).json({ message: "subId query parametresi gerekli" });
  }
  // Eğer brands tablonuzda alt-kategori ilişkisi subcategory_id kolonu ile tutuluyorsa:
  db.query(
    "SELECT id, name, discount_type, discount_value FROM brands WHERE subcategory_id = ?",
    [subId],
    (err, rows) => {
      if (err) {
        console.error("brands-by-subcategory hatası:", err);
        return res.status(500).json({ message: "Sunucu hatası" });
      }
      res.json(rows);
    }
  );
});

app.get("/api/products-category", (req, res) => {
  const categoryId = req.query.categoryId;
  if (!categoryId) {
    return res.status(400).json({ message: "categoryId query parametresi gerekli" });
  }
  const sql = `
    SELECT
      p.*,
      p.has_limit,
      p.limit_qty,
      b.name            AS brand_name,
      b.discount_type   AS brand_disc_type,
      b.discount_value  AS brand_disc_value
    FROM products p
    JOIN brands b ON p.brand_id = b.id
    WHERE p.category = ?
  `;
  db.query(sql, [categoryId], (err, rows) => {
    if (err) {
      console.error("Veritabanı hatası:", err);
      return res.status(500).json({ error: "Veritabanı hatası" });
    }
    res.json(rows);
  });
});

// Ürün silme (DELETE /api/products?id=)
app.delete("/api/products", (req, res) => {
  const id = req.query.id;
  if (!id) return res.status(400).json({ success: false, message: "ID belirtilmeli" });

  db.query("DELETE FROM products WHERE id = ?", [id], (err) => {
    if (err) {
      console.error("Silme hatası:", err);
      return res.status(500).json({ success: false, message: "Silme başarısız" });
    }
    res.json({ success: true, message: "Ürün başarıyla silindi" });
  });
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
    // console.log("Category ID:", categoryId);
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


app.get("/api/getBrands", (req, res) => {
    var brandsId = req.query.name;
    console.log("Brands ID:", categoryId);
    db.query("SELECT * FROM brands WHERE kategori_id = ?", [brandsId], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.get("/api/brands", (req, res) => {
    // const { subcategory_id } = req.query;
    db.query("SELECT * FROM brands", (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// MARKALARİ KATEGORİYE GÖRE GETİR
app.get("/api/brands-by-category", (req, res) => {
  const categoryId = req.query.categoryId;
  if (!categoryId) {
    return res.status(400).json({ message: "categoryId query parametresi gerekli" });
  }

  const sql = `
    SELECT DISTINCT b.id, b.name
    FROM brands b
    JOIN products p      ON b.id = p.brand_id
    JOIN subcategories s ON p.subcategory_id = s.id
    WHERE s.kategori_id = ?
  `;

  db.query(sql, [categoryId], (err, results) => {
    if (err) {
      console.error("Markalar getirme hatası:", err);
      return res.status(500).json({ message: "Sunucu hatası" });
    }
    res.json(results);
  });
});


// app.get("/api/brands-by-products", (req, res) => {
//   const productId = parseInt(req.query.productId, 10);
//   if (!productId) {
//     return res.status(400).json({ message: "productId query parametresi gerekli" });
//   }

//   // Tek sorguda; önce subcategories, sonra products, sonra brands
//   const sql = `
//     SELECT DISTINCT b.id, b.name
//     FROM brands b
//     JOIN products p       ON b.id = p.brand_id
//     JOIN subcategories s  ON p.subcategory_id = s.id
//     WHERE s.kategori_id = ?
//   `;

//   db.query(sql, [categoryId], (err, results) => {
//     if (err) {
//       console.error("Markalar getirme hatası:", err);
//       return res.status(500).json({ message: "Sunucu hatası" });
//     }
//     res.json(results);
//   });
// });


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
  console.log("CREATE /api/products body:", req.body)
  const {
    name,
    price,
    stock,
    base64,
    subcategory_id,
    brand_id,          // <— ekledik
    discount_type,     // <— ekledik
    discount_value,    // <— ekledik
    discount_scope,    // <— ekledik eğer varsa
    category
  } = req.body;

  // temel validasyon
  if (!name || !price || !stock || !subcategory_id || !brand_id || !category) {
    return res.status(400).json({ success: false, message: "Eksik zorunlu alan var." });
  }

const sql = `
  INSERT INTO products
    (name, price, stock, base64, subcategory_id, brand_id,
     discount_type, discount_value, discount_scope,
     category, has_limit, limit_qty)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;
db.query(sql, [
  name, price, stock, base64,
  subcategory_id, brand_id,
  discount_type, discount_value, discount_scope,
  category,   // önceki alanlar
  has_limit,  // 1 veya 0
  limit_qty   // sayı ya da null
], (err, result) => {
    if (err) {
      console.error("Ürün ekleme hatası:", err);
      return res.status(500).json({ success: false, message: "Ürün eklenemedi", error: err.message });
    }
    res.status(201).json({
      success: true,
      message: "Ürün başarıyla eklendi",
      productId: result.insertId
    });
  });
});


// Ürün güncelleme (id query parametre olarak geliyor)

app.put("/api/products", (req, res) => {
  // id’yi hem query’den hem de body’den yakalayalım
  const id = req.body.id || req.query.id;
  console.log("Güncelleme isteği geldi, id =", id, "body =", req.body);

  if (!id) {
    return res.status(400).json({ success: false, message: "ID belirtilmeli" });
  }

  const {
    name, price, stock, brand_id,
    discount_scope, base64 ,
    subcategory_id, discount_type,
    discount_value, category
  } = req.body;

  const sql = `
    UPDATE products
    SET
      name            = ?,
      brand_id        = ?,
      discount_scope  = ?,
      price           = ?,
      stock           = ?,
      base64       = ?,
      subcategory_id  = ?,
      discount_type   = ?,
      discount_value  = ?,
      category        = ?
    WHERE id = ?
  `;
  const params = [
    name, brand_id, discount_scope,
    price, stock, base64 ,
    subcategory_id, discount_type,
    discount_value, category, id
  ];
  console.log("SQL params:", params);

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error("Güncelleme hatası:", err);       // ← Hata detayını burada göreceksin
      return res.status(500).json({
        success: false,
        message: "Güncelleme sırasında sunucu hatası",
        error: err.message                        // ← İstersen client’a da mesajı dönebilirsin
      });
    }
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
  const {
    name, price, stock, base64,
    subcategory_id, discount_type, discount_value, discount_scope, category
  } = req.body;

  const sql = `
    INSERT INTO products 
      (name, price, stock, base64, subcategory_id, discount_type, discount_value, discount_scope, category)
    VALUES (?,?,?,?,?,?,?,?,?)
  `;
  db.query(sql, [
    name, price, stock, base64,
    subcategory_id, discount_type, discount_value, discount_scope, category
  ], (err, result) => {
    if (err) {
      console.error("Ürün ekleme hatası:", err);
      return res.status(500).json({ success: false, message: "Ürün eklenemedi", error: err.message });
    }
    // Başarılı ekleme → 201 + insertId dön
    res.status(201).json({ success: true, message: "Ürün başarıyla eklendi", productId: result.insertId });
  });
});

   

     //CART API'leri (SEPET)
     app.post("/api/cart", (req, res) => {
  const { users_id, products_id, quantity, note } = req.body;
  const sql = `INSERT INTO cart (users_id, products_id, quantity, note) VALUES (?, ?, ?, ?)`;
  db.query(sql, [users_id, products_id, quantity, note], (err, result) => {
    if (err) {
      console.error("Sepet ekleme hatası:", err);
      return res.status(500).json({ success: false, message: "Sepet eklenemedi", error: err.message });
    }
    res.status(201).json({ success: true, message: "Sepet başarıyla eklendi", cartId: result.insertId });
  });
});

// sepete ekle
app.post("/api/cart", (req, res) => {
  const { users_id, products_id, quantity, note } = req.body;
  if (!users_id || !products_id) {
    return res.status(400).json({ success: false, message: "Eksik parametre" });
  }
  const sql = `
    INSERT INTO cart (users_id, product_id, quantity, note)
    VALUES (?, ?, ?, ?)
  `;
  db.query(sql, [users_id, products_id, quantity || 1, note || ""], (err, result) => {
    if (err) {
      console.error("Sepete ekleme hatası:", err);
      return res.status(500).json({ success: false, message: "Eklenemedi" });
    }
    res.json({ success: true, message: "Sepete eklendi", cartId: result.insertId });
  });
});

// sepeti listele
app.get("/api/cart", (req, res) => {
  const usersId = req.query.users_id;
  if (!usersId) return res.status(400).json({ message: "users_id gerekli" });
  const sql = `
    SELECT c.id, c.products_id, c.quantity, c.note,
           p.name, p.price, p.base64
    FROM cart c
    JOIN products p ON p.id = c.products_id
    WHERE c.users_id = ?
  `;
  db.query(sql, [usersId], (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

//sepeti sil 

// CART’ten ürün sil
app.delete("/api/cart", (req, res) => {
  const id = req.query.id;
  if (!id) {
    return res.status(400).json({ success: false, message: "id parametresi gerekli" });
  }
  db.query("DELETE FROM cart WHERE id = ?", [id], (err, result) => {
    if (err) {
      console.error("Sepet silme hatası:", err);
      return res.status(500).json({ success: false, message: "Silme başarısız", error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Bu id ile eşleşen ürün bulunamadı" });
    }
    res.json({ success: true, message: "Ürün başarıyla silindi" });
  });
});

//sepeti güncelle
// CART güncelleme (quantity)
app.put("/api/cart", (req, res) => {
  const { id, quantity } = req.body;
  if (!id || quantity == null) {
    return res.status(400).json({ success: false, message: "id ve quantity gerekli" });
  }
  db.query(
    "UPDATE cart SET quantity = ? WHERE id = ?",
    [quantity, id],
    (err, result) => {
      if (err) {
        console.error("Sepet güncelleme hatası:", err);
        return res.status(500).json({ success: false, message: "Güncelleme başarısız" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: "Ürün bulunamadı" });
      }
      res.json({ success: true, message: "Adet güncellendi" });
    }
  );
});

// server.js içinde, CART API’lerinin altına ekle:
  
// app.post("/api/checkout", async (req, res) => {
//   const { userId, deliveryOption, paymentMethod, items, useMoney } = req.body;
//   // items = [{ productId, quantity, price }] 
//   // useMoney = puan/tutar kullanıldıysa (örneğin 50 ₺)

//   const conn = await db.promise().getConnection();
//   try {
//     await conn.beginTransaction();

//     // 1) orders tablosuna genel sipariş
//     const [orderRes] = await conn.query(
//       `INSERT INTO orders 
//         (user_id, delivery_option, payment_method, used_money, created_at)
//        VALUES (?, ?, ?, ?, NOW())`,
//       [userId, deliveryOption, paymentMethod, useMoney || 0]
//     );
//     const orderId = orderRes.insertId;

//     // 2) order_items ve stock güncelle
//     for (let it of items) {
//       const { productId, quantity, price } = it;
//       await conn.query(
//         `INSERT INTO order_items 
//            (order_id, product_id, quantity, unit_price)
//          VALUES (?, ?, ?, ?)`,
//         [orderId, productId, quantity, price]
//       );
//       await conn.query(
//         `UPDATE products SET stock = stock - ? WHERE id = ?`,
//         [quantity, productId]
//       );
//     }

//     // 3) money kesintisi varsa
//     if (useMoney > 0) {
//       await conn.query(
//         `UPDATE users SET money = money - ? WHERE id = ?`,
//         [useMoney, userId]
//       );
//     }

//     await conn.commit();
//     res.json({ success: true, orderId });
//   } catch (err) {
//     await conn.rollback();
//     console.error("Checkout hatası:", err);
//     res.status(500).json({ success: false, message: "Sipariş oluşturulamadı" });
//   } finally {
//     conn.release();
//   }
// });
app.post("/api/orders", async (req, res) => {
  const { userId, totalAmount, useMoneyPoints, items } = req.body;
  const conn = db.promise();

  try {
    // 0) Basit doğrulamalar
    if (useMoneyPoints < 0) {
      return res.status(400).json({ success: false, message: "Geçersiz puan kullanımı" });
    }
    // 0.1) Kullanıcının yeterli puanı var mı?
    const [[u]] = await conn.execute(
      "SELECT money_points FROM users WHERE id = ?",
      [userId]
    );
    if (!u || u.money_points < useMoneyPoints) {
      return res.status(400).json({ success: false, message: "Yetersiz para puanınız var." });
    }

    // 1) Transaction başlat
    await conn.beginTransaction();

    // 2) Gerçek ödenecek tutarı düşelim
    const netAmount = totalAmount - useMoneyPoints;
    if (netAmount < 0) {
      return res.status(400).json({ success: false, message: "Para puan toplamı aşamaz." });
    }

    // 3) Siparişi kaydet
    const [orderResult] = await conn.execute(
      `INSERT INTO orders (user_id, total_amount, order_date)
       VALUES (?, ?, NOW())`,
      [ userId, netAmount ]
    );
    const orderId = orderResult.insertId;

    // 4) Kalemler + stok güncelle
    for (const it of items) {
      await conn.execute(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price)
         VALUES (?, ?, ?, ?)`,
        [ orderId, it.productId, it.quantity, it.price ]
      );
      await conn.execute(
        `UPDATE products SET stock = stock - ? WHERE id = ?`,
        [ it.quantity, it.productId ]
      );
    }

    // 5) Kullanılan para puanları düş
    if (useMoneyPoints > 0) {
      await conn.execute(
        `UPDATE users
           SET money_points = money_points - ?
         WHERE id = ?`,
        [ useMoneyPoints, userId ]
      );
    }

    // 6) Commit
    await conn.commit();
    res.json({ success: true, orderId });

  } catch (err) {
    await conn.rollback();
    console.error("❌ /api/orders hata:", err);
    res.status(500).json({ success: false, message: "Sipariş oluşturulamadı." });
  }
});

app.get("/api/users/:id", (req,res) => {
  const id = parseInt(req.params.id,10);
  db.query("SELECT money_points FROM users WHERE id = ?", [id], (err,rows) => {
    if (err) return res.status(500).json({ success:false, message: "DB hatası"});
    if (!rows.length) return res.status(404).json({ success:false, message: "Kullanıcı yok"});
    res.json({ success:true, money_points: rows[0].money_points });
  });
});

// PUT /api/users/:id/earn-points
app.put("/api/users/:id/earn-points", (req, res) => {
  const userId = req.params.id;
  const { points } = req.body;

  const query = `UPDATE users SET money_points = money_points + ? WHERE id = ?`;
  db.query(query, [points, userId], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: "DB error" });
    return res.json({ success: true });
  });
});


// order ve order_items tablolarınızın şu yapıda olduğunu varsayıyoruz:
// orders(id, user_id, total_amount, order_date)
// order_items(id, order_id, product_id, quantity, unit_price)

// app.post("/api/orders", async (req, res) => {
//   const { userId, totalAmount, items } = req.body;
//   const conn = await db.promise().getConnection();

//   try {
//     await conn.beginTransaction();

//     // 1) Siparişi kaydet
//     const [orderResult] = await conn.query(
//       `INSERT INTO orders (user_id, total_amount, order_date)
//        VALUES (?, ?, NOW())`,
//       [userId, totalAmount]
//     );
//     const orderId = orderResult.insertId;

//     // 2) Kalemleri kaydet ve stoktan düş
//     for (const it of items) {
//       await conn.query(
//         `INSERT INTO order_items (order_id, product_id, quantity, unit_price)
//          VALUES (?, ?, ?, ?)`,
//         [orderId, it.productId, it.quantity, it.price]
//       );
//       await conn.query(
//         `UPDATE products SET stock = stock - ? WHERE id = ?`,
//         [it.quantity, it.productId]
//       );
//     }

//     await conn.commit();
//     res.json({ success: true, orderId });
//   } catch (err) {
//     await conn.rollback();
//     console.error("Checkout hatası:", err);
//     res.status(500).json({ success: false, message: "Sipariş oluşturulamadı." });
//   } finally {
//     conn.release();
//   }
// });



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
