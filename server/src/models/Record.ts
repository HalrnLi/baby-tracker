import {
  Model,
  DataTypes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';
import sequelize from '../config/database';
import Baby from './Baby';
import User from './User';

export type RecordType = 'feed' | 'pump' | 'diaper' | 'weight';

export interface FeedData {
  amount: number;
  source: 'breast' | 'formula';
  time?: string;
}

export interface PumpData {
  amount: number;
  side: 'left' | 'right' | 'both';
  time?: string;
}

export interface DiaperData {
  type: 'pee' | 'poop' | 'both';
}

export interface WeightData {
  weightKg: number;
  date?: string;
}

export type RecordData = FeedData | PumpData | DiaperData | WeightData;

class Record extends Model<InferAttributes<Record>, InferCreationAttributes<Record>> {
  declare id: CreationOptional<string>;
  declare babyId: string;
  declare userId: string;
  declare type: RecordType;
  declare data: RecordData;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Record.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    babyId: {
      type: DataTypes.UUID,
      allowNull: true, // pump records don't need babyId
      field: 'baby_id',
      references: {
        model: 'babies',
        key: 'id',
      },
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    type: {
      type: DataTypes.ENUM('feed', 'pump', 'diaper', 'weight'),
      allowNull: false,
    },
    data: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    tableName: 'records',
    underscored: true,
  }
);

// Associations
Record.belongsTo(Baby, { foreignKey: 'babyId', as: 'baby' });
Record.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Baby.hasMany(Record, { foreignKey: 'babyId', as: 'records' });
User.hasMany(Record, { foreignKey: 'userId', as: 'records' });

export default Record;
