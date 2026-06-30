# translation-compare Planning Document

> **Summary**: Add parallel translation comparison (번역본 비교) mode to allow users to compare two Bible translations side-by-side
>
> **Project**: bible-app
> **Version**: 0.1
> **Author**: AI Assistant
> **Date**: 2026-06-30
> **Status**: Approved

---

## 1. Overview

### 1.1 Purpose

Allow users to compare two different Bible translations side-by-side within the chapter view, without modifying existing single-translation functionality.

### 1.2 Background

Users want to study the Bible by comparing different Korean/English translations verse-by-verse. The current app supports a single translation at a time via `showChapter()`. A new compare mode is needed that loads a second translation in parallel and renders verses aligned by verse number.

### 1.3 Related Documents

- Requirements: User request (conversation 2026-06-30)
- References: Existing `app.js` — `loadBibleData()`, `showChapter()`, `showTranslationPicker()`

---

## 2. Scope

### 2.1 In Scope

- [x] Compare mode entry from chapter view (button in chapter title area)
- [x] Select second translation via translation picker overlay
- [x] Side-by-side verse rendering aligned by verse number
- [x] Exit compare mode back to single-translation view
- [x] Bookmark/highlight/note indicators shown on primary column only
- [x] Responsive layout: 1 column (<768px) / 2 columns (≥768px)
- [x] Chapter navigation (prev/next) works in compare mode
- [x] Hide action bar during compare mode

### 2.2 Out of Scope

- Loading more than 2 translations simultaneously
- Bookmark/highlight/note creation in compare mode (read-only)
- Server-side comparison or diffing
- Permanent compare UI when not in chapter view

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | Compare mode toggle from chapter view | High | Done |
| FR-02 | Translation picker for second translation | High | Done |
| FR-03 | Parallel verse rendering aligned by verse number | High | Done |
| FR-04 | Exit compare mode restoring original view | High | Done |
| FR-05 | Prev/next chapter navigation in compare mode | Medium | Done |
| FR-06 | Responsive grid (1col mobile / 2col desktop) | Medium | Done |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | Second translation loads asynchronously | Visual check — no blocking |
| Compatibility | No regression to existing single-translation view | Manual test of showChapter() |
| Code Quality | No modification to existing bible/loadBibleData/showChapter | Code review |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [x] User can enter compare mode from chapter view
- [x] User can pick a second translation
- [x] Verses render side-by-side aligned by number
- [x] User can exit compare mode and return to original view
- [x] No regressions in existing single-translation functionality

### 4.2 Quality Criteria

- [x] Zero JS syntax errors (`node --check app.js`)
- [x] Action bar properly hidden during compare mode
- [x] Bookmark/highlight/note indicators visible on primary column

---

## 5. Negative Space (NSP)

### 5.1 What NOT to Do

| # | Anti-pattern | Reason |
|---|--------------|--------|
| 1 | Modify existing `bible` var, `loadBibleData()`, `showChapter()` | Core single-translation functions must remain untouched |
| 2 | Load all 7 translations at once | Performance — only load the one user selects |
| 3 | Break bookmark/highlight/note features | Compare mode is read-only for those |
| 4 | Add permanent UI clutter | Compare button only appears in chapter view |
| 5 | Block async loading | Must use async/await with loading indicator |
| 6 | Lose user book/chapter on compare exit | `exitCompare()` must restore last view |

### 5.2 Tech NOT to Use

- No new external libraries or frameworks
- No DOM manipulation libraries — plain DOM API only

### 5.3 Edge Cases NOT to Handle

- Comparing a translation to itself (user selection should prevent via current translation detection)
- More than 2 translations simultaneously

---

## 6. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Compare mode breaks existing bookmarks | High | Low | Primary column only shows indicators (no writes) |
| Async load shows blank screen | Medium | Low | Show loading indicator during fetch |
| Permission errors writing files | Medium | Medium | Use PowerShell/Node scripts to write files |

---

## 7. Architecture Considerations

### 7.1 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| Compare data storage | Separate var | `compareBible = []` | Parallel to existing `bible` |
| Data loading | Reuse loadBibleData pattern | `loadCompareData(transId)` | Same sessionStorage caching |
| Translation picker | New overlay vs reuse | Reuse with `_cmpCallback` | No new overlay needed |
| Verse alignment | By index vs by number | By verse number | Missing verses show empty cell |

---

## 8. Implementation Plan

### 8.1 Variables

- `compareBible = []` — stores second translation data
- `compareTranslation = null` — translation metadata (id, name, display)
- `isCompareMode = false` — mode flag

### 8.2 New Functions

- `loadCompareData(transId)` — async load with sessionStorage cache
- `findBookIn(data, displayName)` — find book in any translation data
- `showCompareChapter(name, chNum)` — 2-column compare renderer
- `exitCompare()` — clear compare mode, restore single view
- `showComparePicker(callback)` — open translation picker for compare

### 8.3 Modified Functions

- `showChapter` — add compare trigger button (⥃) in chapter title area
- `goBack()` — handle `currentView === 'compare'` by calling `exitCompare()`
- `showTranslationPicker()` — support `_cmpCallback` for compare mode

### 8.4 CSS

- `.compare-view` — compare mode container
- `.cmp-header` — column labels row
- `.cmp-row` — verse alignment grid (1fr / 1fr 1fr at ≥768px)
- `.cmp-cell` — individual verse cell
- `.cmp-exit-btn` — "✕ 단일보기" exit button
- `.ct-compare` — compare trigger button in chapter title
- `.bm-indicator`, `.nt-indicator` — bookmark/note indicators
- `.cmp-hl-*` — highlight color classes for compare mode
- Action bar hidden during compare mode

---

## 9. Next Steps

1. [x] Implement new variables and functions in `app.js`
2. [x] Add compare-mode CSS to `style.css`
3. [x] Modify `showChapter` to add compare button
4. [x] Modify `goBack` for compare navigation
5. [x] Validate with `node --check app.js`
6. [x] Commit changes (`git commit`)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-06-30 | Initial draft | AI Assistant |
