const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ msg: 'Token yok' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch {
    res.status(401).json({ msg: 'Geçersiz token' });
  }
};

exports.verifyRole = (role) => (req, res, next) => {
  if (req.user.role !== role) return res.status(403).json({ msg: 'Yetki yok' });
  next();
};
