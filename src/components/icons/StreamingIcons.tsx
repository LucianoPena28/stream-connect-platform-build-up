import netflixSvg from '@/assets/icons/netflix.svg';
import primeSvg from '@/assets/icons/prime-video.svg';
import spotifySvg from '@/assets/icons/spotify.svg';
import whatsappSvg from '@/assets/icons/whatsapp.svg';

interface IconProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  size?: number;
}

export function NetflixIcon({ size = 24, className = '', ...props }: IconProps) {
  return <img src={netflixSvg} alt="Netflix" width={size} height={size} className={`inline-block ${className}`} {...props} />;
}

export function PrimeVideoIcon({ size = 24, className = '', ...props }: IconProps) {
  return <img src={primeSvg} alt="Prime Video" width={size} height={size} className={`inline-block ${className}`} {...props} />;
}

export function SpotifyIcon({ size = 24, className = '', ...props }: IconProps) {
  return <img src={spotifySvg} alt="Spotify" width={size} height={size} className={`inline-block ${className}`} {...props} />;
}

export function WhatsAppIcon({ size = 24, className = '', ...props }: IconProps) {
  return <img src={whatsappSvg} alt="WhatsApp" width={size} height={size} className={`inline-block text-foreground dark:text-emerald-400 ${className}`} style={{ filter: 'var(--whatsapp-filter, none)' }} {...props} />;
}

/** Returns the appropriate icon component for a service category/name */
export function getServiceIcon(name: string, category?: string | null) {
  const lower = (name + ' ' + (category || '')).toLowerCase();
  if (lower.includes('netflix')) return NetflixIcon;
  if (lower.includes('prime') || lower.includes('amazon')) return PrimeVideoIcon;
  if (lower.includes('spotify')) return SpotifyIcon;
  return null;
}
