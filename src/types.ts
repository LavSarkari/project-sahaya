/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ResponseTeam {
  id: string; // Maps to UserProfile.uid for volunteers
  name: string;
  status: 'active' | 'standby' | 'en-route';
  coordinates: {
    lat: number;
    lng: number;
  };
  capacity: number;
  skills?: string[];
}

export type Priority = 'HIGH' | 'MED' | 'LOW';

export type Category = 'FOOD' | 'MEDICAL' | 'WATER' | 'SHELTER' | 'SECURITY';

export type IssueStatus = 'reported' | 'assigned' | 'in-progress' | 'resolved';

export interface Issue {
  id: string;
  title: string;
  location: string;
  areaId: string;
  peopleAffected: number;
  priority: Priority;
  category: Category;
  status: IssueStatus;
  aiRecommendation: string;
  confidence: number;
  eta: string;
  riskMessage: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  timestamp: string;
  assignedTo?: string; // Volunteer ID
  resolvedBy?: string;
  signalCount?: number; // How many reports merged into this
  sourceDescriptions?: string[]; // Raw descriptions from different reporters
  dataSource?: DataSource; // Which campaign/silo this data came from
  sourceOrg?: string; // Organization name (e.g. "Red Cross")
  description?: string; // Raw description text
  // === A++ UPGRADE: Feedback Loop & Intelligence Fields ===
  resolvedAt?: string; // ISO timestamp of resolution
  assignmentHistory?: AssignmentHistoryEntry[]; // Track all volunteer assignments
  outcome?: AssignmentOutcome; // Resolution quality tracking
  clusterId?: string; // Links related issues into coordinated responses
  escalationCount?: number; // How many times urgency was escalated
  lastEscalatedAt?: string; // Temporal intelligence: last escalation time
}

export type DataSource = 'field_report' | 'food_drive' | 'medical_camp' | 'blood_donation' | 'disability_program' | 'ngo_partner';

export type UserRole = 'admin' | 'volunteer' | 'reporter';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  name: string;
  skills?: string[];
  bio?: string;
  applicationStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  status?: 'active' | 'standby' | 'en-route';
  activeTaskId?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  phone?: string;
  address?: string;
  availability?: 'immediate' | 'scheduled' | 'on-call';
  emergencyContact?: string;
  notificationPreferences?: {
    email: boolean;
    sms: boolean;
    telegram: boolean;
  };
  telegramChatId?: string;
  // === A++ UPGRADE: Performance & Fatigue Tracking ===
  completedTasks?: number; // Total resolved issues
  avgResolutionTime?: number; // Average minutes to resolve
  performanceScore?: number; // 0-100, computed from outcomes
  hoursDeployedToday?: number; // Fatigue tracking
  lastDeployedAt?: string; // ISO timestamp of last deployment
  specializations?: string[]; // Richer than skills: domain-specific expertise
}


export interface VolunteerApplication {
  id: string; // Maps to User UID
  name: string;
  email: string;
  skills: string[];
  bio: string;
  idProofText?: string;
  idProofUrl?: string;
  profilePicUrl?: string;
  phone: string;
  homeAddress?: string;
  serviceArea?: string;
  workingHours?: string;
  availability: 'immediate' | 'scheduled' | 'on-call';
  emergencyContact?: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: string;
  aiVerification?: {
    isHumanFace: boolean;
    notes?: string;
  };
}

export interface Area {
  id: string;
  name: string;
  status: 'green' | 'yellow' | 'red';
  activeIssues: number;
}

// ========= ALLOCATION ENGINE TYPES =========

export type AlertType = 'CRITICAL_GAP' | 'SURPLUS' | 'SKILL_MISMATCH' | 'PROXIMITY_WASTE';

export interface MisallocationAlert {
  id: string;
  type: AlertType;
  sector: string;
  sectorName: string;
  category: Category;
  demandCount: number;
  supplyCount: number;
  urgencyScore: number; // 0-100
  suggestion: string;
  suggestedVolunteerId?: string;
  suggestedFromSector?: string;
  timestamp: string;
}

