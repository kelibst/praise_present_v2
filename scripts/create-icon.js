const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function createIcon() {
  try {
    const inputPath = path.join(__dirname, '..', 'src', 'assets', 'logo-dark.png');
    const assetsDir = path.join(__dirname, '..', 'assets');

    console.log('Creating Windows icon files from logo-dark.png...');
    console.log('Input:', inputPath);

    // Create multiple PNG sizes that Windows uses
    const sizes = [256, 128, 64, 48, 32, 16];
    const pngFiles = [];

    for (const size of sizes) {
      const outputPath = path.join(assetsDir, `icon-${size}.png`);
      await sharp(inputPath)
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toFile(outputPath);

      pngFiles.push(outputPath);
      console.log(`✅ Created ${size}x${size} icon`);
    }

    // Also copy the original as 256x256 fallback
    const icon256Path = path.join(assetsDir, 'icon.png');
    await sharp(inputPath)
      .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(icon256Path);

    console.log('✅ Created icon.png (256x256)');
    console.log('');
    console.log('Multiple PNG sizes created. Electron Forge will use these during packaging.');
    console.log('Note: When you reference "./assets/icon" in forge.config.ts,');
    console.log('Electron Forge will automatically look for icon.ico, icon.png, or icon.icns');

    // For Windows .ico, we'll create a simple single-resolution version
    // Electron Forge will handle the multi-resolution .ico creation during build
    console.log('');
    console.log('Creating basic icon.ico for development...');

    const icoPath = path.join(assetsDir, 'icon.ico');

    // Copy the 256x256 PNG as a basic .ico (Windows can read PNG-format ICOs)
    const pngBuffer = await sharp(inputPath)
      .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    // Create a simple ICO header (for 1 image, 256x256, 32-bit)
    const icoHeader = Buffer.alloc(22);
    icoHeader.writeUInt16LE(0, 0);  // Reserved (must be 0)
    icoHeader.writeUInt16LE(1, 2);  // Type (1 = ICO)
    icoHeader.writeUInt16LE(1, 4);  // Number of images (1)
    icoHeader.writeUInt8(0, 6);     // Width (0 = 256)
    icoHeader.writeUInt8(0, 7);     // Height (0 = 256)
    icoHeader.writeUInt8(0, 8);     // Color palette (0 = no palette)
    icoHeader.writeUInt8(0, 9);     // Reserved (must be 0)
    icoHeader.writeUInt16LE(1, 10); // Color planes
    icoHeader.writeUInt16LE(32, 12); // Bits per pixel
    icoHeader.writeUInt32LE(pngBuffer.length, 14); // Size of PNG data
    icoHeader.writeUInt32LE(22, 18); // Offset to PNG data (after this header)

    // Combine header and PNG data
    const icoBuffer = Buffer.concat([icoHeader, pngBuffer]);
    fs.writeFileSync(icoPath, icoBuffer);

    console.log(`✅ Created icon.ico (${(icoBuffer.length / 1024).toFixed(2)} KB)`);
    console.log('');
    console.log('All icon files created successfully!');
    console.log('Electron Forge will use these during the build process.');

  } catch (error) {
    console.error('❌ Error creating icon:', error);
    console.error('Full error:', error.stack);
    process.exit(1);
  }
}

createIcon();
