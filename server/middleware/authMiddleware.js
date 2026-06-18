const jwt = require('jsonwebtoken');
const { findSafeUserById } = require('../utils/storage');

const jwtSecret = process.env.JWT_SECRET || 'local-dev-jwt-secret';

const protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ message: 'Not authorized, no token provided' });
        }

        const decoded = jwt.verify(token, jwtSecret);
        req.user = await findSafeUserById(decoded.id);
        
        if (!req.user) {
            return res.status(404).json({ message: 'User not found' });
        }

        next();
    } catch (error) {
        return res.status(401).json({ message: 'Not authorized, token failed', error: error.message });
    }
};

module.exports = { protect };
