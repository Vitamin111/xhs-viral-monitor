export function formatNumber(value: number): string {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(1)}w`;
  }

  return value.toLocaleString('zh-CN');
}

export function levelLabel(level: string): string {
  switch (level) {
    case 'VIRAL':
      return '爆款';
    case 'POTENTIAL':
      return '潜力';
    default:
      return '普通';
  }
}
