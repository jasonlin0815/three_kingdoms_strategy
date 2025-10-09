# Three Kingdoms Strategy Manager

> 三國志戰略版盟友表現管理系統 - Alliance Member Performance Tracking System

[![Python](https://img.shields.io/badge/Python-3.13+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.118+-green.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19.2-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📋 目錄

- [專案概覽](#-專案概覽)
- [核心功能](#-核心功能)
- [技術棧](#-技術棧)
- [專案架構](#-專案架構)
- [快速開始](#-快速開始)
- [環境設定](#-環境設定)
- [API 文件](#-api-文件)
- [資料庫架構](#-資料庫架構)
- [開發規範](#-開發規範)
- [專案現況報告](#-專案現況報告)
- [常見問題](#-常見問題)

---

## 🎯 專案概覽

**Three Kingdoms Strategy Manager** 是一個專為《三國志戰略版》遊戲設計的盟友表現管理工具，幫助盟主/官員追蹤與分析同盟成員的表現數據。

### 核心價值

- 📊 **自動化數據管理** - 透過 CSV 上傳自動處理成員表現數據
- 🎮 **多賽季追蹤** - 支援跨賽季數據比較與趨勢分析
- 📈 **即時數據分析** - 自動計算貢獻、戰功、助攻、捐獻等指標
- 🔒 **安全性保證** - 基於 Supabase RLS 的資料隔離機制
- 🌐 **現代化架構** - FastAPI + React 全棧解決方案

---

## ✨ 核心功能

### 已實作功能 ✅

#### 1. **使用者認證系統**
- Google OAuth 登入整合
- Supabase Auth JWT 驗證
- 自動 token 管理與更新

#### 2. **同盟管理 (Alliance Management)**
- 同盟 CRUD 操作（建立、讀取、更新、刪除）
- 自動檢查與引導流程（AllianceGuard）
- 一對一使用者同盟關聯

#### 3. **CSV 數據上傳**
- 智能檔名日期提取（支援中文格式：`同盟統計YYYY年MM月DD日HH时MM分SS秒.csv`）
- 每日唯一上傳約束（自動覆蓋舊數據）
- 批量成員數據處理
- 完整上傳歷史記錄

#### 4. **成員管理**
- 自動成員註冊與更新
- 成員生命週期追蹤（首次出現、最後活躍）
- 活躍狀態管理

#### 5. **表現快照系統**
- 完整的週數據與累積數據記錄
- 支援 13 個關鍵指標追蹤
- 歷史快照保留與查詢

### 規劃中功能 🚧

#### Phase 3: 賽季管理
- [ ] 賽季 CRUD API
- [ ] 賽季週期設定（開始/結束日期）
- [ ] 活躍賽季切換

#### Phase 4: 數據分析
- [ ] 成員表現趨勢分析
- [ ] 排名變化追蹤
- [ ] 同盟數據統計儀表板
- [ ] 霸業積分權重設定

#### Phase 5: 進階功能
- [ ] 數據匯出功能（Excel/CSV）
- [ ] 自訂報表生成
- [ ] 成員表現通知系統

---

## 🛠️ 技術棧

### Backend

| 技術 | 版本 | 用途 |
|------|------|------|
| **Python** | 3.13+ | 核心語言（支援最新 type parameter 語法） |
| **FastAPI** | 0.118.0 | 現代 Python Web 框架 |
| **Pydantic** | 2.12.0 | 資料驗證與序列化 |
| **Supabase** | 2.21.1 | PostgreSQL + Row Level Security |
| **UV** | latest | 快速套件管理工具 |
| **python-jose** | 3.5.0 | JWT 認證 |
| **Ruff** | 0.14.0+ | 程式碼品質檢查 |

### Frontend

| 技術 | 版本 | 用途 |
|------|------|------|
| **React** | 19.2.0 | UI 框架 |
| **TypeScript** | 5.8.3 | 類型安全 |
| **Vite** | 7.0.4 | 建置工具 |
| **TanStack Query** | 5.83.0 | Server State 管理 |
| **React Router** | 7.7.1 | 路由管理 |
| **Tailwind CSS** | 4.1.11 | CSS 框架 |
| **shadcn/ui** | latest | UI 組件庫 |
| **Axios** | 1.11.0 | HTTP 客戶端 |

### Database

- **PostgreSQL 17** (Supabase)
- **Row Level Security (RLS)** 啟用
- **5 核心表格**，完整索引優化

---

## 🏗️ 專案架構

### 目錄結構

```
three_kingdoms_strategy/
├── backend/                    # Python FastAPI Backend
│   ├── src/
│   │   ├── api/v1/endpoints/  # API 路由層
│   │   │   ├── alliances.py   # 同盟管理 API ✅
│   │   │   └── uploads.py     # CSV 上傳 API ✅
│   │   ├── services/          # 業務邏輯層
│   │   │   ├── alliance_service.py       ✅
│   │   │   ├── csv_parser_service.py     ✅
│   │   │   └── csv_upload_service.py     ✅
│   │   ├── repositories/      # 資料存取層 (5 repositories) ✅
│   │   │   ├── base.py                   # SupabaseRepository 基類
│   │   │   ├── alliance_repository.py
│   │   │   ├── season_repository.py
│   │   │   ├── csv_upload_repository.py
│   │   │   ├── member_repository.py
│   │   │   └── member_snapshot_repository.py
│   │   ├── models/            # Pydantic 模型 (15 models) ✅
│   │   ├── core/              # 核心配置
│   │   │   ├── config.py      # 環境變數
│   │   │   ├── database.py    # Supabase 客戶端
│   │   │   ├── auth.py        # JWT 認證 ✅
│   │   │   └── dependencies.py # DI 容器
│   │   └── main.py            # FastAPI 應用入口
│   ├── pyproject.toml         # UV 依賴管理
│   └── uv.lock
│
├── frontend/                   # React TypeScript Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/            # shadcn/ui 基礎組件 ✅
│   │   │   ├── layout/        # Layout 組件 ✅
│   │   │   └── alliance/      # 同盟相關組件 ✅
│   │   ├── pages/             # 路由頁面 (7 pages)
│   │   │   ├── Landing.tsx    # 登入頁面 ✅
│   │   │   ├── Overview.tsx   # 總覽儀表板 🚧
│   │   │   ├── Seasons.tsx    # 賽季管理 🚧
│   │   │   └── ...
│   │   ├── hooks/             # Custom Hooks
│   │   │   └── use-alliance.ts ✅
│   │   ├── lib/
│   │   │   ├── api-client.ts  # HTTP 客戶端 ✅
│   │   │   └── supabase.ts    # Supabase 客戶端 ✅
│   │   ├── contexts/          # React Context
│   │   │   ├── AuthContext.tsx      ✅
│   │   │   └── theme-context.ts     ✅
│   │   └── types/             # TypeScript 類型定義 ✅
│   ├── package.json
│   └── vite.config.ts
│
├── data/                       # CSV 範例資料
├── CLAUDE.md                   # 開發規範 (已整合至本文件)
└── README.md                   # 本文件

✅ = 已完成 | 🚧 = 開發中 | ❌ = 未開始
```

### 4-Layer Architecture Pattern

本專案嚴格遵循 4 層架構設計：

```
┌─────────────────────────────────────────┐
│  API Layer (FastAPI)                    │  ← HTTP 請求處理、驗證、認證
│  src/api/v1/endpoints/                  │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  Service Layer (Business Logic)         │  ← 業務邏輯編排、多步驟操作
│  src/services/                          │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  Repository Layer (Data Access)         │  ← 資料庫查詢、資料轉換
│  src/repositories/                      │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  Database (Supabase PostgreSQL)         │  ← 資料持久化、RLS 安全
└─────────────────────────────────────────┘
```

**關鍵原則**:
- ✅ API Layer **完全委託**給 Service Layer
- ✅ Service Layer **無直接資料庫呼叫**
- ✅ Repository **強制錯誤處理**（使用 `_handle_supabase_result()`）
- ❌ **禁止跨層呼叫**

---

## 🚀 快速開始

### 前置需求

- **Python 3.13+** ([下載](https://www.python.org/downloads/))
- **UV Package Manager** ([安裝教學](https://docs.astral.sh/uv/))
- **Node.js 18+** ([下載](https://nodejs.org/))
- **Supabase 帳號** ([註冊](https://supabase.com/dashboard))

### 1️⃣ Clone 專案

```bash
git clone <repository-url>
cd three_kingdoms_strategy
```

### 2️⃣ Backend 設定

#### 安裝依賴

```bash
cd backend
uv sync
```

#### 環境變數設定

建立 `.env` 檔案：

```bash
cp .env.example .env
```

編輯 `backend/.env`：

```bash
# Supabase Configuration (從 Supabase Dashboard 取得)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_role_key_here
SUPABASE_JWT_SECRET=your_jwt_secret_here

# Backend Configuration
BACKEND_URL=http://localhost:8087
FRONTEND_URL=http://localhost:5187
CORS_ORIGINS=http://localhost:5187

# Security (使用 openssl rand -hex 32 生成)
SECRET_KEY=your_secret_key_here

# Environment Settings
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=INFO
```

**生成 SECRET_KEY**:

```bash
openssl rand -hex 32
```

#### 啟動 Backend

```bash
uv run python src/main.py
```

Backend 將在 **http://localhost:8087** 啟動

### 3️⃣ Frontend 設定

開啟新終端視窗：

#### 安裝依賴

```bash
cd frontend
npm install
```

#### 環境變數設定

建立 `.env` 檔案：

```bash
cp .env.example .env
```

編輯 `frontend/.env`：

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

#### 啟動 Frontend

```bash
npm run dev
```

Frontend 將在 **http://localhost:5187** 啟動

### 4️⃣ Google OAuth 設定

#### 取得 Google OAuth Credentials

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立新專案或選擇現有專案
3. 前往 **APIs & Services** → **Credentials**
4. 建立 **OAuth 2.0 Client ID**:
   - Application type: **Web application**
   - **Authorized redirect URIs**: `https://xxx.supabase.co/auth/v1/callback`

#### 在 Supabase 啟用 Google Provider

1. 前往 Supabase Dashboard → **Authentication** → **Providers**
2. 啟用 **Google** provider
3. 填入 Google OAuth **Client ID** 和 **Client Secret**
4. 儲存設定

### 5️⃣ 驗證安裝

#### Backend Health Check

```bash
curl http://localhost:8087/health
```

**預期回應**:

```json
{
  "status": "healthy",
  "environment": "development",
  "version": "0.1.0"
}
```

#### Frontend 登入測試

1. 開啟瀏覽器：http://localhost:5187/landing
2. 點擊「使用 Google 帳戶登入」
3. 完成授權後應重導向至首頁
4. 首次登入會引導設定同盟資訊

---

## ⚙️ 環境設定

### Backend 環境變數說明

| 變數 | 必填 | 說明 | 範例 |
|------|------|------|------|
| `SUPABASE_URL` | ✅ | Supabase 專案 URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | ✅ | Supabase 匿名金鑰 | `eyJhbGc...` |
| `SUPABASE_SERVICE_KEY` | ✅ | Supabase 服務金鑰 | `eyJhbGc...` |
| `SUPABASE_JWT_SECRET` | ✅ | Supabase JWT Secret | `your_secret` |
| `SECRET_KEY` | ✅ | FastAPI Secret Key | 使用 `openssl rand -hex 32` 生成 |
| `BACKEND_URL` | ❌ | Backend URL | `http://localhost:8087` |
| `FRONTEND_URL` | ❌ | Frontend URL | `http://localhost:5187` |
| `CORS_ORIGINS` | ❌ | CORS 允許來源 | `http://localhost:5187` |
| `ENVIRONMENT` | ❌ | 環境名稱 | `development` / `production` |
| `DEBUG` | ❌ | 除錯模式 | `true` / `false` |
| `LOG_LEVEL` | ❌ | 日誌等級 | `INFO` / `DEBUG` / `WARNING` |

### Frontend 環境變數說明

| 變數 | 必填 | 說明 |
|------|------|------|
| `VITE_SUPABASE_URL` | ✅ | Supabase 專案 URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Supabase 匿名金鑰 |

---

## 📡 API 文件

### Base URL

```
http://localhost:8087/api/v1
```

### 認證

所有受保護的 API 需要在 Header 中帶 JWT token：

```bash
Authorization: Bearer <access_token>
```

### API Endpoints

#### 1. Alliance Management

| Method | Endpoint | 功能 | 狀態碼 |
|--------|----------|------|--------|
| `GET` | `/alliances` | 取得當前用戶同盟 | 200 |
| `POST` | `/alliances` | 建立同盟 | 201 |
| `PATCH` | `/alliances` | 更新同盟 | 200 |
| `DELETE` | `/alliances` | 刪除同盟 | 204 |

**範例：建立同盟**

```bash
curl -X POST http://localhost:8087/api/v1/alliances \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "蜀漢軍團",
    "server_name": "S1 魏興"
  }'
```

**回應**:

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "name": "蜀漢軍團",
  "server_name": "S1 魏興",
  "created_at": "2025-10-09T...",
  "updated_at": "2025-10-09T..."
}
```

#### 2. CSV Upload Management

| Method | Endpoint | 功能 | 狀態碼 |
|--------|----------|------|--------|
| `POST` | `/uploads` | 上傳 CSV 檔案 | 200 |
| `GET` | `/uploads?season_id={uuid}` | 列出上傳記錄 | 200 |
| `DELETE` | `/uploads/{upload_id}` | 刪除上傳 | 200 |

**範例：上傳 CSV**

```bash
curl -X POST http://localhost:8087/api/v1/uploads \
  -H "Authorization: Bearer <token>" \
  -F "season_id=123e4567-e89b-12d3-a456-426614174000" \
  -F "file=@同盟統計2025年10月09日10时13分09秒.csv"
```

**回應**:

```json
{
  "upload_id": "uuid",
  "season_id": "uuid",
  "alliance_id": "uuid",
  "snapshot_date": "2025-10-09T10:13:09",
  "filename": "同盟統計2025年10月09日10时13分09秒.csv",
  "total_members": 201,
  "total_snapshots": 201,
  "replaced_existing": false
}
```

### CSV 檔案格式

#### 檔名格式

```
同盟統計YYYY年MM月DD日HH时MM分SS秒.csv
```

**範例**: `同盟統計2025年10月09日10时13分09秒.csv`

#### CSV 內容格式 (13 欄位)

```csv
成員, 貢獻排行, 貢獻本週, 戰功本週, 助攻本週, 捐獻本週, 貢獻總量, 戰功總量, 助攻總量, 捐獻總量, 勢力值, 所屬州, 分組
大地英豪, 48, 65725743, 104306, 200, 12005282, 399999159, 2626191, 86102, 13962888, 32620, 魏興, 未分組
委皇叔, 44, 105146117, 73201, 700, 0, 411206070, 2490896, 57717, 3028425, 22380, 漢中, 冬組
```

---

## 🗄️ 資料庫架構

### Table 關聯圖

```
auth.users (Supabase Auth)
    ↓ (1:1)
alliances (同盟)
    ↓ (1:many)
seasons (賽季) ←──────┐
    ↓ (1:many)        │
csv_uploads (上傳記錄) │
    ↓ (1:many)        │
member_snapshots (快照)│
    ↓ (many:1)        │
members (成員) ────────┘
```

### 核心表格

#### 1. **alliances** - 同盟主檔

```sql
CREATE TABLE alliances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  server_name VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

- 一個使用者對應一個同盟 (1:1)
- `user_id` 關聯到 Supabase Auth

#### 2. **seasons** - 賽季管理

```sql
CREATE TABLE seasons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alliance_id UUID REFERENCES alliances(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

- 支援 CRUD 操作
- 可管理多個賽季

#### 3. **csv_uploads** - CSV 上傳記錄

```sql
CREATE TABLE csv_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  season_id UUID REFERENCES seasons(id) ON DELETE CASCADE,
  alliance_id UUID REFERENCES alliances(id) ON DELETE CASCADE,
  snapshot_date TIMESTAMPTZ NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  total_members INTEGER NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);
```

- 記錄每次 CSV 上傳的元數據
- 支援每日唯一上傳約束

#### 4. **members** - 成員註冊表

```sql
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alliance_id UUID REFERENCES alliances(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  first_seen_at TIMESTAMPTZ NOT NULL,
  last_seen_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

- 追蹤成員生命週期
- 自動 upsert 機制

#### 5. **member_snapshots** - 成員表現快照

```sql
CREATE TABLE member_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  csv_upload_id UUID REFERENCES csv_uploads(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  alliance_id UUID REFERENCES alliances(id) ON DELETE CASCADE,
  member_name VARCHAR(100) NOT NULL,

  -- 排名與分組
  contribution_rank INTEGER,
  group_name VARCHAR(50),

  -- 週數據
  weekly_contribution BIGINT,
  weekly_merit INTEGER,
  weekly_assist INTEGER,
  weekly_donation BIGINT,

  -- 累積數據
  total_contribution BIGINT,
  total_merit INTEGER,
  total_assist INTEGER,
  total_donation BIGINT,

  -- 其他
  power_value INTEGER,
  state VARCHAR(50),

  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Row Level Security (RLS) 政策

所有表格均啟用 RLS，使用優化的 subquery pattern：

```sql
-- 範例：alliances 表格的 RLS 政策
CREATE POLICY "Users can view own alliance"
  ON alliances FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create own alliance"
  ON alliances FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own alliance"
  ON alliances FOR UPDATE
  USING ((SELECT auth.uid()) = user_id);
```

**效能優化**: 使用 `(SELECT auth.uid())` subquery 比直接呼叫 `auth.uid()` 快 **30-70%**

### 索引優化

```sql
-- alliances
CREATE INDEX idx_alliances_user_id ON alliances(user_id);

-- seasons
CREATE INDEX idx_seasons_alliance_id ON seasons(alliance_id);
CREATE INDEX idx_seasons_is_active ON seasons(is_active);

-- csv_uploads
CREATE INDEX idx_csv_uploads_season_id ON csv_uploads(season_id);
CREATE INDEX idx_csv_uploads_snapshot_date ON csv_uploads(snapshot_date);

-- members
CREATE UNIQUE INDEX idx_members_alliance_name ON members(alliance_id, name);
CREATE INDEX idx_members_is_active ON members(is_active);

-- member_snapshots
CREATE INDEX idx_member_snapshots_csv_upload ON member_snapshots(csv_upload_id);
CREATE INDEX idx_member_snapshots_member ON member_snapshots(member_id);
```

---

## 📏 開發規範

本專案嚴格遵循 **CLAUDE.md** 開發規範，以下為核心原則：

### 🔴 CRITICAL 規範（零容忍）

#### 1. Repository Pattern
- ✅ **所有 Repository 必須繼承** `SupabaseRepository[T]`
- ✅ **強制使用** `_handle_supabase_result()` 處理查詢結果
- ❌ **禁止直接存取** `result.data`

```python
# ✅ CORRECT
class ProductRepository(SupabaseRepository):
    def __init__(self):
        super().__init__(table_name="products", model_class=Product)

    def get_by_user(self, user_id: UUID) -> list[Product]:
        result = self.client.from_(self.table_name).select("*").eq("user_id", str(user_id)).execute()
        data_list = self._handle_supabase_result(result, allow_empty=True)
        return self._build_models(data_list)

# ❌ WRONG
def get_by_user(self, user_id: UUID):
    result = self.client.from_("products").select("*").eq("user_id", str(user_id)).execute()
    return result.data  # 禁止！
```

#### 2. 4-Layer Architecture
- ✅ API Layer **完全委託**給 Service Layer
- ✅ Service Layer **無直接資料庫呼叫**
- ❌ **禁止跨層呼叫**

#### 3. Cloud Deployment 配置
- ✅ FastAPI: `redirect_slashes=False`
- ✅ Root routes: `@router.get("")` (不是 `"/"`)
- ❌ **禁止**: `FORWARDED_ALLOW_IPS=*`

#### 4. RLS 效能優化
- ✅ 使用 `(SELECT auth.uid())` subquery
- ❌ 避免直接呼叫 `auth.uid()`（每行都執行）

### 🟡 IMPORTANT 規範

#### 1. UV 工具鏈（Python）
- ✅ `uv run python script.py` (不是 `python script.py`)
- ✅ `uv add <package>` (不是 `pip install`)
- ✅ `uv sync` (不是 `pip install -r requirements.txt`)

#### 2. Ruff 程式碼檢查
- ✅ **提交前必須執行**: `uv run ruff check .`
- ✅ **零容忍錯誤**: F821, E722, F841, B904
- ✅ **目標**: <50 total errors

#### 3. 命名規範
- ✅ **所有 API 欄位使用 snake_case**（Backend + Frontend）
- ✅ Class 命名：`Handler` (編排) / `Processor` (轉換) / `Service` (業務邏輯)

#### 4. Frontend 規範
- ✅ **100% ES imports**（零容忍 `require()`）
- ✅ **JSX 語法**（禁止 `React.createElement`）
- ✅ **明確 TypeScript interfaces**
- ✅ **使用 TanStack Query** 管理 server state

### 🟢 RECOMMENDED 規範

- ✅ Backend 單一檔案 <1000 行
- ✅ Frontend 組件 <500 行
- ✅ 100% type hints (Python) + TypeScript interfaces
- ✅ Google-style docstrings

### 程式碼品質檢查指令

#### Backend
```bash
# Ruff 檢查
uv run ruff check .

# 自動修復
uv run ruff check . --fix

# 執行測試
uv run pytest
```

#### Frontend
```bash
# TypeScript 型別檢查
npx tsc --noEmit

# ESLint 檢查
npm run lint

# 建置測試
npm run build
```

---

## 📊 專案現況報告

### 實作狀態總覽

| 模組 | 狀態 | 完成度 | 備註 |
|------|------|--------|------|
| **Backend 核心架構** | ✅ | 100% | Repository + Service + API 層完整 |
| **認證系統** | ✅ | 100% | Google OAuth + JWT 驗證 |
| **同盟管理** | ✅ | 100% | CRUD + AllianceGuard 完整 |
| **CSV 上傳** | ✅ | 100% | 解析 + 批次處理 + 每日唯一約束 |
| **成員管理** | ✅ | 100% | Upsert + 生命週期追蹤 |
| **賽季管理** | ❌ | 0% | 僅有 Repository，無 Service/API |
| **數據分析** | ❌ | 0% | 未實作 |
| **Frontend UI** | 🚧 | 40% | Layout + Auth + Alliance 完成 |
| **Dashboard** | 🚧 | 20% | 僅有 UI 框架，無數據整合 |

### 詳細模組分析

#### ✅ 已完成模組

##### 1. **認證系統** (100%)
- ✅ Google OAuth 登入流程
- ✅ Supabase JWT 驗證
- ✅ `get_current_user_id()` dependency
- ✅ 自動 token 管理（Frontend）
- ✅ AuthContext + Protected Routes

**檔案位置**:
- `backend/src/core/auth.py`
- `frontend/src/contexts/AuthContext.tsx`
- `frontend/src/pages/Landing.tsx`

##### 2. **同盟管理** (100%)
- ✅ Alliance CRUD API (`/api/v1/alliances`)
- ✅ AllianceService 業務邏輯
- ✅ AllianceRepository 資料存取
- ✅ Frontend API Client
- ✅ TanStack Query hooks (`use-alliance.ts`)
- ✅ AllianceGuard 路由守衛
- ✅ AllianceSetupForm 首次設定
- ✅ AllianceSettings 更新表單

**檔案位置**:
- `backend/src/api/v1/endpoints/alliances.py`
- `backend/src/services/alliance_service.py`
- `frontend/src/components/alliance/`

##### 3. **CSV 上傳系統** (100%)
- ✅ CSV Parser Service（檔名日期提取 + 內容解析）
- ✅ CSV Upload Service（8 步驟完整工作流程）
- ✅ 每日唯一上傳約束（應用層實作）
- ✅ 批次成員 upsert
- ✅ 批次快照建立
- ✅ Upload CRUD API (`/api/v1/uploads`)

**檔案位置**:
- `backend/src/services/csv_parser_service.py`
- `backend/src/services/csv_upload_service.py`
- `backend/src/api/v1/endpoints/uploads.py`

**特色功能**:
- 智能檔名解析：`同盟統計2025年10月09日10时13分09秒.csv` → `datetime(2025, 10, 9, 10, 13, 9)`
- 自動覆蓋機制：同日期重複上傳會自動刪除舊數據
- 完整權限驗證：確保使用者只能操作自己的數據

##### 4. **Theme Provider** (100%)
- ✅ Light/Dark/System 模式
- ✅ localStorage 持久化
- ✅ ThemeToggle 組件
- ✅ CSS 變數整合

**檔案位置**:
- `frontend/src/contexts/theme-context.ts`
- `frontend/src/components/theme-provider.tsx`

#### 🚧 部分完成模組

##### 5. **賽季管理** (0% - 僅有基礎設施)
- ✅ SeasonRepository 完整實作
- ✅ Season Pydantic Models
- ❌ SeasonService **未實作**
- ❌ Season API endpoints **未實作**
- ❌ Frontend Season 管理 UI **未實作**

**待實作功能**:
```python
# backend/src/services/season_service.py (待建立)
class SeasonService:
    async def create_season(user_id, alliance_id, data) -> Season
    async def get_seasons(user_id, alliance_id) -> list[Season]
    async def update_season(user_id, season_id, data) -> Season
    async def delete_season(user_id, season_id) -> bool
    async def set_active_season(user_id, season_id) -> Season
```

```python
# backend/src/api/v1/endpoints/seasons.py (待建立)
@router.post("/seasons")
@router.get("/seasons")
@router.patch("/seasons/{season_id}")
@router.delete("/seasons/{season_id}")
```

**當前狀態**:
- `frontend/src/pages/Seasons.tsx` 只有靜態 UI，無數據整合

##### 6. **Frontend Dashboard** (20%)
- ✅ Layout 結構（Sidebar + DashboardLayout）
- ✅ 路由配置（5 個頁面）
- ❌ 數據視覺化圖表
- ❌ API 整合

**待實作頁面**:
- `Overview.tsx` - 需要整合 alliance/season 數據
- `DataManagement.tsx` - 需要 CSV 上傳 UI
- `MemberPerformance.tsx` - 需要成員列表與查詢
- `HegemonyWeights.tsx` - 全新功能

#### ❌ 未開始模組

##### 7. **數據分析功能** (0%)
- ❌ 成員表現趨勢分析 API
- ❌ 排名變化追蹤
- ❌ 同盟統計數據
- ❌ Dashboard 圖表整合

##### 8. **霸業積分權重設定** (0%)
- ❌ 權重設定 Repository/Service/API
- ❌ 權重計算邏輯
- ❌ Frontend UI

### 技術債務與問題

#### 🔴 Critical Issues

1. **Ruff 檢查問題**
   - 當前錯誤：1 個 F541 (f-string-missing-placeholders)
   - 位置：待查
   - 建議：執行 `uv run ruff check . --fix`

#### 🟡 Important Issues

1. **缺少 Season API**
   - 影響：無法建立/管理賽季，阻擋 CSV 上傳功能使用
   - 優先級：**高**
   - 預估工時：4-6 小時

2. **Frontend 缺少 CSV 上傳 UI**
   - 影響：無法透過 UI 上傳檔案
   - 優先級：**高**
   - 預估工時：6-8 小時

3. **缺少數據視覺化**
   - 影響：使用者體驗不完整
   - 優先級：**中**
   - 預估工時：8-12 小時

### 下一步建議

#### 優先級 1（立即執行）

1. **修復 Ruff 錯誤**
   ```bash
   cd backend && uv run ruff check . --fix
   ```

2. **實作 Season Service + API**
   - 建立 `backend/src/services/season_service.py`
   - 建立 `backend/src/api/v1/endpoints/seasons.py`
   - 實作 CRUD 功能
   - 測試 API endpoints

3. **實作 Frontend Season 管理**
   - 建立 Season API Client
   - 建立 TanStack Query hooks
   - 實作 Season CRUD UI

#### 優先級 2（短期目標）

4. **CSV 上傳 UI**
   - 檔案拖放上傳組件
   - 上傳進度顯示
   - 上傳歷史列表
   - 整合到 `DataManagement.tsx`

5. **成員列表與查詢**
   - 成員列表 API
   - 分頁與排序
   - 搜尋功能
   - Frontend UI 整合

#### 優先級 3（中期目標）

6. **數據分析功能**
   - 趨勢分析 API
   - 排名變化追蹤
   - Dashboard 圖表整合（Chart.js / Recharts）

7. **霸業積分權重**
   - 權重設定功能
   - 積分計算邏輯
   - UI 整合

### 架構優勢與完成度

#### ✅ 優勢

1. **完整的分層架構** - 4-Layer Pattern 嚴格執行
2. **強型別系統** - Python 100% type hints + TypeScript
3. **安全性保證** - RLS + JWT 認證
4. **程式碼品質** - Ruff 檢查 + 明確規範
5. **現代化技術棧** - FastAPI + React 19 + TanStack Query

#### 📈 整體完成度評估

| 類別 | 完成度 |
|------|--------|
| **Backend 基礎設施** | 90% |
| **認證與安全** | 100% |
| **核心功能 API** | 60% |
| **Frontend 基礎設施** | 85% |
| **功能 UI** | 30% |
| **數據分析** | 0% |
| **整體專案** | **55%** |

---

## ❓ 常見問題

### Q1: 如何新增 Database Table？

**A**: 使用 Supabase MCP 執行 SQL，**不要**建立 migration files（符合 CLAUDE.md 🔴）

```bash
# 透過 Supabase Dashboard 或 MCP 執行
CREATE TABLE new_table (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ...
);
```

### Q2: 如何處理 Supabase 查詢結果？

**A**: 必須使用 `_handle_supabase_result()`，**禁止**直接存取 `result.data`

```python
result = self.client.from_(self.table_name).select("*").execute()
data_list = self._handle_supabase_result(result, allow_empty=True)
```

### Q3: 為什麼使用 `uv run python` 而不是 `python`？

**A**: UV 自動管理虛擬環境，確保依賴隔離（符合 CLAUDE.md 🟡）

### Q4: CSV 上傳後如何處理？

**A**: 流程：
1. 解析 CSV →
2. Upsert Members →
3. Batch Create Snapshots →
4. Update Member Activity

### Q5: 登入後出現 "redirect_uri_mismatch" 錯誤

**原因**: Google OAuth redirect URI 設定錯誤

**解決**:
1. 檢查 Google Cloud Console 的 **Authorized redirect URIs**
2. 確保包含: `https://你的supabase專案.supabase.co/auth/v1/callback`
3. URL 必須完全匹配

### Q6: CORS 錯誤

**原因**: Frontend 和 Backend URL 不匹配

**解決**:
1. 確認 `backend/.env` 的 `CORS_ORIGINS` 包含 frontend URL
2. 重啟 backend 伺服器

---

## 🔒 安全性建議

### 開發環境

- ✅ 使用 `.env` 檔案（已加入 `.gitignore`）
- ✅ 絕不將 `.env` 檔案 commit 到 Git
- ✅ 定期更換 `SECRET_KEY`

### 生產環境

1. 使用環境變數管理工具（AWS Secrets Manager, Vercel Environment Variables）
2. 啟用 HTTPS（必須！）
3. 更新 Google OAuth redirect URIs 為生產網域
4. 設定 `ENVIRONMENT=production`
5. 設定 `DEBUG=false`
6. 使用 Supabase RLS 保護資料

---

## 🤝 貢獻指南

1. Fork 本專案
2. 建立 feature branch (`git checkout -b feature/amazing-feature`)
3. **MUST**: 執行 `uv run ruff check .` 確保程式碼品質
4. Commit 變更 (`git commit -m 'Add amazing feature'`)
5. Push 到 branch (`git push origin feature/amazing-feature`)
6. 開啟 Pull Request

---

## 📄 License

MIT License - 詳見 [LICENSE](LICENSE) 檔案

---

## 📞 聯絡資訊

如有問題或建議，歡迎開 Issue 討論。

---

## 📚 相關資源

- [FastAPI 文件](https://fastapi.tiangolo.com/)
- [Supabase 文件](https://supabase.com/docs)
- [React 文件](https://react.dev/)
- [TanStack Query 文件](https://tanstack.com/query/latest)
- [shadcn/ui 文件](https://ui.shadcn.com/)
- [UV Package Manager](https://docs.astral.sh/uv/)

---

**Last Updated:** 2025-10-09
**Version:** 0.1.0
**Status:** 🚧 Active Development (Phase 2 → Phase 3)
**Python Version:** 3.13+
**Database:** PostgreSQL 17 (Supabase)
**Overall Completion:** 55%
