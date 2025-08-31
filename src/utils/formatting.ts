/**
 * Formatting Utilities
 * Common formatting functions for analytics dashboard
 */

/**
 * Format numbers with appropriate suffixes (K, M, B)
 */
export function formatNumber(num: number): string {
  if (num === 0) return '0';
  
  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  
  if (absNum >= 1000000000) {
    return sign + (absNum / 1000000000).toFixed(1) + 'B';
  } else if (absNum >= 1000000) {
    return sign + (absNum / 1000000).toFixed(1) + 'M';
  } else if (absNum >= 1000) {
    return sign + (absNum / 1000).toFixed(1) + 'K';
  } else if (absNum >= 100) {
    return sign + absNum.toFixed(0);
  } else {
    return sign + absNum.toFixed(1);
  }
}

/**
 * Format currency values
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: amount >= 1000 ? 0 : 2,
    maximumFractionDigits: amount >= 1000 ? 0 : 2
  }).format(amount);
}

/**
 * Format percentages
 */
export function formatPercentage(value: number, decimals: number = 0): string {
  const percentage = value > 1 ? value : value * 100;
  return `${percentage.toFixed(decimals)}%`;
}

/**
 * Format duration from seconds to human readable format
 */
export function formatDuration(seconds: number): string {
  if (seconds === 0) return '0s';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  const parts: string[] = [];
  
  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  
  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }
  
  if (remainingSeconds > 0 && hours === 0) {
    parts.push(`${Math.round(remainingSeconds)}s`);
  }
  
  return parts.join(' ') || '0s';
}

/**
 * Format time ago (relative time)
 */
export function formatTimeAgo(date: string | Date): string {
  const now = new Date();
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  } else {
    const years = Math.floor(diffInSeconds / 31536000);
    return `${years} year${years > 1 ? 's' : ''} ago`;
  }
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date, format: 'short' | 'long' | 'full' = 'short'): string {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  
  switch (format) {
    case 'short':
      return targetDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    case 'long':
      return targetDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    case 'full':
      return targetDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    default:
      return targetDate.toLocaleDateString();
  }
}

/**
 * Format bytes to human readable format
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Format change indicators with color
 */
export function formatChange(value: number): {
  formatted: string;
  isPositive: boolean;
  isNeutral: boolean;
} {
  const isPositive = value > 0;
  const isNeutral = value === 0;
  const formatted = `${isPositive ? '+' : ''}${value.toFixed(1)}%`;
  
  return {
    formatted,
    isPositive,
    isNeutral
  };
}

/**
 * Format rate (events per time unit)
 */
export function formatRate(rate: number, unit: 'second' | 'minute' | 'hour' | 'day' = 'hour'): string {
  return `${rate.toFixed(1)}/${unit}`;
}

/**
 * Format scores (0-5 or 0-100 scale)
 */
export function formatScore(score: number, scale: 5 | 100 = 5): string {
  if (scale === 5) {
    return `${score.toFixed(1)}/5`;
  } else {
    return `${Math.round(score)}/100`;
  }
}

/**
 * Format metric with trend indicator
 */
export function formatMetricWithTrend(
  value: number,
  change: number,
  formatter: (val: number) => string = formatNumber
): {
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  changeClass: string;
} {
  const formattedValue = formatter(value);
  const changeInfo = formatChange(change);
  
  let trend: 'up' | 'down' | 'neutral';
  let changeClass: string;
  
  if (changeInfo.isNeutral) {
    trend = 'neutral';
    changeClass = 'text-muted-foreground';
  } else if (changeInfo.isPositive) {
    trend = 'up';
    changeClass = 'text-green-600';
  } else {
    trend = 'down';
    changeClass = 'text-red-600';
  }
  
  return {
    value: formattedValue,
    change: changeInfo.formatted,
    trend,
    changeClass
  };
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Format confidence score
 */
export function formatConfidence(confidence: number): {
  percentage: string;
  level: 'low' | 'medium' | 'high';
  color: string;
} {
  const percentage = formatPercentage(confidence);
  
  let level: 'low' | 'medium' | 'high';
  let color: string;
  
  if (confidence >= 0.8) {
    level = 'high';
    color = 'text-green-600';
  } else if (confidence >= 0.6) {
    level = 'medium';
    color = 'text-yellow-600';
  } else {
    level = 'low';
    color = 'text-red-600';
  }
  
  return { percentage, level, color };
}