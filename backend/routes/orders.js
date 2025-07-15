const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');

// Sepeti siparişe çevir
router.post('/from-cart', async (req, res) => {
  const { customerId } = req.body;

  try {
    const cart = await Cart.findOne({ customerId });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ msg: "Sepet boş." });
    }

    let total = 0;
    const orderItems = [];

    for (const item of cart.items) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(404).json({ msg: `Ürün bulunamadı: ${item.productId}` });

      const price = product.discountPrice || product.price;
      total += price * item.quantity;

      orderItems.push({
        productId: product._id,
        quantity: item.quantity
      });
    }

    const newOrder = new Order({
      customerId,
      products: orderItems,
      total
    });

    await newOrder.save();
    await Cart.findOneAndDelete({ customerId });

    res.json({
      msg: "📦 Sipariş başarıyla oluşturuldu",
      order: newOrder
    });

  } catch (err) {
    console.error("Sipariş hatası:", err);
    res.status(500).json({ msg: "❌ Sipariş oluşturulamadı", error: err.message });
  }
});

module.exports = router;
