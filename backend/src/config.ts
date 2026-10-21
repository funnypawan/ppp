import { z } from 'zod';
export const config = z.object({DATABASE_URL:z.string().url(),JWT_SECRET:z.string().min(32),PORT:z.coerce.number().default(8080),S3_ENDPOINT:z.string().url(),S3_REGION:z.string().default('auto'),S3_BUCKET:z.string().min(1),S3_ACCESS_KEY:z.string().min(1),S3_SECRET_KEY:z.string().min(1)}).parse(process.env);
