from pathlib import Path

path = Path('app/classifieds/page.tsx')
text = path.read_text()

old_import = 'import { BriefcaseBusiness, Building2, Check, ChevronLeft, Clock3, FileText, Filter, MapPin, Search, ShieldCheck, Star, UserRound, X } from "lucide-react";'
new_import = old_import + '\nimport { loadAccountDetails } from "@/lib/dentalshift";\nimport { supabase } from "@/lib/supabase";'
if old_import not in text:
    raise RuntimeError('Lucide import not found')
text = text.replace(old_import, new_import, 1)

old_state = '  const [preview, setPreview] = useState<PostingPreview | null>(null);'
new_state = old_state + '\n  const [officeLocation, setOfficeLocation] = useState({ city: "", province: "AB" });'
if old_state not in text:
    raise RuntimeError('preview state not found')
text = text.replace(old_state, new_state, 1)

old_effect = '''  useEffect(() => {
    const portalRole = window.localStorage.getItem("dentalshift_portal_role");
    setBackHref(portalRole === "office" ? "/office/overview" : "/professionals/find-shifts");
    const params = new URLSearchParams(window.location.search);
    if (portalRole === "office" && params.get("post") === "office") {
      setPostingMode("office");
      setSubmitted(false);
    }
  }, []);'''
new_effect = '''  useEffect(() => {
    const portalRole = window.localStorage.getItem("dentalshift_portal_role");
    setBackHref(portalRole === "office" ? "/office/overview" : "/professionals/find-shifts");
    const params = new URLSearchParams(window.location.search);
    if (portalRole === "office" && params.get("post") === "office") {
      setPostingMode("office");
      setSubmitted(false);
    }

    if (portalRole === "office") {
      void (async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        try {
          const details = await loadAccountDetails(user.id);
          const city = details.office?.city || details.profile.city || "";
          const province = details.office?.province || details.profile.province || "AB";
          setOfficeLocation({ city, province });
        } catch {
          // Leave the fields editable if account details cannot be loaded.
        }
      })();
    }
  }, []);'''
if old_effect not in text:
    raise RuntimeError('existing useEffect not found')
text = text.replace(old_effect, new_effect, 1)

old_city = '<label className="field"><span>City / Area</span><input name="city" required placeholder="e.g. Calgary NW" /></label>'
new_city = '<label className="field"><span>City / Area</span><input key={`${postingMode}-${officeLocation.city}`} name="city" required defaultValue={postingMode === "office" ? officeLocation.city : ""} placeholder="e.g. Calgary NW" /></label>'
if old_city not in text:
    raise RuntimeError('city field not found')
text = text.replace(old_city, new_city, 1)

old_province = '<label className="field"><span>Province</span><select name="province" required defaultValue="AB">{["AB","BC","MB","NB","NL","NS","NT","NU","ON","PE","QC","SK","YT"].map((item) => <option key={item}>{item}</option>)}</select></label>'
new_province = '<label className="field"><span>Province</span><select key={`${postingMode}-${officeLocation.province}`} name="province" required defaultValue={postingMode === "office" ? officeLocation.province : "AB"}>{["AB","BC","MB","NB","NL","NS","NT","NU","ON","PE","QC","SK","YT"].map((item) => <option key={item}>{item}</option>)}</select></label>'
if old_province not in text:
    raise RuntimeError('province field not found')
text = text.replace(old_province, new_province, 1)

path.write_text(text)
print('DentalJobs office postings now default city/province from the signed-in office account.')
