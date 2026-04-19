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

export type ReminderType = 'pump' | 'diaper';

class Reminder extends Model<InferAttributes<Reminder>, InferCreationAttributes<Reminder>> {
  declare id: CreationOptional<string>;
  declare babyId: string;
  declare userId: string;
  declare type: ReminderType;
  declare intervalMinutes: number;
  declare enabled: boolean;
  declare lastTriggered: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Reminder.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    babyId: {
      type: DataTypes.UUID,
      allowNull: false,
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
      type: DataTypes.ENUM('pump', 'diaper'),
      allowNull: false,
    },
    intervalMinutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'interval_minutes',
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    lastTriggered: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_triggered',
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
    tableName: 'reminders',
    underscored: true,
  }
);

// Associations
Reminder.belongsTo(Baby, { foreignKey: 'babyId', as: 'baby' });
Reminder.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Baby.hasMany(Reminder, { foreignKey: 'babyId', as: 'reminders' });
User.hasMany(Reminder, { foreignKey: 'userId', as: 'reminders' });

export default Reminder;
