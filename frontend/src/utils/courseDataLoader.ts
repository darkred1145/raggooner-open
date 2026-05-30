export type SlopeEntry = { start: number; length: number; slope: number };
export type CornerEntry = { start: number; length: number };
export type StraightEntry = { start: number; end: number; frontType: number };
export type CourseEntry = {
  raceTrackId: number;
  distance: number;
  distanceType: number;
  surface: number;
  turn: number;
  course: number;
  laneMax: number;
  slopes: SlopeEntry[];
  corners: CornerEntry[];
  straights: StraightEntry[];
};
export type CourseData = Record<string, CourseEntry>;

class CourseDataLoaderClass {
  private data: CourseData | null = null;

  async initialize(): Promise<void> {
    if (this.data) return;
    const resp = await fetch('/data/course_data.json');
    if (!resp.ok) throw new Error(`Failed to load course_data.json (${resp.status})`);
    this.data = await resp.json() as CourseData;
  }

  getCourse(trackId: string | number): CourseEntry | undefined {
    return this.data?.[String(trackId)];
  }

  getSlopes(trackId: string | number): SlopeEntry[] {
    return this.getCourse(trackId)?.slopes ?? [];
  }
}

export const courseDataLoader = new CourseDataLoaderClass();
