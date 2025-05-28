const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Tag = require('./Tag');

const Content = sequelize.define('Content', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isUrl: true
    }
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isArchived: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

// Define associations
Content.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Content, { foreignKey: 'userId' });

// Many-to-many relationship with tags
Content.belongsToMany(Tag, { through: 'ContentTags' });
Tag.belongsToMany(Content, { through: 'ContentTags' });

module.exports = Content;