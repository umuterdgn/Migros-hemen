const Product = require('../models/Product');

// Tüm ürünleri getir
exports.getAllProducts = async (req, res) => {
  const products = await Product.find();
  res.json(products);
};

// Ürün ekle
exports.createProduct = async (req, res) => {
  const newProduct = new Product(req.body);
  await newProduct.save();
  res.json({ msg: 'Ürün eklendi', product: newProduct });
};

// Ürünü güncelle
exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const updated = await Product.findByIdAndUpdate(id, req.body, { new: true });
  res.json({ msg: 'Ürün güncellendi', updated });
};

// Ürünü sil
exports.deleteProduct = async (req, res) => {
  const { id } = req.params;
  await Product.findByIdAndDelete(id);
  res.json({ msg: 'Ürün silindi' });
};
