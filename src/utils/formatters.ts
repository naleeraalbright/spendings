export function formatCurrency(amount: number, currency = 'UGX'): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  
  // For UGX, if whole number, show without decimals; if has decimals, show 2 decimals
  const hasDecimals = absAmount % 1 !== 0;
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(absAmount);

  const prefix = currency.length > 1 ? `${currency} ` : currency;
  return isNegative ? `-${prefix}${formatted}` : `${prefix}${formatted}`;
}

export function formatDate(dateString: string): string {
  try {
    const [year, month, day] = dateString.split('-');
    if (!year || !month || !day) return dateString;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string, timeString?: string, createdAt?: number): string {
  try {
    if (createdAt) {
      const d = new Date(createdAt);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
    }
    const [year, month, day] = dateString.split('-');
    if (!year || !month || !day) return dateString;
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    const formattedDate = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(d);
    return timeString ? `${formattedDate}, ${timeString}` : formattedDate;
  } catch {
    return dateString;
  }
}

export function formatMonthName(yearMonth: string): string {
  try {
    const [year, month] = yearMonth.split('-');
    const d = new Date(Number(year), Number(month) - 1, 1);
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return yearMonth;
  }
}
