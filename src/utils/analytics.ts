export function calculateGrowth(policies: any[], claims: any[]) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const previousDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonth = previousDate.getMonth();
  const previousYear = previousDate.getFullYear();

  let incomeCurrent = 0;
  let incomePrevious = 0;

  policies.forEach(p => {
    const d = new Date(p.createdAt || new Date());
    if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
      incomeCurrent += Number(p.premium) || 0;
    } else if (d.getMonth() === previousMonth && d.getFullYear() === previousYear) {
      incomePrevious += Number(p.premium) || 0;
    }
  });

  let claimsCurrent = 0;
  let claimsPrevious = 0;

  claims.forEach(c => {
    const amount = Number(c.amount) || 0;
    const d = new Date(c.date || new Date());
    if (d.getMonth() === currentMonth && d.getFullYear() === currentYear && c.status === 'approved') {
      claimsCurrent += amount;
    } else if (d.getMonth() === previousMonth && d.getFullYear() === previousYear && c.status === 'approved') {
      claimsPrevious += amount;
    }
  });

  const profitCurrent = incomeCurrent - claimsCurrent;
  const profitPrevious = incomePrevious - claimsPrevious;

  const calculatePercentage = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / Math.abs(previous)) * 100;
  };

  return {
    income: {
      current: incomeCurrent,
      previous: incomePrevious,
      growth: calculatePercentage(incomeCurrent, incomePrevious),
      isPositive: incomeCurrent >= incomePrevious,
    },
    claims: {
      current: claimsCurrent,
      previous: claimsPrevious,
      growth: calculatePercentage(claimsCurrent, claimsPrevious),
      isPositive: claimsCurrent >= claimsPrevious,
    },
    profit: {
      current: profitCurrent,
      previous: profitPrevious,
      growth: calculatePercentage(profitCurrent, profitPrevious),
      isPositive: profitCurrent >= profitPrevious,
    }
  };
}

export function getTopPerformingPolicyType(policies: any[]) {
  const typePremiums: Record<string, number> = {};
  let totalPremium = 0;

  policies.forEach(p => {
    const premium = Number(p.premium) || 0;
    if (premium > 0) {
      typePremiums[p.type] = (typePremiums[p.type] || 0) + premium;
      totalPremium += premium;
    }
  });

  if (totalPremium === 0) return null;

  let topType = '';
  let maxPremium = -1;

  for (const [type, premium] of Object.entries(typePremiums)) {
    if (premium > maxPremium) {
      maxPremium = premium;
      topType = type;
    }
  }

  return {
    type: topType,
    premium: maxPremium,
    percentage: (maxPremium / totalPremium) * 100
  };
}

export function getMostClaimedCategory(policies: any[], claims: any[]) {
  const policyTypeMap: Record<string, string> = {};
  policies.forEach(p => {
    policyTypeMap[p.id] = p.type;
  });

  const typeClaimsCount: Record<string, number> = {};
  let totalClaims = 0;

  claims.forEach(c => {
    const type = policyTypeMap[c.policyId];
    if (type) {
      typeClaimsCount[type] = (typeClaimsCount[type] || 0) + 1;
      totalClaims++;
    }
  });

  if (totalClaims === 0) return null;

  let topType = '';
  let maxCount = -1;

  for (const [type, count] of Object.entries(typeClaimsCount)) {
    if (count > maxCount) {
      maxCount = count;
      topType = type;
    }
  }

  return {
    type: topType,
    count: maxCount,
    percentage: (maxCount / totalClaims) * 100
  };
}
