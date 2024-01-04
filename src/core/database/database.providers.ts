import { OpenApi } from '@src/open-api/entity/openApi.entity';
import { Sequelize } from 'sequelize-typescript';

import { DEVELOPMENT, PRODUCTION, SEQUELIZE, TEST } from '../constants';
import { databaseConfig } from './database.config';

export const databaseProviders = [
  {
    provide: SEQUELIZE,
    useFactory: async () => {
      let config;
      switch (process.env.NODE_ENV) {
        case DEVELOPMENT:
          config = databaseConfig.development;
          break;
        case TEST:
          config = databaseConfig.test;
          break;
        case PRODUCTION:
          config = databaseConfig.production;
          break;
        default:
          config = databaseConfig.development;
      }
      const sequelize = new Sequelize(config);
      // Environment-specific configurations
      if (process.env.NODE_ENV === 'production') {
        // Disable SQL query logging in production
        sequelize.options.logging = false;

        // Connection pooling settings
        sequelize.options.pool = {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        };
      }
      sequelize.addModels([OpenApi]);

      // Enable synchronization
      // await sequelize.sync({ force: false }); // Set force to true if you want to drop and recreate tables

      return sequelize;
    }
  }
];
