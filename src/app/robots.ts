import type { MetadataRoute } from 'next';
import { BETA_MODE } from '@/lib/beta';

export default function robots(): MetadataRoute.Robots {
  if (BETA_MODE) {
    return { rules: { userAgent: '*', disallow: '/' } };
  }
  return { rules: { userAgent: '*', allow: '/' } };
}
