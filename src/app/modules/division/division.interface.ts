export interface IDivision {
  name: string;
  slug: string;
  thumbnail?: string;
  description?: string;
}
/**
 *  division = chittagong division
 *  slug = chittagong division
 *  /:id => /abcdefghijklmnopqrstuvwxyz
 *  /:id =>
 *  /:slug => /division/chittagong-division
 */
