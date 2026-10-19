/**
 * Client-Side Image Compressor & EXIF Stripper
 * Resizes large photos, strips EXIF headers by redrawing to HTML5 Canvas,
 * and stamps date/time watermark onto the photo.
 */

export interface CompressionResult {
  dataUrl: string;
  sizeKb: number;
  originalSizeKb: number;
  width: number;
  height: number;
  timestamp: string;
  locationNote?: string;
}

export async function compressAndStampImage(
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    addTimestampOverlay?: boolean;
    locationNote?: string;
  } = {}
): Promise<CompressionResult> {
  const {
    maxWidth = 960,
    maxHeight = 960,
    quality = 0.68,
    addTimestampOverlay = true,
    locationNote,
  } = options;

  const originalSizeKb = Math.round(file.size / 1024);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca berkas gambar.'));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Format berkas gambar tidak valid.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio preserving dimensions
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context tidak tersedia'));
          return;
        }

        // Draw image onto canvas - this inherently removes EXIF metadata (GPS, camera serials, etc.)
        ctx.drawImage(img, 0, 0, width, height);

        const now = new Date();
        const dateFormatted = now.toLocaleDateString('id-ID', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
        const timeFormatted = now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        const stampText = `G7KAIH · ${dateFormatted} ${timeFormatted}`;

        // Optional watermark overlay for authentic habit verification
        if (addTimestampOverlay) {
          ctx.save();
          const padding = 12;
          const fontSize = Math.max(14, Math.round(width * 0.024));
          ctx.font = `600 ${fontSize}px sans-serif`;

          const textWidth = ctx.measureText(stampText).width;
          const bannerHeight = fontSize + 16;
          const bannerY = height - bannerHeight - padding;

          // Translucent dark pill background
          ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
          const boxWidth = locationNote
            ? Math.max(textWidth, ctx.measureText(locationNote).width) + 24
            : textWidth + 24;
          const totalBoxHeight = locationNote ? bannerHeight * 1.8 : bannerHeight;

          ctx.beginPath();
          ctx.roundRect(padding, height - totalBoxHeight - padding, boxWidth, totalBoxHeight, 8);
          ctx.fill();

          // Text rendering
          ctx.fillStyle = '#ffffff';
          ctx.fillText(stampText, padding + 12, height - (locationNote ? totalBoxHeight - fontSize - 6 : padding + 10));

          if (locationNote) {
            ctx.fillStyle = '#38bdf8';
            ctx.font = `500 ${Math.max(11, fontSize - 3)}px sans-serif`;
            ctx.fillText(`📍 ${locationNote}`, padding + 12, height - padding - 8);
          }

          ctx.restore();
        }

        // Convert to WebP or JPEG
        let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        
        // Approximate size in KB
        let base64Length = compressedDataUrl.length - (compressedDataUrl.indexOf(',') + 1);
        let sizeKb = Math.round((base64Length * 3) / 4 / 1024);

        // If still > 500 KB, compress further with lower quality
        if (sizeKb > 500) {
          compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
          base64Length = compressedDataUrl.length - (compressedDataUrl.indexOf(',') + 1);
          sizeKb = Math.round((base64Length * 3) / 4 / 1024);
        }

        resolve({
          dataUrl: compressedDataUrl,
          sizeKb,
          originalSizeKb,
          width,
          height,
          timestamp: now.toISOString(),
          locationNote,
        });
      };

      img.src = event.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Optimizes School Logo for permanent local & cloud storage.
 * Preserves transparency for PNG/SVG and keeps dimensions clean (max 400x400).
 */
