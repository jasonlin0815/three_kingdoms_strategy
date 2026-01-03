# LINE Bot Integration - 極簡設計

> **Status**: Refactored to Minimalist Design
> **Date**: 2026-01-03
> **Last Updated**: 2026-01-03

---

## 設計理念

Bot 只做兩件事：
1. **群組綁定** - 技術必要，獲取 `line_group_id`
2. **LIFF 入口推送** - 在適當時機引導用戶進入 LIFF

所有功能都在 LIFF Web UI 完成，Bot 只是入口。

---

## 觸發條件

| 觸發 | 事件 | 動作 | 限制 |
|------|------|------|------|
| Bot 加入群組 | `join` | 發送綁定說明 | - |
| 新成員加入 | `memberJoined` | 發送 LIFF 入口 | 群組已綁定 |
| `/綁定 CODE` | `message` | 執行綁定 | - |
| @bot | `message` | 發送 LIFF 入口 | - |
| 未註冊者發言 | `message` | 發送 LIFF 入口 | 每用戶一次 |
| 用戶加好友 | `follow` | 簡短說明 | - |

---

## 資料表結構

### line_user_notifications
記錄已發送通知的用戶，確保每用戶每群組只通知一次。

```sql
CREATE TABLE line_user_notifications (
    line_group_id VARCHAR(64) NOT NULL,
    line_user_id VARCHAR(64) NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (line_group_id, line_user_id)
);
```

### 其他表格（已存在）

- `line_binding_codes` - 臨時綁定碼
- `line_group_bindings` - 群組與同盟對應
- `member_line_bindings` - 成員與遊戲 ID 對應

---

## 環境變數

```env
# LINE Bot
LINE_CHANNEL_ID=xxxx
LINE_CHANNEL_SECRET=xxxx
LINE_ACCESS_TOKEN=xxxx
LINE_BOT_USER_ID=Uxxxx  # Bot 的 user ID，用於 @mention 檢測
LIFF_ID=xxxx-xxxx
```

### 如何獲取 LINE_BOT_USER_ID

```bash
curl -H "Authorization: Bearer {ACCESS_TOKEN}" \
     https://api.line.me/v2/bot/info
```

回應中的 `userId` 即為 Bot 的 user ID。

---

## 訊息模板

### 1. Bot 加入群組
```
👋 我是三國小幫手！

📌 開始使用：
盟主請發送「/綁定 XXXXXX」完成綁定
（綁定碼請在 Web App 生成）
```

### 2. 綁定成功（Flex Message）
```
┌────────────────────┐
│ ✅ 綁定成功！       │
├────────────────────┤
│ 各位盟友，請點擊    │
│ 下方按鈕開始使用！  │
├────────────────────┤
│    [開始使用]      │
└────────────────────┘
```

### 3. 被 @ 回應（Flex Message）
```
┌────────────────────┐
│ 📱 三國小幫手       │
├────────────────────┤
│ 查看表現、註冊帳號  │
│ 管理銅礦           │
├────────────────────┤
│     [開啟]         │
└────────────────────┘
```

### 4. 新成員歡迎（Flex Message）
```
┌────────────────────┐
│ 👋 歡迎加入！       │
├────────────────────┤
│ 點擊下方按鈕開始～  │
├────────────────────┤
│    [開始使用]      │
└────────────────────┘
```

### 5. 首次發言提醒（純文字）
```
💡 尚未註冊？點這裡開始 → {LIFF_URL}
```

### 6. 私聊回覆
```
💡 請在同盟群組中 @我 使用功能～
```

### 7. 加好友回覆
```
👋 嗨！我主要在群組中使用。
請在已綁定的同盟群組中 @我 開始使用！
```

---

## API Endpoints

### Web App (需要 JWT 認證)

| Method | Endpoint | 說明 |
|--------|----------|------|
| POST | `/api/v1/linebot/codes` | 生成綁定碼 |
| GET | `/api/v1/linebot/binding` | 查詢綁定狀態 |
| DELETE | `/api/v1/linebot/binding` | 解除綁定 |
| POST | `/api/v1/linebot/binding/refresh-info` | 刷新群組資訊 |

### LIFF (LINE User ID + Group ID 認證)

| Method | Endpoint | 說明 |
|--------|----------|------|
| GET | `/api/v1/linebot/member/info` | 查詢成員資訊 |
| GET | `/api/v1/linebot/member/performance` | 查詢成員表現 |
| POST | `/api/v1/linebot/member/register` | 註冊遊戲 ID |
| DELETE | `/api/v1/linebot/member/unregister` | 刪除遊戲 ID 綁定 |
| GET | `/api/v1/linebot/copper/list` | 查詢銅礦列表 |
| POST | `/api/v1/linebot/copper/register` | 註冊銅礦 |
| DELETE | `/api/v1/linebot/copper/{id}` | 刪除銅礦 |

### Webhook

| Method | Endpoint | 說明 |
|--------|----------|------|
| POST | `/api/v1/linebot/webhook` | LINE 事件處理 |

---

## 事件處理流程

```
事件進入
    │
    ├─ Bot 加入群組 (join)
    │   └─ 發送綁定說明
    │
    ├─ 新成員加入 (memberJoined)
    │   └─ 群組已綁定 → 發送 LIFF 入口
    │
    ├─ 訊息 (message)
    │   ├─ /綁定 CODE → 執行綁定
    │   ├─ @bot → 發送 LIFF 入口
    │   └─ 未註冊 & 未通知過 → 發送 LIFF 入口
    │
    ├─ 加好友 (follow)
    │   └─ 發送簡短說明
    │
    └─ 其他 → 忽略
```

---

## 移除的功能

以下功能已從 Bot 移除（改由 LIFF 處理）：

- ❌ `/狀態` 指令
- ❌ `/幫助` 指令
- ❌ 群組 30 分鐘冷卻機制（改為每用戶一次）
- ❌ 私聊複雜處理
- ❌ 個人表現查詢
- ❌ 排行榜

---

## 檔案結構

```
backend/src/
├── api/v1/endpoints/
│   └── linebot.py              # LINE Bot endpoints
├── models/
│   └── line_binding.py         # Pydantic models
├── repositories/
│   └── line_binding_repository.py  # Data access
├── services/
│   └── line_binding_service.py # Binding logic
└── core/
    ├── config.py               # LINE Bot config
    └── line_auth.py            # LINE auth utilities
```

---

## 安全機制

| 機制 | 說明 |
|------|------|
| Webhook 簽名驗證 | HMAC-SHA256 |
| 綁定碼過期 | 5 分鐘 |
| Rate Limit | 3 碼/小時/同盟 |
| 安全字符集 | 去除 0/O/I/1 |

---

*Last Updated: 2026-01-03*
