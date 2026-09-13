from pathlib import Path

path = Path('components/OfficePostingsCard.tsx')
text = path.read_text()
old = '''type JobConnection = {
  id: string;
  listingId: string;
  sourceOfficeListingId?: string | null;
  initiatorRole: "professional" | "office";
  status: "pending" | "interested" | "declined" | "withdrawn";
  createdAt: string;
  profession: string;
  city: string;
  province: string;
  candidatePreview?: CandidatePreview | null;
};'''
new = '''type JobConnection = {
  id: string;
  listingId: string;
  professionalId: string;
  officeId: string;
  initiatorRole: "professional" | "office";
  status: "pending" | "interested" | "declined" | "withdrawn";
  message: string;
  resumePath: string | null;
  createdAt: string;
  profession: string;
  employment: string;
  city: string;
  province: string;
  listingType: "office_hiring" | "professional_available";
  sourceOfficeListingId?: string | null;
  candidatePreview?: CandidatePreview | null;
};'''
if old not in text:
    raise SystemExit('JobConnection type block not found')
path.write_text(text.replace(old, new, 1))
print('Aligned OfficePostingsCard JobConnection type with page.tsx')
