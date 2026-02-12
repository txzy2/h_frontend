// types/auth/jwt.types.ts
export type JwtPayload = {
  sub: string;
  email: string;
  login: string;
  name: string;
  role: string;
  sid: string;
  iat: number;
  exp: number;
};

export type UserData = {
  userId: string;
  email: string;
  login: string;
  name: string;
  role: string;
};
