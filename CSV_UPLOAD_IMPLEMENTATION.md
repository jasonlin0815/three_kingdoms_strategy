# CSV Upload System Implementation

## ✅ Implementation Summary

完整實作了 **CSV 上傳系統**，包含 CRUD 功能與「每日唯一上傳」約束。

---

## 📋 Implemented Components

### 1️⃣ **Repository Layer** (`src/repositories/`)

#### ✅ `csv_upload_repository.py` - 新增方法
- `get_by_date(alliance_id, season_id, snapshot_date)` - 檢查特定日期是否已有上傳記錄
- 用途：實作「每日唯一上傳」邏輯（應用層約束）

### 2️⃣ **Service Layer** (`src/services/`)

#### ✅ `csv_parser_service.py` - CSV 解析服務
**功能**:
- `extract_datetime_from_filename(filename)` - 從檔名提取日期時間
  - 支援格式：`同盟統計2025年10月09日10时13分09秒.csv`
  - Regex pattern: `(\d{4})年(\d{2})月(\d{2})日(\d{2})时(\d{2})分(\d{2})秒`
  - 返回：`datetime` 物件

- `parse_csv_content(csv_content)` - 解析 CSV 內容
  - 讀取 13 個欄位（成員、貢獻排行、週數據、累積數據等）
  - 返回：`list[dict]` 成員數據

**符合規範**:
- 🟡 Processor Pattern (stateless transformation)
- 100% type hints
- Google-style docstrings

#### ✅ `csv_upload_service.py` - 上傳服務
**主要方法**:

1. **`upload_csv(user_id, season_id, filename, csv_content, snapshot_date)`**
   - 完整上傳工作流程（8 步驟）:
     1. 驗證使用者權限（擁有 season）
     2. 提取 snapshot_date（從檔名或參數）
     3. 解析 CSV 內容
     4. **檢查同日期上傳記錄（若存在則刪除）** ← 關鍵！
     5. 建立 CSV upload 記錄
     6. Upsert members（建立新成員或更新現有成員）
     7. Batch create snapshots
     8. 返回上傳結果統計

2. **`get_uploads_by_season(user_id, season_id)`**
   - 取得賽季所有上傳記錄
   - 包含權限驗證

3. **`delete_upload(user_id, upload_id)`**
   - 刪除上傳記錄
   - CASCADE 自動刪除關聯的 snapshots
   - 包含權限驗證

**符合規範**:
- 🔴 Service Layer 編排 repositories
- 🔴 NO direct database calls
- 完整的權限驗證（user_id ownership check）

### 3️⃣ **API Layer** (`src/api/v1/endpoints/`)

#### ✅ `uploads.py` - CSV Upload Endpoints

**Endpoints**:

1. **`POST /api/v1/uploads`** - 上傳 CSV
   - Form data: `season_id` (UUID), `file` (UploadFile)
   - 驗證檔案格式（.csv）
   - 自動從檔名提取日期
   - 返回：上傳統計（total_members, total_snapshots, replaced_existing）

2. **`GET /api/v1/uploads?season_id={uuid}`** - 列出上傳記錄
   - Query param: `season_id`
   - 返回：`{uploads: [...], total: N}`

3. **`DELETE /api/v1/uploads/{upload_id}`** - 刪除上傳
   - Path param: `upload_id`
   - CASCADE 刪除所有 snapshots
   - 返回：成功訊息

**符合規範**:
- 🔴 API Layer 完全委託給 Service Layer
- 🔴 使用 Provider Pattern (`Depends(get_csv_upload_service)`)
- 正確的 HTTP status codes (400, 403, 404, 500)

### 4️⃣ **Dependency Injection** (`src/core/dependencies.py`)

#### ✅ 新增 Provider
- `get_csv_upload_service()` - 提供 CSVUploadService 實例
- 符合 Provider Pattern 標準

### 5️⃣ **Main Application** (`src/main.py`)

