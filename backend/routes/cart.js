const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');

// Sepete ürün ekle
router.post('/add', async (req, res) => {
  const { customerId, productId, quantity } = req.body;

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
  res.json({ msg: "Ürün sepete eklendi", cart });
});

// Sepeti getir
router.get('/:customerId', async (req, res) => {
  const cart = await Cart.findOne({ customerId: req.params.customerId }).populate("items.productId");
  if (!cart) return res.json({ items: [] });
  res.json(cart);
});

// Sepetten ürün sil
router.post('/remove', async (req, res) => {
  const { customerId, productId } = req.body;

  const cart = await Cart.findOne({ customerId });
  if (!cart) return res.status(404).json({ msg: "Sepet bulunamadı" });

  cart.items = cart.items.filter(item => item.productId.toString() !== productId);
  await cart.save();

  res.json({ msg: "Ürün sepetten çıkarıldı", cart });
});

// Sepeti temizle
router.post('/clear', async (req, res) => {
  const { customerId } = req.body;

  await Cart.findOneAndDelete({ customerId });
  res.json({ msg: "Sepet temizlendi" });
});

module.exports = router;