export async function compressSchoolLogo(file: File): Promise<{
  dataUrl: string;
  sizeKb: number;
  width: number;
  height: number;
}> {
  // If SVG, read directly as data URL to preserve vector crispness
  if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Gagal membaca berkas logo SVG.'));
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const sizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);
        resolve({
          dataUrl,
          sizeKb,
          width: 400,
          height: 400,
        });
      };
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca berkas logo sekolah.'));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Format berkas gambar tidak valid atau rusak.'));
      img.onload = () => {
        const maxDim = 400;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context tidak tersedia.'));
          return;
        }

        // Draw image keeping transparent background if PNG/WebP
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
        const outputMime = isPng ? 'image/png' : 'image/jpeg';
        let dataUrl = canvas.toDataURL(outputMime, isPng ? undefined : 0.88);

        let base64Length = dataUrl.length - (dataUrl.indexOf(',') + 1);
        let sizeKb = Math.round((base64Length * 3) / 4 / 1024);

        // If PNG is unexpectedly large (> 350KB), compress with JPEG
        if (sizeKb > 350 && isPng) {
          dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          base64Length = dataUrl.length - (dataUrl.indexOf(',') + 1);
          sizeKb = Math.round((base64Length * 3) / 4 / 1024);
        }

        resolve({
          dataUrl,
          sizeKb,
          width,
          height,
        });
      };

      img.src = event.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

import { OFFICIAL_SDN_GUDANG_2_LOGO } from '../data/seedData';

/**
 * Educational Emblem Presets (Tut Wuri Handayani, Karakter Pancasila, Crest Sekolah)
 */
