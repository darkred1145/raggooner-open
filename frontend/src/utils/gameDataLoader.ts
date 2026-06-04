async function decompressGzip(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`Failed to fetch ${url} (${response.status})`);
  const compressed = await response.arrayBuffer();
  const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Response(stream).arrayBuffer();
}

type RacetrackFilterEntry = {
  id: number;
  label?: string;
  statThresholds?: string[];
  [key: string]: any;
};

class GameDataLoaderClass {
  private data: Record<string, any> | null = null;

  async initialize(): Promise<void> {
    if (this.data) return;
    const buf = await decompressGzip('/data/gamedata.bin.gz');
    const text = new TextDecoder().decode(buf);
    this.data = JSON.parse(text);
  }

  private ensureLoaded(): void {
    if (!this.data) throw new Error('GameDataLoader not initialized');
  }

  get racetrackFilterData(): RacetrackFilterEntry[] {
    this.ensureLoaded();
    return this.data!['tracks/racetracks']?.pageProps?.racetrackFilterData ?? [];
  }

  get skillNameFallbacks(): { id: number; enname?: string; jpname?: string }[] {
    this.ensureLoaded();
    return this.data!['skills'] ?? [];
  }
}

export const gameDataLoader = new GameDataLoaderClass();
