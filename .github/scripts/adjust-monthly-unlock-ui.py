from pathlib import Path

path = Path('app/classifieds/page.tsx')
text = path.read_text()

text = text.replace('.from("candidate_unlocks").select("office_id,professional_id,status").eq("status", "paid")', '.from("candidate_unlocks").select("office_id,professional_id,status").in("status", ["accrued","billed","paid"])')

old = '''      if (result.unlocked) {
        await loadUnlocks();
        await viewUnlockedCandidate(connection);
        return;
      }
      if (!result.checkoutUrl) throw new Error("Stripe checkout could not be opened.");
      window.location.assign(result.checkoutUrl);
'''
new = '''      if (result.unlocked) {
        await loadUnlocks();
        await loadConnections();
        await viewUnlockedCandidate(connection);
        return;
      }
      throw new Error(result.error || "Candidate unlock could not be completed.");
'''
assert old in text
text = text.replace(old, new, 1)

helper_anchor = '  const viewUnlockedCandidate = async (connection: JobConnection) => {\n'
assert helper_anchor in text
setup = '''  const setupBillingCard = async () => {
    setUnlockError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Please sign in again.");
      const response = await fetch("/api/dentaljobs/billing/setup", { method: "POST", headers: { Authorization: `Bearer ${session.access_token}` } });
      const result = await response.json();
      if (!response.ok || !result.checkoutUrl) throw new Error(result.error || "Could not open secure card setup.");
      window.location.assign(result.checkoutUrl);
    } catch (value) {
      setUnlockError(value instanceof Error ? value.message : "Could not open secure card setup.");
    }
  };

'''
text = text.replace(helper_anchor, setup + helper_anchor, 1)

text = text.replace('"Unlock Candidate — $29 CAD"', '"Unlock Candidate — $29 CAD · billed monthly"')
text = text.replace('"Opening checkout…"', '"Unlocking…"')

error_old = '{unlockError && <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700">{unlockError}</p>}'
error_new = '{unlockError && <div className="mt-3 flex flex-col gap-2 rounded-xl bg-rose-50 p-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm font-bold text-rose-700">{unlockError}</p>{unlockError.toLowerCase().includes("credit card") && <button type="button" onClick={() => void setupBillingCard()} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#002757] px-3.5 py-2 text-xs font-black text-white"><CreditCard size={14}/> Add Card</button>}</div>}'
assert error_old in text
text = text.replace(error_old, error_new, 1)

text = text.replace('Your office will not be charged again for this same professional on DentalShift.', 'This $29 Candidate Unlock is added to your office’s monthly DentalShift invoice. Your office will not be charged again for this same professional.')

path.write_text(text)
print('Monthly Candidate Unlock UI adjusted')
