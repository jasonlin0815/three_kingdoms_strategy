# Three Kingdoms Strategy - System Architecture

> 系統架構與資料模型完整文件

**版本**: v0.9.0
**更新日期**: 2026-01-22

---

## 目錄

1. [系統概覽](#系統概覽)
2. [核心實體關係圖](#核心實體關係圖)
3. [資料模型詳解](#資料模型詳解)
   - [Alliance (同盟)](#1-alliance-同盟)
   - [Season (賽季)](#2-season-賽季)
   - [Member (成員)](#3-member-成員)
   - [CSV Upload & Snapshot](#4-csv-upload--snapshot)
   - [Period & Metrics](#5-period--metrics)
   - [Battle Events](#6-battle-events-戰役事件)
   - [Copper Mine](#7-copper-mine-銅礦管理)
   - [Donation](#8-donation-捐獻事件)
   - [LINE Integration](#9-line-integration)
4. [核心業務流程](#核心業務流程)
5. [權限系統](#權限系統)
6. [API 架構](#api-架構)

---

## 系統概覽

### 設計理念

本系統採用 **Alliance-Centric** 設計，以同盟 (Alliance) 為核心組織單位：

- **Member 隸屬於 Alliance**（不是 Season），實現跨賽季追蹤
- **Season 獨立管理**，每季數據互不影響
- **Snapshot 時間序列**，保留完整歷史軌跡
- **雙層架構**：Rules (Alliance Level) + Records (Season Level)

### 技術棧

| 層級 | 技術 |
|------|------|
| Backend | Python 3.13+ / FastAPI 0.118 / Pydantic V2 |
| Database | PostgreSQL 17 (Supabase) + RLS |
| Frontend | React 19 / TypeScript 5.8 / TanStack Query |
| Integration | LINE Bot SDK / LIFF |

---

## 核心實體關係圖

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              AUTH LAYER                                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  auth.users (Supabase Auth)                                                      │
│       │                                                                          │
│       ├──→ alliance_collaborators (用戶 ↔ 同盟關聯，含角色)                      │
│       │                                                                          │
│       └──→ pending_invitations (待接受邀請)                                      │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              ALLIANCE LAYER                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Alliance (同盟) ─────────────────────────────────────────────────────────────┐  │
│       │                                                                       │  │
│       ├──→ Member (遊戲成員，跨賽季) ←──────────────────────────────────────┐ │  │
│       │         ↑                                                           │ │  │
│       │         │ (member_id FK)                                            │ │  │
│       │         │                                                           │ │  │
│       ├──→ Season (賽季) ───────────────────────────────────────────────────┤ │  │
│       │         │                                                           │ │  │
│       │         ├──→ CsvUpload ──→ MemberSnapshot (快照)                    │ │  │
│       │         │         │               │                                 │ │  │
│       │         │         │               └──→ MemberPeriodMetrics          │ │  │
│       │         │         │                           ↑                     │ │  │
│       │         │         └──→ Period ────────────────┘                     │ │  │
│       │         │                                                           │ │  │
│       │         ├──→ BattleEvent ──→ BattleEventMetrics ────────────────────┘ │  │
│       │         │                                                             │  │
│       │         ├──→ CopperMine (銅礦所有權) ──────────────────────────────────┘  │
│       │         │                                                                │
│       │         ├──→ DonationEvent ──→ DonationTarget                            │
│       │         │                                                                │
│       │         └──→ HegemonyWeights (霸業積分權重)                              │
│       │                                                                          │
│       ├──→ CopperMineRule (銅礦規則，跨賽季)                                     │
│       │                                                                          │
│       └──→ LineCustomCommand (LINE 自定義指令)                                   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              LINE INTEGRATION LAYER                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Alliance ←──── LineGroupBinding (LINE 群組 ↔ 同盟)                              │
│       │              │                                                           │
│       │              ↓                                                           │
│       └───── MemberLineBinding (LINE 用戶 ↔ 遊戲 ID ↔ Member)                    │
│                                                                                  │
│  LineBindingCode (一次性綁定碼，5 分鐘過期)                                      │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 資料模型詳解

### 1. Alliance (同盟)

**表名**: `alliances`
**角色**: 頂層組織單位，所有資料的 root entity

```sql
CREATE TABLE alliances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                    -- 同盟名稱
  server_name TEXT,                      -- 遊戲伺服器名稱
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**關聯**:
| 關聯表 | 關係 | 說明 |
|--------|------|------|
| alliance_collaborators | 1:N | 用戶與同盟的關聯（含角色） |
| seasons | 1:N | 同盟的賽季 |
| members | 1:N | 同盟的遊戲成員 |
| copper_mine_rules | 1:N | 銅礦申請規則（跨賽季） |
| line_group_bindings | 1:N | LINE 群組綁定 |

**設計重點**:
- Alliance 不再有 `user_id` 欄位，改用 `alliance_collaborators` 管理多用戶
- 所有子表都有 `alliance_id` 作為 RLS 過濾依據

---

### 2. Season (賽季)

**表名**: `seasons`
**角色**: 時間範圍管理，隔離不同賽季的數據

```sql
CREATE TABLE seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alliance_id UUID NOT NULL REFERENCES alliances(id),
  name TEXT NOT NULL,                    -- 賽季名稱 (例: S1 征服賽季)
  start_date DATE NOT NULL,              -- 開始日期
  end_date DATE,                         -- 結束日期 (NULL = 進行中)
  is_active BOOLEAN DEFAULT true,        -- 是否為活躍賽季
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**設計重點**:
- 每個同盟同時只有一個 `is_active = true` 的賽季
- `end_date = NULL` 表示賽季尚未結束
- Season Level 的資料（CsvUpload, Period, BattleEvent 等）在切換賽季後互不影響

---

### 3. Member (成員)

**表名**: `members`
**角色**: 遊戲成員的長期追蹤實體

```sql
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alliance_id UUID NOT NULL REFERENCES alliances(id),
  name TEXT NOT NULL,                    -- 遊戲暱稱（同盟內唯一）
  first_seen_at TIMESTAMPTZ NOT NULL,    -- 首次出現時間
  last_seen_at TIMESTAMPTZ NOT NULL,     -- 最後出現時間
  is_active BOOLEAN DEFAULT true,        -- 是否在最新快照中
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(alliance_id, name)
);
```

**關聯**:
| 關聯表 | 關係 | 說明 |
|--------|------|------|
| member_snapshots | 1:N | 成員的歷史快照 |
| member_period_metrics | 1:N | 成員的期間指標 |
| battle_event_metrics | 1:N | 成員的戰役指標 |
| copper_mines | 1:N | 成員的銅礦 |
| member_line_bindings | 1:N | LINE 綁定 |

**設計重點**:
- **Member 隸屬於 Alliance，不是 Season**
- 同一玩家跨賽季是同一個 Member record
- 透過 `first_seen_at` / `last_seen_at` 追蹤生命週期
- `name` 在同盟內唯一，用於 CSV 匹配

---

### 4. CSV Upload & Snapshot

#### CsvUpload

**表名**: `csv_uploads`
**角色**: 記錄每次 CSV 上傳的元數據

```sql
CREATE TABLE csv_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES seasons(id),
  alliance_id UUID NOT NULL REFERENCES alliances(id),  -- 反正規化，加速 RLS
  snapshot_date TIMESTAMPTZ NOT NULL,    -- 從檔名解析的時間
  uploaded_at TIMESTAMPTZ DEFAULT now(), -- 實際上傳時間
  file_name TEXT NOT NULL,
  total_members INTEGER DEFAULT 0,
  upload_type TEXT DEFAULT 'regular' CHECK (upload_type IN ('regular', 'event')),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**upload_type 說明**:
| 類型 | 用途 | 特性 |
|------|------|------|
| `regular` | 日常數據管理 | 同日重複上傳會覆蓋、觸發 Period 計算 |
| `event` | 戰役事件分析 | 同日可多次上傳、不觸發 Period 計算 |

#### MemberSnapshot

**表名**: `member_snapshots`
**角色**: 某時間點的成員數據快照

```sql
CREATE TABLE member_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  csv_upload_id UUID NOT NULL REFERENCES csv_uploads(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id),
  alliance_id UUID NOT NULL REFERENCES alliances(id),

  -- 可變屬性（每次快照可能不同）
  member_name TEXT NOT NULL,             -- 保留原始資料（玩家可能改名）
  state TEXT NOT NULL,                   -- 所屬州
  group_name TEXT,                       -- 分組

  -- 排名與勢力
  contribution_rank INTEGER NOT NULL,
  power_value INTEGER NOT NULL,

  -- 週數據
  weekly_contribution BIGINT DEFAULT 0,
  weekly_merit INTEGER DEFAULT 0,
  weekly_assist INTEGER DEFAULT 0,
  weekly_donation BIGINT DEFAULT 0,

  -- 累計總量
  total_contribution BIGINT DEFAULT 0,
  total_merit BIGINT DEFAULT 0,
  total_assist INTEGER DEFAULT 0,
  total_donation BIGINT DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now()
);
```

**設計重點**:
- `ON DELETE CASCADE`：刪除 CsvUpload 時自動刪除關聯的 Snapshot
- `member_name` 重複儲存是因為玩家可能改名，需保留歷史紀錄
- `alliance_id` 反正規化，加速 RLS 查詢

---

### 5. Period & Metrics

#### Period

**表名**: `periods`
**角色**: 兩次 CSV 上傳之間的時間區間

```sql
CREATE TABLE periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES seasons(id),
  alliance_id UUID NOT NULL REFERENCES alliances(id),
  start_upload_id UUID REFERENCES csv_uploads(id),  -- 起始上傳（第一期為 NULL）
  end_upload_id UUID NOT NULL REFERENCES csv_uploads(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days INTEGER NOT NULL CHECK (days > 0),  -- 期間天數
  period_number INTEGER NOT NULL CHECK (period_number > 0),  -- 期間編號
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Period 自動計算邏輯**:
```
Upload 1 (10/01) ─────────────────── Upload 2 (10/07) ─────────────────── Upload 3 (10/14)
        │                                   │                                   │
        │                                   │                                   │
        └───────── Period 1 (6 days) ───────┴───────── Period 2 (7 days) ───────┘
                   start_upload_id=NULL            start_upload_id=Upload1
                   end_upload_id=Upload1           end_upload_id=Upload2
```

#### MemberPeriodMetrics

**表名**: `member_period_metrics`
**角色**: 成員在某期間的計算結果

```sql
CREATE TABLE member_period_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id UUID NOT NULL REFERENCES periods(id),
  member_id UUID NOT NULL REFERENCES members(id),
  alliance_id UUID NOT NULL REFERENCES alliances(id),
  start_snapshot_id UUID REFERENCES member_snapshots(id),  -- 新成員為 NULL
  end_snapshot_id UUID NOT NULL REFERENCES member_snapshots(id),

  -- 期間增量 (diff)
  contribution_diff BIGINT DEFAULT 0 CHECK (contribution_diff >= 0),
  merit_diff BIGINT DEFAULT 0 CHECK (merit_diff >= 0),
  assist_diff BIGINT DEFAULT 0 CHECK (assist_diff >= 0),
  donation_diff BIGINT DEFAULT 0 CHECK (donation_diff >= 0),
  power_diff INTEGER DEFAULT 0,  -- 可為負數

  -- 每日均值
  daily_contribution NUMERIC DEFAULT 0 CHECK (daily_contribution >= 0),
  daily_merit NUMERIC DEFAULT 0 CHECK (daily_merit >= 0),
  daily_assist NUMERIC DEFAULT 0 CHECK (daily_assist >= 0),
  daily_donation NUMERIC DEFAULT 0 CHECK (daily_donation >= 0),

  -- 排名資訊
  start_rank INTEGER CHECK (start_rank > 0),  -- 新成員為 NULL
  end_rank INTEGER NOT NULL CHECK (end_rank > 0),
  rank_change INTEGER,  -- 正數 = 進步

  -- 期末狀態
  end_power INTEGER DEFAULT 0,
  end_state VARCHAR,
  end_group VARCHAR,

  -- 標記
  is_new_member BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(period_id, member_id)
);
```

**計算公式**:
```
contribution_diff = end_snapshot.total_contribution - start_snapshot.total_contribution
daily_contribution = contribution_diff / period.days
rank_change = start_rank - end_rank  -- 正數表示排名上升（數字變小）
```

---

### 6. Battle Events (戰役事件)

#### BattleEvent

**表名**: `battle_events`
**角色**: 戰役事件記錄

```sql
CREATE TABLE battle_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alliance_id UUID NOT NULL REFERENCES alliances(id),
  season_id UUID NOT NULL REFERENCES seasons(id),
  name TEXT NOT NULL,
  event_type TEXT,               -- 事件類型（自定義）
  description TEXT,
  before_upload_id UUID REFERENCES csv_uploads(id),  -- 戰前快照
  after_upload_id UUID REFERENCES csv_uploads(id),   -- 戰後快照
  event_start TIMESTAMPTZ,       -- 事件開始時間
  event_end TIMESTAMPTZ,         -- 事件結束時間
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'analyzing', 'completed')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### BattleEventMetrics

**表名**: `battle_event_metrics`
**角色**: 成員在戰役中的表現

```sql
CREATE TABLE battle_event_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES battle_events(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id),
  alliance_id UUID NOT NULL REFERENCES alliances(id),
  start_snapshot_id UUID REFERENCES member_snapshots(id),
  end_snapshot_id UUID REFERENCES member_snapshots(id),

  -- 戰役期間增量
  contribution_diff BIGINT DEFAULT 0,
  merit_diff BIGINT DEFAULT 0,
  assist_diff BIGINT DEFAULT 0,
  donation_diff BIGINT DEFAULT 0,
  power_diff INTEGER DEFAULT 0,

  -- 狀態標記
  participated BOOLEAN DEFAULT false,  -- 是否參與
  is_new_member BOOLEAN DEFAULT false, -- 期間新加入
  is_absent BOOLEAN DEFAULT false,     -- 期間缺席

  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(event_id, member_id)
);
```

---

### 7. Copper Mine (銅礦管理)

#### CopperMineRule (Alliance Level)

**表名**: `copper_mine_rules`
**角色**: 銅礦申請規則，跨賽季共用

```sql
CREATE TABLE copper_mine_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alliance_id UUID NOT NULL REFERENCES alliances(id),
  tier INTEGER NOT NULL CHECK (tier >= 1 AND tier <= 10),  -- 第幾座銅礦
  required_merit BIGINT NOT NULL CHECK (required_merit > 0),  -- 戰功門檻
  allowed_level TEXT DEFAULT 'both' CHECK (allowed_level IN ('nine', 'ten', 'both')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(alliance_id, tier)
);
```

**allowed_level 說明**:
| 值 | 說明 |
|----|------|
| `nine` | 只能申請 9 級銅礦 |
| `ten` | 只能申請 10 級銅礦 |
| `both` | 9 或 10 級皆可 |

#### CopperMine (Season Level)

**表名**: `copper_mines`
**角色**: 銅礦所有權記錄

```sql
CREATE TABLE copper_mines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alliance_id UUID NOT NULL REFERENCES alliances(id),
  season_id UUID REFERENCES seasons(id),     -- 所屬賽季
  member_id UUID REFERENCES members(id),     -- 所屬成員（自動匹配）

  -- 來源追蹤
  registered_by_line_user_id VARCHAR NOT NULL,  -- LIFF: LINE User ID / Dashboard: "dashboard"
  game_id VARCHAR NOT NULL,                      -- 遊戲暱稱

  -- 銅礦資訊
  coord_x INTEGER NOT NULL CHECK (coord_x >= 0),
  coord_y INTEGER NOT NULL CHECK (coord_y >= 0),
  level INTEGER NOT NULL CHECK (level >= 1 AND level <= 10),
  status VARCHAR DEFAULT 'active',
  notes TEXT,

  registered_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**銅礦驗證流程**:
```
1. 取得規則數量 → 銅礦上限
2. 計算成員已有銅礦數量
3. 檢查是否達上限
4. 取得下一座的規則 (tier = current_count + 1)
5. 驗證戰功 (total_merit >= required_merit)
6. 驗證等級 (level 符合 allowed_level)
7. 檢查座標唯一性 (season_id, coord_x, coord_y)
```

---

### 8. Donation (捐獻事件)

#### DonationEvent

**表名**: `donation_events`
**角色**: 捐獻活動記錄

```sql
CREATE TABLE donation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alliance_id UUID NOT NULL REFERENCES alliances(id),
  season_id UUID NOT NULL REFERENCES seasons(id),
  title VARCHAR NOT NULL,
  type VARCHAR NOT NULL CHECK (type IN ('regular', 'penalty')),
  description TEXT,
  deadline TIMESTAMPTZ NOT NULL,
  target_amount BIGINT DEFAULT 0 CHECK (target_amount >= 0),  -- 預設目標
  status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**type 說明**:
| 類型 | 說明 | 目標設定 |
|------|------|----------|
| `regular` | 一般捐獻 | 統一目標 (target_amount) |
| `penalty` | 懲罰性捐獻 | 個別目標 (donation_targets) |

#### DonationTarget

**表名**: `donation_targets`
**角色**: 個別成員的捐獻目標（覆寫預設）

```sql
CREATE TABLE donation_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_event_id UUID NOT NULL REFERENCES donation_events(id) ON DELETE CASCADE,
  alliance_id UUID NOT NULL REFERENCES alliances(id),
  member_id UUID NOT NULL REFERENCES members(id),
  target_amount BIGINT NOT NULL CHECK (target_amount >= 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(donation_event_id, member_id)
);
```

---

### 9. LINE Integration

#### LineBindingCode

**表名**: `line_binding_codes`
**角色**: 一次性綁定碼（5 分鐘過期）

```sql
CREATE TABLE line_binding_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alliance_id UUID NOT NULL REFERENCES alliances(id),
  code VARCHAR NOT NULL UNIQUE,          -- 6-8 字元英數字
  created_by UUID NOT NULL REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ NOT NULL,       -- 過期時間
  used_at TIMESTAMPTZ,                   -- 使用時間（NULL = 未使用）
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### LineGroupBinding

**表名**: `line_group_bindings`
**角色**: LINE 群組與同盟的綁定

```sql
CREATE TABLE line_group_bindings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alliance_id UUID NOT NULL REFERENCES alliances(id),
  line_group_id VARCHAR NOT NULL,        -- LINE Group ID (Cxxxxxxxxxx)
  group_name VARCHAR,                    -- 群組名稱
  group_picture_url TEXT,                -- 群組圖片
  bound_by_line_user_id VARCHAR NOT NULL,  -- 執行綁定的 LINE 用戶
  is_active BOOLEAN DEFAULT true,
  bound_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(line_group_id)
);
```

#### MemberLineBinding

**表名**: `member_line_bindings`
**角色**: LINE 用戶與遊戲 ID 的綁定

```sql
CREATE TABLE member_line_bindings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alliance_id UUID NOT NULL REFERENCES alliances(id),
  member_id UUID REFERENCES members(id),  -- 自動匹配後填入
  line_user_id VARCHAR NOT NULL,          -- LINE User ID (Uxxxxxxxxxx)
  line_display_name VARCHAR NOT NULL,     -- LINE 顯示名稱
  game_id VARCHAR NOT NULL,               -- 遊戲暱稱（用於匹配 Member）
  is_verified BOOLEAN DEFAULT false,      -- 是否已驗證
  bound_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(alliance_id, line_user_id, game_id)
);
```

**LINE 綁定流程**:
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. 盟主在 Web App 產生綁定碼                                                 │
│    → LineBindingCode (5 分鐘過期)                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. 在 LINE 群組輸入 "/綁定 XXXXXX"                                          │
│    → 驗證碼 → 建立 LineGroupBinding                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. 群組成員透過 LIFF 註冊遊戲 ID                                             │
│    → MemberLineBinding (game_id)                                            │
│    → 自動比對 Members.name → 填入 member_id                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 核心業務流程

### CSV 上傳流程

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CSV Upload Workflow                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. 驗證權限 (owner/collaborator)                                            │
│       │                                                                      │
│       ↓                                                                      │
│  2. 解析檔名取得 snapshot_date                                               │
│     格式: 同盟統計YYYY年MM月DD日HH时MM分SS秒.csv                             │
│       │                                                                      │
│       ↓                                                                      │
│  3. 解析 CSV 內容                                                            │
│     欄位: 成員, 貢獻排行, 貢獻本週, 戰功本週, 助攻本週, 捐獻本週,            │
│           貢獻總量, 戰功總量, 助攻總量, 捐獻總量, 勢力值, 所屬州, 分組       │
│       │                                                                      │
│       ↓                                                                      │
│  4. [regular 類型] 檢查同日是否有上傳 → 刪除舊資料                           │
│       │                                                                      │
│       ↓                                                                      │
│  5. 建立 CsvUpload 記錄                                                      │
│       │                                                                      │
│       ↓                                                                      │
│  6. Upsert Members (依 name 比對)                                            │
│     - 存在 → 更新 last_seen_at                                               │
│     - 不存在 → 新建 Member                                                   │
│       │                                                                      │
│       ↓                                                                      │
│  7. Batch Create MemberSnapshots                                             │
│       │                                                                      │
│       ↓                                                                      │
│  8. [regular 類型] 計算 Period 和 MemberPeriodMetrics                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Period 計算邏輯

```python
def calculate_periods_for_season(season_id):
    # 1. 取得所有 regular 類型的上傳，按時間排序
    uploads = get_uploads(season_id, type='regular', order='snapshot_date ASC')

    # 2. 刪除舊的 Periods 和 Metrics
    delete_periods_by_season(season_id)

    # 3. 為每對連續上傳建立 Period
    for i, (start_upload, end_upload) in enumerate(pairwise(uploads)):
        period = create_period(
            season_id=season_id,
            period_number=i + 1,
            start_upload_id=start_upload.id if start_upload else None,
            end_upload_id=end_upload.id,
            start_date=start_upload.snapshot_date if start_upload else season.start_date,
            end_date=end_upload.snapshot_date,
            days=(end_date - start_date).days
        )

        # 4. 計算每個成員的指標
        for member in get_members_in_end_snapshot(end_upload.id):
            start_snapshot = get_snapshot(start_upload.id, member.id)
            end_snapshot = get_snapshot(end_upload.id, member.id)

            create_member_period_metrics(
                period_id=period.id,
                member_id=member.id,
                contribution_diff=end.total - start.total,
                daily_contribution=diff / days,
                rank_change=start.rank - end.rank,
                is_new_member=(start_snapshot is None)
            )
```

---

## 權限系統

### 角色定義

| 角色 | 權限 | 說明 |
|------|------|------|
| `owner` | 完整權限 | 建立同盟的用戶，可刪除同盟 |
| `collaborator` | 編輯權限 | 受邀的協作者，可上傳 CSV、管理賽季 |
| `member` | 唯讀權限 | 受邀的成員，只能查看數據 |

### 權限矩陣

| 操作 | owner | collaborator | member |
|------|:-----:|:------------:|:------:|
| 查看同盟數據 | ✅ | ✅ | ✅ |
| 上傳 CSV | ✅ | ✅ | ❌ |
| 管理賽季 | ✅ | ✅ | ❌ |
| 管理戰役事件 | ✅ | ✅ | ❌ |
| 管理銅礦規則 | ✅ | ✅ | ❌ |
| 邀請成員 | ✅ | ✅ | ❌ |
| 刪除同盟 | ✅ | ❌ | ❌ |
| 移除協作者 | ✅ | ❌ | ❌ |

### RLS 政策模式

```sql
-- 效能優化：使用 subquery 快取 auth.uid()
CREATE POLICY "policy_name" ON table_name
USING (
  alliance_id IN (
    SELECT alliance_id FROM alliance_collaborators
    WHERE user_id = (SELECT auth.uid())
  )
);
```

---

## API 架構

### 4-Layer Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  API Layer (src/api/v1/endpoints/)                                           │
│  - HTTP 請求處理、驗證、認證                                                 │
│  - 使用 Depends(get_service) 注入 Service                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  Service Layer (src/services/)                                               │
│  - 業務邏輯編排                                                              │
│  - 權限檢查                                                                  │
│  - 多步驟操作協調                                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  Repository Layer (src/repositories/)                                        │
│  - 資料庫查詢                                                                │
│  - 使用 _handle_supabase_result() 統一錯誤處理                               │
│  - 繼承 SupabaseRepository[T]                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│  Database (Supabase PostgreSQL)                                              │
│  - 資料持久化                                                                │
│  - RLS 安全策略                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 主要 API Endpoints

| 模組 | Endpoint | 功能 |
|------|----------|------|
| **Alliance** | `GET /alliances` | 取得用戶的同盟 |
| | `POST /alliances` | 建立同盟 |
| | `GET /alliances/{id}/collaborators` | 取得協作者列表 |
| **Season** | `GET /seasons` | 列出賽季 |
| | `POST /seasons` | 建立賽季 |
| | `PATCH /seasons/{id}/activate` | 設為活躍賽季 |
| **Upload** | `POST /uploads` | 上傳 CSV |
| | `GET /uploads?season_id={id}` | 列出上傳記錄 |
| **Events** | `GET /events?season_id={id}` | 列出戰役事件 |
| | `POST /events` | 建立戰役事件 |
| | `GET /events/{id}/analytics` | 戰役分析數據 |
| **Copper Mine** | `GET /copper-mines/rules` | 取得銅礦規則 |
| | `GET /copper-mines/ownerships?season_id={id}` | 取得銅礦列表 |
| **Analytics** | `GET /analytics/members/{id}/trends` | 成員趨勢分析 |
| | `GET /analytics/groups` | 組別對比分析 |
| **LIFF** | `POST /liff/copper-mines/register` | LIFF 申請銅礦 |
| | `GET /liff/members/performance` | LIFF 個人表現 |

---

## 附錄：資料庫表格清單

| 表名 | 筆數 | 說明 |
|------|------|------|
| alliances | 3 | 同盟 |
| alliance_collaborators | 8 | 用戶-同盟關聯 |
| pending_invitations | 1 | 待接受邀請 |
| seasons | 1 | 賽季 |
| members | 301 | 遊戲成員 |
| csv_uploads | 6 | CSV 上傳記錄 |
| member_snapshots | 1582 | 成員快照 |
| periods | 6 | 期間 |
| member_period_metrics | 1185 | 成員期間指標 |
| hegemony_weights | 4 | 霸業積分權重 |
| battle_events | 1 | 戰役事件 |
| battle_event_metrics | 199 | 戰役成員指標 |
| copper_mine_rules | 4 | 銅礦規則 |
| copper_mines | 3 | 銅礦記錄 |
| donation_events | 2 | 捐獻事件 |
| donation_targets | 3 | 捐獻目標 |
| line_binding_codes | 5 | LINE 綁定碼 |
| line_group_bindings | 3 | LINE 群組綁定 |
| member_line_bindings | 94 | LINE 用戶綁定 |
| line_custom_commands | 1 | LINE 自定義指令 |
| line_user_notifications | 7 | LINE 通知記錄 |

---

**文件結束**
