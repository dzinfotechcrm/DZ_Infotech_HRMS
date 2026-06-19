import { supabase } from './config';

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    throw error;
  }
  return data;
}

export async function logout() {
  return await supabase.auth.signOut();
}

export async function syncAuthenticatedUser(supabaseUser) {
  if (!supabaseUser) {
    return null;
  }

  // 1. Fetch user profile from public.users table
  const { data: userSnap } = await supabase
    .from('users')
    .select('*')
    .eq('id', supabaseUser.id)
    .maybeSingle();

  // 2. Fetch employee record matching the uid or email
  let { data: employeeSnap } = await supabase
    .from('employees')
    .select('*')
    .eq('uid', supabaseUser.id)
    .maybeSingle();

  if (!employeeSnap) {
    // If not found by uid, try by email
    const { data: empByEmail } = await supabase
      .from('employees')
      .select('*')
      .eq('email', supabaseUser.email)
      .maybeSingle();

    if (empByEmail) {
      // Link employee to this new user ID (overwriting old Firebase UID)
      await supabase
        .from('employees')
        .update({ uid: supabaseUser.id })
        .eq('id', empByEmail.id);

      employeeSnap = empByEmail;
    }
  }

  if (!employeeSnap) {
    return null; // No employee record found
  }

  const userPayload = {
    id: supabaseUser.id,
    email: supabaseUser.email,
    display_name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || '',
    photo_url: supabaseUser.user_metadata?.avatar_url || '',
    role: employeeSnap.role || 'employee',
    employee_id: employeeSnap.id || '',
    employee_linked: true,
    is_active: employeeSnap.status === 'active',
    last_login: new Date().toISOString(),
  };

  // Use upsert on email to avoid 409 conflict if email already exists
  if (!userSnap) {
    await supabase.from('users').upsert([{ ...userPayload }], { onConflict: 'email' });
  } else {
    await supabase.from('users').update(userPayload).eq('id', supabaseUser.id);
  }

  return {
    uid: userPayload.id,
    email: userPayload.email,
    displayName: userPayload.display_name,
    photoURL: userPayload.photo_url,
    role: userPayload.role,
    employeeId: userPayload.employee_id,
    isActive: userPayload.is_active,
    status: employeeSnap.status || 'active',
  };
}
