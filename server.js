const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

// Middleware para permitir CORS
app.use(cors());

// Configuração do body-parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Conectar ao banco de dados SQLite para usuários
const db = new sqlite3.Database('./users.db', (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err.message);
  } else {
    console.log('Banco de dados conectado!');
  }
});

// Conectar ao banco de dados SQLite para "Outros"
const dbOthers = new sqlite3.Database('./others.db', (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados de "Outros":', err.message);
  } else {
    console.log('Banco de dados de "Outros" conectado!');
  }
});

// Criar tabelas (se não existirem) no banco de dados de usuários
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      message TEXT NOT NULL
    )
  `);
});

// Criar tabela para "Outros" (se não existir)
dbOthers.serialize(() => {
  dbOthers.run(`
    CREATE TABLE IF NOT EXISTS others (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      message TEXT NOT NULL
    )
  `);
});

// Rota de login (POST) - verificar as credenciais
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Consultar banco de dados para verificar se o usuário existe
  db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
    if (err) {
      return res.status(500).send('Erro no banco de dados');
    }
    if (!row) {
      return res.status(400).send('Usuário não encontrado');
    }

    // Comparar a senha com a criptografada no banco
    bcrypt.compare(password, row.password, (err, result) => {
      if (err) {
        return res.status(500).send('Erro ao verificar a senha');
      }

      if (result) {
        // Se a senha for válida, retorna um sucesso
        res.json({ message: 'Login bem-sucedido!' });
      } else {
        // Se a senha for inválida
        res.status(400).send('Senha incorreta');
      }
    });
  });
});

// Rota de cadastro (POST) - criar um novo usuário
app.post('/cadastro', (req, res) => {
  const { email, password } = req.body;

  // Verificar se o usuário já existe
  db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
    if (err) {
      return res.status(500).send('Erro ao verificar o banco de dados');
    }
    if (row) {
      return res.status(400).send('Usuário já existe');
    }

    // Criptografar a senha
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        return res.status(500).send('Erro ao criptografar a senha');
      }

      // Inserir o novo usuário no banco de dados
      db.run('INSERT INTO users (email, password) VALUES (?, ?)', [email, hashedPassword], function(err) {
        if (err) {
          return res.status(500).send('Erro ao criar usuário');
        }
        res.status(201).json({ message: 'Usuário criado com sucesso' });
      });
    });
  });
});

// Rota de Fale Conosco (POST) - salvar mensagem no banco de dados
app.post('/fale-conosco', (req, res) => {
  const { name, email, message } = req.body;

  // Verificar se todos os campos foram preenchidos
  if (!name || !email || !message) {
    return res.status(400).send('Todos os campos são obrigatórios');
  }

  // Inserir a mensagem no banco de dados
  db.run('INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)', [name, email, message], function(err) {
    if (err) {
      return res.status(500).send('Erro ao salvar a mensagem');
    }
    res.status(201).json({ message: 'Mensagem enviada com sucesso' });
  });
});

// Rota de "Outros" (POST) - salvar mensagem no banco de dados "Outros"
app.post('/outros', (req, res) => {
  const { name, email, message } = req.body;

  // Verificar se todos os campos foram preenchidos
  if (!name || !email || !message) {
    return res.status(400).send('Todos os campos são obrigatórios');
  }

  // Inserir a mensagem no banco de dados "Outros" (usar dbOthers)
  dbOthers.run('INSERT INTO others (name, email, message) VALUES (?, ?, ?)', [name, email, message], function(err) {
    if (err) {
      return res.status(500).send('Erro ao salvar a mensagem');
    }
    res.status(201).json({ message: 'Mensagem enviada com sucesso para a página outros' });
  });
});

// Iniciar o servidor na porta 3001
app.listen(3001, () => {
  console.log('Servidor backend rodando em http://localhost:3001');
});
