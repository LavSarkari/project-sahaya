/**
 * Allocation Engine - The Brain of Smart Resource Allocation
 * 
 * This module performs pure computation over issues and volunteers
 * to detect misallocations, compute optimal assignments, and
 * generate heatmap data. No Firebase calls - just algorithms.
 */

import { 
  Issue, UserProfile, Category, 
  SectorHealth, MisallocationAlert, OptimalAssignment, HeatmapPoint 
} from '../types';
import { AREAS } from '../constants';

// Skill-to-category mapping for demand/supply matching
const CATEGORY_SKILL_MAP: Record<Category, string> = {
  'MEDICAL': 'medical',
  'FOOD': 'food distribution',
  'WATER': 'logistics',
  'SHELTER': 'logistics',
  'SECURITY': 'search and rescue'
};

const ALL_CATEGORIES: Category[] = ['FOOD', 'MEDICAL', 'WATER', 'SHELTER', 'SECURITY'];

// Priority weights for urgency scoring
const PRIORITY_WEIGHT: Record<string, number> = { 'HIGH': 3, 'MED': 2, 'LOW': 1 };

/**
 * Haversine distance between two lat/lng points in km
 */
function haversineKm(
  lat1: number, lng1: number, 
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + 
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Computes a health matrix for every sector based on active issues and available volunteers.
 */
export function computeSectorMatrix(
  issues: Issue[], 
  volunteers: UserProfile[]
): SectorHealth[] {
  const activeIssues = issues.filter(i => i.status !== 'resolved');
  const sectors = new Map<string, SectorHealth>();

  // Initialize sectors from AREAS constant
  AREAS.forEach(area => {
    const emptyDemands = {} as Record<Category, { count: number; totalAffected: number; highPriority: number }>;
    ALL_CATEGORIES.forEach(cat => {
      emptyDemands[cat] = { count: 0, totalAffected: 0, highPriority: 0 };
    });

    sectors.set(area.id, {
      sectorId: area.id,
      sectorName: area.name,
      demands: emptyDemands,
      supplies: {},
      volunteerIds: [],
      overallStatus: 'balanced',
      urgencyScore: 0
    });
  });

  // Aggregate demand from issues
  activeIssues.forEach(issue => {
    let sector = sectors.get(issue.areaId);
    if (!sector) {
      // Create ad-hoc sector for unknown areas
      const emptyDemands = {} as Record<Category, { count: number; totalAffected: number; highPriority: number }>;
      ALL_CATEGORIES.forEach(cat => {
        emptyDemands[cat] = { count: 0, totalAffected: 0, highPriority: 0 };
      });
      sector = {
        sectorId: issue.areaId,
        sectorName: issue.areaId,
        demands: emptyDemands,
        supplies: {},
        volunteerIds: [],
        overallStatus: 'balanced',
        urgencyScore: 0
      };
      sectors.set(issue.areaId, sector);
    }

    const d = sector.demands[issue.category];
    if (d) {
      d.count++;
      d.totalAffected += issue.peopleAffected || 0;
      if (issue.priority === 'HIGH') d.highPriority++;
    }
  });

  // Aggregate supply from volunteers  
  // Map each volunteer to their nearest sector based on coordinates
  volunteers.forEach(vol => {
    if (vol.status === 'en-route') return; // Already deployed, don't count as available supply

    let bestSector = 'aliganj';
    let bestDist = Infinity;

    if (vol.coordinates) {
      AREAS.forEach(area => {
        // Use area centroid from issues or fallback coordinates
        const areaIssues = activeIssues.filter(i => i.areaId === area.id);
        let centroidLat = 26.87, centroidLng = 80.95;
        if (areaIssues.length > 0) {
          centroidLat = areaIssues.reduce((s, i) => s + i.coordinates.lat, 0) / areaIssues.length;
          centroidLng = areaIssues.reduce((s, i) => s + i.coordinates.lng, 0) / areaIssues.length;
        }
        const dist = haversineKm(vol.coordinates!.lat, vol.coordinates!.lng, centroidLat, centroidLng);
        if (dist < bestDist) {
          bestDist = dist;
          bestSector = area.id;
        }
      });
    }

    const sector = sectors.get(bestSector);
    if (sector) {
      sector.volunteerIds.push(vol.uid);
      (vol.skills || []).forEach(skill => {
        sector.supplies[skill] = (sector.supplies[skill] || 0) + 1;
      });
    }
  });

  // Compute urgency scores and overall status
  sectors.forEach(sector => {
    let totalDemand = 0;
    let totalHighPriority = 0;
    let totalAffected = 0;
    let totalSupply = 0;

    ALL_CATEGORIES.forEach(cat => {
      const d = sector.demands[cat];
      totalDemand += d.count;
      totalHighPriority += d.highPriority;
      totalAffected += d.totalAffected;

      const neededSkill = CATEGORY_SKILL_MAP[cat];
      totalSupply += sector.supplies[neededSkill] || 0;
    });

    // Urgency = weighted demand intensity
    sector.urgencyScore = Math.min(100, 
      totalHighPriority * 25 + 
      totalDemand * 10 + 
      Math.floor(totalAffected / 50)
    );

    // Overall status
    if (totalDemand === 0) {
      sector.overallStatus = totalSupply > 0 ? 'surplus' : 'balanced';
    } else if (totalSupply === 0 && totalDemand > 0) {
      sector.overallStatus = 'critical';
    } else if (totalSupply < totalDemand) {
      sector.overallStatus = totalHighPriority > 0 ? 'critical' : 'strained';
    } else {
      sector.overallStatus = 'balanced';
    }
  });

  return Array.from(sectors.values()).sort((a, b) => b.urgencyScore - a.urgencyScore);
}

/**
 * Detects misallocations across sectors: gaps, surpluses, skill mismatches.
 */
export function detectMisallocations(
  sectorMatrix: SectorHealth[],
  volunteers: UserProfile[]
): MisallocationAlert[] {
  const alerts: MisallocationAlert[] = [];
  let alertId = 0;

  sectorMatrix.forEach(sector => {
    ALL_CATEGORIES.forEach(cat => {
      const demand = sector.demands[cat];
      const neededSkill = CATEGORY_SKILL_MAP[cat];
      const supply = sector.supplies[neededSkill] || 0;

      if (demand.count > 0 && supply === 0) {
        // CRITICAL GAP - demand exists, no matching supply
        // Look for surplus volunteers in other sectors
        const surplusSector = sectorMatrix.find(other => 
          other.sectorId !== sector.sectorId && 
          (other.supplies[neededSkill] || 0) > 0 &&
          other.demands[cat].count === 0
        );

        // Find the actual volunteer to suggest
        let suggestedVol: UserProfile | undefined;
        if (surplusSector) {
          suggestedVol = volunteers.find(v => 
            surplusSector.volunteerIds.includes(v.uid) &&
            v.skills?.includes(neededSkill) &&
            v.status !== 'en-route'
          );
        }

        alerts.push({
          id: `alert-${alertId++}`,
          type: 'CRITICAL_GAP',
          sector: sector.sectorId,
          sectorName: sector.sectorName,
          category: cat,
          demandCount: demand.count,
          supplyCount: 0,
          urgencyScore: Math.min(100, demand.highPriority * 30 + demand.count * 15 + Math.floor(demand.totalAffected / 20)),
          suggestion: surplusSector 
            ? `Redeploy ${neededSkill} volunteer from ${surplusSector.sectorName} → ${sector.sectorName}`
            : `No ${neededSkill} volunteers available anywhere. Escalate to partner NGOs immediately.`,
          suggestedVolunteerId: suggestedVol?.uid,
          suggestedFromSector: surplusSector?.sectorId,
          timestamp: new Date().toISOString()
        });
      } else if (demand.count === 0 && supply > 1) {
        // SURPLUS - volunteers idle with no matching demand
        alerts.push({
          id: `alert-${alertId++}`,
          type: 'SURPLUS',
          sector: sector.sectorId,
          sectorName: sector.sectorName,
          category: cat,
          demandCount: 0,
          supplyCount: supply,
          urgencyScore: 15,
          suggestion: `${supply} ${neededSkill} volunteers idle in ${sector.sectorName}. Consider redeployment to high-need sectors.`,
          timestamp: new Date().toISOString()
        });
      }
    });

    // SKILL MISMATCH - sector has volunteers but wrong skills
    const totalDemandInSector = ALL_CATEGORIES.reduce((s, c) => s + sector.demands[c].count, 0);
    if (totalDemandInSector > 0 && sector.volunteerIds.length > 0) {
      const unmetCategories = ALL_CATEGORIES.filter(cat => {
        const d = sector.demands[cat];
        const skill = CATEGORY_SKILL_MAP[cat];
        return d.count > 0 && (sector.supplies[skill] || 0) === 0;
      });

      if (unmetCategories.length > 0 && sector.volunteerIds.length > 0) {
        alerts.push({
          id: `alert-${alertId++}`,
          type: 'SKILL_MISMATCH',
          sector: sector.sectorId,
          sectorName: sector.sectorName,
          category: unmetCategories[0],
          demandCount: sector.demands[unmetCategories[0]].count,
          supplyCount: sector.volunteerIds.length,
          urgencyScore: 40,
          suggestion: `${sector.sectorName} has ${sector.volunteerIds.length} volunteers, but none with ${CATEGORY_SKILL_MAP[unmetCategories[0]]} skills needed for ${unmetCategories[0]} issues.`,
          timestamp: new Date().toISOString()
        });
      }
    }
  });

  // Sort by urgency (highest first)
  return alerts.sort((a, b) => b.urgencyScore - a.urgencyScore);
}

/**
 * Computes the globally optimal N:M assignment of volunteers to issues.
 * Uses a greedy weighted matching algorithm.
 */
export function computeOptimalAssignments(
  issues: Issue[],
  volunteers: UserProfile[]
): OptimalAssignment[] {
  const unassigned = issues.filter(i => 
    i.status === 'reported' && !i.assignedTo
  );
  const available = volunteers.filter(v => 
    v.status === 'standby' || v.status === 'active'
  );

  if (unassigned.length === 0 || available.length === 0) return [];

  // Score all (issue, volunteer) pairs
  const pairs: { issue: Issue; volunteer: UserProfile; score: number; dist: number; skillMatch: boolean }[] = [];

  unassigned.forEach(issue => {
    available.forEach(vol => {
      const neededSkill = CATEGORY_SKILL_MAP[issue.category];
      const hasSkill = vol.skills?.includes(neededSkill) || false;
      const skillScore = hasSkill ? 1 : 0.2;

      // Proximity score (closer = higher)
      let dist = 50; // default 50km
      if (vol.coordinates) {
        dist = haversineKm(
          vol.coordinates.lat, vol.coordinates.lng,
          issue.coordinates.lat, issue.coordinates.lng
        );
      }
      const proximityScore = Math.max(0, 1 - (dist / 100)); // 0km=1.0, 100km=0.0

      // Urgency weight
      const urgencyScore = PRIORITY_WEIGHT[issue.priority] / 3; // normalized 0-1

      const totalScore = skillScore * 0.4 + proximityScore * 0.3 + urgencyScore * 0.3;

      pairs.push({ issue, volunteer: vol, score: totalScore, dist, skillMatch: hasSkill });
    });
  });

  // Sort by score descending
  pairs.sort((a, b) => b.score - a.score);

  // Greedy assignment - no volunteer assigned twice, no issue assigned twice
  const assignedVolunteers = new Set<string>();
  const assignedIssues = new Set<string>();
  const results: OptimalAssignment[] = [];

  for (const pair of pairs) {
    if (assignedVolunteers.has(pair.volunteer.uid) || assignedIssues.has(pair.issue.id)) continue;

    assignedVolunteers.add(pair.volunteer.uid);
    assignedIssues.add(pair.issue.id);

    const neededSkill = CATEGORY_SKILL_MAP[pair.issue.category];
    results.push({
      issueId: pair.issue.id,
      issueTitle: pair.issue.title,
      volunteerId: pair.volunteer.uid,
      volunteerName: pair.volunteer.name,
      score: pair.score,
      reasoning: pair.skillMatch 
        ? `${pair.volunteer.name} has ${neededSkill} skills and is ${pair.dist.toFixed(1)}km away`
        : `Closest available volunteer at ${pair.dist.toFixed(1)}km (no exact skill match for ${neededSkill})`,
      estimatedDistance: pair.dist,
      skillMatch: pair.skillMatch
    });
  }

  return results;
}

/**
 * Generates heatmap data points from issues for canvas rendering.
 * Intensity is weighted by priority, people affected, and recency.
 */
export function generateHeatmapData(issues: Issue[]): HeatmapPoint[] {
  const activeIssues = issues.filter(i => i.status !== 'resolved');
  const now = Date.now();

  return activeIssues.map(issue => {
    const priorityWeight = PRIORITY_WEIGHT[issue.priority] / 3;
    const affectedWeight = Math.min(1, (issue.peopleAffected || 1) / 500);
    
    // Recency: issues from last hour = 1.0, 24h ago = 0.3
    const ageMs = now - new Date(issue.timestamp).getTime();
    const ageHours = ageMs / (1000 * 60 * 60);
    const recencyWeight = Math.max(0.3, 1 - (ageHours / 24));

    const intensity = Math.min(1, priorityWeight * 0.5 + affectedWeight * 0.3 + recencyWeight * 0.2);

    return {
      lat: issue.coordinates.lat,
      lng: issue.coordinates.lng,
      intensity,
      category: issue.category
    };
  });
}

/**
 * Computes global allocation statistics for the dashboard header.
 */
export function computeAllocationStats(
  issues: Issue[],
  volunteers: UserProfile[],
  matrix: SectorHealth[]
) {
  const active = issues.filter(i => i.status !== 'resolved');
  const unassigned = active.filter(i => !i.assignedTo && i.status === 'reported');
  const standby = volunteers.filter(v => v.status === 'standby');
  const deployed = volunteers.filter(v => v.status === 'en-route' || v.status === 'active');
  const criticalSectors = matrix.filter(s => s.overallStatus === 'critical');
  const totalAffected = active.reduce((s, i) => s + (i.peopleAffected || 0), 0);

  // Allocation efficiency: % of high-priority issues that have volunteers assigned
  const highPri = active.filter(i => i.priority === 'HIGH');
  const highPriCovered = highPri.filter(i => i.assignedTo);
  const efficiency = highPri.length > 0 
    ? Math.round((highPriCovered.length / highPri.length) * 100) 
    : 100;

  return {
    totalActive: active.length,
    unassignedCount: unassigned.length,
    standbyVolunteers: standby.length,
    deployedVolunteers: deployed.length,
    criticalSectors: criticalSectors.length,
    totalAffected,
    allocationEfficiency: efficiency
  };
}
