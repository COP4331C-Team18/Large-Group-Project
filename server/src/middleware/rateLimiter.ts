import rateLimit from 'express-rate-limit';

// Rate limiter: 20 requests per 1 minute per IP
const rateLimiter = rateLimit({
	windowMs: 60 * 1000, // 1 minute
	max: 2000, // limit each IP to 20 requests per windowMs
	standardHeaders: true,
	legacyHeaders: false,
});

export default rateLimiter;