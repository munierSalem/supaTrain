'use client';

import './AddActivityForm.css';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { activitySchema, ActivityForm } from '@/schemas/activitySchema';
import { getBrowserClient } from '@/lib/supabaseBrowser';
import { DateTime } from 'luxon';

export default function AddActivityForm() {
  const supabase = getBrowserClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ActivityForm>({ resolver: zodResolver(activitySchema) });

  const onSubmit = async (data: ActivityForm) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return alert('Not signed in');

    // Convert local datetime + timezone -> UTC + offset (seconds)
    const dtLocal = DateTime.fromISO(data.start_date_local, { zone: data.timezone });
    if (!dtLocal.isValid) {
      alert('Invalid local date/time');
      return;
    }

    const start_date = dtLocal.toUTC().toISO();          // UTC timestamptz
    const start_date_local_iso = dtLocal.toISO();        // keeps zone info; fine for timestamptz
    const utc_offset = dtLocal.offset * 60;              // Luxon gives minutes; DB expects seconds

    const { error } = await supabase.from('activities').insert({
      user_id: user.id,
      source: 'manual',

      name: data.name,
      sport_type: data.sport_type,
      distance: data.distance,
      moving_time: data.moving_time,
      total_elevation_gain: data.total_elevation_gain,

      has_heartrate: false, // assume not present for manual entries

      // new date fields
      start_date,                 // UTC
      start_date_local: start_date_local_iso,
      timezone: data.timezone,
      utc_offset,                 // seconds
    });

    if (error) {
      alert('Error saving activity: ' + error.message);
    } else {
      alert('Activity added!');
      reset();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="activity-form">
      <label>
        Name
        <input type="text" {...register('name')} />
        {errors.name && <span>{errors.name.message}</span>}
      </label>

      <label>
        Sport type
        <input type="text" {...register('sport_type')} />
        {errors.sport_type && <span>{errors.sport_type.message}</span>}
      </label>

      <label>
        Distance (m)
        <input
          type="number"
          step="any"
          {...register('distance', { valueAsNumber: true })}
        />
        {errors.distance && <span>{errors.distance.message}</span>}
      </label>

      <label>
        Moving time (sec)
        <input
          type="number"
          step="1"
          {...register('moving_time', { valueAsNumber: true })}
        />
        {errors.moving_time && <span>{errors.moving_time.message}</span>}
      </label>

      <label>
        Elevation gain (m)
        <input
          type="number"
          step="any"
          {...register('total_elevation_gain', { valueAsNumber: true })}
        />
        {errors.total_elevation_gain && (
          <span>{errors.total_elevation_gain.message}</span>
        )}
      </label>

      <label>
        Local start date/time
        <input
          type="datetime-local"
          {...register('start_date_local')}
        />
        {errors.start_date_local && (
          <span>{errors.start_date_local.message}</span>
        )}
      </label>

      <label>
        Timezone
        <select defaultValue="America/Denver" {...register('timezone')}>
          <option value="America/Denver">America/Denver</option>
          <option value="America/Los_Angeles">America/Los_Angeles</option>
          <option value="America/Chicago">America/Chicago</option>
          <option value="America/New_York">America/New_York</option>
          <option value="UTC">UTC</option>
        </select>
        {errors.timezone && <span>{errors.timezone.message}</span>}
      </label>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving…' : 'Add Activity'}
      </button>
    </form>
  );
}
