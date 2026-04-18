import { collection, onSnapshot, query, orderBy, doc, writeBatch, getDocs, where, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Issue } from '../types';
import { MOCK_ISSUES } from '../constants';

export enum OperationType {
  GET = 'get',
  LIST = 'list',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {},
    operationType,
    path
  };
  console.error('Firestore Error Details: ', errInfo);
  // Don't throw inside listeners to avoid uncaught exceptions, 
  // just log and allow the UI to handle the empty state
}

import { mergeSignals } from './geminiService';

export const submitReport = async (report: Omit<Issue, 'id' | 'eta'> & { rawDescription?: string }) => {
  try {
    const issuesRef = collection(db, 'issues');
    // Find active issues in the same area to potentially aggregate
    const q = query(
      issuesRef, 
      where('areaId', '==', report.areaId),
      where('status', '!=', 'resolved')
    );

    const snapshot = await getDocs(q);
    const existingIssues = snapshot.docs.map(d => ({ ...d.data(), id: d.id }) as Issue);
    
    // Use AI to decide if we should merge
    const signalWithMeta = {
      ...report,
      signalCount: 1,
      sourceDescriptions: [report.rawDescription || report.title]
    };

    const mergeResult = await mergeSignals(signalWithMeta, existingIssues);

    if (mergeResult.shouldMerge && mergeResult.mergedIssue) {
      const { id, ...updateData } = mergeResult.mergedIssue;
      if (id) {
        await updateDoc(doc(db, 'issues', id), {
           ...updateData,
           timestamp: new Date().toISOString()
        });
        return { id, type: 'aggregated' };
      }
    } 

    // Else create new
    const newIssue = {
      ...signalWithMeta,
      status: 'reported',
      eta: 'Calculating...', 
    };
    const { rawDescription, ...cleanIssue } = newIssue as any;
    const docRef = await addDoc(issuesRef, cleanIssue);
    return { id: docRef.id, type: 'new' };
    
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'issues');
  }
};

export const subscribeToIssues = (onIssuesUpdate: (issues: Issue[]) => void) => {
  const issuesCollection = collection(db, 'issues');
  const q = query(issuesCollection, orderBy('timestamp', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const issues = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as Issue[];
    onIssuesUpdate(issues);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'issues');
  });
};

export const seedData = async () => {
  try {
    const batch = writeBatch(db);
    MOCK_ISSUES.forEach((issue) => {
      const docRef = doc(collection(db, 'issues'), issue.id);
      batch.set(docRef, issue);
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'issues');
  }
};
