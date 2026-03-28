import rateLimit from 'express-rate-limit';

const MAX_REQUESTS_PER_MINUTE_PER_IP = 20;

const rateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: MAX_REQUESTS_PER_MINUTE_PER_IP, // limit each IP to this many requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
export default rateLimiter;