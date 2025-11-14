// app/profile/page.tsx

import ProfileForm from "./ProfileForm";

export default function ProfilePage() {
  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Your Health Profile</h1>
      <ProfileForm />
    </div>
  );
}
