/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ResponseTeam {
  id: string;
  name: string;
  status: 'active' | 'standby' | 'en-route';
  coordinates: {
    lat: number;
    lng: number;
  };
  capacity: number;
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
}

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
}


export interface VolunteerApplication {
  id: string; // Maps to User UID
  name: string;
  email: string;
  skills: string[];
  bio: string;
  idProofText: string;
  phone: string;
  address: string;
  availability: 'immediate' | 'scheduled' | 'on-call';
  emergencyContact?: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: string;
}


export interface ResponseTeam {
  id: string; // This will map to UserProfile.uid for volunteers
  name: string;
  status: 'active' | 'standby' | 'en-route';
  coordinates: {
    lat: number;
    lng: number;
  };
  capacity: number;
  skills?: string[];
}

export interface Area {
  id: string;
  name: string;
  status: 'green' | 'yellow' | 'red';
  activeIssues: number;
}
