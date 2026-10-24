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

  const isActive = (status) => status === 'active' || status === 'Active';

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
      // Agents are managed in SFMS and may not have a matching employee row
      // when their employee profile could not be linked during setup.
      const { data: agentSnap, error: agentError } = await supabase
        .from('sfms_agents')
        .select('*')
        .ilike('email', supabaseUser.email)
        .maybeSingle();

      if (agentError) throw agentError;
      if (!agentSnap || !isActive(agentSnap.status)) {
        return null; // No active employee, intern, or SFMS agent record found
      }

      const userPayload = {
        id: supabaseUser.id,
        email: supabaseUser.email,
        display_name: agentSnap.name || supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || '',
        photo_url: supabaseUser.user_metadata?.avatar_url || '',
        role: 'agent',
        employee_id: agentSnap.id,
        employee_linked: true,
        is_active: true,
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
        isActive: true,
        status: 'active',
        employeeId: agentSnap.id,
      };
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
      bankName: internSnap.bank_name,
      ifsc: internSnap.ifsc_code,
      bankAccount: internSnap.bank_account,
      upiId: internSnap.upi_id,
      upiQrCodeUrl: internSnap.upi_qr_code_url,
      employeeId: userPayload.employee_id,
    };
  }

  let agentSnap = null;

  // Agents are managed in SFMS; resolve older records by email if their IDs differ.
  if (employeeSnap.role === 'agent') {
    const { data: agentById, error: agentByIdError } = await supabase
      .from('sfms_agents')
      .select('*')
      .eq('id', employeeSnap.id)
      .maybeSingle();

    if (agentByIdError) throw agentByIdError;
    agentSnap = agentById;

    if (!agentSnap && employeeSnap.email) {
      const { data: agentByEmail, error: agentByEmailError } = await supabase
        .from('sfms_agents')
        .select('*')
        .ilike('email', employeeSnap.email)
        .maybeSingle();

      if (agentByEmailError) throw agentByEmailError;
      agentSnap = agentByEmail;
    }

    if (!agentSnap || !isActive(agentSnap.status)) {
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
    is_active: employeeSnap.role === 'agent' ? isActive(agentSnap.status) : isActive(employeeSnap.status),
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
