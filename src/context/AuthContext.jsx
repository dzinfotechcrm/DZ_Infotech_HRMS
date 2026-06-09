import { createContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, setDoc, updateDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { logout, signInWithGoogle } from '../firebase/auth';
import { initializeSeedData } from '../firebase/seed';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    let unsubscribeProfile = null;
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setFirebaseUser(currentUser);
      setLoading(true);
      setAccessDenied(false);

      if (!currentUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      if (unsubscribeProfile) {
        unsubscribeProfile();
      }

      unsubscribeProfile = onSnapshot(
        doc(db, 'users', currentUser.uid),
        async (snapshot) => {
          if (!snapshot.exists()) {
            try {
              const q = query(collection(db, 'employees'), where('email', '==', currentUser.email));
              const querySnapshot = await getDocs(q);
              if (!querySnapshot.empty) {
                const empDoc = querySnapshot.docs[0];
                const empData = empDoc.data();

                if (empData.uid && empData.uid !== currentUser.uid) {
                  setUser(null);
                  setAccessDenied(true);
                  setLoading(false);
                  return;
                }

                const safeProfile = {
                  uid: currentUser.uid,
                  email: currentUser.email,
                  displayName: currentUser.displayName,
                  photoURL: currentUser.photoURL,
                  role: empData.role || 'employee',
                  employeeId: empData.employeeId || '',
                  isActive: true,
                  createdAt: serverTimestamp(),
                  lastLogin: serverTimestamp(),
                };
                await setDoc(doc(db, 'users', currentUser.uid), safeProfile, { merge: true });

                try {
                  await setDoc(doc(db, 'employees', empDoc.id), { uid: currentUser.uid, employeeLinked: true }, { merge: true });
                } catch (e) {
                  console.error('Could not link employee UID:', e);
                }

                await initializeSeedData();
                return;
              }
            } catch (err) {
              console.error('Error linking employee record:', err);
            }

            setUser(null);
            setAccessDenied(true);
            setLoading(false);
            return;
          }

          // User exists, run seed check safely just once
          initializeSeedData().catch(console.error);

          const profile = snapshot.data();

          const uidEmployeeQuery = query(collection(db, 'employees'), where('uid', '==', currentUser.uid));
          let employeeSnapshot = await getDocs(uidEmployeeQuery);

          if (employeeSnapshot.empty) {
            const emailEmployeeQuery = query(collection(db, 'employees'), where('email', '==', currentUser.email));
            employeeSnapshot = await getDocs(emailEmployeeQuery);
          }

          if (employeeSnapshot.empty) {
            setUser(null);
            setAccessDenied(true);
            setLoading(false);
            return;
          }

          const employeeData = employeeSnapshot.docs[0].data();
          if (employeeData.uid && employeeData.uid !== currentUser.uid) {
            setUser(null);
            setAccessDenied(true);
            setLoading(false);
            return;
          }

          if (!employeeData.uid) {
            try {
              await setDoc(doc(db, 'employees', employeeSnapshot.docs[0].id), { uid: currentUser.uid, employeeLinked: true }, { merge: true });
            } catch (e) {
              console.error('Could not link employee UID:', e);
            }
          }

          const safeProfile = {
            ...profile,
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
            role: employeeData.role || profile.role || 'employee',
            department: employeeData.departmentId || profile.department || '',
            employeeId: employeeData.employeeId || profile.employeeId || '',
            managerId: employeeData.managerId || profile.managerId || '',
            status: employeeData.status || 'active',
            isActive: employeeData.status === 'active',
          };

          const needsUpdate =
            safeProfile.role !== profile.role ||
            safeProfile.employeeId !== profile.employeeId ||
            safeProfile.status !== profile.status ||
            safeProfile.isActive !== profile.isActive;

          if (needsUpdate) {
            await setDoc(doc(db, 'users', currentUser.uid), safeProfile, { merge: true });
          }
          setUser(safeProfile);
          setLoading(false);
        },
        (error) => {
          console.error('Firestore user subscription error:', error);
          setUser(null);
          setAccessDenied(true);
          setLoading(false);
        }
      );
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  const value = useMemo(() => ({
    firebaseUser,
    user,
    loading,
    accessDenied,
    signInWithGoogle,
    logout,
  }), [firebaseUser, user, loading, accessDenied]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
