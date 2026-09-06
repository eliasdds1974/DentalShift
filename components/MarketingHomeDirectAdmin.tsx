"use client";

import { MarketingHome as OriginalMarketingHome } from "./MarketingHome";

type Audience = "office" | "professional";

type Props = {
  onSignIn: () => void;
  onGetStarted: (audience: Audience) => void;
  onAdmin?: () => void;
  onWorkspace?: () => void;
  signedIn?: boolean;
};

export function MarketingHome({ onAdmin: _onAdmin, ...props }: Props) {
  return (
    <OriginalMarketingHome
      {...props}
      onAdmin={() => {
        window.location.assign("/admin/overview");
      }}
    />
  );
}
