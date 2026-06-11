import { NextResponse } from "next/server";

/**
 * Digital Asset Links for Android TWA (Trusted Web Activity).
 * After generating your APK signing keystore, set on Vercel:
 *   TWA_PACKAGE_NAME=com.skyworld.survey
 *   TWA_SHA256_FINGERPRINT=AA:BB:CC:...  (from keytool -list -v)
 */
export async function GET() {
  const packageName = process.env.TWA_PACKAGE_NAME;
  const fingerprint = process.env.TWA_SHA256_FINGERPRINT;

  if (!packageName || !fingerprint) {
    return NextResponse.json([], {
      headers: { "Content-Type": "application/json" }
    });
  }

  const body = [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: packageName,
        sha256_cert_fingerprints: [fingerprint.replace(/\s/g, "")]
      }
    }
  ];

  return NextResponse.json(body, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
