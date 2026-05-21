import { v2 as cloudinary } from 'cloudinary';

if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure:     true,
  });
}

export { cloudinary };

export function isCloudinaryConfigured() {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

export function cloudinaryUrl(publicId: string, opts?: {
  width?: number;
  height?: number;
  quality?: number | 'auto';
  format?: 'auto' | 'webp' | 'avif';
  crop?: 'fill' | 'thumb' | 'scale' | 'fit';
}) {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloud || !publicId) return publicId;

  const transforms = [
    opts?.width   ? `w_${opts.width}`   : '',
    opts?.height  ? `h_${opts.height}`  : '',
    opts?.crop    ? `c_${opts.crop}`    : '',
    opts?.quality ? `q_${opts.quality}` : 'q_auto',
    opts?.format  ? `f_${opts.format}`  : 'f_auto',
  ].filter(Boolean).join(',');

  return `https://res.cloudinary.com/${cloud}/image/upload/${transforms}/${publicId}`;
}
