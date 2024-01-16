export interface IDatabaseConfigAttributes {
  username?: string;
  password?: string;
  database?: string;
  host?: string;
  port?: number | string;
  dialect?: string;
  urlDatabase?: string;
  dialectOptions?: object;
}

export interface IDatabaseConfig {
  db: IDatabaseConfigAttributes;
}
