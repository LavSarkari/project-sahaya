/**
 * Allocation Engine v2.0 — A++ Intelligence Brain
 * 
 * Upgrades over v1:
 * - Multi-tier skill matching (exact/secondary/tertiary)
 * - Fatigue & workload tracking in volunteer scoring
 * - Coverage gap factor in urgency scoring
 * - Two-pass matching algorithm (exact skills → best remaining)
 * - Temporal trend detection (escalation alerts)
 * - Issue clustering for coordinated responses
 * - Dynamic sector discovery from data
 */

import { 
  Issue, UserProfile, Category, 
  SectorHealth, MisallocationAlert, OptimalAssignment, HeatmapPoint,
  EscalationAlert, IssueCluster,
  CATEGORY_SKILL_MAP as SHARED_SKILL_MAP
} from '../types';
import { AREAS } from '../constants';

const ALL_CATEGORIES: Category[] = ['FOOD', 'MEDICAL', 'WATER', 'SHELTER', 'SECURITY'];
const PRIORITY_WEIGHT: Record<string, number> = { 'HIGH': 3, 'MED': 2, 'LOW': 1 };

// ========= CORE MATH =========

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
 * Compute skill match score using tiered mapping.
 * exact=1.0, secondary=0.6, tertiary=0.3, none=0.1
 */
function computeSkillScore(volunteerSkills: string[], category: Category): { score: number; matchTier: string } {
  const mappings = SHARED_SKILL_MAP[category] || [];
  let bestScore = 0.1;
  let bestTier = 'none';
  
  for (const mapping of mappings) {
    if (volunteerSkills.includes(mapping.skill) && mapping.weight > bestScore) {
      bestScore = mapping.weight;
      bestTier = mapping.tier;
    }
  }
  
  return { score: bestScore, matchTier: bestTier };
}

/**
 * Get the primary (exact-tier) skill name for a category.
 */
function getPrimarySkill(category: Category): string {
  const mappings = SHARED_SKILL_MAP[category] || [];
  const exact = mappings.find(m => m.tier === 'exact');
  return exact?.skill || 'logistics';
}

/**
 * Compute volunteer fatigue factor (1.0 = fresh, 0.0 = exhausted)
 */
function computeFatigueFactor(vol: UserProfile): number {
  const hoursToday = vol.hoursDeployedToday || 0;
  const fatigue = Math.max(0, 1 - (hoursToday / 12));
  
  // Also penalize if deployed very recently (< 1 hour ago)
  if (vol.lastDeployedAt) {
    const hoursSinceLast = (Date.now() - new Date(vol.lastDeployedAt).getTime()) / (1000 * 60 * 60);
    if (hoursSinceLast < 1) return fatigue * 0.7; // 30% penalty for recent deployment
  }
  
  return fatigue;
}

/**
 * Compute volunteer track record factor (0.5 default, up to 1.0 for proven performers)
 */
function computeTrackRecord(vol: UserProfile): number {
  if (!vol.completedTasks || vol.completedTasks === 0) return 0.5; // neutral for unknowns
  const score = (vol.performanceScore || 50) / 100;
  return Math.max(0.2, Math.min(1.0, score));
}

