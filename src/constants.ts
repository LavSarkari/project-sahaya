import { Issue, Area, ResponseTeam } from './types';

/**
 * DEFAULT_AREAS — Fallback sector definitions for Lucknow.
 * The A++ allocation engine in allocationService.ts auto-discovers
 * additional sectors dynamically from issue data coordinates.
 * These serve as the baseline known sectors.
 */
export const AREAS: Area[] = [
  { id: 'aliganj', name: 'Aliganj', status: 'red', activeIssues: 12 },
  { id: 'gomti-nagar', name: 'Gomti Nagar', status: 'yellow', activeIssues: 5 },
  { id: 'indira-nagar', name: 'Indira Nagar', status: 'green', activeIssues: 2 },
  { id: 'hazratganj', name: 'Hazratganj', status: 'red', activeIssues: 8 },
  { id: 'chowk', name: 'Chowk', status: 'yellow', activeIssues: 4 },
  { id: 'jankipuram', name: 'Jankipuram', status: 'green', activeIssues: 1 },
];

export const MOCK_ISSUES: Issue[] = [
  {
    id: '1',
    title: 'Food Shortage - Refugee Camp A',
    location: 'Sector 4, Aliganj',
    areaId: 'aliganj',
    peopleAffected: 450,
    priority: 'HIGH',
    category: 'FOOD',
    aiRecommendation: 'Dispatch 2 emergency supply trucks and notify local NGOs for distribution support.',
    confidence: 94,
    eta: '45 mins',
    riskMessage: 'High risk of civil unrest if supplies do not arrive within 2 hours.',
    status: 'reported',
    coordinates: { lat: 26.8922, lng: 80.9366 },
    timestamp: '2024-03-15T08:30:00Z',
  },
  {
    id: '2',
    title: 'Medical Assistance Required',
    location: 'Vivek Khand, Gomti Nagar',
    areaId: 'gomti-nagar',
    peopleAffected: 25,
    priority: 'MED',
    category: 'MEDICAL',
    aiRecommendation: 'Deploy onsite medical triage team and establish a mobile clinic.',
    confidence: 88,
    status: 'reported',
    eta: '30 mins',
    riskMessage: 'Potential spread of infection if localized treatment is delayed.',
    coordinates: { lat: 26.8500, lng: 80.9900 },
    timestamp: '2024-03-15T09:15:00Z',
  },
  {
    id: '3',
    title: 'Water Contamination Alert',
    location: 'Block C, Hazratganj',
    areaId: 'hazratganj',
    peopleAffected: 1200,
    priority: 'HIGH',
    category: 'WATER',
    aiRecommendation: 'Shutdown main supply line B-12 and dispatch 5 water tankers.',
    confidence: 91,
    status: 'reported',
    eta: '1 hour',
    riskMessage: 'Severe threat of waterborne disease outbreak in high-density residential zones.',
    coordinates: { lat: 26.8467, lng: 80.9462 },
    timestamp: '2024-03-15T07:45:00Z',
  },
  {
    id: '4',
    title: 'Shelter Damage - Tropical Storm',
    location: 'Sector 2, Aliganj',
    areaId: 'aliganj',
    peopleAffected: 80,
    priority: 'MED',
    category: 'SHELTER',
    aiRecommendation: 'Deliver 50 reinforced tents and 200 blankets.',
    confidence: 85,
    status: 'reported',
    eta: '2 hours',
    riskMessage: 'Exposure risk due to plummeting night temperatures.',
    coordinates: { lat: 26.8950, lng: 80.9300 },
    timestamp: '2024-03-15T10:00:00Z',
  },
  {
    id: '5',
    title: 'Security Breach Reported',
    location: 'Old City, Chowk',
    areaId: 'chowk',
    peopleAffected: 0,
    priority: 'LOW',
    category: 'SECURITY',
    aiRecommendation: 'Increase drone surveillance and notify local patrol units.',
    confidence: 79,
    status: 'reported',
    eta: '15 mins',
    riskMessage: 'Low direct impact, but monitoring required to prevent escalation.',
    coordinates: { lat: 26.8700, lng: 80.9100 },
    timestamp: '2024-03-15T11:20:00Z',
  },
];

export const RESPONSE_TEAMS: ResponseTeam[] = [
  {
    id: 'rt-1',
    name: 'Rapid Response Alpha',
    status: 'en-route',
    coordinates: { lat: 26.8700, lng: 80.9500 },
    capacity: 12,
  },
  {
    id: 'rt-2',
    name: 'Medical Unit 4',
    status: 'active',
    coordinates: { lat: 26.8550, lng: 80.9700 },
    capacity: 8,
  },
  {
    id: 'rt-3',
    name: 'Logistics Team Beta',
    status: 'standby',
    coordinates: { lat: 26.8800, lng: 80.9300 },
    capacity: 20,
  },
];
