export type Locale = "vi" | "en";

const dict = {
  vi: {
    brand: "ShadowPulse",
    tagline: "Biết nền tảng đang giấu gì, và mức độ chắc chắn của kết luận đó.",
    heroSupport:
      "Quét tín hiệu hạn chế hiển thị công khai trên X, Instagram, TikTok, Facebook và Threads. Không mật khẩu. Không verdict bịa.",
    cta: "Quét ngay",
    placeholder: "@handle hoặc URL profile",
    platforms: "Nền tảng",
    scanning: "Đang quét tín hiệu công khai…",
    score: "Visibility Score",
    scoreBasedOn: "Điểm dựa trên {n}/{m} tín hiệu đo được",
    scoreNone: "Chưa đủ tín hiệu đo được để tính điểm",
    disclaimer:
      "ShadowPulse quan sát dữ liệu công khai. Đây không phải thông báo từ X, Meta hay TikTok. Điểm số bỏ qua các tín hiệu không đo được. Hãy đối chiếu Account Status / Under the Hood trong app.",
    nextSteps: "3 việc nên làm tiếp",
    next1: "Mở công cụ official trong app (Account Status / Under the Hood).",
    next2: "Nếu Inconclusive vì thiếu bài/reply: đăng 1 bài test công khai rồi quét lại.",
    next3: "Đừng đổi strategy chỉ vì tụt view. Tụt view không đồng nghĩa shadowban.",
    alertTitle: "Nhận alert khi tín hiệu đổi",
    alertPlaceholder: "email@domain.com",
    alertCta: "Giữ chỗ monitor",
    alertThanks: "Đã lưu. Phase 2 sẽ gửi magic link monitor.",
    methodology: "Phương pháp",
    manualCheck: "Check tay 2 phút",
    share: "Chia sẻ kết quả (24h)",
    openManual: "Mở link kiểm tra tay",
    statusClear: "Clear",
    statusRestricted: "Restricted",
    statusInconclusive: "Inconclusive",
    statusNA: "N/A",
    confidence: "Tin cậy",
    evidence: "Bằng chứng",
    method: "Cách đo",
    rateLimit: "Bạn đã hết lượt free hôm nay hoặc handle vừa được quét. Thử lại sau.",
    invalid: "Handle không hợp lệ cho nền tảng đã chọn.",
    empty: "Nhập handle và chọn ít nhất một nền tảng.",
    footerTrust: "Trung thực hơn đối thủ. “Không rõ” tốt hơn “bị ban 100%”.",
    navMethod: "Phương pháp",
    resultFor: "Báo cáo cho",
    measured: "Đo được",
    officialCta: "Mở hướng dẫn check official",
  },
  en: {
    brand: "ShadowPulse",
    tagline: "See what platforms are hiding, and how sure we are.",
    heroSupport:
      "Public visibility probes across X, Instagram, TikTok, Facebook, and Threads. No passwords. No fake verdicts.",
    cta: "Scan now",
    placeholder: "@handle or profile URL",
    platforms: "Platforms",
    scanning: "Probing public signals…",
    score: "Visibility Score",
    scoreBasedOn: "Score based on {n}/{m} measurable signals",
    scoreNone: "Not enough measurable signals to score",
    disclaimer:
      "ShadowPulse observes public data only. This is not a notice from X, Meta, or TikTok. Scores ignore unmeasurable signals. Cross-check Account Status / Under the Hood in-app.",
    nextSteps: "3 things to do next",
    next1: "Open the official tool in-app (Account Status / Under the Hood).",
    next2: "If Inconclusive for missing posts/replies: publish one public test, then rescan.",
    next3: "Don’t overhaul strategy for a view drop alone. Views are not a shadowban.",
    alertTitle: "Get alerted when signals change",
    alertPlaceholder: "email@domain.com",
    alertCta: "Join monitor waitlist",
    alertThanks: "Saved. Phase 2 will send a magic-link monitor.",
    methodology: "Methodology",
    manualCheck: "2-minute manual check",
    share: "Share result (24h)",
    openManual: "Open manual check link",
    statusClear: "Clear",
    statusRestricted: "Restricted",
    statusInconclusive: "Inconclusive",
    statusNA: "N/A",
    confidence: "Confidence",
    evidence: "Evidence",
    method: "Method",
    rateLimit: "Free daily limit or handle cooldown hit. Try again later.",
    invalid: "Handle is invalid for the selected platform(s).",
    empty: "Enter a handle and pick at least one platform.",
    footerTrust: "Honesty over hype. “Unclear” beats “100% banned”.",
    navMethod: "Methodology",
    resultFor: "Report for",
    measured: "Measurable",
    officialCta: "Open official check guide",
  },
} as const;

export type DictKey = keyof (typeof dict)["vi"];

export function t(
  locale: Locale,
  key: DictKey,
  vars?: Record<string, string | number>,
) {
  let value: string = dict[locale][key];
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      value = value.replace(`{${k}}`, String(v));
    }
  }
  return value;
}

export const PLATFORM_LABEL: Record<
  "x" | "instagram" | "tiktok" | "facebook" | "threads",
  { vi: string; en: string }
> = {
  x: { vi: "X", en: "X" },
  instagram: { vi: "Instagram", en: "Instagram" },
  tiktok: { vi: "TikTok", en: "TikTok" },
  facebook: { vi: "Facebook", en: "Facebook" },
  threads: { vi: "Threads", en: "Threads" },
};
