// Pure validation helpers (no React) so they can be unit-tested. Mirrors the database CHECK constraints.
export const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
export const STORY_CATEGORIES = ['Belonging', 'Loneliness & homesickness', 'Culture & identity', 'Challenges & discrimination', 'Growth & resilience', 'Finding community', 'Other'];
export const INTEREST_OPTIONS = ['Membership', 'Volunteering', 'Sharing a story', 'Partnership', 'Events'];
export const IMAGE_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

const len = (value) => (value || '').trim().length;
const between = (value, min, max) => len(value) >= min && len(value) <= max;

export function validateContact(v) {
  const e = {};
  if (!between(v.full_name, 2, 120)) e.full_name = 'Please enter your full name (at least 2 characters).';
  if (!EMAIL_RE.test((v.email || '').trim()) || len(v.email) > 254) e.email = 'Please enter a valid email address, like name@example.com.';
  if (!between(v.subject, 3, 150)) e.subject = 'Please add a short subject (3 to 150 characters).';
  if (!between(v.message, 10, 5000)) e.message = 'Please write a message of at least 10 characters (up to 5,000).';
  return e;
}

export function validateImage(file) {
  if (!file) return null;
  if (!IMAGE_TYPES[file.type]) return 'Please choose a JPG, PNG or WebP image.';
  if (file.size > MAX_IMAGE_BYTES) return 'That image is larger than 3 MB. Please choose a smaller one.';
  return null;
}

export function validateStory(v, file) {
  const e = {};
  if (!between(v.title, 3, 150)) e.title = 'Please give your story a title (3 to 150 characters).';
  if (!between(v.display_name, 2, 80)) e.display_name = 'Please enter the name you would like shown (2 to 80 characters).';
  if (!EMAIL_RE.test((v.email || '').trim()) || len(v.email) > 254) e.email = 'Please enter a valid email address. It is never published.';
  if (!between(v.country, 2, 80)) e.country = 'Please tell us your country of residence.';
  if (!STORY_CATEGORIES.includes(v.category)) e.category = 'Please choose a category.';
  if (!between(v.body, 100, 10000)) e.body = `Please write at least 100 characters (you have ${len(v.body)}). The limit is 10,000.`;
  const imageError = validateImage(file);
  if (imageError) e.image = imageError;
  if (v.consent !== true) e.consent = 'Please confirm that you give permission to publish your story.';
  return e;
}

export function validateJoin(v) {
  const e = {};
  if (!between(v.full_name, 2, 120)) e.full_name = 'Please enter your full name (at least 2 characters).';
  if (!EMAIL_RE.test((v.email || '').trim()) || len(v.email) > 254) e.email = 'Please enter a valid email address, like name@example.com.';
  if (len(v.location) > 120) e.location = 'Please keep this under 120 characters.';
  if (!v.interests || v.interests.length === 0) e.interests = 'Please choose at least one way you would like to get involved.';
  if (len(v.message) > 2000) e.message = 'Please keep your message under 2,000 characters.';
  if (v.consent !== true) e.consent = 'Please confirm that HomeAFar may contact you about this.';
  return e;
}
