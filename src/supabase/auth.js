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
    // If not found in employees, try interns
    let { data: internSnap } = await supabase
      .from('interns')
      .select('*')
      .eq('uid', supabaseUser.id)
      .maybeSingle();

    if (!internSnap) {
      const { data: internByEmail } = await supabase
        .from('interns')
        .select('*')
        .or(`email.eq.${supabaseUser.email},login_email.eq.${supabaseUser.email}`)
        .maybeSingle();

      if (internByEmail) {
        await supabase
          .from('interns')
          .update({ uid: supabaseUser.id })
          .eq('id', internByEmail.id);

        internSnap = internByEmail;
      }
    }

    if (!internSnap) {
      return null; // No employee or intern record found
    }

    // Handle Intern payload
    const internName = internSnap.first_name && internSnap.last_name 
      ? `${internSnap.first_name} ${internSnap.last_name}`
      : internSnap.full_name || supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || '';

    const userPayload = {
      id: supabaseUser.id,
      email: supabaseUser.email,
      display_name: internName,
      photo_url: supabaseUser.user_metadata?.avatar_url || '',
      role: 'intern',
      employee_id: internSnap.id,
      employee_linked: true,
      is_active: internSnap.status === 'Active' || internSnap.status === 'active',
      last_login: new Date().toISOString(),
    };

    if (!userSnap) {
      await supabase.from('users').upsert([{ ...userPayload }], { onConflict: 'email' });
    } else {
      await supabase.from('users').update(userPayload).eq('id', supabaseUser.id);
    }

    return {
      ...supabaseUser,
      ...userSnap,
      ...userPayload,
      uid: supabaseUser.id,
      displayName: userPayload.display_name,
      photoURL: userPayload.photo_url,
      isActive: userPayload.is_active,
      status: userPayload.is_active ? 'active' : 'inactive',
      isPaid: internSnap.is_paid,
    };
  }

  // If role is agent, verify the agent still exists in sfms_agents
  if (employeeSnap.role === 'agent') {
    const { data: agentSnap } = await supabase
      .from('sfms_agents')
      .select('id')
      .eq('id', employeeSnap.id)
      .maybeSingle();

    if (!agentSnap) {
      // Agent was deleted from the database
      return null;
    }
  }

  const employeeName = employeeSnap.first_name && employeeSnap.last_name 
    ? `${employeeSnap.first_name} ${employeeSnap.last_name}`
    : supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || '';

  const userPayload = {
    id: supabaseUser.id,
    email: supabaseUser.email,
    display_name: employeeName,
    photo_url: supabaseUser.user_metadata?.avatar_url || '',
    role: employeeSnap.role || 'employee',
    employee_id: employeeSnap.id || '',
    employee_linked: true,
    is_active: employeeSnap.status === 'active' || employeeSnap.status === 'Active',
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
    status: userPayload.is_active ? 'active' : 'inactive',
  };
}
