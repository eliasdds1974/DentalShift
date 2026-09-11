import ClassifiedsPage from "../classifieds/page";

export default function DentalJobsPage() {
  return (
    <div className="dental-jobs-compact-layout">
      <style>{`
        @media (min-width: 1024px) {
          .dental-jobs-compact-layout main > section:first-of-type > div:has(> section.relative h2) {
            display: grid;
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
            column-gap: 1rem;
            align-items: start;
          }

          .dental-jobs-compact-layout main > section:first-of-type > div:has(> section.relative h2) > :first-child,
          .dental-jobs-compact-layout main > section:first-of-type > div:has(> section.relative h2) > section:not(.relative),
          .dental-jobs-compact-layout main > section:first-of-type > div:has(> section.relative h2) > div.mt-6.grid.gap-3 {
            grid-column: 1 / -1;
          }

          .dental-jobs-compact-layout main > section:first-of-type > div:has(> section.relative h2) > div.mt-6.grid.gap-4 {
            grid-column: 1;
            max-width: none;
            margin-top: 1.5rem;
          }

          .dental-jobs-compact-layout main > section:first-of-type > div:has(> section.relative h2) > section.relative {
            grid-column: 2;
            margin-top: 1.5rem;
            height: 100%;
          }
        }
      `}</style>
      <ClassifiedsPage />
    </div>
  );
}