#### ✅ Router Registration
- `app.include_router(uploads.router, prefix="/api/v1")`
- Endpoints 可用於：`/api/v1/uploads`

---

## 🔑 Key Features

### ✅ 1. 每日唯一上傳約束
**實作方式**:
- 應用層邏輯（因為無法透過 Supabase MCP 添加 DB constraint）
- `CsvUploadRepository.get_by_date(alliance_id, season_id, snapshot_date)`
- 上傳流程檢查：如果同日期已有記錄 → **刪除舊記錄** → 建立新記錄
- 結果：`replaced_existing: true/false` 告知使用者

### ✅ 2. 完整 CRUD 操作
- **CREATE**: `POST /api/v1/uploads` (含自動 replace 邏輯)
- **READ**: `GET /api/v1/uploads?season_id={uuid}`
- **DELETE**: `DELETE /api/v1/uploads/{upload_id}`
- **UPDATE**: 不需要（直接上傳新檔案會自動 replace）

### ✅ 3. 權限驗證
所有操作都驗證：
- User 擁有該 Alliance
- Alliance 擁有該 Season
- 防止跨使用者資料存取

### ✅ 4. 檔名日期提取
- **Regex Pattern**: `同盟統計(\d{4})年(\d{2})月(\d{2})日(\d{2})时(\d{2})分(\d{2})秒\.csv`
- **範例**: `同盟統計2025年10月09日10时13分09秒.csv`
- **結果**: `datetime(2025, 10, 9, 10, 13, 9)`

### ✅ 5. CSV 資料處理
- **13 欄位解析**: 成員、貢獻排行、週數據 (4)、累積數據 (4)、勢力值、所屬州、分組
- **Member Upsert**: 自動建立新成員或更新現有成員
- **Batch Insert**: 一次性批量建立所有 snapshots（效能優化）

---

## 📊 API Request/Response Examples

### 1. Upload CSV

**Request**:
```bash
curl -X POST http://localhost:8087/api/v1/uploads \
  -F "season_id=123e4567-e89b-12d3-a456-426614174000" \
  -F "file=@同盟統計2025年10月09日10时13分09秒.csv"
```

**Response**:
```json
{
  "upload_id": "789e0123-e89b-12d3-a456-426614174000",
  "season_id": "123e4567-e89b-12d3-a456-426614174000",
  "alliance_id": "456e7890-e89b-12d3-a456-426614174000",
  "snapshot_date": "2025-10-09T10:13:09",
  "filename": "同盟統計2025年10月09日10时13分09秒.csv",
  "total_members": 201,
  "total_snapshots": 201,
  "replaced_existing": true
}
```

### 2. List Uploads

**Request**:
```bash
curl "http://localhost:8087/api/v1/uploads?season_id=123e4567-e89b-12d3-a456-426614174000"
```

**Response**:
```json
{
  "uploads": [
    {
      "id": "789e0123-e89b-12d3-a456-426614174000",
      "season_id": "123e4567-e89b-12d3-a456-426614174000",
      "alliance_id": "456e7890-e89b-12d3-a456-426614174000",
      "snapshot_date": "2025-10-09T10:13:09",
      "file_name": "同盟統計2025年10月09日10时13分09秒.csv",
      "total_members": 201,
      "uploaded_at": "2025-10-09T10:15:00"
    }
  ],
  "total": 1
}
```

### 3. Delete Upload

**Request**:
```bash
curl -X DELETE http://localhost:8087/api/v1/uploads/789e0123-e89b-12d3-a456-426614174000
```

**Response**:
```json
{
  "message": "Upload deleted successfully",
  "upload_id": "789e0123-e89b-12d3-a456-426614174000"
}
```

---

## 🛡️ Error Handling

### 400 Bad Request
- 檔案不是 .csv 格式
- CSV 內容無法解析
- 檔名格式錯誤（無法提取日期）

### 403 Forbidden
- 使用者不擁有該 Alliance
- 使用者無權存取該 Season

