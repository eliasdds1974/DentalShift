import DentalJobsPage from "../classifieds/page";

export default function DentalJobsRoute() {
  return (
    <div className="dental-jobs-route">
      <DentalJobsPage />
      <style>{`
        .dental-jobs-route main > section:first-of-type .mx-auto > .mt-6.grid > button:has(.lucide-user-round) {
          position: relative !important;
          overflow: hidden !important;
          border-color: #002757 !important;
          background: #002757 !important;
          box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1) !important;
          transform: translateY(0);
        }

        .dental-jobs-route main > section:first-of-type .mx-auto > .mt-6.grid > button:has(.lucide-user-round)::before {
          content: "";
          position: absolute;
          inset: 0 0 auto 0;
          height: 6px;
          background: #01A32E;
        }

        .dental-jobs-route main > section:first-of-type .mx-auto > .mt-6.grid > button:has(.lucide-user-round):hover {
          border-color: #01A32E !important;
          transform: translateY(-4px) !important;
          box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25) !important;
        }

        .dental-jobs-route main > section:first-of-type .mx-auto > .mt-6.grid > button:has(.lucide-user-round) > div > span:first-child {
          background: #01A32E !important;
          color: #ffffff !important;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1) !important;
          outline: 4px solid rgb(255 255 255 / 0.1);
        }

        .dental-jobs-route main > section:first-of-type .mx-auto > .mt-6.grid > button:has(.lucide-user-round) p:first-child {
          color: #9be3ad !important;
        }

        .dental-jobs-route main > section:first-of-type .mx-auto > .mt-6.grid > button:has(.lucide-user-round) h2 {
          color: #ffffff !important;
        }

        .dental-jobs-route main > section:first-of-type .mx-auto > .mt-6.grid > button:has(.lucide-user-round) h2 + p {
          color: #e2e8f0 !important;
        }

        .dental-jobs-route main > section:first-of-type .mx-auto > .mt-6.grid > button:has(.lucide-user-round) h2 + p + span {
          margin-top: 1rem !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 0.5rem !important;
          border-radius: 0.75rem !important;
          background: #01A32E !important;
          padding: 0.625rem 1rem !important;
          color: #ffffff !important;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1) !important;
        }

        .dental-jobs-route main > section:first-of-type .mx-auto > .mt-6.grid > button:has(.lucide-user-round):hover h2 + p + span {
          background: #ffffff !important;
          color: #002757 !important;
        }
      `}</style>
    </div>
  );
}
