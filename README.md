# DentalShift

DentalShift is a Canadian dental staffing marketplace connecting verified dental professionals with dental offices that need short-term shift coverage.

## Current working model

- Office dashboard with shift posting, matched professionals, invitations and bookings
- Professional marketplace with matched shifts, applications, favourites and schedule
- Admin dashboard with licence verification and dispute oversight
- Responsive desktop and mobile interface
- Supabase data model with row-level security for profiles, offices, shifts, applications, bookings, reviews, licence checks and disputes

## Run locally

```bash
npm install
npm run dev
```

The production database is hosted in the connected DentalShift Supabase project. Add Supabase publishable environment variables when the authentication layer is enabled.
