import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-server';
import { cloudinary, isCloudinaryConfigured } from '@/lib/cloudinary';

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    if (!isCloudinaryConfigured()) {
      return NextResponse.json({ error: 'Cloudinary no configurado' }, { status: 503 });
    }

    const formData = await request.formData();
    const file   = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'discapp';

    if (!file) return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 });

    const bytes  = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;

    const result = await cloudinary.uploader.upload(base64, {
      folder: `discapp/${folder}`,
      resource_type: 'image',
      transformation: [
        { quality: 'auto', fetch_format: 'auto' },
        { width: 1200, crop: 'limit' },
      ],
    });

    return NextResponse.json({
      url:      result.secure_url,
      publicId: result.public_id,
      width:    result.width,
      height:   result.height,
    });
  } catch (error) {
    console.error('Error POST /api/upload:', error);
    return NextResponse.json({ error: 'Error al subir imagen' }, { status: 500 });
  }
}
