const jwt = require('jsonwebtoken');
const { validId } = require('../services/input');

module.exports = function (req, res, next) {
    const match = /^Bearer\s+(\S+)$/i.exec(req.header('Authorization') || '');
    if (!match) return res.status(401).json({ error: 'Authentification requise' });

    try {
        const verified = jwt.verify(match[1], process.env.JWT_SECRET, { algorithms: ['HS256'] });
        if (!validId(verified._id)) return res.status(401).json({ error: 'Session invalide' });
        req.user = verified;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Session invalide ou expirée' });
    }
};
