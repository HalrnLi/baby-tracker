import {
  Model,
  DataTypes,
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';
import sequelize from '../config/database';
import User from './User';

class Baby extends Model<InferAttributes<Baby>, InferCreationAttributes<Baby>> {
  declare id: CreationOptional<string>;
  declare name: string;
  declare birthDate: Date;
  declare gender: 'male' | 'female';
  declare userId: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Baby.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    birthDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'birth_date',
    },
    gender: {
      type: DataTypes.ENUM('male', 'female'),
      allowNull: false,
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
    tableName: 'babies',
    underscored: true,
  }
);

// Associations
Baby.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Baby, { foreignKey: 'userId', as: 'babies' });

export default Baby;
