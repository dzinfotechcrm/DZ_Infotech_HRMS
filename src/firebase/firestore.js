import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  setDoc,
  query,
  serverTimestamp,
  startAfter,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from './config';

export function col(name) {
  return collection(db, name);
}

export function ref(collectionName, id) {
  return doc(db, collectionName, id);
}

export function listenCollection(collectionName, buildQuery, onNext, onError) {
  const base = collection(db, collectionName);
  const q = typeof buildQuery === 'function' ? buildQuery(base) : buildQuery || base;
  return onSnapshot(q, (snapshot) => {
    onNext(
      snapshot.docs.map((document) => ({ id: document.id, ...document.data() })),
      snapshot,
    );
  }, onError);
}

export function listenDocument(collectionName, id, onNext, onError) {
  return onSnapshot(doc(db, collectionName, id), (snapshot) => {
    onNext(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null, snapshot);
  }, onError);
}

export async function createDocument(collectionName, payload) {
  return addDoc(collection(db, collectionName), {
    ...payload,
    createdAt: payload.createdAt || serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateDocument(collectionName, id, payload) {
  return updateDoc(doc(db, collectionName, id), {
    ...payload,
    updatedAt: serverTimestamp(),
  });
}

export async function upsertDocument(collectionName, id, payload) {
  return setDoc(doc(db, collectionName, id), {
    ...payload,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function removeDocument(collectionName, id) {
  return deleteDoc(doc(db, collectionName, id));
}

export async function fetchDocument(collectionName, id) {
  return getDoc(doc(db, collectionName, id));
}

export async function fetchCollection(collectionName, buildQuery) {
  const base = collection(db, collectionName);
  const q = typeof buildQuery === 'function' ? buildQuery(base) : buildQuery || base;
  const snapshot = await getDocs(q);
  return snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));
}

export { addDoc, collection, doc, getDocs, limit, onSnapshot, orderBy, query, serverTimestamp, startAfter, updateDoc, where };
