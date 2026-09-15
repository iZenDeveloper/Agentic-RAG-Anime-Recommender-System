import Link from "next/link";

export const metadata = {
  title: "Phương pháp đo — ShadowPulse",
  description:
    "ShadowPulse chỉ đo tín hiệu quan sát được từ bên ngoài. Mọi tín hiệu không đo được trả Inconclusive.",
};

export default function MethodologyPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <Link href="/" className="text-sm text-[var(--signal)] hover:underline">
        ← ShadowPulse
      </Link>
      <h1 className="display mt-6 text-4xl text-[var(--ink)]">Phương pháp đo</h1>
      <p className="mt-4 leading-relaxed text-[var(--mute)]">
        Sản phẩm sống hay chết ở độ trung thực. Chúng tôi chỉ quan sát dữ liệu
        công khai — cùng thứ một người lạ có thể thấy — và gắn confidence cho
        từng tín hiệu.
      </p>

      <section className="mt-10 space-y-4 text-sm leading-relaxed">
        <h2 className="display text-2xl">Quy tắc</h2>
        <ul className="list-disc space-y-2 pl-5 text-[var(--mute)]">
          <li>Chỉ đo tín hiệu public: search, gợi ý, bài công khai, metadata.</li>
          <li>Không suy diễn ranking nội bộ thành “bị shadowban”.</li>
          <li>Thiếu dữ liệu / platform chặn / probe fail → Inconclusive.</li>
          <li>Visibility Score chỉ tính Clear + Restricted; bỏ Inconclusive.</li>
          <li>Luôn có CTA check official (Account Status / Under the Hood).</li>
        </ul>
      </section>

      <section className="mt-10 space-y-4 text-sm">
        <h2 className="display text-2xl">MVP theo nền tảng</h2>
        <div className="space-y-3 text-[var(--mute)]">
          <p>
            <strong className="text-[var(--ink)]">X:</strong> profile, suggestion
            approximation, from: search (khi surface mở), ghost/deboost khi có
            sample; For You luôn Inconclusive.
          </p>
          <p>
            <strong className="text-[var(--ink)]">Instagram / TikTok / Threads:</strong>{" "}
            profile public + wizard official; search cá nhân hóa → thường
            Inconclusive.
          </p>
          <p>
            <strong className="text-[var(--ink)]">Facebook:</strong> page lookup +
            checklist official. Không bán Restricted cho phân phối newsfeed.
          </p>
        </div>
      </section>

      <p className="mt-12 border-l-2 border-[var(--warn)] pl-4 text-sm leading-relaxed text-[var(--warn)]">
        ShadowPulse không phải thông báo từ X, Meta hay TikTok. Không hứa gỡ
        ban. Không scrape nội dung private.
      </p>
    </main>
  );
}
