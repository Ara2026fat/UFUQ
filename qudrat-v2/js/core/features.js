/**
 * Feature flags: how new capabilities are added later without rebuilding.
 * A feature ships dark (false), gets a route + nav entry, then flips to true.
 */
export const FEATURES = [
  { key: 'core.practice',   on: true,  title: 'التدريب السريع والتدريب حسب الموضوع' },
  { key: 'core.mistakes',   on: true,  title: 'التعلم من الخطأ (شرح بديل + سؤال مشابه)' },
  { key: 'core.approval',   on: true,  title: 'دورة اعتماد المحتوى من الأستاذ' },
  { key: 'next.diagnostic', on: false, title: 'اختبار تشخيصي لتحديد المستوى' },
  { key: 'next.exam',       on: false, title: 'محاكاة اختبار بزمن حقيقي' },
  { key: 'next.review',     on: false, title: 'المراجعة الذكية المتباعدة' },
  { key: 'next.challenges', on: false, title: 'التحديات والمنافسة' },
  { key: 'next.ai',         on: false, title: 'المساعد الذكي (بعد اعتماد قواعده)' },
  { key: 'next.backend',    on: false, title: 'حسابات حقيقية وقاعدة بيانات مركزية' },
];
export const isOn = (key) => !!FEATURES.find((f) => f.key === key)?.on;