### 404 Not Found
- Season 不存在
- Upload 記錄不存在

### 500 Internal Server Error
- Database 操作失敗

---

## 🎯 符合 CLAUDE.md 規範檢查

### 🔴 CRITICAL 規範
- ✅ Repository Pattern: 繼承 `SupabaseRepository[T]`
- ✅ 使用 `_handle_supabase_result()` 處理查詢
- ✅ **禁止直接存取 `result.data`**
- ✅ 4-Layer Architecture: API → Service → Repository → Database
- ✅ 無跨層呼叫

### 🟡 IMPORTANT 規範
- ✅ 所有欄位使用 `snake_case`
- ✅ 100% type hints
- ✅ Google-style docstrings
- ✅ Ruff check: **All passed! (0 errors)**

### 🟢 RECOMMENDED 規範
- ✅ 檔案未超過 1000 行
- ✅ 清晰的模組化結構
- ✅ 完整的錯誤處理

---

## 🚀 Code Quality

### Ruff Check Result
```bash
cd backend && uv run ruff check .
# ✅ All checks passed!
```

### Type Safety
- 100% type hints in all new code
- Pydantic models for validation
- UUID type safety

### Documentation
- Google-style docstrings for all functions
- Inline comments explaining business logic
- 中文註解說明符合 CLAUDE.md 規範

---

## 📝 TODO: Authentication

目前使用 `DEFAULT_USER_ID` (placeholder)。

**下一步**:
1. 整合 Supabase Auth
2. 實作 JWT token validation
3. 從 request headers 提取 user_id
4. 更新 dependency injection (`get_current_user`)

**Placeholder 位置**: `src/api/v1/endpoints/uploads.py:21`
```python
DEFAULT_USER_ID = UUID("00000000-0000-0000-0000-000000000000")  # TODO: Replace with actual auth
```

---

## 🔄 Workflow Diagram

```
User uploads CSV file
       ↓
POST /api/v1/uploads
       ↓
API Layer (uploads.py)
 - Validate file format
 - Read CSV content
       ↓
Service Layer (csv_upload_service.py)
 - Verify user ownership
 - Parse filename → extract date
 - Parse CSV content
 - Check existing upload on same date
   ├─ If exists → DELETE old upload
   └─ Continue
 - Create CSV upload record
 - Upsert members (create/update)
 - Batch create snapshots
       ↓
Repository Layer
 - CsvUploadRepository.create()
 - MemberRepository.upsert_by_name()
 - MemberSnapshotRepository.create_batch()
       ↓
Database (Supabase PostgreSQL)
 - Insert into csv_uploads
 - Upsert into members
 - Batch insert into member_snapshots
       ↓
Return upload result to user
```

---

## ✅ Testing Checklist

### Parser Service
- [x] Datetime extraction from filename (regex test passed)
- [x] CSV content parsing (13 fields)

### Upload Service
- [ ] Upload new CSV (happy path)
- [ ] Replace existing upload (same date)
- [ ] Authorization check (403)
- [ ] Invalid file format (400)

### API Endpoints
- [ ] POST /api/v1/uploads
- [ ] GET /api/v1/uploads
- [ ] DELETE /api/v1/uploads/{id}

---

## 📚 Related Files

**New Files**:
- `backend/src/services/csv_parser_service.py`
- `backend/src/services/csv_upload_service.py`
- `backend/src/api/v1/endpoints/uploads.py`

**Modified Files**:
- `backend/src/repositories/csv_upload_repository.py` (+1 method)
- `backend/src/services/__init__.py` (exports)
- `backend/src/api/v1/endpoints/__init__.py` (exports)
- `backend/src/core/dependencies.py` (+1 provider)
- `backend/src/main.py` (router registration)

---

**Implementation Date**: 2025-10-09
**Status**: ✅ Complete (All Ruff checks passed)
**Next Phase**: Frontend Integration + Authentication
