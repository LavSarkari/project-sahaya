/**
 * Feedback & Audit Service — A++ Feedback Loop
 * 
 * Records assignment outcomes, computes volunteer performance,
 * and maintains an audit trail of all allocation decisions.
 */

import { doc, updateDoc, addDoc, collection, getDocs, query, where, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { AssignmentOutcome, AllocationLogEntry } from '../types';

/**
 * Record the outcome of a completed assignment.
 * Updates the issue with resolution data AND updates the volunteer's performance metrics.
 */
export async function recordOutcome(
  issueId: string,
  volunteerId: string,
  volunteerName: string,
  outcome: AssignmentOutcome
): Promise<void> {
  try {
    // 1. Update the issue with outcome data
    const issueRef = doc(db, 'issues', issueId);
    await updateDoc(issueRef, {
      outcome,
      resolvedAt: outcome.resolvedAt,
      status: 'resolved'
    });

    // 2. Update volunteer performance metrics
    const volunteerRef = doc(db, 'users', volunteerId);
    
    // Fetch current stats to compute running average
    const volSnap = await getDocs(query(collection(db, 'users'), where('uid', '==', volunteerId)));
    const currentData = volSnap.docs[0]?.data();
    const prevCompleted = currentData?.completedTasks || 0;
    const prevAvgTime = currentData?.avgResolutionTime || 0;
    
    // Running average: new_avg = (old_avg * old_count + new_value) / new_count
    const newCompleted = prevCompleted + 1;
    const newAvgTime = (prevAvgTime * prevCompleted + outcome.resolutionMinutes) / newCompleted;
    
    // Performance score: weighted by rating (if given) and resolution speed
    const speedScore = Math.max(0, 100 - (outcome.resolutionMinutes / 2)); // Fast = higher
    const ratingScore = outcome.volunteerRating ? outcome.volunteerRating * 20 : 60; // Default neutral
    const effectiveScore = outcome.effective ? 80 : 30;
    const newPerformance = Math.round((speedScore * 0.3 + ratingScore * 0.4 + effectiveScore * 0.3));

    // Blend with existing score
    const prevScore = currentData?.performanceScore || 50;
    const blendedScore = Math.round((prevScore * prevCompleted + newPerformance) / newCompleted);

    await updateDoc(volunteerRef, {
      completedTasks: newCompleted,
      avgResolutionTime: Math.round(newAvgTime),
      performanceScore: Math.min(100, Math.max(0, blendedScore)),
      status: 'standby',
      activeTaskId: null,
      hoursDeployedToday: increment(Math.ceil(outcome.resolutionMinutes / 60))
    });

    // 3. Log the resolution action
    await logAllocationAction({
      action: 'resolve',
      issueId,
      issueTitle: '', // Will be filled by caller
      volunteerId,
      volunteerName,
      reasoning: `Resolved in ${outcome.resolutionMinutes} minutes. ${outcome.effective ? 'Effective.' : 'Needs improvement.'}${outcome.notes ? ` Notes: ${outcome.notes}` : ''}`,
      triggeredBy: 'volunteer-self'
    });
  } catch (err) {
    console.error('Failed to record outcome:', err);
    throw err;
  }
}

/**
 * Log an allocation action to the audit trail.
 */
export async function logAllocationAction(entry: Omit<AllocationLogEntry, 'id' | 'timestamp'>): Promise<void> {
  try {
    await addDoc(collection(db, 'allocation_log'), {
      ...entry,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Failed to log allocation action:', err);
    // Don't throw — audit logging should never block the main flow
  }
}

/**
 * Get a volunteer's track record for a specific issue category.
 */
export async function getVolunteerTrackRecord(
  volunteerId: string
): Promise<{ completedTasks: number; avgTime: number; score: number }> {
  try {
    const userSnap = await getDocs(query(collection(db, 'users'), where('uid', '==', volunteerId)));
    if (userSnap.empty) return { completedTasks: 0, avgTime: 0, score: 50 };
    
    const data = userSnap.docs[0].data();
    return {
      completedTasks: data.completedTasks || 0,
      avgTime: data.avgResolutionTime || 0,
      score: data.performanceScore || 50
    };
  } catch (err) {
    console.error('Failed to fetch track record:', err);
    return { completedTasks: 0, avgTime: 0, score: 50 };
  }
}
