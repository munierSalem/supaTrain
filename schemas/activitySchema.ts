import { z } from 'zod';

export const activitySchema = z.object({
  name: z.string().min(1, 'Required'),
  start_date_local: z.string().min(1, 'Required'),
  timezone: z.string().min(1).default('America/Denver'),
  sport_type: z.string().min(1),
  distance: z.number().nonnegative(),
  total_elevation_gain: z.number().nonnegative(),
  has_heartrate: z.boolean().default(false),

  // client side helpers
  moving_time__hours: z.number().min(0).default(0),
  moving_time__minutes: z.number().min(0).max(59).default(0),
  moving_time__seconds: z.number().min(0).max(59).default(0),
});

export type ActivityForm = z.infer<typeof activitySchema>;