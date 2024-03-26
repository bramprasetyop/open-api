export const SEQUELIZE = 'SEQUELIZE';
export const OPEN_API_REPOSITORY = 'OPEN_API_REPOSITORY';
export const KAFKA_CONFIG = {
  clientId: 'open-api-kafka',
  broker: 'kafka:9092',
  groupId: 'open-api-consumer',
  connectionTimeout: 3000,
  authenticationTimeout: 1000,
  reauthenticationThreshold: 10000
};
