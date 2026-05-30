import { ref } from 'vue';
import { raceKey } from '../utils/utils';

type SecureUpdateFn = (data: Record<string, any>) => Promise<void>;

export function useReplayUpload(secureUpdate: SecureUpdateFn) {
  const uploading = ref(false);
  const error = ref<string | null>(null);

  const uploadReplay = async (
    file: File,
    _tournamentId: string,
    stage: string,
    group: string,
    raceNumber: number,
  ): Promise<void> => {
    uploading.value = true;
    error.value = null;

    try {
      const content = await file.text();
      JSON.parse(content);
      const key = raceKey(stage, group, raceNumber);
      await secureUpdate({ [`races.${key}.replayData`]: content });
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Upload failed';
      throw e;
    } finally {
      uploading.value = false;
    }
  };

  const deleteReplay = async (
    _tournamentId: string,
    stage: string,
    group: string,
    raceNumber: number,
  ): Promise<void> => {
    const key = raceKey(stage, group, raceNumber);
    await secureUpdate({ [`races.${key}.replayData`]: null });
  };

  return {
    uploading,
    error,
    uploadReplay,
    deleteReplay,
  };
}
