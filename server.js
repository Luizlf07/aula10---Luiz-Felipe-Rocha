const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 8080;

// Configuração de conexão com o banco (usando variáveis de ambiente)
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT) || 5432,
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

// Rota de Healthcheck exigida pelos testes de integração
// CORREÇÃO: o teste espera { status: 'UP' } (o original devolvia 'OK' e quebrava o CI)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

// Inicia o servidor apenas se o arquivo for executado diretamente (ex: node server.js)
if (require.main === module) {
  app.listen(port, () => {
    console.log(`App rodando na porta ${port}`);
  });
}

// Exporta o aplicativo Express para ser importado pelo Supertest nos testes
module.exports = app;
