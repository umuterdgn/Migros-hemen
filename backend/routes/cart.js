const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');

// Sepete ürün ekle
router.post('/add', async (req, res) => {
  const { customerId, productId, quantity } = req.body;

  try {
    let cart = await Cart.findOne({ customerId });

    if (!cart) {
      cart = new Cart({ customerId, items: [{ productId, quantity }] });
    } else {
      const existingItem = cart.items.find(item => item.productId.toString() === productId);
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        cart.items.push({ productId, quantity });
      }
    }

    await cart.save();
    res.json({ msg: "✅ Ürün sepete eklendi", cart });
  } catch (err) {
    res.status(500).json({ msg: "❌ Sepete eklerken hata oluştu", error: err.message });
  }
});

// Sepeti getir
router.get('/:customerId', async (req, res) => {
  try {
    const cart = await Cart.findOne({ customerId: req.params.customerId }).populate("items.productId");
    if (!cart) return res.json({ items: [] });
    res.json(cart);
  } catch (err) {
    res.status(500).json({ msg: "❌ Sepet alınamadı", error: err.message });
  }
});

// Sepetten ürün sil
router.post('/remove', async (req, res) => {
  const { customerId, productId } = req.body;

  try {
    const cart = await Cart.findOne({ customerId });
    if (!cart) return res.status(404).json({ msg: "Sepet bulunamadı" });

    cart.items = cart.items.filter(item => item.productId.toString() !== productId);
    await cart.save();

    res.json({ msg: "🗑️ Ürün sepetten çıkarıldı", cart });
  } catch (err) {
    res.status(500).json({ msg: "❌ Sepetten çıkarırken hata", error: err.message });
  }
});

// Sepeti temizle
router.post('/clear', async (req, res) => {
  const { customerId } = req.body;

  try {
    await Cart.findOneAndDelete({ customerId });
    res.json({ msg: "🧹 Sepet temizlendi" });
  } catch (err) {
    res.status(500).json({ msg: "❌ Sepet temizlenemedi", error: err.message });
  }
});

module.exports = router;
