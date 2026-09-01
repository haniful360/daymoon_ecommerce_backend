import { registerAs } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

export interface CloudinaryConfig {
  cloudName?: string;
  apiKey?: string;
  apiSecret?: string;
  folder?: string;
  secure: boolean;
}

export const cloudinaryConfig = registerAs(
  'cloudinary',
  (): CloudinaryConfig => ({
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    folder: process.env.CLOUDINARY_FOLDER,
    secure: process.env.CLOUDINARY_SECURE === 'true',
  }),
);

export const CLOUDINARY_PROVIDER = 'CLOUDINARY_PROVIDER';

/**
 * Configure and initialize Cloudinary SDK
 */
export function setupCloudinary(): typeof cloudinary {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: process.env.CLOUDINARY_SECURE === 'true',
  });
  return cloudinary;
}
