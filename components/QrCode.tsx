import QRCode from "qrcode";

/**
 * Renders a QR code for `url` server-side. `url` must already be validated
 * (isValidLaunchUrl) by the caller — this component encodes exactly the same
 * string as the launch link, so the two can never point to different places.
 */
export async function QrCode({ url, label }: { url: string; label: string }) {
  const dataUrl = await QRCode.toDataURL(url, {
    margin: 1,
    width: 220,
    color: { dark: "#18181b", light: "#ffffff" },
  });

  return (
    <div className="flex flex-col items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={dataUrl}
        alt={`${label} 실행 링크로 연결되는 QR 코드`}
        width={180}
        height={180}
        className="rounded-lg border border-zinc-200 dark:border-zinc-700"
      />
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        휴대폰 카메라로 스캔하면 같은 실행 링크로 이동해요
      </p>
    </div>
  );
}
