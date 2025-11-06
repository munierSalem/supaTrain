'use client';

import './AddActivityForm.css';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { activitySchema, ActivityForm } from '@/schemas/activitySchema';
import { getBrowserClient } from '@/lib/supabaseBrowser';
import { DateTime } from 'luxon';

export default function AddActivityForm() {
  const router = useRouter();
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

    // convert moving_time to seconds
    const hours = data.moving_time__hours ?? 0;
    const minutes = data.moving_time__minutes ?? 0;
    const seconds = data.moving_time__seconds ?? 0;
    const moving_time = hours * 3600 + minutes * 60 + seconds;

    const { error } = await supabase.from('activities').insert({
      user_id: user.id,
      source: 'manual',

      name: data.name,
      sport_type: data.sport_type,
      distance: data.distance * 1609.34,  // miles to meters
      moving_time,
      total_elevation_gain: data.total_elevation_gain * 0.3048,  // feet to meters

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
      router.push('/');
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
        <select {...register('sport_type')}>
          <option value="">Select a sport</option>
          <option value="AlpineSki">Alpine Ski</option>
          <option value="Hike">Hike / Snowshoe</option>
          <option value="RockClimbing">Rock Climbing</option>
          <option value="Run">Run</option>
          <option value="Swim">Swim</option>
          <option value="Walk">Walk</option>
          <option value="Other">Other</option>
        </select>
        {errors.sport_type && <span>{errors.sport_type.message}</span>}
      </label>

      <label>
        Distance (miles)
        <input
          type="number"
          step="any"
          {...register('distance', { valueAsNumber: true })}
        />
        {errors.distance && <span>{errors.distance.message}</span>}
      </label>

      <label>
        Moving time (hh:mm:ss)
        <div className="duration-inputs">
          <input
            type="number"
            min="0"
            defaultValue={0}
            placeholder="hh"
            {...register('moving_time__hours', { valueAsNumber: true })}
          />
          :
          <input
            type="number"
            min="0"
            max="59"
            defaultValue={0}
            placeholder="mm"
            {...register('moving_time__minutes', { valueAsNumber: true })}
          />
          :
          <input
            type="number"
            min="0"
            max="59"
            defaultValue={0}
            placeholder="ss"
            {...register('moving_time__seconds', { valueAsNumber: true })}
          />
        </div>
        {errors.moving_time && <span>{errors.moving_time.message}</span>}
      </label>

      <label>
        Elevation gain (feet)
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
