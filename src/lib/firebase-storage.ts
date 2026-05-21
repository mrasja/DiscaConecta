import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from './firebase';

const storage = getStorage(app);

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const storageRef = ref(storage, `avatars/${userId}`);
  const snap = await uploadBytes(storageRef, file, { contentType: file.type });
  return getDownloadURL(snap.ref);
}

export async function uploadReviewPhoto(userId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const storageRef = ref(storage, `reviews/${userId}/${Date.now()}.${ext}`);
  const snap = await uploadBytes(storageRef, file, { contentType: file.type });
  return getDownloadURL(snap.ref);
}

export async function uploadVerificationDoc(
  userId: string,
  type: 'dni_front' | 'dni_back' | 'selfie',
  file: File | Blob,
): Promise<string> {
  const ext = file instanceof File ? file.name.split('.').pop() : 'jpg';
  const storageRef = ref(storage, `verificacion/${userId}/${type}.${ext}`);
  const snap = await uploadBytes(storageRef, file, {
    contentType: file instanceof File ? file.type : 'image/jpeg',
  });
  return getDownloadURL(snap.ref);
}
