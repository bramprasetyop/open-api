import {
  AllowNull,
  Column,
  DataType,
  Default,
  Model,
  Table
} from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';

@Table({
  tableName: 'openApiAuth',
  timestamps: true
})
export class OpenApi extends Model<OpenApi> {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: () => uuidv4(),
    allowNull: false
  })
  id: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'company_name'
  })
  companyName: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'private_key'
  })
  privateKey: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'public_key'
  })
  publicKey: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  })
  isActive: boolean;

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column({
    type: DataType.DATE,
    field: 'created_at'
  })
  createdAt: Date;

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column({
    type: DataType.DATE,
    field: 'updated_at'
  })
  updatedAt: Date;
}
