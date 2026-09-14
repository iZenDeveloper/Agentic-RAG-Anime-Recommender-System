# ShadowPulse

Web app quét tín hiệu hạn chế hiển thị (shadowban / reach suppression) đa nền tảng:
**X · Instagram · TikTok · Facebook · Threads**.

Theo PRD v0.1: trung thực hơn đối thủ — mỗi tín hiệu có status
`Clear / Restricted / Inconclusive / N/A`, confidence, evidence và CTA check official.

## Chạy local

```bash
cd shadowpulse
npm install
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000).

## API

`POST /api/scan`

```json
{ "handle": "elonmusk", "platforms": ["x", "instagram"] }
```

Rate limit free: 5 check/IP/ngày, 1 check/handle/3 phút.

## Nguyên tắc

- Chỉ probe dữ liệu công khai, không OAuth mật khẩu user.
- Không đo được → **Inconclusive**, không bịa Restricted.
- Visibility Score chỉ trên tín hiệu đo được.
