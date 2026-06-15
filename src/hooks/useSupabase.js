import { useEffect, useState } from 'react';
import { supabase } from '../supabase/config';

export function useSupabaseCollection(tableName, buildQuery) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshCounter, setRefreshCounter] = useState(0);

  useEffect(() => {
    let isMounted = true;
    let subscription = null;
    
    // Map camelCase table names to snake_case for Supabase
    const dbTableName = tableName.replace(/([A-Z])/g, "_$1").toLowerCase();
    
    const channelName = `realtime:${dbTableName}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const mapRow = (row) => {
      if (!row) return row;
      const base = row.data ? { ...row.data, ...row } : { ...row };
      base.createdAt = row.created_at || base.createdAt;
      base.updatedAt = row.updated_at || base.updatedAt;
      base.employeeId = row.employee_id || base.employeeId;
      base.departmentId = row.department_id || base.departmentId;
      base.firstName = row.first_name || base.firstName;
      base.lastName = row.last_name || base.lastName;
      return base;
    };

    const fetchData = async (isRefetch = false) => {
      // If we are refetching because of refreshCounter, let's treat it as a silent refetch
      if (!isRefetch && refreshCounter === 0) setLoading(true);
      try {
        let query = supabase.from(dbTableName).select('*');
        if (typeof buildQuery === 'function') {
          // Temporarily monkey-patch the query to translate camelCase to snake_case for order/where
          const originalOrder = query.order.bind(query);
          query.order = (column, options) => {
            if (column === 'createdAt') column = 'created_at';
            if (column === 'updatedAt') column = 'updated_at';
            if (column === 'employeeId') column = 'employee_id';
            if (column === 'firstName') column = 'first_name';
            if (column === 'lastName') column = 'last_name';
            if (column === 'departmentId') column = 'department_id';
            return originalOrder(column, options);
          };
          
          query = buildQuery(query);
        }
        const { data, error } = await query;
        if (error) throw error;
        
        if (isMounted) {
          setItems((data || []).map(mapRow));
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    // We previously disabled this to stop the "refreshing" issue, but since the 
    // loading spinner flash is fixed, we can re-enable silent realtime updates 
    // so edits appear instantly without a manual page reload.
    subscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: dbTableName },
        () => {
          fetchData(true); // Refetch silently on any change
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [tableName, buildQuery, refreshCounter]);

  const refetch = () => {
    setRefreshCounter(prev => prev + 1);
  };

  return { items, loading, error, refetch };
}

export function useSupabaseDocument(tableName, id) {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) {
      setItem(null);
      setLoading(false);
      return;
    }

    let isMounted = true;
    const channelName = `realtime:${tableName}_${id}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const mapRow = (row) => {
      if (!row) return row;
      const base = row.data ? { ...row.data, ...row } : { ...row };
      base.createdAt = row.created_at || base.createdAt;
      base.updatedAt = row.updated_at || base.updatedAt;
      base.employeeId = row.employee_id || base.employeeId;
      base.departmentId = row.department_id || base.departmentId;
      base.firstName = row.first_name || base.firstName;
      base.lastName = row.last_name || base.lastName;
      return base;
    };

    const fetchData = async (isRefetch = false) => {
      if (!isRefetch) setLoading(true);
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .eq('id', id)
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        
        if (isMounted) {
          setItem(data ? mapRow(data) : null);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    // We previously disabled this to stop the "refreshing" issue, but since the 
    // loading spinner flash is fixed, we can re-enable silent realtime updates.
    subscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: tableName, filter: `id=eq.${id}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            if (isMounted) setItem(null);
          } else {
            if (isMounted) setItem(mapRow(payload.new));
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [tableName, id]);

  return { item, loading, error };
}
