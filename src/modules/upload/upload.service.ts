import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import * as fs from 'fs';
import 'multer';
import * as path from 'path';

export interface UploadResult {
  url: string;
  publicId?: string;
  format?: string;
  bytes?: number;
  originalName: string;
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private isCloudinaryReady = false;

  constructor(private readonly configService: ConfigService) {
    const cloudName =
      this.configService.get<string>('CLOUDINARY_CLOUD_NAME') ||
      process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey =
      this.configService.get<string>('CLOUDINARY_API_KEY') ||
      process.env.CLOUDINARY_API_KEY;
    const apiSecret =
      this.configService.get<string>('CLOUDINARY_API_SECRET') ||
      process.env.CLOUDINARY_API_SECRET;

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
      this.isCloudinaryReady = true;
      this.logger.log('Cloudinary SDK initialized successfully');
    } else {
      this.logger.warn(
        'Cloudinary credentials not fully configured. Local disk storage fallback will be used.',
      );
    }
  }

  /**
   * Uploads a single file either to Cloudinary or falls back to local disk storage
   */
  async uploadFile(
    file: Express.Multer.File,
    subfolder: string = 'sellers',
  ): Promise<UploadResult> {
    if (!file) {
      throw new Error('No file provided for upload');
    }

    const folder =
      this.configService.get<string>('CLOUDINARY_FOLDER') || 'daymoon_b2b';
    const targetFolder = `${folder}/${subfolder}`;

    if (this.isCloudinaryReady && file.buffer) {
      try {
        const result = await this.uploadToCloudinary(file.buffer, targetFolder);
        return {
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          bytes: result.bytes,
          originalName: file.originalname,
        };
      } catch (error) {
        this.logger.error(
          `Cloudinary upload failed, falling back to local storage: ${(error as Error).message}`,
        );
      }
    }

    // Fallback: save to local uploads directory
    return this.saveToLocalDisk(file, subfolder);
  }

  /**
   * Uploads multiple files concurrently
   */
  async uploadMultipleFiles(
    files: Express.Multer.File[],
    subfolder: string = 'sellers',
  ): Promise<UploadResult[]> {
    if (!files || files.length === 0) return [];
    return Promise.all(files.map((file) => this.uploadFile(file, subfolder)));
  }

  private uploadToCloudinary(
    buffer: Buffer,
    folder: string,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
        },
        (error, result) => {
          if (error || !result) {
            return reject(
              error || new Error('Cloudinary returned empty result'),
            );
          }
          resolve(result);
        },
      );

      uploadStream.end(buffer);
    });
  }

  private saveToLocalDisk(
    file: Express.Multer.File,
    subfolder: string,
  ): UploadResult {
    const uploadRoot = path.join(process.cwd(), 'uploads', subfolder);
    if (!fs.existsSync(uploadRoot)) {
      fs.mkdirSync(uploadRoot, { recursive: true });
    }

    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const filePath = path.join(uploadRoot, uniqueName);

    if (file.buffer) {
      fs.writeFileSync(filePath, file.buffer);
    } else if (file.path && fs.existsSync(file.path)) {
      fs.copyFileSync(file.path, filePath);
    }

    const relativeUrl = `/uploads/${subfolder}/${uniqueName}`;
    return {
      url: relativeUrl,
      originalName: file.originalname,
      bytes: file.size,
    };
  }
}
