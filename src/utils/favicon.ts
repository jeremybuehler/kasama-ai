// Kasama brand favicon generator
export const generateKasamaFavicon = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return '';
  
  // Create gradient background
  const gradient = ctx.createLinearGradient(0, 0, 32, 32);
  gradient.addColorStop(0, '#E6B2BA');
  gradient.addColorStop(0.5, '#7E55B1');
  gradient.addColorStop(1, '#5D3587');
  
  // Draw rounded square background
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.roundRect(0, 0, 32, 32, 8);
  ctx.fill();
  
  // Draw flame shape
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.moveTo(16, 24);
  ctx.quadraticCurveTo(10, 20, 12, 12);
  ctx.quadraticCurveTo(14, 8, 16, 6);
  ctx.quadraticCurveTo(18, 8, 20, 12);
  ctx.quadraticCurveTo(22, 20, 16, 24);
  ctx.fill();
  
  return canvas.toDataURL('image/png');
};

// Apply the favicon
export const applyKasamaFavicon = () => {
  const favicon = generateKasamaFavicon();
  
  // Remove existing favicons
  const existingLinks = document.querySelectorAll("link[rel*='icon']");
  existingLinks.forEach(link => link.remove());
  
  // Create new favicon
  const link = document.createElement('link');
  link.type = 'image/png';
  link.rel = 'icon';
  link.href = favicon;
  document.head.appendChild(link);
};