export interface SectorHealth {
  sectorId: string;
  sectorName: string;
  demands: Record<Category, { count: number; totalAffected: number; highPriority: number }>;
  supplies: Record<string, number>; // skill → count of available volunteers
  volunteerIds: string[];
  overallStatus: 'critical' | 'strained' | 'balanced' | 'surplus';
  urgencyScore: number;
}

export interface OptimalAssignment {
  issueId: string;
  issueTitle: string;
  volunteerId: string;
  volunteerName: string;
  score: number; // 0-1
  reasoning: string;
  estimatedDistance: number; // km
  skillMatch: boolean;
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number; // 0-1
  category: Category;
}

// ========= A++ UPGRADE: FEEDBACK LOOP TYPES =========

export interface AssignmentHistoryEntry {
  volunteerId: string;
  volunteerName: string;
  assignedAt: string; // ISO timestamp
  unassignedAt?: string; // ISO timestamp if reassigned
  reason?: string; // Why they were unassigned
}

export interface AssignmentOutcome {
  effective: boolean;
  resolutionMinutes: number;
  volunteerRating?: 1 | 2 | 3 | 4 | 5; // Admin rates effectiveness
  notes?: string;
  resolvedBy: string; // Volunteer UID
  resolvedAt: string; // ISO timestamp
}

export interface AllocationLogEntry {
  id: string;
  timestamp: string;
  action: 'assign' | 'redeploy' | 'auto-assign' | 'resolve' | 'escalate';
  issueId: string;
  issueTitle: string;
  volunteerId?: string;
  volunteerName?: string;
  matchScore?: number;
  reasoning: string;
  triggeredBy: 'admin' | 'autopilot' | 'volunteer-self' | 'system';
}

// ========= A++ UPGRADE: TEMPORAL INTELLIGENCE TYPES =========

export interface EscalationAlert {
  id: string;
  issueId: string;
  issueTitle: string;
  sector: string;
  sectorName: string;
  previousPriority: Priority;
  currentPriority: Priority;
  signalDelta: number; // New reports in last hour
  affectedDelta: number; // Change in affected count
  trendDirection: 'worsening' | 'stable' | 'improving';
  projectedEscalationHours: number; // Hours until critical if unchecked
  recommendation: string;
  timestamp: string;
}

export interface IssueCluster {
  id: string;
  name: string; // Auto-generated name like "Flood Response - Sector 3"
  issueIds: string[];
  category: Category;
  centroid: { lat: number; lng: number };
  radiusKm: number;
  totalAffected: number;
  coordinatedResponse: string; // AI-generated unified response plan
  timestamp: string;
}

// ========= A++ UPGRADE: SHARED SKILL MAPPING =========

export type SkillTier = 'exact' | 'secondary' | 'tertiary';

export interface SkillMapping {
  skill: string;
  tier: SkillTier;
  weight: number; // exact=1.0, secondary=0.6, tertiary=0.3
}

export const CATEGORY_SKILL_MAP: Record<Category, SkillMapping[]> = {
  'MEDICAL': [
    { skill: 'medical', tier: 'exact', weight: 1.0 },
    { skill: 'search and rescue', tier: 'secondary', weight: 0.6 },
    { skill: 'logistics', tier: 'tertiary', weight: 0.3 },
  ],
  'FOOD': [
    { skill: 'food distribution', tier: 'exact', weight: 1.0 },
    { skill: 'logistics', tier: 'secondary', weight: 0.6 },
    { skill: 'communications', tier: 'tertiary', weight: 0.3 },
  ],
  'WATER': [
    { skill: 'logistics', tier: 'exact', weight: 1.0 },
    { skill: 'medical', tier: 'secondary', weight: 0.6 },
    { skill: 'communications', tier: 'tertiary', weight: 0.3 },
  ],
  'SHELTER': [
    { skill: 'search and rescue', tier: 'exact', weight: 1.0 },
    { skill: 'logistics', tier: 'secondary', weight: 0.6 },
    { skill: 'communications', tier: 'tertiary', weight: 0.3 },
  ],
  'SECURITY': [
    { skill: 'search and rescue', tier: 'exact', weight: 1.0 },
    { skill: 'communications', tier: 'secondary', weight: 0.6 },
    { skill: 'medical', tier: 'tertiary', weight: 0.3 },
  ],
};
