const DEFAULT_MAX_BYTES = 3 * 1024 * 1024; // 3 MB
const MAX_ATTEMPTS = 6;
const SCALE_STEP = 0.85;
const MIN_DIMENSION = 600;
const INITIAL_QUALITY = 0.85;
const MIN_QUALITY = 0.45;
const QUALITY_STEP = 0.1;
const OUTPUT_TYPE = 'image/jpeg';

/**
 * Compresses a business-card photo until it fits under the desired byte size.
 * Reduces JPEG quality first, then gradually scales the full frame
 * (no cropping) if needed. Returns a File so downstream logic can keep
 * using FileReader without changes.
 */
export async function ensureImageUnderLimit(file, maxBytes = DEFAULT_MAX_BYTES) {
  if (!(file instanceof File) || !file.type.startsWith('image/')) {
    throw new Error('A valid image file is required for compression.');
  }

  if (file.size <= maxBytes) {
    return file;
  }

  const source = await loadImageSource(file);
  let width = source.width;
  let height = source.height;
  let quality = INITIAL_QUALITY;
  let bestBlob = file;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const canvas = document.createElement('canvas');
    const canvasWidth = Math.max(1, Math.round(width));
    const aspectRatio = height / width || 1;
    const canvasHeight = Math.max(1, Math.round(canvasWidth * aspectRatio));
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);

    // eslint-disable-next-line no-await-in-loop
    const blob = await canvasToJpeg(canvas, quality);
    if (blob && blob.size < bestBlob.size) {
      bestBlob = blob;
    }

    if (blob && blob.size <= maxBytes) {
      cleanupImageSource(source);
      return blobToFile(blob, file.name);
    }

    // Prepare for another pass by trimming resolution and quality a bit.
    width = width > MIN_DIMENSION ? Math.max(width * SCALE_STEP, MIN_DIMENSION) : width * SCALE_STEP;
    height = height > MIN_DIMENSION ? Math.max(height * SCALE_STEP, MIN_DIMENSION) : height * SCALE_STEP;
    quality = Math.max(MIN_QUALITY, quality - QUALITY_STEP);
  }

  cleanupImageSource(source);
  return blobToFile(bestBlob, file.name);
}

function canvasToJpeg(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas failed to produce a blob.'));
          return;
        }
        resolve(blob);
      },
      OUTPUT_TYPE,
      quality
    );
  });
}

function loadImageSource(file) {
  if ('createImageBitmap' in window) {
    return createImageBitmap(file);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function cleanupImageSource(source) {
  if ('close' in source && typeof source.close === 'function') {
    source.close();
  }
  if (source instanceof HTMLImageElement && source.src.startsWith('blob:')) {
    URL.revokeObjectURL(source.src);
  }
}

function blobToFile(blob, originalName) {
  return new File([blob], originalName.replace(/\.\w+$/, '.jpg'), {
    type: OUTPUT_TYPE,
    lastModified: Date.now()
  });
}


