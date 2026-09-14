import Link from "next/link";
import type { Platform } from "@/lib/types";

const GUIDES: Record<
  Platform,
  { title: string; steps: string[]; official: string }
> = {
  x: {
    title: "Check tay X trong 2 phút",
    steps: [
      "Mở x.com bằng tài khoản khác (hoặc logged-out).",
      "Gõ vài ký tự đầu handle vào Search → People: có hiện suggestion không?",
      "Search `from:handle` tab Latest: bài gần nhất có index không?",
      "Mở Under the Hood / account notice trong app nếu có.",
    ],
    official: "https://help.x.com/en/using-x/x-under-the-hood",
  },
  instagram: {
    title: "Check tay Instagram trong 2 phút",
    steps: [
      "Settings → Account Status trong app (source of truth).",
      "Từ nick không follow: search username — profile có hiện không?",
      "Đăng hashtag độc, search hashtag từ nick khác.",
      "Đừng kết luận Explore ban chỉ vì view tụt.",
    ],
    official: "https://help.instagram.com/2635538616697496",
  },
  tiktok: {
    title: "Check tay TikTok trong 2 phút",
    steps: [
      "TikTok Studio → Account Check / Account status.",
      "Mở video mới → Analytics → Traffic source (For You?).",
      "Search handle từ nick không follow.",
      "Hashtag độc + nick không follow để test discovery.",
    ],
    official: "https://www.tiktok.com/tiktokstudio",
  },
  facebook: {
    title: "Check tay Facebook trong 2 phút",
    steps: [
      "Mở Account Status / Professional dashboard trong app.",
      "Search Page từ tài khoản khác.",
      "Kiểm tra Page quality / ad account riêng nếu chạy ads.",
      "Tool bên ngoài không đọc được phân phối newsfeed.",
    ],
    official: "https://www.facebook.com/help",
  },
  threads: {
    title: "Check tay Threads trong 2 phút",
    steps: [
      "Mở profile logged-out / nick khác.",
      "Search handle nếu surface còn sống.",
      "Kiểm tra reply trong thread gốc từ phía người lạ.",
      "Đối chiếu Account Status Instagram (cùng hệ Meta).",
    ],
    official: "https://www.threads.net/",
  },
};

export default async function CheckGuidePage({
  params,
}: {
  params: Promise<{ platform: string }>;
}) {
  const { platform: raw } = await params;
  const platform = raw as Platform;
  const guide = GUIDES[platform];
  if (!guide) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-12">
        <p>Unknown platform.</p>
        <Link href="/">Home</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-5 py-12">
      <Link href="/" className="text-sm text-[var(--signal)]">
        ← ShadowPulse
      </Link>
      <h1 className="mt-6 font-[family-name:var(--font-display)] text-3xl font-bold">
        {guide.title}
      </h1>
      <ol className="mt-6 list-decimal space-y-3 pl-5 text-[var(--muted)]">
        {guide.steps.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
      <a
        href={guide.official}
        target="_blank"
        rel="noreferrer"
        className="mt-8 inline-flex rounded-xl bg-[var(--signal)] px-4 py-2.5 text-sm font-semibold text-[#04201b]"
      >
        Mở hướng dẫn official
      </a>
    </main>
  );
}
