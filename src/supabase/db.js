import { supabase } from './config';

export async function createDocument(tableName, payload) {
  const id = payload.id || crypto.randomUUID();
  const { data, error } = await supabase
    .from(mapTableName(tableName))
    .insert([
      {
        id,
        ...payload,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ])
    .select()
    .single();

  if (error) throw error;
  try {
    const bc = new BroadcastChannel('app-updates');
    bc.postMessage({ type: 'table-update', table: mapTableName(tableName) });
    bc.close();
  } catch (err) {}
  return data;
}

export async function createNotification(userId, title, message, type = 'assignment') {
  return await createDocument('notifications', {
    user_id: userId,
    title,
    message,
    type,
    is_read: false
  });
}

export async function updateDocument(tableName, id, payload) {
  const { data, error } = await supabase
    .from(mapTableName(tableName))
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  try {
    const bc = new BroadcastChannel('app-updates');
    bc.postMessage({ type: 'table-update', table: mapTableName(tableName) });
    bc.close();
  } catch (err) {}
  return data;
}

export async function upsertDocument(tableName, id, payload) {
  const { data, error } = await supabase
    .from(mapTableName(tableName))
    .upsert([
      {
        id,
        ...payload,
        updated_at: new Date().toISOString(),
      }
    ], { onConflict: 'id' })
    .select()
    .single();

  if (error) throw error;
  try {
    const bc = new BroadcastChannel('app-updates');
    bc.postMessage({ type: 'table-update', table: mapTableName(tableName) });
    bc.close();
  } catch (err) {}
  return data;
}

export async function removeDocument(tableName, id) {
  const { error } = await supabase
    .from(mapTableName(tableName))
    .delete()
    .eq('id', id);

  if (error) throw error;
  try {
    const bc = new BroadcastChannel('app-updates');
    bc.postMessage({ type: 'table-update', table: mapTableName(tableName) });
    bc.close();
  } catch (err) {}
}

export async function fetchDocument(tableName, id) {
  const { data, error } = await supabase
    .from(mapTableName(tableName))
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 means no rows found
  return { exists: () => !!data, data: () => data, id: data?.id };
}

export async function fetchCollection(tableName, buildQuery) {
  let query = supabase.from(mapTableName(tableName)).select('*');

  if (typeof buildQuery === 'function') {
    query = buildQuery(query);
  }

  const { data, error } = await query;
  if (error) throw error;

  return data;
}


// --- Firestore Compat Layer for queries ---

export function query(base, ...modifiers) {
  return modifiers.reduce((acc, modifier) => modifier(acc), base);
}

function mapField(field) {
  if (field === 'createdAt') return 'created_at';
  if (field === 'updatedAt') return 'updated_at';
  if (field === 'employeeId') return 'employee_id';
  if (field === 'departmentId') return 'department_id';
  if (field === 'firstName') return 'first_name';
  if (field === 'lastName') return 'last_name';
  return field;
}

export function where(field, op, value) {
  const f = mapField(field);
  return (q) => {
    switch (op) {
      case '==': return q.eq(f, value);
      case '!=': return q.neq(f, value);
      case '>': return q.gt(f, value);
      case '<': return q.lt(f, value);
      case '>=': return q.gte(f, value);
      case '<=': return q.lte(f, value);
      case 'in': return q.in(f, value);
      case 'array-contains': return q.contains(f, [value]);
      default: return q;
    }
  };
}

export function orderBy(field, direction = 'asc') {
  const f = mapField(field);
  return (q) => q.order(f, { ascending: direction === 'asc' });
}

export function limit(n) {
  return (q) => q.limit(n);
}

export function collection(db, path) {
  return path;
}

export const db = supabase;

export function serverTimestamp() {
  return new Date().toISOString();
}

function mapTableName(name) {
  return name.replace(/([A-Z])/g, "_$1").toLowerCase();
}

export async function getDocs(q) {
  // If q is just a string (table name), we need to create a query
  let finalQuery = typeof q === 'string' ? supabase.from(mapTableName(q)).select('*') : q;
  const { data, error } = await finalQuery;
  if (error) throw error;
  return {
    empty: !data || data.length === 0,
    docs: (data || []).map(d => ({
      id: d.id,
      data: () => d.data ? { ...d.data, ...d } : { ...d }
    }))
  };
}

export function doc(db, path, id) {
  return { path, id };
}

export async function getDoc({ path, id }) {
  const { data, error } = await supabase.from(mapTableName(path)).select('*').eq('id', id).single();
  if (error && error.code !== 'PGRST116') throw error;
  return {
    exists: () => !!data,
    data: () => data,
    id: data?.id
  };
}

export async function setDoc({ path, id }, payload, options = {}) {
  if (options.merge) {
    const { error } = await supabase.from(mapTableName(path)).upsert([{ id, ...payload }], { onConflict: 'id' });
    if (error) throw error;
  } else {
    const { error } = await supabase.from(mapTableName(path)).insert([{ id, ...payload }]);
    if (error) throw error;
  }
}

export async function updateDoc({ path, id }, payload) {
  const { error } = await supabase.from(mapTableName(path)).update(payload).eq('id', id);
  if (error) throw error;
}

export async function addDoc(pathString, payload) {
  const id = payload.id || crypto.randomUUID();
  const { data, error } = await supabase.from(mapTableName(pathString)).insert([{ id, ...payload }]).select().single();
  if (error) throw error;
  return { id: data.id };
}

export async function deleteDoc({ path, id }) {
  const { error } = await supabase.from(mapTableName(path)).delete().eq('id', id);
  if (error) throw error;
}
