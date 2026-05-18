import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from './firebase';

const storage = getStorage(app);

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const storageRef = ref(storage, `avatars/${userId}`);
  const snap = await uploadBytes(storageRef, file, { contentType: file.type });
  return getDownloadURL(snap.ref);
}
