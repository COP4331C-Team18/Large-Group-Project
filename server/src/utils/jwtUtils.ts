import jwt from 'jsonwebtoken';

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not configured");
};
const secretKey = process.env.JWT_SECRET;
const defaultExpiration = '1h';

// helper function to sign a JWT token
export function signAccessToken(payload: object, expiresIn: string = defaultExpiration) {
  return jwt.sign(payload, secretKey, { expiresIn });
}

// helper function to verify a JWT token
export function verifyAccessToken(token: string){
  return jwt.verify(token, secretKey);
}


