const { Sequelize } = require('sequelize');

// Configuração do Sequelize para SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite', // Caminho para o arquivo SQLite
  logging: false, // Desative logs (opcional)
});

// Testar a conexão
sequelize.authenticate()
  .then(() => console.log('Conexão com o banco de dados foi estabelecida com sucesso.'))
  .catch((err) => console.error('Não foi possível conectar ao banco de dados:', err));

module.exports = sequelize;
