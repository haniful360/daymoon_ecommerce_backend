import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'UP',
      service: 'Daymoon B2B Marketplace & Factory Sourcing API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}
