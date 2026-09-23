const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function run() {
  const publicDir = path.join(__dirname, '..', 'public');
  const faviconSvg = fs.readFileSync(path.join(publicDir, 'favicon.svg'));

  console.log('Generating favicon PNG suite...');
  const sizes = [48, 96, 144, 192, 512];
  for (const s of sizes) {
    await sharp(faviconSvg)
      .resize(s, s)
      .png()
      .toFile(path.join(publicDir, `icon-${s}x${s}.png`));
    console.log(`Generated icon-${s}x${s}.png`);
  }

  // Apple touch icon (180x180)
  await sharp(faviconSvg)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Generated apple-touch-icon.png (180x180)');

  // Standalone Organization logo (512x512)
  await sharp(faviconSvg)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'operis-logo-512x512.png'));
  console.log('Generated operis-logo-512x512.png');

  // favicon.png (48x48)
  await sharp(faviconSvg)
    .resize(48, 48)
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));

  // Generate multi-resolution binary favicon.ico (16, 32, 48)
  const png16 = await sharp(faviconSvg).resize(16, 16).png().toBuffer();
  const png32 = await sharp(faviconSvg).resize(32, 32).png().toBuffer();
  const png48 = await sharp(faviconSvg).resize(48, 48).png().toBuffer();

  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0); // reserved
  icoHeader.writeUInt16LE(1, 2); // type 1 = icon
  icoHeader.writeUInt16LE(3, 4); // 3 images

  const dirEntrySize = 16;
  const entriesOffset = 6;
  let currentOffset = entriesOffset + (dirEntrySize * 3);

  const images = [
    { width: 16, height: 16, buf: png16 },
    { width: 32, height: 32, buf: png32 },
    { width: 48, height: 48, buf: png48 },
  ];

  const entries = [];
  for (const img of images) {
    const entry = Buffer.alloc(dirEntrySize);
    entry.writeUInt8(img.width === 256 ? 0 : img.width, 0);
    entry.writeUInt8(img.height === 256 ? 0 : img.height, 1);
    entry.writeUInt8(0, 2); // color palette count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(img.buf.length, 8); // image size
    entry.writeUInt32LE(currentOffset, 12); // image offset
    entries.push(entry);
    currentOffset += img.buf.length;
  }

  const icoFile = Buffer.concat([
    icoHeader,
    ...entries,
    ...images.map(img => img.buf)
  ]);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoFile);
  console.log('Generated multi-resolution binary favicon.ico');

  // Generate 1200x630 Open Graph PNG Card
  console.log('Generating og-image.png (1200x630)...');
  const ogSvg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0b0d"/>
      <stop offset="50%" stop-color="#12141a"/>
      <stop offset="100%" stop-color="#08090b"/>
    </linearGradient>
    <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.3"/>
      <stop offset="50%" stop-color="#818cf8" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#c084fc" stop-opacity="0.1"/>
    </linearGradient>
    <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="50%" stop-color="#818cf8"/>
      <stop offset="100%" stop-color="#c084fc"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Glow circles -->
  <circle cx="200" cy="150" r="300" fill="url(#glow)" filter="blur(60px)"/>
  <circle cx="1000" cy="450" r="280" fill="url(#glow)" filter="blur(60px)"/>

  <!-- Grid mesh pattern -->
  <g stroke="#ffffff" stroke-opacity="0.04" stroke-width="1">
    <line x1="100" y1="0" x2="100" y2="630"/>
    <line x1="200" y1="0" x2="200" y2="630"/>
    <line x1="300" y1="0" x2="300" y2="630"/>
    <line x1="400" y1="0" x2="400" y2="630"/>
    <line x1="500" y1="0" x2="500" y2="630"/>
    <line x1="600" y1="0" x2="600" y2="630"/>
    <line x1="700" y1="0" x2="700" y2="630"/>
    <line x1="800" y1="0" x2="800" y2="630"/>
    <line x1="900" y1="0" x2="900" y2="630"/>
    <line x1="1000" y1="0" x2="1000" y2="630"/>
    <line x1="1100" y1="0" x2="1100" y2="630"/>
    <line x1="0" y1="100" x2="1200" y2="100"/>
    <line x1="0" y1="200" x2="1200" y2="200"/>
    <line x1="0" y1="300" x2="1200" y2="300"/>
    <line x1="0" y1="400" x2="1200" y2="400"/>
    <line x1="0" y1="500" x2="1200" y2="500"/>
    <line x1="0" y1="600" x2="1200" y2="600"/>
  </g>

  <!-- Border Card -->
  <rect x="50" y="50" width="1100" height="530" rx="32" fill="none" stroke="#ffffff" stroke-opacity="0.1" stroke-width="1.5"/>

  <!-- Protocol Badge -->
  <g transform="translate(100, 110)">
    <rect width="360" height="38" rx="19" fill="#1e293b" fill-opacity="0.8" stroke="#38bdf8" stroke-opacity="0.3"/>
    <circle cx="20" cy="19" r="4" fill="#34d399"/>
    <text x="36" y="24" fill="#38bdf8" font-family="sans-serif" font-weight="600" font-size="13" letter-spacing="0.05em">
      %0 KOMİSYON PROTOKOLÜ • 10 SEKTÖR
    </text>
  </g>

  <!-- Brand Wordmark -->
  <g transform="translate(100, 210)">
    <text x="0" y="0" fill="#ffffff" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-weight="700" font-size="44" letter-spacing="-0.02em">
      Bağımsız Yetenekler &amp; Şirketler İçin
    </text>
    <text x="0" y="58" fill="url(#textGrad)" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-weight="700" font-size="44" letter-spacing="-0.02em">
      Komisyonsuz, Doğrudan İş Birliği
    </text>
  </g>

  <!-- Subtitle -->
  <g transform="translate(100, 340)">
    <text x="0" y="0" fill="#94a3b8" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-weight="400" font-size="20" letter-spacing="-0.01em">
      Yazılımdan tasarıma, yapay zekadan pazarlamaya 110 uzmanlık alanında
    </text>
    <text x="0" y="30" fill="#94a3b8" font-family="DejaVu Sans, Arial, Helvetica, sans-serif" font-weight="400" font-size="20" letter-spacing="-0.01em">
      şifrelenmiş teklifler ve 7 günlük taze ilan radarıyla çalışan açık eşleştirme ağı.
    </text>
  </g>

  <!-- Footer Pillars -->
  <g transform="translate(100, 480)">
    <rect x="0" y="0" width="220" height="52" rx="14" fill="#141822" stroke="#334155" stroke-width="1"/>
    <text x="24" y="32" fill="#34d399" font-family="sans-serif" font-weight="700" font-size="18">%0</text>
    <text x="60" y="32" fill="#e2e8f0" font-family="sans-serif" font-weight="500" font-size="14">Komisyon</text>

    <rect x="240" y="0" width="220" height="52" rx="14" fill="#141822" stroke="#334155" stroke-width="1"/>
    <text x="264" y="32" fill="#38bdf8" font-family="sans-serif" font-weight="700" font-size="18">7 Gün</text>
    <text x="320" y="32" fill="#e2e8f0" font-family="sans-serif" font-weight="500" font-size="14">Canlılık Radarı</text>

    <rect x="480" y="0" width="220" height="52" rx="14" fill="#141822" stroke="#334155" stroke-width="1"/>
    <text x="504" y="32" fill="#818cf8" font-family="sans-serif" font-weight="700" font-size="18">AES-256</text>
    <text x="590" y="32" fill="#e2e8f0" font-family="sans-serif" font-weight="500" font-size="14">Kör Teklif</text>

    <rect x="720" y="0" width="220" height="52" rx="14" fill="#141822" stroke="#334155" stroke-width="1"/>
    <text x="744" y="32" fill="#c084fc" font-family="sans-serif" font-weight="700" font-size="18">P2P</text>
    <text x="790" y="32" fill="#e2e8f0" font-family="sans-serif" font-weight="500" font-size="14">Doğrudan İletişim</text>
  </g>

  <!-- Operis Logo Watermark at top right -->
  <g transform="translate(1000, 90)">
    <circle cx="50" cy="50" r="46" fill="#ffffff"/>
    <g transform="translate(18, 18) scale(0.62)">
      <path d="M 25.50 124.50 A 70 70 0 0 1 124.50 25.50" stroke="#09090B" stroke-width="11" stroke-linecap="round" fill="none"/>
      <path d="M 36.11 113.89 A 55 55 0 0 1 113.89 36.11" stroke="#09090B" stroke-width="11" stroke-linecap="round" fill="none"/>
      <path d="M 46.72 103.28 A 40 40 0 0 1 103.28 46.72" stroke="#09090B" stroke-width="11" stroke-linecap="round" fill="none"/>
      <path d="M 113.89 36.11 A 55 55 0 0 1 36.11 113.89" stroke="#09090B" stroke-width="42" stroke-linecap="butt" fill="none"/>
    </g>
  </g>
</svg>
`;

  await sharp(Buffer.from(ogSvg))
    .resize(1200, 630)
    .png()
    .toFile(path.join(publicDir, 'og-image.png'));
  console.log('Generated og-image.png (1200x630)');

  console.log('All branding and Google assets generated successfully!');
}

run().catch(console.error);
