"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireMemberAuth = requireMemberAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function requireMemberAuth(req, res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    const token = header.slice(7);
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        return res.status(500).json({ error: 'Server misconfiguration' });
    }
    try {
        const payload = jsonwebtoken_1.default.verify(token, secret);
        if (payload.role !== 'member') {
            return res.status(403).json({ error: 'Member access required' });
        }
        req.member = payload;
        next();
    }
    catch {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}
