// Supabase client. Only the public URL and anon key are ever used here; they are protected by Row Level Security.
// Never put a service-role key in this project.
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isConfigured = Boolean(url && key);
export const storyImageUrl = (path) => (url && path ? `${url}/storage/v1/object/public/story-images/${path}` : null);

let clientPromise = null;
export const getSupabase = () => {
  if (!isConfigured) return Promise.resolve(null);
  if (!clientPromise) clientPromise = import('@supabase/supabase-js').then(({ createClient }) => createClient(url, key));
  return clientPromise;
};

export const NOT_CONFIGURED_MESSAGE = 'Online forms are not switched on yet. Please email homeafar26@gmail.com instead.';
export class FormError extends Error {
  constructor(userMessage) { super(userMessage); this.userMessage = userMessage; }
}
