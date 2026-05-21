export async function uploadImage(
  file: File,
  folder: string,
  token: string
): Promise<{ url: string; publicId: string }> {
  const form = new FormData();
  form.append('file', file);
  form.append('folder', folder);

  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Error al subir imagen');
  }

  return res.json();
}
