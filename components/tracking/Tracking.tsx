import Script from "next/script";
import { Suspense } from "react";
import { ConsentAndPixel } from "@/components/tracking/ConsentAndPixel";
import { PageViewTracker } from "@/components/tracking/PageViewTracker";
import { COOKIES } from "@/lib/cookies";

/**
 * GA4 + Google Ads via gtag with Consent Mode v2 (default denied until the visitor
 * chooses). Meta Pixel is only injected after marketing consent (see ConsentAndPixel).
 */
export function Tracking() {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const adsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
  const tagId = gaId ?? adsId;

  return (
    <>
      {tagId ? (
        <>
          <Script id="gtag-consent" strategy="afterInteractive">
            {`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
var c = (document.cookie.match(/(?:^|; )${COOKIES.consent}=a([01])m([01])/) || []);
gtag('consent', 'default', {
  analytics_storage: c[1] === '1' ? 'granted' : 'denied',
  ad_storage: c[2] === '1' ? 'granted' : 'denied',
  ad_user_data: c[2] === '1' ? 'granted' : 'denied',
  ad_personalization: c[2] === '1' ? 'granted' : 'denied',
  wait_for_update: 500
});
gtag('set', 'url_passthrough', true);
gtag('set', 'ads_data_redaction', c[2] !== '1');
gtag('js', new Date());
${gaId ? `gtag('config', '${gaId}', { send_page_view: false });` : ""}
${adsId ? `gtag('config', '${adsId}', { allow_enhanced_conversions: true });` : ""}
`}
          </Script>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${tagId}`} strategy="afterInteractive" />
        </>
      ) : null}
      <ConsentAndPixel />
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
    </>
  );
}
