const express = require('express');
const { Pool } = require('pg');

const app = express();
//verificar a porta a ser utilizada com o professor
const port = 8080;

// Configuração de conexão com o banco (usando variáveis de ambiente)
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: 5432,
});

app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.send(`<h1>Comunicação com sucesso!</h1><p>Data do Banco de Dados: ${result.rows[0].now}</p>`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao conectar no banco de dados. Tente atualizar a página em alguns segundos.');
  }
});

app.listen(port, () => {
  console.log(`App rodando na porta ${port}`);
});
