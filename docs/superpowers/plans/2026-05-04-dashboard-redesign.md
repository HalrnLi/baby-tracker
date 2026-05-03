# Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Dashboard page: merge recent records by type, add feed/diaper status cards, add inline weight recording, compress the summary row.

**Architecture:** All changes are in a single file (`DashboardPage.tsx`). Data logic changes in `loadData`; new UI sections (status cards, compact summary, weight sheet) replace the existing summary section. The weight sheet is inline (no new component file) since it's a simple number input + save.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, axios

---

## File Structure

**Modify:**
- `client/src/pages/DashboardPage.tsx` — all changes in one file

**No new files.** Weight recording is rendered inline as a bottom sheet (pattern already established by existing Feed/Diaper detail sheets).

**No API or model changes.** `recordsApi.create` with `type: 'weight'` already works for saving weights. No new endpoints.

---

### Task 1: Update data logic — merge recent records + all-time last records

**Files:**
- Modify: `client/src/pages/DashboardPage.tsx`

**Changes in `loadData` function:**

- [ ] **Step 1: Change `lastFeed`/`lastDiaper` from today-only to all-time**

Replace the current computation (lines 49-52):
```ts
// BEFORE — lastFeed/lastDiaper from today's records only
const feedRecs = todayRecords.filter((r: any) => r.type === 'feed');
const diaperRecs = todayRecords.filter((r: any) => r.type === 'diaper');
const feedCount = feedRecs.length;
const diaperCount = diaperRecs.length;
const lastFeed = [...feedRecs]
  .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
const lastDiaper = [...diaperRecs]
  .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
```

With:
```ts
// AFTER — lastFeed/lastDiaper from all records (sortedRecords), counts stay today-only
const feedCount = todayRecords.filter((r: any) => r.type === 'feed').length;
const diaperCount = todayRecords.filter((r: any) => r.type === 'diaper').length;
const lastFeed = sortedRecords.find((r: any) => r.type === 'feed') || null;
const lastDiaper = sortedRecords.find((r: any) => r.type === 'diaper') || null;
```

- [ ] **Step 2: Change recent records from 5 sub-types to 3 types**

Replace the current array construction (lines 62-68):
```ts
// BEFORE — sub-type based, up to 5 items
const recent = [
  sortedRecords.find((r: any) => r.type === 'feed' && r.data.source === 'breast'),
  sortedRecords.find((r: any) => r.type === 'feed' && r.data.source === 'formula'),
  sortedRecords.find((r: any) => r.type === 'pump'),
  sortedRecords.find((r: any) => r.type === 'diaper' && r.data.type === 'pee'),
  sortedRecords.find((r: any) => r.type === 'diaper' && r.data.type === 'poop'),
].filter(Boolean) as RecordType[];
```

With:
```ts
// AFTER — type-based, up to 3 items
const recent = [
  sortedRecords.find((r: any) => r.type === 'feed'),
  sortedRecords.find((r: any) => r.type === 'pump'),
  sortedRecords.find((r: any) => r.type === 'diaper'),
].filter(Boolean) as RecordType[];
```

- [ ] **Step 3: Build to verify no compile errors**

```bash
cd client && npx tsc --noEmit
```
Expected: No errors.

---

### Task 2: Add weight recording state and handler

**Files:**
- Modify: `client/src/pages/DashboardPage.tsx`

- [ ] **Step 1: Add new state variables**

After the existing `detailSheetType` state (line 22), add:
```ts
const [showWeightSheet, setShowWeightSheet] = useState(false);
const [weightInput, setWeightInput] = useState('');
```

- [ ] **Step 2: Add `handleSaveWeight` function**

After the existing `handleQuickSuccess` function (line 84), add:
```ts
const handleSaveWeight = async () => {
  if (!weightInput || Number(weightInput) <= 0 || !babies[0]) return;
  try {
    await recordsApi.create({
      babyId: babies[0].id,
      type: 'weight',
      data: { weightKg: Number(weightInput) },
    });
    setShowWeightSheet(false);
    setWeightInput('');
    loadData();
  } catch (err) {
    console.error('Failed to save weight:', err);
  }
};
```

- [ ] **Step 3: Build to verify**

```bash
cd client && npx tsc --noEmit
```
Expected: No errors.

---

### Task 3: Replace 今日摘要 with status cards + compact summary

**Files:**
- Modify: `client/src/pages/DashboardPage.tsx`

This task replaces the existing 今日摘要 section (lines 132-177) with the new layout: two status cards on top, three compact summary cards below.

- [ ] **Step 1: Replace the 今日摘要 block**

Replace everything from `{/* 今日摘要 */}` (line 132) through the closing `</div>` of the `formatTimeAgo` text (line 176) with:

