import type { Geo } from '@vercel/functions';

export function appendGeoAndTimeToContext(context: string, geo: Geo) {
  return `${context}\n
    User's Geo Location and Time:
      ${geo.city ? `- ${geo.city}${geo.latitude && geo.longitude ? ` (${geo.latitude}, ${geo.longitude})` : ''}.` : ''}
      - Current date is ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit', weekday: 'short' })}. 
    `;
}
