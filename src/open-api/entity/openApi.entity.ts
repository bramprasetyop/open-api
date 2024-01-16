import {
  AllowNull,
  Column,
  DataType,
  Default,
  Model,
  Table
} from 'sequelize-typescript';

@Table({
  tableName: 'm_oauth_key',
  timestamps: false
})
export class MOAuthKey extends Model<MOAuthKey> {
  @Default(DataType.BIGINT)
  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
    field: 'id'
  })
  id: number;

  @Column({
    type: DataType.STRING(225),
    allowNull: false,
    field: 'client_id'
  })
  clientId: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    field: 'name'
  })
  name: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'private_key'
  })
  privateKey: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'public_key'
  })
  publicKey: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    field: 'grant_type'
  })
  grantType: string;

  @Column({
    type: DataType.STRING(15),
    allowNull: false,
    field: 'created_by'
  })
  createdBy: string;

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column({
    type: DataType.DATE,
    field: 'created_date'
  })
  createdDate: Date;

  @Column({
    type: DataType.STRING(15),
    allowNull: false,
    field: 'modified_by'
  })
  modifiedBy: string;

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column({
    type: DataType.DATE,
    field: 'modified_date'
  })
  modifiedDate: Date;

  @Column({
    type: DataType.CHAR(1),
    allowNull: false,
    field: 'is_active'
  })
  isActive: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'public_key_bank'
  })
  publicKeyBank: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'private_key_bank'
  })
  privateKeyBank: string;

  @Column({
    type: DataType.STRING(255),
    field: 'client_id_bank'
  })
  clientIdBank: string;
}
