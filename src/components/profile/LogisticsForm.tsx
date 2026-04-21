import { Shield, GraduationCap, Briefcase, Plus, Trash2 } from "lucide-react";
import { ProfileSubComponentProps, CollegeEntry, EmployerEntry } from "./types";
import { BrandLogo } from "../BrandLogo";
import { extractDomain } from "../../utils/logoResolvers";

const DIETARY_OPTIONS = ["Gluten-Free", "Kosher", "Halal", "Vegetarian", "Vegan", "Nut-free", "No-pork", "No-Beef"];

export function LogisticsForm({ profile, setProfile, isMinor, inputClass, labelClass, sectionClass }: ProfileSubComponentProps) {
  const toggleDietary = (item: string) => {
    setProfile(prev => ({
      ...prev,
      dietary_restrictions: prev.dietary_restrictions.includes(item)
        ? prev.dietary_restrictions.filter(t => t !== item)
        : [...prev.dietary_restrictions, item],
    }));
  };

  const getOtherDietary = () => {
    const other = profile.dietary_restrictions.find(t => t.startsWith("Other:"));
    return other ? other.replace("Other:", "").trim() : "";
  };

  const setOtherDietary = (val: string) => {
    setProfile(prev => {
      const filtered = prev.dietary_restrictions.filter(t => !t.startsWith("Other:"));
      if (!val) return { ...prev, dietary_restrictions: filtered };
      return { ...prev, dietary_restrictions: [...filtered, `Other: ${val}`] };
    });
  };

  const addCollege = () => setProfile(prev => ({ ...prev, colleges: [...prev.colleges, { name: "", domain: "", years: "", degree: "" }] }));
  const removeCollege = (i: number) => setProfile(prev => ({ ...prev, colleges: prev.colleges.filter((_, idx) => idx !== i) }));
  const updateCollege = (i: number, field: keyof CollegeEntry, val: string) => {
    const updated = [...profile.colleges];
    const sanitizedVal = field === "domain" ? extractDomain(val as string) : val;
    updated[i] = { ...updated[i], [field]: sanitizedVal };
    if (field === "name" && (val as string).length > 2 && !updated[i].domain) {
      const domain = (val as string).toLowerCase().replace(/\s+/g, "").replace(/university|college|of|the/gi, "");
      updated[i].domain = `${domain}.edu`;
    }
    setProfile(prev => ({ ...prev, colleges: updated }));
  };

  const addEmployer = () => setProfile(prev => ({ ...prev, employers: [...prev.employers, { name: "", domain: "", title: "", current: false, years: "" }] }));
  const removeEmployer = (i: number) => setProfile(prev => ({ ...prev, employers: prev.employers.filter((_, idx) => idx !== i) }));
  const updateEmployer = (i: number, field: keyof EmployerEntry, val: string | boolean) => {
    const updated = [...profile.employers];
    const sanitizedVal = field === "domain" ? extractDomain(val as string) : val;
    updated[i] = { ...updated[i], [field]: sanitizedVal };
    setProfile(prev => ({ ...prev, employers: updated }));
  };

  return (
    <>
      {/* FIRST / Food */}
      <div className={sectionClass}>
        <h3 className="text-sm font-black uppercase tracking-wider text-ares-red">FIRST & Fun</h3>
        <div>
          <label htmlFor="pe-fav-first" className={labelClass}>Favorite thing about FIRST / ARES</label>
          <input id="pe-fav-first" className={inputClass} placeholder="Building robots with friends!" value={profile.favorite_first_thing} onChange={e => setProfile({...profile, favorite_first_thing: e.target.value})} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="pe-fav-mech" className={labelClass}>Favorite Robot Mechanism</label>
            <input id="pe-fav-mech" className={inputClass} placeholder="e.g. 2022 Turret" value={profile.favorite_robot_mechanism} onChange={e => setProfile({...profile, favorite_robot_mechanism: e.target.value})} />
          </div>
          <div>
            <label htmlFor="pe-superstition" className={labelClass}>Pre-Match Superstition</label>
            <input id="pe-superstition" className={inputClass} placeholder="e.g. Taping the battery 3 times" value={profile.pre_match_superstition} onChange={e => setProfile({...profile, pre_match_superstition: e.target.value})} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="pe-food" className={labelClass}>Favorite Food</label>
            <input id="pe-food" className={inputClass} placeholder="Pizza, tacos..." value={profile.favorite_food} onChange={e => setProfile({...profile, favorite_food: e.target.value})} />
          </div>
          <div>
            <span className={labelClass}>Dietary Restrictions</span>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {DIETARY_OPTIONS.map(opt => (
                <label key={opt} className="flex items-center gap-2 text-sm text-zinc-300">
                  <input type="checkbox" checked={profile.dietary_restrictions.includes(opt)} onChange={() => toggleDietary(opt)} className="accent-ares-red rounded w-4 h-4" />
                  {opt}
                </label>
              ))}
              <div className="col-span-2 mt-1">
                <label className="flex items-center gap-2 text-sm text-zinc-300 mb-1">
                  <input type="checkbox" checked={profile.dietary_restrictions.some(t => t.startsWith("Other:"))} onChange={(e) => { if (!e.target.checked) setOtherDietary(""); else setOtherDietary("Optional Details"); }} className="accent-ares-red rounded w-4 h-4" />
                  Other
                </label>
                {profile.dietary_restrictions.some(t => t.startsWith("Other:")) && (
                  <input className={`${inputClass} !py-2`} placeholder="Please specify..." value={getOtherDietary()} onChange={e => setOtherDietary(e.target.value)} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Internal Logistics (Private) */}
      <div className={sectionClass}>
        <div className="flex items-center gap-2 mb-2 text-sm font-black uppercase tracking-wider text-ares-red">
          <Shield size={16} /> Team Logistics (Private)
        </div>
        <p className="text-xs text-zinc-400 mb-4">This information is strictly for event organization and travel. It will NEVER be shown publicly.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <label htmlFor="pe-tshirt" className={labelClass}>T-Shirt Size</label>
            <select id="pe-tshirt" className={inputClass} value={profile.tshirt_size} onChange={e => setProfile({...profile, tshirt_size: e.target.value})}>
              <option value="" disabled>Select Size...</option>
              <option value="Youth Medium">Youth Medium</option>
              <option value="Youth Large">Youth Large</option>
              <option value="Adult Small">Adult Small</option>
              <option value="Adult Medium">Adult Medium</option>
              <option value="Adult Large">Adult Large</option>
              <option value="Adult XL">Adult XL</option>
              <option value="Adult 2XL">Adult 2XL</option>
              <option value="Adult 3XL">Adult 3XL</option>
            </select>
          </div>
          <div className="md:col-span-1">
            <label htmlFor="pe-ec-name" className={labelClass}>Emergency Contact Name</label>
            <input id="pe-ec-name" className={inputClass} placeholder="Parent/Guardian Name" value={profile.emergency_contact_name} onChange={e => setProfile({...profile, emergency_contact_name: e.target.value})} />
          </div>
          <div className="md:col-span-1">
            <label htmlFor="pe-ec-phone" className={labelClass}>Emergency Contact Phone</label>
            <input id="pe-ec-phone" className={inputClass} placeholder="(304) 555-1234" value={profile.emergency_contact_phone} onChange={e => setProfile({...profile, emergency_contact_phone: e.target.value})} />
          </div>
        </div>
      </div>

      {/* Education (non-students only) */}
      {!isMinor && (
        <div className={sectionClass}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-wider text-ares-red flex items-center gap-2"><GraduationCap size={16} /> Education</h3>
            <button onClick={addCollege} className="flex items-center gap-1 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 ares-cut-sm text-xs font-bold text-ares-gold">
              <Plus size={14} /> Add College
            </button>
          </div>
          {profile.colleges.map((col, i) => (
            <div key={i} className="flex gap-4 items-start bg-black/30 p-4 ares-cut border border-white/5 group hover:border-ares-gold/30 transition-all">
              <BrandLogo domain={col.domain} fallbackIcon={GraduationCap} className="w-12 h-12" />
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                <input className={inputClass} placeholder="University name" value={col.name} onChange={e => updateCollege(i, "name", e.target.value)} />
                <input className={inputClass} placeholder="Domain (rice.edu)" value={col.domain} onChange={e => updateCollege(i, "domain", e.target.value)} />
                <input className={inputClass} placeholder="Degree (BS ME)" value={col.degree} onChange={e => updateCollege(i, "degree", e.target.value)} />
                <input className={inputClass} placeholder="Years (2020-2024)" value={col.years} onChange={e => updateCollege(i, "years", e.target.value)} />
              </div>
              <button onClick={() => removeCollege(i)} className="text-red-500 hover:text-red-400 p-1"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      )}

      {/* Career (non-students only) */}
      {!isMinor && (
        <div className={sectionClass}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-wider text-ares-red flex items-center gap-2"><Briefcase size={16} /> Career</h3>
            <button onClick={addEmployer} className="flex items-center gap-1 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 ares-cut-sm text-xs font-bold text-ares-gold">
              <Plus size={14} /> Add Employer
            </button>
          </div>
          {profile.employers.map((emp, i) => (
            <div key={i} className="flex gap-4 items-start bg-black/30 p-4 ares-cut border border-white/5 group hover:border-ares-gold/30 transition-all">
              <BrandLogo domain={emp.domain} fallbackIcon={Briefcase} className="w-12 h-12" />
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                <input className={inputClass} placeholder="Company name" value={emp.name} onChange={e => updateEmployer(i, "name", e.target.value)} />
                <input className={inputClass} placeholder="Domain (spacex.com)" value={emp.domain} onChange={e => updateEmployer(i, "domain", e.target.value)} />
                <input className={inputClass} placeholder="Title" value={emp.title} onChange={e => updateEmployer(i, "title", e.target.value)} />
                <input className={inputClass} placeholder="Years" value={emp.years} onChange={e => updateEmployer(i, "years", e.target.value)} />
              </div>
              <div className="flex flex-col items-center gap-1">
                <label htmlFor={`pe-emp-current-${i}`} className="text-[9px] text-zinc-500">Current</label>
                <input id={`pe-emp-current-${i}`} type="checkbox" checked={emp.current} onChange={e => updateEmployer(i, "current", e.target.checked)} className="accent-ares-red" />
              </div>
              <button onClick={() => removeEmployer(i)} className="text-red-500 hover:text-red-400 p-1"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
