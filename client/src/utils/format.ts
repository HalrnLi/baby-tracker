export function formatRecordTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function toLocalDateTimeString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

export function getRecordIcon(type: string): string {
  switch (type) {
    case 'feed': return '🍼';
    case 'pump': return '🧴';
    case 'diaper': return '🩲';
    case 'weight': return '📊';
    default: return '📝';
  }
}

export function getRecordLabel(type: string, data: any): string {
  switch (type) {
    case 'feed': {
      const sourceMap: Record<string, string> = { breast: '母乳', formula: '奶粉' };
      const sourceLabel = sourceMap[data.source] || data.source;
      if (data.source === 'breast' || !data.amount) return sourceLabel;
      return `${sourceLabel} ${data.amount}ml`;
    }
    case 'pump': {
      return `${data.amount}ml`;
    }
    case 'diaper': {
      const typeMap: Record<string, string> = { pee: '小便', poop: '大便', both: '大小便' };
      return typeMap[data.type] || '换尿布';
    }
    case 'weight': {
      return `${data.weightKg} kg`;
    }
    default:
      return '';
  }
}
