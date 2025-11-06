'use client';

import './AddActivityForm.css';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { activitySchema, ActivityForm } from '@/schemas/activitySchema';
import { getBrowserClient } from '@/lib/supabaseBrowser';

export default function AddActivityForm() {
  const supabase = getBrowserClient();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<ActivityForm>({ resolver: zodResolver(activitySchema) });

  const onSubmit = async (data: ActivityForm) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert('Not signed in');

    const { error } = await supabase.from('activities').insert({
      ...data,
      user_id: user.id,
      source: 'manual',
      start_date: new Date().toISOString(),
      start_date_local: new Date().toISOString(),
    });

    if (error) alert('Error saving activity: ' + error.message);
    else {
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
      </label>

      <label>
        Distance (m)
        <input type="number" step="any" {...register('distance', { valueAsNumber: true })} />
      </label>

      <label>
        Moving time (sec)
        <input type="number" step="1" {...register('moving_time', { valueAsNumber: true })} />
      </label>

      <label>
        Elevation gain (m)
        <input type="number" step="any" {...register('total_elevation_gain', { valueAsNumber: true })} />
      </label>

      <label>
        Has heart-rate?
        <input type="checkbox" {...register('has_heartrate')} />
      </label>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving…' : 'Add Activity'}
      </button>
    </form>
  );
}
