import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { AREAS } from "../constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isAdminEmail(email?: string | null) {
  return email?.toLowerCase() === 'luv.sarkari@gmail.com';
}

export function getNearestArea(lat: number, lng: number) {
  const coordinates: Record<string, {lat: number, lng: number}> = {
    'aliganj': { lat: 26.8922, lng: 80.9366 },
    'gomti-nagar': { lat: 26.8500, lng: 80.9900 },
    'hazratganj': { lat: 26.8467, lng: 80.9462 },
    'indira-nagar': { lat: 26.8850, lng: 80.9700 },
    'chowk': { lat: 26.8700, lng: 80.9100 },
    'jankipuram': { lat: 26.9100, lng: 80.9400 }
  };

  let nearestId = 'aliganj';
  let minDistance = Infinity;

  Object.entries(coordinates).forEach(([id, coords]) => {
    const dist = Math.sqrt(Math.pow(lat - coords.lat, 2) + Math.pow(lng - coords.lng, 2));
    if (dist < minDistance) {
      minDistance = dist;
      nearestId = id;
    }
  });

  return nearestId;
}
