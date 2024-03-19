import { Partner } from '@src/open-api/entity/openApi.entity';
import { Sequelize } from 'sequelize-typescript';

import { SEQUELIZE } from '../constants';
import { databaseConfig } from './database.config';

export const databaseProviders = [
  {
    provide: SEQUELIZE,
    useFactory: async () => {
      let config;
      switch (process.env.NODE_ENV) {
        default:
          config = databaseConfig.db;
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
      sequelize.addModels([Partner]);
      // uncomment for auto syncronize
      // await sequelize.sync();
      return sequelize;
    }
  }
];
