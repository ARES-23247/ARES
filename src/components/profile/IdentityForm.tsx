import { User } from "lucide-react";
import { ProfileSubComponentProps } from "./types";

export function IdentityForm({ profile, setProfile, inputClass, labelClass, sectionClass }: ProfileSubComponentProps) {
  return (
    <div className={sectionClass}>
      <h3 className="text-sm font-black uppercase tracking-wider text-ares-red flex items-center gap-2"><User size={16} /> Identity</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="pe-first-name" className={labelClass}>First Name (Hidden)</label>
          <input id="pe-first-name" className={inputClass} placeholder="e.g. John" value={profile.first_name} onChange={e => setProfile({...profile, first_name: e.target.value})} />
        </div>
        <div>
          <label htmlFor="pe-last-name" className={labelClass}>Last Name (Hidden)</label>
          <input id="pe-last-name" className={inputClass} placeholder="e.g. Doe" value={profile.last_name} onChange={e => setProfile({...profile, last_name: e.target.value})} />
        </div>
        <div>
          <label htmlFor="pe-nickname" className={labelClass}>Nickname (Public Display Name)</label>
          <input id="pe-nickname" className={inputClass} placeholder="e.g. Sparky, RoboKid42" value={profile.nickname} onChange={e => setProfile({...profile, nickname: e.target.value})} />
        </div>
        <div>
          <label htmlFor="pe-pronouns" className={labelClass}>Pronouns</label>
          <input id="pe-pronouns" className={inputClass} placeholder="e.g. he/him, she/her, they/them" value={profile.pronouns} onChange={e => setProfile({...profile, pronouns: e.target.value})} />
        </div>
      </div>
      <div>
        <label htmlFor="pe-email" className={labelClass}>Email Address</label>
        <input id="pe-email" className={`${inputClass} opacity-50 cursor-not-allowed`} value={profile.email || ""} disabled placeholder="Synced from your login" title="Email is synced from your login account automatically." />
      </div>
      <div>
        <label htmlFor="pe-bio" className={labelClass}>Bio</label>
        <textarea id="pe-bio" className={`${inputClass} min-h-[80px] resize-none`} placeholder="Tell us about yourself (keep it PII-free!)" value={profile.bio} onChange={e => setProfile({...profile, bio: e.target.value})} />
      </div>
      <div>
        <label htmlFor="pe-funfact" className={labelClass}>Fun Fact</label>
        <input id="pe-funfact" className={inputClass} placeholder="Something cool about you!" value={profile.fun_fact} onChange={e => setProfile({...profile, fun_fact: e.target.value})} />
      </div>
    </div>
  );
}
