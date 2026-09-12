from pathlib import Path

path = Path('components/DentalJobsNativeMarketplace.tsx')
s = path.read_text()

old = '''    const actionLabel = existing
      ? applicationLabel(existing.status)
      : role === "professional"
        ? "Apply"
        : "I'm Interested";
'''
new = '''    const actionLabel = existing
      ? existing.status === "pending" && role === "office"
        ? "Awaiting Response"
        : applicationLabel(existing.status)
      : role === "professional"
        ? "Apply"
        : "I'm Interested";
'''
if old not in s:
    raise SystemExit('action label block not found')
s = s.replace(old, new, 1)

marker = '''  const renderCard = (listing: Listing) => {\n'''
if marker not in s:
    raise SystemExit('renderCard marker not found')

insert = '''  const submitOfficeInterest = async (listing: Listing) => {
    if (sending) return;
    setSending(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in again.");

      const details = await loadAccountDetails(user.id);
      const officeId = details.office?.id || null;
      const professionalId = listing.professional_id;
      if (!officeId || !professionalId) throw new Error("This listing is missing account information needed to continue.");

      const { data, error: insertError } = await supabase
        .from("job_applications")
        .insert({
          listing_id: listing.id,
          professional_id: professionalId,
          office_id: officeId,
          initiator_role: "office",
          status: "pending",
          message: "",
          resume_path_snapshot: null,
        })
        .select("id,listing_id,status")
        .single();

      if (insertError) throw insertError;

      setApplications((current) => [
        ...current.filter((item) => item.listing_id !== listing.id),
        data as ApplicationState,
      ]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to send your interest right now.");
    } finally {
      setSending(false);
    }
  };

'''
s = s.replace(marker, insert + marker, 1)

old_button = '''              <button
                type="button"
                disabled={Boolean(existing)}
                onClick={() => { setSelected(listing); setMessage(""); setActionError(""); }}
                className="flex-1 rounded-xl px-3 py-2.5 text-xs font-black text-white shadow-sm transition hover:brightness-95 disabled:cursor-default disabled:opacity-65"
                style={{ backgroundColor: accent }}
              >
                {actionLabel}
              </button>
'''
new_button = '''              <button
                type="button"
                disabled={Boolean(existing) || sending}
                onClick={() => {
                  if (role === "office") {
                    void submitOfficeInterest(listing);
                    return;
                  }
                  setSelected(listing);
                  setMessage("");
                  setActionError("");
                }}
                className="flex-1 rounded-xl px-3 py-2.5 text-xs font-black text-white shadow-sm transition hover:brightness-95 disabled:cursor-default disabled:opacity-65"
                style={{ backgroundColor: accent }}
              >
                {actionLabel}
              </button>
'''
if old_button not in s:
    raise SystemExit('card action button block not found')
s = s.replace(old_button, new_button, 1)

path.write_text(s)
