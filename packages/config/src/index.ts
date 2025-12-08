import { DynamicModule, Global, Module } from '@nestjs/common';
import dotenv from 'dotenv';

dotenv.config();

export interface ConfigModuleOptions {
  serviceName: string;
}

@Global()
@Module({})
export class ConfigModule {
  static register(options: ConfigModuleOptions): DynamicModule {
    return {
      module: ConfigModule,
      providers: [
        {
          provide: 'SERVICE_NAME',
          useValue: options.serviceName
        },
        {
          provide: 'ENV',
          useValue: process.env
        }
      ],
      exports: ['SERVICE_NAME', 'ENV']
    };
  }
}