```tsx
{/* 上次状态卡片 */}
<div className="grid grid-cols-2 gap-3 mb-5">
  <div className="p-4 bg-warm-50 rounded-2xl shadow-soft">
    <div className="flex items-center gap-2 mb-2">
      <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-400 flex items-center justify-center">
        <IconFeed size={18} />
      </div>
      <span className="text-sm font-semibold text-stone-600">喂奶</span>
    </div>
    {stats?.lastFeed ? (
      <>
        <div className="text-lg font-bold text-stone-800">
          {formatTimeAgo(stats.lastFeed.createdAt)}
        </div>
        <div className="text-xs text-stone-400 mt-0.5">
          {getRecordLabel(stats.lastFeed.type, stats.lastFeed.data)}
        </div>
      </>
    ) : (
      <div className="text-sm text-stone-400">暂无记录</div>
    )}
  </div>
  <div className="p-4 bg-warm-50 rounded-2xl shadow-soft">
    <div className="flex items-center gap-2 mb-2">
      <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-500 flex items-center justify-center">
        <IconDiaper size={18} />
      </div>
      <span className="text-sm font-semibold text-stone-600">尿布</span>
    </div>
    {stats?.lastDiaper ? (
      <>
        <div className="text-lg font-bold text-stone-800">
          {formatTimeAgo(stats.lastDiaper.createdAt)}
        </div>
        <div className="text-xs text-stone-400 mt-0.5">
          {getRecordLabel(stats.lastDiaper.type, stats.lastDiaper.data)}
        </div>
      </>
    ) : (
      <div className="text-sm text-stone-400">暂无记录</div>
    )}
  </div>
</div>

{/* 今日摘要 */}
<div className="mb-5">
  <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2 px-1">今日摘要</h2>
  <div className="grid grid-cols-3 gap-2">
    <button
      className="p-3 bg-warm-50 rounded-2xl shadow-soft text-center hover:shadow-lifted active:scale-[0.97] transition-all cursor-pointer"
      onClick={() => setDetailSheetType('feed')}
    >
      <div className="text-xs text-rose-400 font-medium mb-1">喂奶</div>
      <div className="text-2xl font-bold text-rose-500">{stats?.feedCount || 0}</div>
      <div className="text-[11px] text-stone-400 mt-0.5">次</div>
    </button>
    <button
      className="p-3 bg-warm-50 rounded-2xl shadow-soft text-center hover:shadow-lifted active:scale-[0.97] transition-all cursor-pointer"
      onClick={() => setDetailSheetType('diaper')}
    >
      <div className="text-xs text-sky-500 font-medium mb-1">尿布</div>
      <div className="text-2xl font-bold text-sky-500">{stats?.diaperCount || 0}</div>
      <div className="text-[11px] text-stone-400 mt-0.5">次</div>
    </button>
    <button
      className="p-3 bg-warm-50 rounded-2xl shadow-soft text-center hover:shadow-lifted active:scale-[0.97] transition-all cursor-pointer"
      onClick={() => setShowWeightSheet(true)}
    >
      <div className="text-xs text-emerald-600 font-medium mb-1">体重</div>
      <div className="text-2xl font-bold text-emerald-600">
        {latestWeight ? `${latestWeight.data.weightKg}` : '—'}
      </div>
      <div className="text-[11px] text-stone-400 mt-0.5">kg</div>
    </button>
  </div>
</div>
```

- [ ] **Step 2: Build to verify**

```bash
cd client && npx tsc --noEmit
```
Expected: No errors.

---

### Task 4: Add weight recording bottom sheet

**Files:**
- Modify: `client/src/pages/DashboardPage.tsx`

- [ ] **Step 1: Add weight sheet JSX**

After the closing `</Card>` of the 最近记录 section and before the FAB button, add the weight recording sheet. Also add the necessary import for `IconBack` if not already imported (check existing imports at line 9 — `IconBack` should already be there from the existing detail sheets).

```tsx
{/* Weight Recording Sheet */}
{showWeightSheet && (
  <div
    className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 animate-fade-in"
    onClick={(e) => { if (e.target === e.currentTarget) { setShowWeightSheet(false); setWeightInput(''); } }}
  >
    <div className="bg-warm-100 rounded-t-[20px] px-6 pt-3 pb-10 w-full max-w-[480px] animate-slide-up" onClick={e => e.stopPropagation()}>
      <div className="w-9 h-1 bg-stone-300 rounded-full mx-auto mb-4" />
      <h2 className="text-center text-base font-semibold text-stone-800 mb-5">记录体重</h2>

      <div className="flex items-center justify-center gap-2 mb-6">
        <input
          type="number"
          step="0.1"
          className="w-32 text-center text-2xl font-bold py-3 px-4 rounded-xl bg-white border-0 shadow-soft focus:outline-none focus:ring-2 focus:ring-emerald-400"
          placeholder="4.2"
          value={weightInput}
          onChange={(e) => setWeightInput(e.target.value)}
          autoFocus
        />
        <span className="text-lg text-stone-500 font-medium">kg</span>
      </div>

      <div className="flex gap-3">
        <button
          className="flex-1 py-3 rounded-xl bg-white text-stone-500 font-medium shadow-soft hover:bg-stone-50 transition-colors"
          onClick={() => { setShowWeightSheet(false); setWeightInput(''); }}
        >
          取消
        </button>
        <button
          className="flex-1 py-3 rounded-xl bg-emerald-500 text-white font-medium shadow-soft hover:bg-emerald-600 disabled:opacity-50 transition-colors"
          disabled={!weightInput || Number(weightInput) <= 0}
          onClick={handleSaveWeight}
        >
          保存
        </button>
      </div>

      <button
        className="w-full flex items-center justify-center gap-1 py-3 mt-4 text-stone-400 hover:text-stone-600 text-sm transition-colors"
        onClick={() => { setShowWeightSheet(false); setWeightInput(''); }}
      >
        <IconBack size={16} /> 返回
      </button>
    </div>
  </div>
)}
```

- [ ] **Step 2: Build to verify**

```bash
cd client && npx tsc --noEmit
```
Expected: No errors.

---

### Task 5: Final verification

- [ ] **Step 1: Full TypeScript check**

```bash
cd client && npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 2: Build the project**

```bash
cd client && npm run build
```
Expected: Build succeeds.

- [ ] **Step 3: Start dev server and smoke test**

```bash
npm run dev
```
Expected: Server starts, Dashboard loads, status cards show correct data, creating a weight entry closes sheet and refreshes, recent records show merged entries, clicking feed/diaper in summary opens detail sheets.

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/DashboardPage.tsx
git commit -m "feat: redesign dashboard with status cards, merged records, inline weight"
```
