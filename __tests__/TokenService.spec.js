import { describe, expect, test, jest } from '@jest/globals';

import sequelize from '../src/config/db.js';
import Token from '../src/models/Token.js';
import { scheduledCleanup } from '../src/routes/TokenService.js';

beforeAll(async () => {
    await sequelize.sync();
});

beforeEach(async () => {
    await Token.destroy({ truncate: true });
});

describe('Scheduled Token CleanUp', () => {
    it('clears the expired token with scheduled task', async () => {
        jest.useFakeTimers();
        const token = 'test-token';
        const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);

        await Token.create({
            token: token,
            lastUsedAt: eightDaysAgo,
        });

        scheduledCleanup();

        jest.advanceTimersByTime(60 * 60 * 1000 + 5000);

        const tokenInDB = await Token.findOne({ where: { token: token } });

        expect(tokenInDB).toBeNull();
    });
});
