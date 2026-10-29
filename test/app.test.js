const request = require('supertest');
const app = require('../server');

describe('Testes de Integração e Rota de Healthcheck', () => {
  it('Deve retornar status 200 no endpoint /health', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status', 'UP');
  });

  it('Deve responder em JSON no endpoint /health', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });

  it('Deve retornar 404 para rotas inexistentes', async () => {
    const res = await request(app).get('/rota-que-nao-existe');
    expect(res.statusCode).toEqual(404);
  });
});
