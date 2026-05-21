import imageCompression from 'browser-image-compression';

export async function compressImage(file: File, maxSizeMB = 0.5): Promise<File> {
  if (file.size < maxSizeMB * 1024 * 1024) return file; // ya está bien

  const compressed = await imageCompression(file, {
    maxSizeMB,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
    fileType: file.type === 'image/png' ? 'image/png' : 'image/jpeg',
  });

  // Mantener el nombre original
  return new File([compressed], file.name, { type: compressed.type });
}
