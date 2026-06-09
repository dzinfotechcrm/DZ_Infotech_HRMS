import { signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp, setDoc, query, where, getDocs, collection } from 'firebase/firestore';
import { auth, db, googleProvider } from './config';

export async function signInWithGoogle() {
  const credential = await signInWithPopup(auth, googleProvider);
  const user = credential.user;

  const employeeQuery = await getDocs(
    query(collection(db, 'employees'), where('email', '==', user.email))
  );

  if (employeeQuery.empty) {
    await signOut(auth);
    throw new Error('Access denied. Your account has not been registered by admin.');
  }

  const employeeDoc = employeeQuery.docs[0];
  const employeeData = employeeDoc.data();

  if (employeeData.uid && employeeData.uid !== user.uid) {
    await signOut(auth);
    throw new Error('Access denied. This account is already linked to a different employee record.');
  }

  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);
  const userPayload = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    role: employeeData.role || 'employee',
    employeeId: employeeData.employeeId || '',
    employeeLinked: true,
    isActive: true,
    lastLogin: serverTimestamp(),
  };

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      ...userPayload,
      createdAt: serverTimestamp(),
    });
  } else {
    await updateDoc(userRef, userPayload);
  }

  await updateDoc(doc(db, 'employees', employeeDoc.id), {
    uid: user.uid,
    employeeLinked: true,
  });

  return user;
}

export async function logout() {
  return signOut(auth);
}

export async function syncAuthenticatedUser(firebaseUser) {
  if (!firebaseUser) {
    return null;
  }

  const userRef = doc(db, 'users', firebaseUser.uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    return null;
  }

  const profile = snapshot.data();
  let employeeQuery = query(collection(db, 'employees'), where('uid', '==', firebaseUser.uid));
  let employeeSnapshot = await getDocs(employeeQuery);

  if (employeeSnapshot.empty) {
    employeeQuery = query(collection(db, 'employees'), where('email', '==', firebaseUser.email));
    employeeSnapshot = await getDocs(employeeQuery);
    if (!employeeSnapshot.empty) {
      const empDoc = employeeSnapshot.docs[0];
      const empData = empDoc.data();
      if (empData.uid && empData.uid !== firebaseUser.uid) {
        return null;
      }
      await updateDoc(doc(db, 'employees', empDoc.id), {
        uid: firebaseUser.uid,
        employeeLinked: true,
      });
    }
  }

  if (employeeSnapshot.empty) {
    return null;
  }

  const employeeData = employeeSnapshot.docs[0].data();
  const safeProfile = {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
    role: profile.role || employeeData.role || 'employee',
    employeeId: profile.employeeId || employeeData.employeeId || '',
    isActive: employeeData.status === 'active',
    status: employeeData.status || 'active',
    createdAt: profile.createdAt || serverTimestamp(),
    lastLogin: serverTimestamp(),
  };

  await setDoc(userRef, safeProfile, { merge: true });
  return safeProfile;
}
