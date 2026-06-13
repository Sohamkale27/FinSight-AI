const MONTH_LABELS = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const SHORT_MONTH_LABELS = new Intl.DateTimeFormat("en-US", {
  month: "short",
  timeZone: "UTC",
});

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const CATEGORY_COLORS = [
  "#4f8cff",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#22d3ee",
  "#f59e0b",
  "#f97316",
  "#ec4899",
];

function formatCurrency(value) {
  return CURRENCY_FORMATTER.format(Number(value) || 0);
}

function formatPercent(value) {
  return `${Math.round(Number(value) || 0)}%`;
}

function createUtcDate(year, month, day = 1) {
  return new Date(Date.UTC(year, month, day));
}

function getMonthKey(date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(date) {
  return MONTH_LABELS.format(date);
}

function getShortMonthLabel(date) {
  return SHORT_MONTH_LABELS.format(date);
}

function buildMonthWindows(monthCount = 6, anchorDate = new Date()) {
  const anchor = createUtcDate(anchorDate.getUTCFullYear(), anchorDate.getUTCMonth(), 1);
  const windows = [];

  for (let offset = monthCount - 1; offset >= 0; offset -= 1) {
    const monthStart = createUtcDate(anchor.getUTCFullYear(), anchor.getUTCMonth() - offset, 1);
    const nextMonthStart = createUtcDate(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 1);

    windows.push({
      key: getMonthKey(monthStart),
      label: getMonthLabel(monthStart),
      shortLabel: getShortMonthLabel(monthStart),
      start: monthStart,
      end: nextMonthStart,
    });
  }

  return windows;
}

function normalizeCategory(category) {
  return typeof category === "string" ? category.trim().toLowerCase() : "";
}

function createEmptyMonthBucket(window) {
  return {
    key: window.key,
    label: window.label,
    shortLabel: window.shortLabel,
    income: 0,
    expense: 0,
    cashFlow: 0,
  };
}

function buildAnalyticsPayload(transactions = []) {
  const monthWindows = buildMonthWindows(6);
  const monthBuckets = monthWindows.map(createEmptyMonthBucket);
  const monthBucketByKey = new Map(monthBuckets.map((bucket) => [bucket.key, bucket]));
  const categoryStats = new Map();

  let totalIncome = 0;
  let totalExpenses = 0;
  let latestTransactionDate = null;

  for (const transaction of transactions) {
    const amount = Number(transaction.amount) || 0;
    const type = transaction.type === "income" ? "income" : "expense";
    const categoryKey = normalizeCategory(transaction.category);
    const categoryLabel = typeof transaction.category === "string" && transaction.category.trim()
      ? transaction.category.trim()
      : "Uncategorized";
    const date = transaction.createdAt instanceof Date ? transaction.createdAt : new Date(transaction.createdAt);
    const monthKey = getMonthKey(date);
    const monthBucket = monthBucketByKey.get(monthKey);

    if (type === "income") {
      totalIncome += amount;
    } else {
      totalExpenses += amount;
    }

    if (monthBucket) {
      monthBucket[type] += amount;
    }

    if (categoryKey) {
      const currentCategory = categoryStats.get(categoryKey) || {
        key: categoryKey,
        label: categoryLabel,
        total: 0,
        expense: 0,
        income: 0,
        currentMonthExpense: 0,
        previousMonthExpense: 0,
      };

      currentCategory.label = currentCategory.label || categoryLabel;
      currentCategory.total += amount;
      currentCategory[type] += amount;

      if (monthBucket) {
        if (monthKey === monthBuckets[monthBuckets.length - 1].key && type === "expense") {
          currentCategory.currentMonthExpense += amount;
        }

        if (monthKey === monthBuckets[monthBuckets.length - 2].key && type === "expense") {
          currentCategory.previousMonthExpense += amount;
        }
      }

      categoryStats.set(categoryKey, currentCategory);
    }

    if (!latestTransactionDate || date > latestTransactionDate) {
      latestTransactionDate = date;
    }
  }

  for (const bucket of monthBuckets) {
    bucket.cashFlow = bucket.income - bucket.expense;
  }

  const currentMonthBucket = monthBuckets[monthBuckets.length - 1] || createEmptyMonthBucket(monthWindows[0] || {
    key: "",
    label: "Current month",
    shortLabel: "Current",
  });
  const previousMonthBucket = monthBuckets[monthBuckets.length - 2] || createEmptyMonthBucket(monthWindows[0] || {
    key: "",
    label: "Previous month",
    shortLabel: "Prev",
  });

  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
  const currentMonthCashFlow = currentMonthBucket.cashFlow;
  const averageMonthlyExpense = monthBuckets.length > 0 ? totalExpenses / monthBuckets.length : 0;
  const expenseDelta = previousMonthBucket.expense > 0
    ? ((currentMonthBucket.expense - previousMonthBucket.expense) / previousMonthBucket.expense) * 100
    : null;

  const expenseCategories = Array.from(categoryStats.values())
    .filter((item) => item.expense > 0)
    .sort((left, right) => right.expense - left.expense)
    .map((item, index) => {
      const share = totalExpenses > 0 ? (item.expense / totalExpenses) * 100 : 0;

      return {
        label: item.label,
        value: item.expense,
        share,
        color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
      };
    });

  const incomeVsExpense = {
    labels: monthBuckets.map((bucket) => bucket.shortLabel),
    series: [
      {
        label: "Income",
        color: CATEGORY_COLORS[0],
        values: monthBuckets.map((bucket) => bucket.income),
      },
      {
        label: "Expenses",
        color: CATEGORY_COLORS[2],
        values: monthBuckets.map((bucket) => bucket.expense),
      },
    ],
  };

  const monthlySpendingTrend = {
    labels: monthBuckets.map((bucket) => bucket.shortLabel),
    values: monthBuckets.map((bucket) => bucket.expense),
  };

  const topCategory = expenseCategories[0] || null;
  const topCategoryMonthly = topCategory
    ? Array.from(categoryStats.values()).find((item) => item.label === topCategory.label)
    : null;

  const insights = [];

  if (topCategory) {
    insights.push(`${topCategory.label} represents ${formatPercent(topCategory.share)} of your expenses.`);
  } else {
    insights.push("No expense categories are available yet. Add an expense to unlock category insights.");
  }

  if (topCategoryMonthly && topCategoryMonthly.previousMonthExpense > 0) {
    const categoryDelta = ((topCategoryMonthly.currentMonthExpense - topCategoryMonthly.previousMonthExpense) / topCategoryMonthly.previousMonthExpense) * 100;
    const direction = categoryDelta >= 0 ? "increased" : "decreased";
    insights.push(
      `${topCategoryMonthly.label} spending ${direction} ${Math.abs(Math.round(categoryDelta))}% compared to last month.`,
    );
  } else if (expenseDelta !== null) {
    const direction = expenseDelta >= 0 ? "increased" : "decreased";
    insights.push(
      `Total spending ${direction} ${Math.abs(Math.round(expenseDelta))}% compared to last month.`,
    );
  } else if (currentMonthBucket.expense > 0) {
    insights.push(`Current month expenses total ${formatCurrency(currentMonthBucket.expense)}.`);
  } else {
    insights.push("No spending recorded in the current month yet.");
  }

  insights.push(`Average monthly expense over the last ${monthBuckets.length} months is ${formatCurrency(averageMonthlyExpense)}.`);

  if (savingsRate > 0) {
    const savingsMessage = savingsRate >= 20
      ? `Your savings rate is ${Math.round(savingsRate)}%, which is above average.`
      : `Your savings rate is ${Math.round(savingsRate)}%. Consider targeting at least 20% to build a stronger buffer.`;
    insights.push(savingsMessage);
  } else if (totalIncome > 0) {
    insights.push("Your expenses currently exceed income. Review the highest spending categories to recover margin.");
  } else {
    insights.push("Add income transactions to unlock savings analysis and cash flow recommendations.");
  }

  if (currentMonthCashFlow < 0) {
    insights.push(`Budget warning: current month cash flow is ${formatCurrency(currentMonthCashFlow)}, so expenses are outpacing income.`);
  } else if (topCategory && topCategory.share >= 30) {
    insights.push(`Budget warning: ${topCategory.label} is absorbing ${formatPercent(topCategory.share)} of all expenses.`);
  } else if (averageMonthlyExpense > 0) {
    insights.push(`Your current monthly spending average is ${formatCurrency(averageMonthlyExpense)}. Use category caps to keep it steady.`);
  }

  const summary = {
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,
    savingsRate,
    monthlyCashFlow: currentMonthCashFlow,
    currentMonthLabel: currentMonthBucket.label,
    previousMonthLabel: previousMonthBucket.label,
    latestTransactionDate,
  };

  return {
    summary,
    charts: {
      expenseByCategory: expenseCategories,
      incomeVsExpense,
      monthlySpendingTrend,
    },
    insights,
  };
}

module.exports = {
  buildAnalyticsPayload,
  formatCurrency,
};
