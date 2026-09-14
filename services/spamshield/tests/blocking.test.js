/**
 * SpamShield API Tests
 */

const request = require('supertest');
const app = require('../src/server');

describe('SpamShield API', () => {
  describe('Health Check', () => {
    it('should return health status', async () => {
      const res = await request(app)
        .get('/health')
        .expect(200);
      
      expect(res.body.status).toBe('healthy');
      expect(res.body).toHaveProperty('timestamp');
    });
  });

  describe('Check Phone Number', () => {
    it('should check a phone number', async () => {
      const res = await request(app)
        .post('/api/v1/check')
        .set('X-API-Key', 'demo_key')
        .send({
          phoneNumber: '+1234567890',
          context: 'call'
        })
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('phoneNumber');
      expect(res.body.data).toHaveProperty('score');
      expect(res.body.data).toHaveProperty('level');
    });

    it('should require phoneNumber', async () => {
      const res = await request(app)
        .post('/api/v1/check')
        .set('X-API-Key', 'demo_key')
        .send({ context: 'call' })
        .expect(400);
      
      expect(res.body.error).toBe('Validation Error');
    });

    it('should require API key', async () => {
      await request(app)
        .post('/api/v1/check')
        .send({ phoneNumber: '+1234567890' })
        .expect(401);
    });
  });

  describe('Statistics', () => {
    it('should get statistics', async () => {
      const res = await request(app)
        .get('/api/v1/stats')
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('total_numbers');
    });

    it('should get top offenders', async () => {
      const res = await request(app)
        .get('/api/v1/stats/top-offenders?limit=10')
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('offenders');
    });
  });

  describe('API Documentation', () => {
    it('should return API docs', async () => {
      const res = await request(app)
        .get('/api/docs')
        .expect(200);
      
      expect(res.body).toHaveProperty('name');
      expect(res.body).toHaveProperty('endpoints');
    });
  });
});