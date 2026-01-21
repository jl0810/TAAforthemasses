import React from "react";
import { UserCircle } from "lucide-react";
import { ProfileSettings } from "@/components/dashboard/profile-settings";
import { getUserPreferences } from "@/app/actions/user";

export default async function ProfilePage() {
  const preferences = await getUserPreferences();

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      <section className="flex items-center gap-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-emerald-500 p-1">
            <div className="w-full h-full rounded-full bg-[#0f172a] flex items-center justify-center overflow-hidden">
              <UserCircle size={64} className="text-white/20" />
            </div>
          </div>
          <div className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-emerald-500 border-4 border-[#0f172a]" />
        </div>
        <div>
          <h1 className="text-3xl font-black font-outfit text-white">
            User Profile
          </h1>
          <p className="text-white/40 text-sm">
            Manage your strategy preferences
          </p>
        </div>
      </section>

      <ProfileSettings initialConfig={preferences} />
    </div>
  );
}
