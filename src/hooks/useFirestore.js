import { useEffect, useMemo, useState } from 'react';
import { collection, doc, onSnapshot, query } from '../supabase/db';
import { db } from '../supabase/config';

export function useSupabaseCollection(collectionName, buildQuery) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const resolvedQuery = useMemo(() => {
    const base = collection(db, collectionName);
    return typeof buildQuery === 'function' ? buildQuery(base) : buildQuery || query(base);
  }, [collectionName, buildQuery]);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(resolvedQuery, (snapshot) => {
      setItems(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
      setLoading(false);
      setError(null);
    }, (snapshotError) => {
      setError(snapshotError);
      setLoading(false);
    });

    return unsubscribe;
  }, [resolvedQuery]);

  return { items, loading, error };
}

export function useSupabaseDocument(collectionName, id) {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) {
      setItem(null);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    const unsubscribe = onSnapshot(doc(db, collectionName, id), (snapshot) => {
      setItem(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
      setLoading(false);
      setError(null);
    }, (snapshotError) => {
      setError(snapshotError);
      setLoading(false);
    });

    return unsubscribe;
  }, [collectionName, id]);

  return { item, loading, error };
}
