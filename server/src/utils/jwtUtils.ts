import jwt from 'jsonwebtoken';

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not configured");
};
const secretKey = process.env.JWT_SECRET as string; // Type assertion since we already checked for its existence
const defaultExpiration = '20m'; // 20 minutes, can be overridden when signing

// helper function to sign a JWT token
export function signAccessToken(payload: object, expiresIn: string = defaultExpiration) {
  return jwt.sign(payload, secretKey as string, { expiresIn: expiresIn as any });
}

// helper function to verify a JWT token
export function verifyAccessToken(token: string){
  return jwt.verify(token, secretKey as string);
}


