import { computed, type ComputedRef, type Ref } from 'vue';
import type { Tournament, Team } from '../types';
import { compareTeams } from '../utils/utils';

export function useProjectedProgression(
  tournament: Ref<Tournament | null>,
  sortedTeamsA: ComputedRef<Team[]>,
  sortedTeamsB: ComputedRef<Team[]>,
  sortedTeamsC: ComputedRef<Team[]>,
) {
  return computed(() => {
    if (!tournament.value) return { tied: [], safe: [], needed: 0 };

    const teamCount = tournament.value.teams.length;
    const safeIds: string[] = [];
    const tiedSet = new Set<string>();
    let needed = 0;

    if (teamCount === 9) {
      const groups = [
        { list: sortedTeamsA.value, name: 'A' },
        { list: sortedTeamsB.value, name: 'B' },
        { list: sortedTeamsC.value, name: 'C' },
      ];
      groups.forEach(g => {
        const top = g.list[0]!;
        const runner = g.list[1]!;
        if (compareTeams(top, runner, false, tournament.value!) === 0) {
          tiedSet.add(top.id);
          tiedSet.add(runner.id);
          if (g.list[2] && compareTeams(top, g.list[2], false, tournament.value!) === 0) {
            tiedSet.add(g.list[2].id);
          }
          needed++;
        } else {
          safeIds.push(top.id);
        }
      });
    } else if (teamCount === 8) {
      const groups = [sortedTeamsA, sortedTeamsB];
      groups.forEach(list => {
        const first = list.value[0]!;
        const second = list.value[1]!;
        const third = list.value[2]!;
        if (compareTeams(second, third, false, tournament.value!) === 0) {
          if (compareTeams(first, second, false, tournament.value!) === 0) {
            tiedSet.add(first.id);
            tiedSet.add(second.id);
            tiedSet.add(third.id);
            if (list.value[3] && compareTeams(first, list.value[3], false, tournament.value!) === 0) {
              tiedSet.add(list.value[3].id);
            }
            needed += 2;
          } else {
            safeIds.push(first.id);
            tiedSet.add(second.id);
            tiedSet.add(third.id);
            if (list.value[3] && compareTeams(second, list.value[3], false, tournament.value!) === 0) {
              tiedSet.add(list.value[3].id);
            }
            needed += 1;
          }
        } else {
          safeIds.push(first.id);
          safeIds.push(second.id);
        }
      });
    } else {
      let slotsAvailable = 0;
      const wildCardPool: Team[] = [];

      const topA = sortedTeamsA.value[0]!;
      const runA = sortedTeamsA.value[1]!;
      const thirdA = sortedTeamsA.value[2];

      if (compareTeams(topA, runA, false, tournament.value!) === 0) {
        tiedSet.add(topA.id);
        tiedSet.add(runA.id);
        wildCardPool.push(topA, runA);
        if (thirdA && compareTeams(topA, thirdA, false, tournament.value!) === 0) {
          tiedSet.add(thirdA.id);
          wildCardPool.push(thirdA);
        }
        slotsAvailable++;
      } else {
        safeIds.push(topA.id);
        wildCardPool.push(runA);
        if (thirdA && compareTeams(runA, thirdA, false, tournament.value!) === 0) {
          wildCardPool.push(thirdA);
        }
      }

      const topB = sortedTeamsB.value[0]!;
      const runB = sortedTeamsB.value[1]!;
      const thirdB = sortedTeamsB.value[2];

      if (compareTeams(topB, runB, false, tournament.value!) === 0) {
        tiedSet.add(topB.id);
        tiedSet.add(runB.id);
        wildCardPool.push(topB, runB);
        if (thirdB && compareTeams(topB, thirdB, false, tournament.value!) === 0) {
          tiedSet.add(thirdB.id);
          wildCardPool.push(thirdB);
        }
        slotsAvailable++;
      } else {
        safeIds.push(topB.id);
        wildCardPool.push(runB);
        if (thirdB && compareTeams(runB, thirdB, false, tournament.value!) === 0) {
          wildCardPool.push(thirdB);
        }
      }

      slotsAvailable++;
      wildCardPool.sort((a, b) => compareTeams(a, b, false, tournament.value!));

      if (wildCardPool.length > slotsAvailable) {
        const lastQualifier = wildCardPool[slotsAvailable - 1]!;
        const firstLoser = wildCardPool[slotsAvailable]!;
        if (compareTeams(lastQualifier, firstLoser, false, tournament.value!) === 0) {
          wildCardPool.forEach(p => {
            const comparison = compareTeams(p, lastQualifier, false, tournament.value!);
            if (comparison < 0) {
              if (tiedSet.has(p.id)) tiedSet.delete(p.id);
              if (!safeIds.includes(p.id)) safeIds.push(p.id);
              slotsAvailable--;
            } else if (comparison === 0) {
              tiedSet.add(p.id);
            }
          });
          needed = slotsAvailable;
        } else {
          for (let i = 0; i < slotsAvailable; i++) {
            const p = wildCardPool[i]!;
            if (tiedSet.has(p.id)) tiedSet.delete(p.id);
            if (!safeIds.includes(p.id)) safeIds.push(p.id);
          }
          tiedSet.clear();
          needed = 0;
        }
      } else {
        wildCardPool.forEach(p => {
          if (tiedSet.has(p.id)) tiedSet.delete(p.id);
          if (!safeIds.includes(p.id)) safeIds.push(p.id);
        });
        needed = 0;
      }
    }

    safeIds.forEach(id => {
      if (tiedSet.has(id)) tiedSet.delete(id);
    });

    const tiedTeamsList = tournament.value.teams.filter(t => tiedSet.has(t.id));
    return { tied: tiedTeamsList, safe: safeIds, needed };
  });
}
