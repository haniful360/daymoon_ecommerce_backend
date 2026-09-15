import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client!: RedisClientType;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('REDIS_HOST') || 'localhost';
    const port = parseInt(
      this.configService.get<string>('REDIS_PORT') || '6379',
      10,
    );
    const username =
      this.configService.get<string>('REDIS_USERNAME') || 'default';
    const password = this.configService.get<string>('REDIS_PASSWORD') || '';

    this.client = createClient({
      username,
      password,
      socket: {
        host,
        port,
        reconnectStrategy: (retries) => {
          if (retries > 5) {
            this.logger.warn('Redis reconnect retry limit reached');
            return false;
          }
          return Math.min(retries * 500, 3000);
        },
      },
    }) as RedisClientType;

    this.client.on('error', (err) => {
      this.logger.error('Redis Client Error:', err?.message || err);
    });
  }

  async onModuleInit() {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
        this.logger.log('Connected to Redis Cloud successfully');
      }
    } catch (error) {
      this.logger.error('Failed to connect to Redis', error);
    }
  }

  async onModuleDestroy() {
    try {
      if (this.client && this.client.isOpen) {
        await this.client.disconnect();
        this.logger.log('Disconnected from Redis');
      }
    } catch (error) {
      this.logger.error('Error disconnecting from Redis', error);
    }
  }

  /**
   * Get value by key
   */
  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  /**
   * Set key-value with optional TTL in seconds
   */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds && ttlSeconds > 0) {
      await this.client.set(key, value, { EX: ttlSeconds });
    } else {
      await this.client.set(key, value);
    }
  }

  /**
   * Delete key
   */
  async del(key: string): Promise<number> {
    return this.client.del(key);
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const res = await this.client.exists(key);
    return res > 0;
  }

  /**
   * Raw Redis client for advanced operations
   */
  getClient(): RedisClientType {
    return this.client;
  }
}
