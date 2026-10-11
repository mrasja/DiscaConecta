import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-server';
import { cloudinary, isCloudinaryConfigured } from '@/lib/cloudinary';

// El cliente manda `file.type`/tamaño pero eso es solo lo que el navegador declara —
// no hay garantía de que sea real. Estas son las validaciones que sí corren server-side.
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB, igual al límite que ya anuncia el cliente

// Firma de archivo (magic bytes) — un atacante puede subir un .php o .svg con script
// embebido y renombrarlo/declarar un Content-Type de imagen; esto verifica el contenido real.
function sniffImageType(buffer: Buffer): string | null {
  if (buffer.length < 4) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return 'image/png';
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) return 'image/gif';
  if (buffer.length >= 12 && buffer.slice(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    if (!isCloudinaryConfigured()) {
      return NextResponse.json({ error: 'Cloudinary no configurado' }, { status: 503 });
    }

    const formData  = await request.formData();
    const file      = formData.get('file') as File | null;
    const rawFolder = (formData.get('folder') as string) || 'discaconecta';
    // Solo alfanumérico y guiones — evita inyectar segmentos raros en la ruta de Cloudinary.
    const folder = /^[a-zA-Z0-9-]+$/.test(rawFolder) ? rawFolder : 'discaconecta';

    if (!file) return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 });
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Tipo de archivo no permitido. Usá JPG, PNG, WEBP o GIF.' }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'La imagen debe pesar menos de 10 MB' }, { status: 400 });
    }

    const bytes  = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const sniffedType = sniffImageType(buffer);
    if (!sniffedType) {
      return NextResponse.json({ error: 'El archivo no es una imagen válida' }, { status: 400 });
    }

    const base64 = `data:${sniffedType};base64,${buffer.toString('base64')}`;

    const result = await cloudinary.uploader.upload(base64, {
      folder: `discaconecta/${folder}`,
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
