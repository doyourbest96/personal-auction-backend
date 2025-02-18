export interface AuthRequest extends Request {
  user: {
    userId: string;
  };
}
