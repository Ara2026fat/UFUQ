/** One source of truth for navigation per role (sidebar on desktop, tab bar on phone). */
export const ROLES = {
  student: { label: 'طالب', home: '/' },
  teacher: { label: 'الفريق', home: '/t' },
  admin: { label: 'الفريق', home: '/t' },
};

const STAFF = [
  { to: '/t', label: 'اللوحة', icon: 'home', exact: true },
  { to: '/t/content', label: 'المحتوى', icon: 'list', base: '/t/content' },
  { to: '/t/new', label: 'سؤال جديد', icon: 'plus' },
  { to: '/t/studio', label: 'استوديو الأستاذ', icon: 'pen', base: '/t/studio' },
  { to: '/t/live', label: 'حصة مباشرة', icon: 'pen', base: '/t/live' },
  { to: '/t/library', label: 'مكتبة الملفات', icon: 'books', base: '/t/library' },
  { to: '/a', label: 'الإدارة', icon: 'users', base: '/a' },
];

export const NAV = {
  student: [
    { to: '/', label: 'جولتي', icon: 'home', exact: true, c: 1 },
    { to: '/learn-hub', label: 'أتعلّم', icon: 'books', base: '/learn-hub', c: 5 },
    { to: '/topics', label: 'المواضيع', icon: 'books', base: '/topics', c: 4 },
    { to: '/practice?mode=quick', label: 'تدريب سريع', icon: 'bolt', base: '/practice', c: 6 },
    { to: '/mistakes', label: 'أخطائي', icon: 'xcircle', base: '/mistakes', c: 2 },
    { to: '/progress', label: 'لوحة تقدّمي', icon: 'trend', base: '/progress', c: 3 },
    { to: '/exam', label: 'محاكاة الاختبار', icon: 'clipcheck', base: '/exam', c: 7 },
    { to: '/map', label: 'خريطة مهاراتي', icon: 'nodes', base: '/map', c: 5 },
    { to: '/solve', label: 'مسألة محلولة', icon: 'stairs', base: '/solve', c: 1 },
    { to: '/more', label: 'المزيد', icon: 'list', base: '/more', c: 4 },
  ],
  teacher: STAFF, admin: STAFF,
};
