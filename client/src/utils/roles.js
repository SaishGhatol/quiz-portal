// Where each kind of account "lives" in the app — used for the logo link,
// the landing redirect and sending admins away from the student dashboard.
export const roleHome = user => {
  if (user?.role === 'admin') return '/admin';
  if (user?.role === 'org_admin') return '/org';
  return '/dashboard';
};

export const isStudentRole = user => !!user && user.role !== 'admin' && user.role !== 'org_admin';
