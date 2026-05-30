import { ref } from 'vue';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';
import { raceKey } from '../utils/utils';

type SecureUpdateFn = (data: Record<string, any>) => Promise<void>;

export function useReplayUpload(secureUpdate: SecureUpdateFn) {
  const uploading = ref(false);
  const error = ref<string | null>(null);

  const getReplayPath = (tournamentId: string, stage: string, group: string, raceNumber: number) =>
    `replays/${tournamentId}/${raceKey(stage, group, raceNumber)}.json`;

  const uploadReplay = async (
    file: File,
    tournamentId: string,
    stage: string,
    group: string,
    raceNumber: number,
  ): Promise<void> => {
    uploading.value = true;
    error.value = null;
    const path = getReplayPath(tournamentId, stage, group, raceNumber);
    const ref = storageRef(storage, path);

    try {
      await uploadBytes(ref, file);
      const key = raceKey(stage, group, raceNumber);
      await secureUpdate({ [`races.${key}.replayPath`]: path });
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Upload failed';
      throw e;
    } finally {
      uploading.value = false;
    }
  };

  const deleteReplay = async (
    tournamentId: string,
    stage: string,
    group: string,
    raceNumber: number,
  ): Promise<void> => {
    const path = getReplayPath(tournamentId, stage, group, raceNumber);
    const ref = storageRef(storage, path);
    await deleteObject(ref);

    const key = raceKey(stage, group, raceNumber);
    await secureUpdate({ [`races.${key}.replayPath`]: null });
  };

  const getReplayUrl = async (path: string): Promise<string> => {
    const ref = storageRef(storage, path);
    return getDownloadURL(ref);
  };

  const fetchReplayData = async (path: string): Promise<any> => {
    const url = await getReplayUrl(path);
    const resp = await fetch(url);
    return resp.json();
  };

  return {
    uploading,
    error,
    uploadReplay,
    deleteReplay,
    getReplayUrl,
    fetchReplayData,
  };
}
