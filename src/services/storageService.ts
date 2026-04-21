import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

export const uploadVerificationDocument = async (
  file: File,
  userId: string,
  type: 'id_proof' | 'profile_pic'
): Promise<string> => {
  const extension = file.name.split('.').pop();
  const fileName = `${type}_${Date.now()}.${extension}`;
  const storageRef = ref(storage, `verifications/${userId}/${fileName}`);
  
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
};
