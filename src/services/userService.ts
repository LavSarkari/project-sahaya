import { doc, updateDoc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';

import { db } from '../firebase';
import { UserProfile, VolunteerApplication } from '../types';

/**
 * Validates if a user exist in the system.
 */
export const verifyUserExists = async (uid: string): Promise<boolean> => {
  if (!uid) return false;
  const docRef = doc(db, 'users', uid);
  const snap = await getDoc(docRef);
  return snap.exists();
};

/**
 * Manually upgrades a user's clearance to Volunteer.
 */
export const enrollPersonnelManually = async (uid: string): Promise<{ success: boolean; message: string }> => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return { success: false, message: "Personnel ID not found in system registry." };
    }

    await updateDoc(userRef, { 
      role: 'volunteer',
      applicationStatus: 'approved',
      status: 'standby'
    });

    return { success: true, message: "Personnel clearance upgraded successfully." };
  } catch (error) {
    console.error('Enrollment error:', error);
    return { success: false, message: "System error during enrollment." };
  }
};

/**
 * Approves a volunteer application and promotes the user.
 */
export const approveApplication = async (app: VolunteerApplication) => {
  const userRef = doc(db, 'users', app.id);
  await updateDoc(userRef, {
    role: 'volunteer',
    skills: app.skills,
    bio: app.bio,
    phone: app.phone,
    address: app.address,
    availability: app.availability,
    emergencyContact: app.emergencyContact,
    applicationStatus: 'approved',
    status: 'standby'
  });

  await deleteDoc(doc(db, 'volunteer_applications', app.id));
};


/**
 * Revokes volunteer access and demotes to reporter.
 */
export const revokeVolunteerAccess = async (uid: string) => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    role: 'reporter',
    applicationStatus: 'none',
    status: 'active'
  });
};

/**
 * Rejects a volunteer application.
 */
export const rejectApplication = async (appId: string) => {
  const userRef = doc(db, 'users', appId);
  await updateDoc(userRef, { applicationStatus: 'rejected' });
  await deleteDoc(doc(db, 'volunteer_applications', appId));
};

/**
 * Fetches all volunteers who are currently on standby for assignment.
 */
export const getAvailableVolunteers = async (): Promise<UserProfile[]> => {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('role', '==', 'volunteer'), where('status', '==', 'standby'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ ...doc.data() }) as UserProfile);
};