export const SCHOOL_LOGO_PRESETS = [
  {
    id: 'crest_sdn_gudang_2',
    title: 'SD Negeri Gudang 2 (Resmi)',
    description: 'Lambang resmi SD Negeri Gudang 2 Cikalongkulon - Cianjur',
    svgDataUrl: OFFICIAL_SDN_GUDANG_2_LOGO,
  },
  {
    id: 'tut_wuri_handayani',
    title: 'Tut Wuri Handayani (Kemendikbud)',
    description: 'Lambang resmi pendidikan nasional Indonesia',
    svgDataUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
        <defs>
          <linearGradient id="blueG" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1d4ed8"/>
            <stop offset="100%" stop-color="#1e3a8a"/>
          </linearGradient>
          <linearGradient id="goldG" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fcd34d"/>
            <stop offset="50%" stop-color="#f59e0b"/>
            <stop offset="100%" stop-color="#d97706"/>
          </linearGradient>
        </defs>
        <!-- Outer Segilima / Pentagonal Crest -->
        <polygon points="100,10 190,75 155,180 45,180 10,75" fill="url(#blueG)" stroke="#fcd34d" stroke-width="5"/>
        <polygon points="100,18 180,77 150,172 50,172 20,77" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.6"/>
        <!-- Sayap Garuda & Api Tut Wuri -->
        <!-- Api Obor (Flame) -->
        <path d="M100,40 C108,55 115,62 108,75 C103,68 100,60 100,52 C100,60 97,68 92,75 C85,62 92,55 100,40 Z" fill="#ef4444"/>
        <path d="M100,48 C104,58 108,63 104,70 C101,65 100,60 100,55 C100,60 99,65 96,70 C92,63 96,58 100,48 Z" fill="#fbbf24"/>
        <!-- Tut Wuri Handayani Crest Body / Sayap Emas -->
        <path d="M100,75 C120,70 145,85 160,110 C140,115 125,108 100,120 C75,108 60,115 40,110 C55,85 80,70 100,75 Z" fill="url(#goldG)"/>
        <!-- Buku Terbuka (Open Book of Knowledge) -->
        <path d="M100,122 C115,115 135,118 152,126 L152,142 C135,134 115,132 100,138 C85,132 65,134 48,142 L48,126 C65,118 85,115 100,122 Z" fill="#ffffff" stroke="#1e3a8a" stroke-width="2"/>
        <line x1="100" y1="122" x2="100" y2="152" stroke="#1e3a8a" stroke-width="2.5"/>
        <!-- Bintang Emas Puncak -->
        <polygon points="100,24 103,31 110,31 105,36 107,43 100,39 93,43 95,36 90,31 97,31" fill="#fcd34d"/>
        <!-- Pita Dasar -->
        <path d="M60,162 Q100,152 140,162 L148,174 Q100,165 52,174 Z" fill="#fbbf24" stroke="#d97706" stroke-width="1.5"/>
        <text x="100" y="169" font-family="sans-serif" font-size="7" font-weight="900" fill="#1e3a8a" text-anchor="middle" letter-spacing="1">TUT WURI HANDAYANI</text>
      </svg>`
    )}`,
  },
  {
    id: 'crest_prestasi_bintang',
    title: 'Bintang Karakter Hebat',
    description: 'Lambang generasi emas pembiasaan 7 kebiasaan',
    svgDataUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
        <defs>
          <linearGradient id="redG" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#e11d48"/>
            <stop offset="100%" stop-color="#9f1239"/>
          </linearGradient>
          <linearGradient id="amberG" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fef08a"/>
            <stop offset="50%" stop-color="#f59e0b"/>
            <stop offset="100%" stop-color="#b45309"/>
          </linearGradient>
        </defs>
        <!-- Circular Medallion -->
        <circle cx="100" cy="100" r="90" fill="url(#redG)" stroke="#fbbf24" stroke-width="5"/>
        <circle cx="100" cy="100" r="82" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.8"/>
        <!-- Central Big Golden Star -->
        <polygon points="100,40 114,75 152,77 122,100 133,136 100,115 67,136 78,100 48,77 86,75" fill="url(#amberG)" stroke="#ffffff" stroke-width="2"/>
        <!-- Number 7 inside Star -->
        <text x="100" y="104" font-family="sans-serif" font-size="34" font-weight="900" fill="#881337" text-anchor="middle">7</text>
        <!-- Bottom Banner Ribbon -->
        <path d="M40,148 Q100,138 160,148 L152,168 Q100,158 48,168 Z" fill="#ffffff" stroke="#9f1239" stroke-width="2"/>
        <text x="100" y="161" font-family="sans-serif" font-size="8.5" font-weight="800" fill="#9f1239" text-anchor="middle" letter-spacing="1">GENERASI EMAS</text>
      </svg>`
    )}`,
  },
  {
    id: 'crest_pendidikan_buku',
    title: 'Lembaga Pendidikan Nasional',
    description: 'Lambang perisai obor ilmu & buku sekolah',
    svgDataUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
        <defs>
          <linearGradient id="emeraldG" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#059669"/>
            <stop offset="100%" stop-color="#064e3b"/>
          </linearGradient>
        </defs>
        <path d="M100,15 C150,15 180,45 180,95 C180,145 140,175 100,190 C60,175 20,145 20,95 C20,45 50,15 100,15 Z" fill="url(#emeraldG)" stroke="#fbbf24" stroke-width="5"/>
        <!-- Inner Border -->
        <path d="M100,25 C142,25 168,52 168,95 C168,138 135,164 100,178 C65,164 32,138 32,95 C32,52 58,25 100,25 Z" fill="none" stroke="#ffffff" stroke-width="1.5" opacity="0.6"/>
        <!-- Torch / Obor -->
        <path d="M100,42 C106,55 112,62 106,72 C102,66 100,60 100,53 C100,60 98,66 94,72 C88,62 94,55 100,42 Z" fill="#f59e0b"/>
        <rect x="96" y="70" width="8" height="24" rx="2" fill="#d97706"/>
        <!-- Open Book -->
        <path d="M100,98 C115,92 135,94 150,102 L150,126 C135,118 115,116 100,122 C85,116 65,118 50,126 L50,102 C65,94 85,92 100,98 Z" fill="#ffffff" stroke="#064e3b" stroke-width="2"/>
        <line x1="100" y1="98" x2="100" y2="132" stroke="#064e3b" stroke-width="2"/>
        <!-- Laurel Leaves / Padi & Kapas -->
        <circle cx="100" cy="155" r="8" fill="#fbbf24"/>
        <text x="100" y="158" font-family="sans-serif" font-size="9" font-weight="900" fill="#064e3b" text-anchor="middle">★</text>
      </svg>`
    )}`,
  },
];