// ========= SECTOR HEALTH MATRIX =========

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

  // Dynamic sector discovery: create sectors for areas not in AREAS
  activeIssues.forEach(issue => {
    if (!sectors.has(issue.areaId)) {
      const emptyDemands = {} as Record<Category, { count: number; totalAffected: number; highPriority: number }>;
      ALL_CATEGORIES.forEach(cat => {
        emptyDemands[cat] = { count: 0, totalAffected: 0, highPriority: 0 };
      });
      sectors.set(issue.areaId, {
        sectorId: issue.areaId,
        sectorName: issue.areaId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        demands: emptyDemands,
        supplies: {},
        volunteerIds: [],
        overallStatus: 'balanced',
        urgencyScore: 0
      });
    }
  });

  // Aggregate demand
  activeIssues.forEach(issue => {
    const sector = sectors.get(issue.areaId);
    if (!sector) return;
    const d = sector.demands[issue.category];
    if (d) {
      d.count++;
      d.totalAffected += issue.peopleAffected || 0;
      if (issue.priority === 'HIGH') d.highPriority++;
    }
  });

  // Aggregate supply — map volunteers to nearest sector
  volunteers.forEach(vol => {
    if (vol.status === 'en-route') return;

    let bestSector = AREAS[0]?.id || 'unknown';
    let bestDist = Infinity;

    if (vol.coordinates) {
      const allSectorIds = Array.from(sectors.keys());
      for (const sectorId of allSectorIds) {
        const sectorIssues = activeIssues.filter(i => i.areaId === sectorId);
        let centroidLat = 26.87, centroidLng = 80.95;
        if (sectorIssues.length > 0) {
          centroidLat = sectorIssues.reduce((s, i) => s + i.coordinates.lat, 0) / sectorIssues.length;
          centroidLng = sectorIssues.reduce((s, i) => s + i.coordinates.lng, 0) / sectorIssues.length;
        }
        const dist = haversineKm(vol.coordinates!.lat, vol.coordinates!.lng, centroidLat, centroidLng);
        if (dist < bestDist) {
          bestDist = dist;
          bestSector = sectorId;
        }
      }
    }

    const sector = sectors.get(bestSector);
    if (sector) {
      sector.volunteerIds.push(vol.uid);
      (vol.skills || []).forEach(skill => {
        sector.supplies[skill] = (sector.supplies[skill] || 0) + 1;
      });
    }
  });

  // Compute urgency scores with UPGRADED formula
  sectors.forEach(sector => {
    let totalDemand = 0, totalHighPriority = 0, totalAffected = 0, totalSupply = 0;

    ALL_CATEGORIES.forEach(cat => {
      const d = sector.demands[cat];
      totalDemand += d.count;
      totalHighPriority += d.highPriority;
      totalAffected += d.totalAffected;
      const primarySkill = getPrimarySkill(cat);
      totalSupply += sector.supplies[primarySkill] || 0;
    });

    // A++ Urgency formula: priority + demand + affected + coverage gap
    const coverageGap = (totalDemand > 0 && totalSupply === 0) ? 20 : 0;
    sector.urgencyScore = Math.min(100, 
      totalHighPriority * 25 + 
      totalDemand * 10 + 
      Math.floor(totalAffected / 50) +
      coverageGap
    );

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

// ========= MISALLOCATION DETECTION =========

export function detectMisallocations(
  sectorMatrix: SectorHealth[],
  volunteers: UserProfile[]
): MisallocationAlert[] {
  const alerts: MisallocationAlert[] = [];
  let alertId = 0;

  sectorMatrix.forEach(sector => {
    ALL_CATEGORIES.forEach(cat => {
      const demand = sector.demands[cat];
      const primarySkill = getPrimarySkill(cat);
      const supply = sector.supplies[primarySkill] || 0;

      if (demand.count > 0 && supply === 0) {
        // CRITICAL GAP — also check secondary skills now
        const allSkillsForCat = SHARED_SKILL_MAP[cat] || [];
        const hasAnyRelevantSkill = allSkillsForCat.some(m => (sector.supplies[m.skill] || 0) > 0);
        
        const surplusSector = sectorMatrix.find(other => 
          other.sectorId !== sector.sectorId && 
          (other.supplies[primarySkill] || 0) > 0 &&
          other.demands[cat].count === 0
        );

        let suggestedVol: UserProfile | undefined;
        if (surplusSector) {
          suggestedVol = volunteers.find(v => 
            surplusSector.volunteerIds.includes(v.uid) &&
            v.skills?.includes(primarySkill) &&
            v.status !== 'en-route'
          );
        }

        alerts.push({
          id: `alert-${alertId++}`,
          type: hasAnyRelevantSkill ? 'SKILL_MISMATCH' : 'CRITICAL_GAP',
          sector: sector.sectorId,
          sectorName: sector.sectorName,
          category: cat,
          demandCount: demand.count,
          supplyCount: 0,
          urgencyScore: Math.min(100, demand.highPriority * 30 + demand.count * 15 + Math.floor(demand.totalAffected / 20)),
          suggestion: surplusSector 
            ? `Redeploy ${primarySkill} volunteer from ${surplusSector.sectorName} → ${sector.sectorName}`
            : hasAnyRelevantSkill
              ? `${sector.sectorName} has volunteers with secondary skills. Consider cross-training or deploying with guidance.`
              : `No ${primarySkill} volunteers available anywhere. Escalate to partner NGOs immediately.`,
          suggestedVolunteerId: suggestedVol?.uid,
          suggestedFromSector: surplusSector?.sectorId,
          timestamp: new Date().toISOString()
        });
      } else if (demand.count === 0 && supply > 1) {
        alerts.push({
          id: `alert-${alertId++}`,
          type: 'SURPLUS',
          sector: sector.sectorId,
          sectorName: sector.sectorName,
          category: cat,
          demandCount: 0,
          supplyCount: supply,
          urgencyScore: 15,
          suggestion: `${supply} ${primarySkill} volunteers idle in ${sector.sectorName}. Consider redeployment to high-need sectors.`,
          timestamp: new Date().toISOString()
        });
      }
    });

    // SKILL MISMATCH at sector level
    const totalDemandInSector = ALL_CATEGORIES.reduce((s, c) => s + sector.demands[c].count, 0);
    if (totalDemandInSector > 0 && sector.volunteerIds.length > 0) {
      const unmetCategories = ALL_CATEGORIES.filter(cat => {
        const d = sector.demands[cat];
        const primarySkill = getPrimarySkill(cat);
        return d.count > 0 && (sector.supplies[primarySkill] || 0) === 0;
      });

      if (unmetCategories.length > 0) {
        const cat = unmetCategories[0];
        const primarySkill = getPrimarySkill(cat);
        alerts.push({
          id: `alert-${alertId++}`,
          type: 'SKILL_MISMATCH',
          sector: sector.sectorId,
          sectorName: sector.sectorName,
          category: cat,
          demandCount: sector.demands[cat].count,
          supplyCount: sector.volunteerIds.length,
          urgencyScore: 40,
          suggestion: `${sector.sectorName} has ${sector.volunteerIds.length} volunteers, but none with ${primarySkill} skills needed for ${cat} issues.`,
          timestamp: new Date().toISOString()
        });
      }
    }
  });

  return alerts.sort((a, b) => b.urgencyScore - a.urgencyScore);
}

// ========= A++ TWO-PASS OPTIMAL ASSIGNMENTS =========

export function computeOptimalAssignments(
  issues: Issue[],
  volunteers: UserProfile[]
): OptimalAssignment[] {
  const unassigned = issues.filter(i => i.status === 'reported' && !i.assignedTo);
  const available = volunteers.filter(v => v.status === 'standby' || v.status === 'active');

  if (unassigned.length === 0 || available.length === 0) return [];

  // Score all pairs with A++ formula
  const pairs: { issue: Issue; volunteer: UserProfile; score: number; dist: number; skillMatch: boolean; matchTier: string }[] = [];

  unassigned.forEach(issue => {
    available.forEach(vol => {
      const { score: skillScore, matchTier } = computeSkillScore(vol.skills || [], issue.category);

      let dist = 50;
      if (vol.coordinates) {
        dist = haversineKm(vol.coordinates.lat, vol.coordinates.lng, issue.coordinates.lat, issue.coordinates.lng);
      }
      const proximityScore = Math.max(0, 1 - (dist / 100));

      const urgencyScore = PRIORITY_WEIGHT[issue.priority] / 3;
      
      // A++ factors
      const availabilityScore = vol.availability === 'immediate' ? 1.0 : vol.availability === 'on-call' ? 0.7 : 0.4;
      const fatigueFactor = computeFatigueFactor(vol);
      const trackRecord = computeTrackRecord(vol);

      // A++ weighted score
      const totalScore = 
        skillScore * 0.30 +      // Skill match (tiered)
        proximityScore * 0.25 +   // Proximity
        urgencyScore * 0.15 +     // Issue urgency
        availabilityScore * 0.10 + // Volunteer availability
        fatigueFactor * 0.10 +    // Not exhausted
        trackRecord * 0.10;       // Past performance

      pairs.push({ issue, volunteer: vol, score: totalScore, dist, skillMatch: matchTier === 'exact', matchTier });
    });
  });

  // TWO-PASS MATCHING
  // Pass 1: Assign exact skill matches first (sorted by score)
  const exactPairs = pairs.filter(p => p.matchTier === 'exact').sort((a, b) => b.score - a.score);
  const secondaryPairs = pairs.filter(p => p.matchTier !== 'exact').sort((a, b) => b.score - a.score);
  
  const assignedVolunteers = new Set<string>();
  const assignedIssues = new Set<string>();
  const results: OptimalAssignment[] = [];

  // Pass 1: exact matches
  for (const pair of exactPairs) {
    if (assignedVolunteers.has(pair.volunteer.uid) || assignedIssues.has(pair.issue.id)) continue;
    assignedVolunteers.add(pair.volunteer.uid);
    assignedIssues.add(pair.issue.id);

    const primarySkill = getPrimarySkill(pair.issue.category);
    results.push({
      issueId: pair.issue.id,
      issueTitle: pair.issue.title,
      volunteerId: pair.volunteer.uid,
      volunteerName: pair.volunteer.name,
      score: pair.score,
      reasoning: `${pair.volunteer.name} has exact ${primarySkill} skills, is ${pair.dist.toFixed(1)}km away` +
        (pair.volunteer.performanceScore ? ` (perf: ${pair.volunteer.performanceScore}/100)` : ''),
      estimatedDistance: pair.dist,
      skillMatch: true
    });
  }

  // Pass 2: fill remaining with best available (secondary/tertiary)
  for (const pair of secondaryPairs) {
    if (assignedVolunteers.has(pair.volunteer.uid) || assignedIssues.has(pair.issue.id)) continue;
    assignedVolunteers.add(pair.volunteer.uid);
    assignedIssues.add(pair.issue.id);

    const primarySkill = getPrimarySkill(pair.issue.category);
    results.push({
      issueId: pair.issue.id,
      issueTitle: pair.issue.title,
      volunteerId: pair.volunteer.uid,
      volunteerName: pair.volunteer.name,
      score: pair.score,
      reasoning: pair.matchTier !== 'none'
        ? `${pair.volunteer.name} has ${pair.matchTier} skills for ${pair.issue.category}, ${pair.dist.toFixed(1)}km away`
        : `Closest available volunteer at ${pair.dist.toFixed(1)}km (no skill match for ${primarySkill})`,
      estimatedDistance: pair.dist,
      skillMatch: false
    });
  }

  return results;
}

// ========= HEATMAP DATA =========

export function generateHeatmapData(issues: Issue[]): HeatmapPoint[] {
  const activeIssues = issues.filter(i => i.status !== 'resolved');
  const now = Date.now();

  return activeIssues.map(issue => {
    const priorityWeight = PRIORITY_WEIGHT[issue.priority] / 3;
    const affectedWeight = Math.min(1, (issue.peopleAffected || 1) / 500);
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

// ========= DASHBOARD STATS =========

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

  const highPri = active.filter(i => i.priority === 'HIGH');
  const highPriCovered = highPri.filter(i => i.assignedTo);
  const efficiency = highPri.length > 0 
    ? Math.round((highPriCovered.length / highPri.length) * 100) 
    : 100;

  // A++ metric: average volunteer performance score
  const scoredVols = volunteers.filter(v => v.performanceScore !== undefined);
  const avgPerformance = scoredVols.length > 0
    ? Math.round(scoredVols.reduce((s, v) => s + (v.performanceScore || 0), 0) / scoredVols.length)
    : null;

  return {
    totalActive: active.length,
    unassignedCount: unassigned.length,
    standbyVolunteers: standby.length,
    deployedVolunteers: deployed.length,
    criticalSectors: criticalSectors.length,
    totalAffected,
    allocationEfficiency: efficiency,
    avgVolunteerPerformance: avgPerformance
  };
}

// ========= A++ TEMPORAL INTELLIGENCE =========

/**
 * Detects escalation trends: issues getting worse over time.
 */
export function computeEscalationAlerts(issues: Issue[]): EscalationAlert[] {
  const alerts: EscalationAlert[] = [];
  const activeIssues = issues.filter(i => i.status !== 'resolved');
  const now = Date.now();
  const ONE_HOUR = 60 * 60 * 1000;

  // Group by areaId to detect sector-level trends
  const sectorIssues = new Map<string, Issue[]>();
  activeIssues.forEach(issue => {
    const arr = sectorIssues.get(issue.areaId) || [];
    arr.push(issue);
    sectorIssues.set(issue.areaId, arr);
  });

  sectorIssues.forEach((sectorIss, sectorId) => {
    // Issues reported in last hour vs older
    const recentIssues = sectorIss.filter(i => (now - new Date(i.timestamp).getTime()) < ONE_HOUR);
    const olderIssues = sectorIss.filter(i => (now - new Date(i.timestamp).getTime()) >= ONE_HOUR);
    
    const signalDelta = recentIssues.length;
    const recentAffected = recentIssues.reduce((s, i) => s + (i.peopleAffected || 0), 0);
    const olderAffected = olderIssues.reduce((s, i) => s + (i.peopleAffected || 0), 0);
    const affectedDelta = recentAffected;

    // Determine trend
    let trendDirection: 'worsening' | 'stable' | 'improving' = 'stable';
    if (signalDelta >= 2 || recentAffected > olderAffected * 0.5) {
      trendDirection = 'worsening';
    } else if (sectorIss.length > 0 && recentIssues.length === 0) {
      trendDirection = 'improving';
    }

    if (trendDirection === 'worsening') {
      const highCount = sectorIss.filter(i => i.priority === 'HIGH').length;
      const projectedHours = highCount > 2 ? 1 : highCount > 0 ? 3 : 6;

      alerts.push({
        id: `esc-${sectorId}-${Date.now()}`,
        issueId: recentIssues[0]?.id || sectorIss[0].id,
        issueTitle: `${signalDelta} new reports in ${sectorId}`,
        sector: sectorId,
        sectorName: sectorId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        previousPriority: 'MED',
        currentPriority: highCount > 0 ? 'HIGH' : 'MED',
        signalDelta,
        affectedDelta,
        trendDirection,
        projectedEscalationHours: projectedHours,
        recommendation: `${signalDelta} new signals detected in the last hour affecting ${recentAffected} people. ` +
          `Situation projected to escalate within ${projectedHours}h if unaddressed. ` +
          `Consider preemptive volunteer deployment.`,
        timestamp: new Date().toISOString()
      });
    }
  });

  return alerts.sort((a, b) => a.projectedEscalationHours - b.projectedEscalationHours);
}

// ========= A++ ISSUE CLUSTERING =========

/**
 * Groups geographically close issues of the same category into clusters
 * for coordinated multi-issue response.
 */
export function clusterRelatedIssues(issues: Issue[]): IssueCluster[] {
  const activeIssues = issues.filter(i => i.status !== 'resolved');
  const clusters: IssueCluster[] = [];
  const clustered = new Set<string>();
  const CLUSTER_RADIUS_KM = 10;

  activeIssues.forEach(issue => {
    if (clustered.has(issue.id)) return;

    // Find nearby issues of same category
    const nearby = activeIssues.filter(other => 
      other.id !== issue.id &&
      !clustered.has(other.id) &&
      other.category === issue.category &&
      haversineKm(issue.coordinates.lat, issue.coordinates.lng, other.coordinates.lat, other.coordinates.lng) <= CLUSTER_RADIUS_KM
    );

    if (nearby.length >= 1) { // At least 2 issues to form a cluster
      const allInCluster = [issue, ...nearby];
      allInCluster.forEach(i => clustered.add(i.id));

      const centroidLat = allInCluster.reduce((s, i) => s + i.coordinates.lat, 0) / allInCluster.length;
      const centroidLng = allInCluster.reduce((s, i) => s + i.coordinates.lng, 0) / allInCluster.length;
      const maxDist = Math.max(...allInCluster.map(i => 
        haversineKm(centroidLat, centroidLng, i.coordinates.lat, i.coordinates.lng)
      ));
      const totalAffected = allInCluster.reduce((s, i) => s + (i.peopleAffected || 0), 0);

      clusters.push({
        id: `cluster-${issue.category}-${clusters.length}`,
        name: `${issue.category} Response — ${issue.areaId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`,
        issueIds: allInCluster.map(i => i.id),
        category: issue.category,
        centroid: { lat: centroidLat, lng: centroidLng },
        radiusKm: Math.max(1, maxDist),
        totalAffected,
        coordinatedResponse: `${allInCluster.length} related ${issue.category} incidents within ${maxDist.toFixed(1)}km radius affecting ${totalAffected} people. Coordinated team deployment recommended.`,
        timestamp: new Date().toISOString()
      });
    }
  });

  return clusters.sort((a, b) => b.totalAffected - a.totalAffected);
}
