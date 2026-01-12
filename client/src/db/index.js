import { Sequelize } from 'sequelize';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite', // El archivo SQLite se creará en la raíz del proyecto
  logging: false
});

module.exports = sequelize;