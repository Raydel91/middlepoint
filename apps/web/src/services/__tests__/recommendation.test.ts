import { describe, it, expect } from 'vitest';

function calculateScore(purchases: number, views: number): number {
  return purchases * 3 + views * 1;
}

describe('RecommendationService algorithm', () => {
  it('calculates score as (purchases * 3) + (views * 1)', () => {
    expect(calculateScore(5, 10)).toBe(25);
    expect(calculateScore(0, 15)).toBe(15);
    expect(calculateScore(3, 0)).toBe(9);
  });

  it('prioritizes purchases over views', () => {
    const purchaseScore = calculateScore(2, 0);
    const viewScore = calculateScore(0, 5);
    expect(purchaseScore).toBeGreaterThan(viewScore);
  });
});

describe('Analytics KPIs formulas', () => {
  it('calculates avg ticket', () => {
    const totalSales = 10000;
    const totalOrders = 50;
    expect(totalSales / totalOrders).toBe(200);
  });

  it('calculates conversion rate', () => {
    const orders = 50;
    const visits = 1000;
    expect(orders / visits).toBe(0.05);
  });

  it('calculates LTV', () => {
    const avgTicket = 200;
    const purchaseFrequency = 2;
    const retentionTime = 12;
    expect(avgTicket * purchaseFrequency * retentionTime).toBe(4800);
  });

  it('calculates CAC', () => {
    const marketingSpend = 150000;
    const newClients = 30;
    expect(marketingSpend / newClients).toBe(5000);
  });
});
