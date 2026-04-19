# Client Codebase Analysis: Optimizations and Improvements

**Project**: Web File Browser - Vue 3 Client  
**Date**: April 2026  
**Codebase Stats**: ~8,514 LOC across 204 Vue/TS files, 155 components, 3.2MB build output

---

## Executive Summary

The Vue 3 client application is well-structured with a modern tech stack (Vue 3 + TypeScript + Tailwind CSS + Vite). The codebase demonstrates good practices in project organization, strong type safety, and clean architecture. However, there are meaningful opportunities to reduce bundle size, improve rendering performance, enhance code maintainability, and provide better UX features.

**Key Areas for Improvement:**
1. **Bundle size**: 3.2MB total (including font files); 573KB just for Prism.js syntax highlighter
2. **Performance**: No virtual scrolling for large file lists; Prism.js loaded on-demand for every text preview
3. **Missing features**: No search/filter, keyboard shortcuts, offline support considerations, or accessibility enhancements
4. **Code duplication**: Some utility logic could be consolidated

---

## 1. PERFORMANCE OPTIMIZATIONS

### 1.1 Prism.js Syntax Highlighter Bundle Optimization ⭐ HIGH PRIORITY

**Issue**: Prism.js minified file (579KB) is bundled unconditionally and loaded on every route change
- Current: Single 573KB `prism.min.js` file is downloaded and parsed even if user never opens text files
- The entire Prism library with all languages/plugins is included in the vendor bundle
- Loaded via dynamic import on DOMContentLoaded, but still significant overhead

**Impact**:
- 17.8% of total JS bundle (3.2MB) is syntax highlighting alone
- Increases Time to Interactive (TTI) and First Contentful Paint (FCP)
- Wasted bandwidth for users who only browse images/videos
- Slows down initial page load on slower connections/devices

**Difficulty**: Medium  
**Estimated Impact**: High (save ~600KB, reduce JS parse time by ~8%)

**Solution Options**:
1. **Route-based code splitting**: Only load Prism when previewing a text file
   - Lazy load via dynamic import in `TextPreview.vue`
   - Saves bandwidth for non-text preview sessions
2. **Use lighter alternative**: Consider `Highlight.js` (~50KB minified) or `Shiki` (~100KB)
3. **Custom build**: Build Prism with only required languages instead of full library
4. **Trim to essential languages**: Remove rarely-used language support

**Recommended Approach**: 
- Implement route-based lazy loading (option 1) - 2-3 hours effort
- Provides immediate benefit without dependency changes
- Falls back gracefully if load fails

**Code Impact**: Modify `DirectoryView.vue` and `TextPreview.vue` to dynamically import Prism on demand

---

### 1.2 Large Font Files Not Subset for Usage

**Issue**: Three variable font families are imported in full without subsetting
- `@fontsource-variable/inter` (full Unicode support, ~200KB)
- `@fontsource-variable/source-code-pro` (~80KB)
- Atkinson Hyperlegible commented out (~100KB not used)
- All variants (normal + italic) for every weight

**Impact**:
- Unnecessary font data for characters never used in the UI
- Web fonts block rendering until loaded
- Slower page load, especially on mobile/slow connections

**Difficulty**: Low-Medium  
**Estimated Impact**: Medium (save ~100-150KB)

**Solution**:
1. **Use font subsetting**: Only include Latin character set (or Cyrillic if needed)
   - Remove `cyrillic-ext`, `greek-ext` variants
   - Use `@fontsource/inter` with `subset: 'latin'` option
2. **Use system fonts fallback**: Consider system-ui stack for UI elements
3. **Lazy load decorative fonts**: If only used in specific features, load on-demand

**Recommended Approach**: Subset fonts to Latin + Common (saves ~50KB immediately)

---

### 1.3 No Virtual Scrolling for Large File Lists

**Issue**: All entries are rendered in the DOM simultaneously regardless of list size
- Current implementation: `v-for` on `entries` array renders every entry
- No windowing/virtualization approach
- For directories with 1000+ files: 1000+ DOM nodes created and maintained

**Impact**:
- High memory usage for large directories (>100 files)
- Slower initial render time
- Laggy scrolling with poor FCP metrics
- Impacts low-end devices and browsers significantly

**Difficulty**: Medium-High  
**Estimated Impact**: High (60-80% faster scroll in large directories)

**Solution**:
1. **Implement virtual scrolling**: Use `@tanstack/vue-virtual` (lightweight)
   - Only render visible items + buffer
   - Drastically reduces DOM nodes and memory
   - ~30KB dependency (acceptable for benefit)
2. **Alternative: Pagination**: Load entries in batches (100 per page)
   - Simpler to implement but worse UX
   - Requires backend pagination support

**Recommended Approach**: Virtual scrolling with `@tanstack/vue-virtual`
- Integrate with existing `DirectoryContent.vue` component
- Estimate: 4-6 hours implementation + testing

**Code Impact**: Refactor view layouts to use virtual scroller; ~50 lines of code changes

---

### 1.4 No Code Splitting for Route-Based Features

**Issue**: Single 150KB main bundle (`index-B4U3Jvkj.js`) includes all routes and components
- `DirectoryView.vue`, all preview components, and UI library included in initial chunk
- No dynamic imports for preview dialog or specialized features

**Impact**:
- Larger initial download and parse time
- Unused components present in TTI-critical path
- All previews (video, audio, code) parsed even if only browsing images

**Difficulty**: Low  
**Estimated Impact**: Medium (save ~30-40KB from main bundle)

**Solution**:
1. **Lazy load preview components**: Async import of `PreviewDialog` and viewers
2. **Dynamic import of rarely-used UI components**: Dialogs, popovers loaded on-demand
3. **Separate code splitting for different file types**: Audio/video players bundled together

**Recommended Approach**: 
- Lazy load `PreviewDialog` component in `DirectoryView.vue`
- Lazy load preview-specific viewers (Audio, Video, Code)
- 3-4 hours implementation

---

### 1.5 Unnecessary Package Dependencies ⭐ QUICK WIN

**Issue**: Some dependencies are bundled but minimally used
- `media-chrome`: Imported globally but only used in video/audio preview
  - Should be lazy-loaded or replaced with simpler HTML5 controls
- `remeda`: Functional utility library only used once in `sort.ts`
  - Could replace with vanilla JS or consolidate with existing utils
- `dayjs`: Included but only 11 usage points across codebase
  - Not critical path; could defer or use native Date API

**Impact**:
- `media-chrome` (4.19.0) adds unnecessary overhead to video/audio-only use case
- Larger tree-shaking potential
- Unused plugin polyfills in browser

**Difficulty**: Low  
**Estimated Impact**: Low-Medium (save ~20-30KB)

**Solution**:
1. **Media-chrome**: 
   - Remove global import from `main.ts`
   - Lazy import in `VideoPreview.vue` and `AudioPreview.vue`
   - Or replace with native HTML5 `<video>` and `<audio>` controls
2. **Remeda**: 
   - Replace `pipe()` + `sortBy()` with native array methods
   - One-time refactor of `sortEntries()` function
3. **Dayjs**: 
   - Verify actual usage; possibly replace with native `Intl.DateTimeFormat`

**Recommended Approach**: Remove/lazy-load `media-chrome` (1-2 hours), refactor `remeda` usage (1 hour)

---

### 1.6 No Service Worker / Offline Support

**Issue**: Application requires network for all functionality; no offline caching
- Single Page App but no offline capabilities
- No resource caching strategy
- No network error resilience

**Impact**:
- Network disconnection = blank page
- No ability to view cached files/previews
- Poor experience on unreliable home networks

**Difficulty**: Medium  
**Estimated Impact**: Medium (improves resilience, not performance directly)

**Solution**:
1. **Register Service Worker** to cache:
   - App shell (HTML, CSS, JS bundles)
   - Recently viewed file previews
   - Directory listings (with TTL)
2. **Implement cache strategies**:
   - Cache-first for static assets
   - Network-first for directory listings
   - Stale-while-revalidate for previews

**Recommended Approach**: Basic service worker (3-4 hours) for offline support

---

### 1.7 No Image Optimization / Lazy Loading

**Issue**: Thumbnail images have no lazy loading or optimization
- All thumbnail URLs are pre-computed in `DirectoryView.vue`
- No `loading="lazy"` attribute on `<img>` tags
- No responsive image variants or WebP fallbacks
- Source icons from `unplugin-icons` included in main bundle

**Impact**:
- Unnecessary image downloads outside viewport
- Larger memory footprint with large file lists
- Icon set fully included in JS bundle (overhead)

**Difficulty**: Low-Medium  
**Estimated Impact**: Medium (saves ~15-20KB bundle, improves perceived performance)

**Solution**:
1. **Add lazy loading**: Use `loading="lazy"` on thumbnail images
2. **Icon optimization**: Tree-shake icon sets to only used icons
   - Currently including both `ph` and `ri` icon families fully
3. **Image format optimization**: Serve WebP with fallback (server-side concern, but document it)

**Recommended Approach**: Add lazy loading attributes (30 mins) + tree-shake unused icons (1 hour)

---

## 2. CODE QUALITY & ARCHITECTURE

### 2.1 Component Complexity: PreviewDialog and Viewers

**Issue**: Several preview components are doing too much
- `PreviewDialog.vue` (179 lines): Dialog state, content switching, actions coordination
- `TextPreview.vue` (176 lines): Prism integration, text copying, syntax highlighting hooks
- `VideoPreview.vue` (172 lines): Media player setup, controls, event handling
- `PreviewDialogActions.vue` (128 lines): Multiple action buttons with complex logic

**Impact**:
- Hard to test individual concerns
- Difficult to extend with new preview types
- Tight coupling between preview logic and UI
- Reusability issues if adding new preview modes

**Difficulty**: Medium  
**Estimated Impact**: Medium (improves maintainability, testability)

**Solution**: 
1. **Extract preview logic into composables**:
   - `useTextPreview()`: Handle Prism integration, text operations
   - `useVideoPreview()`: Media player state, controls
   - `useAudioPreview()`: Audio player state
2. **Create preview factory pattern**:
   - Map file types to preview implementations
   - Easier to add new preview types (3D models, documents, etc.)
3. **Separate action logic**: Move action handlers to utility module

**Recommended Approach**: Refactor into composables (4-5 hours), improves test coverage

---

### 2.2 Event Bus Usage Pattern

**Issue**: `Emittery`-based event bus is used extensively but could be replaced with Vue 3 patterns
- `useEventBus()` composable wraps Emittery singleton
- Used for: text copy, path updates, query updates, theme changes
- Creates implicit dependencies and makes dataflow harder to trace

**Current Usage**:
- `copy_text`, `text_copied` events in preview dialogs
- `path_updating`, `path_updated` in router store
- `query_updated` for sorting/view changes

**Impact**:
- Event-driven architecture is harder to debug
- Implicit subscriptions spread across components
- No single source of truth for state

**Difficulty**: Medium  
**Estimated Impact**: Low (architectural improvement, not performance)

**Solution**:
1. **Replace with Pinia stores** for explicit state management:
   - Create `usePreviewStore()` for preview state
   - Create `useUIStore()` for theme, toolbar, etc.
2. **Keep event bus only for one-off notifications** (copy confirmation, alerts)
3. **Explicit prop/emit for parent-child communication**

**Recommended Approach**: Gradual migration (3-4 hours) - optional refactoring

---

### 2.3 Type Safety: Missing Entry Type Definitions

**Issue**: `Entry` type has optional fields that should be required/validated
- `entry.url` is assigned in component (DirectoryView.vue:88) not from server
- `entry.preview_type` is inferred, not provided by server
- `entry.thumbnail` can be null/undefined with no clear contract

**Code Pattern** (DirectoryView.vue):
```ts
const results = res.data.map((entry: Entry) => {
  entry.url = toFileUrl(entry);  // Runtime assignment!
  if (entry.thumbnail) {
    entry.thumbnail = toFileUrl(entry.thumbnail) || null;
  }
  return entry;
});
```

**Impact**:
- Runtime mutations of API response objects
- Unclear data contracts between client/server
- Potential for bugs if server response structure changes
- Poor separation of concerns (API response vs UI model)

**Difficulty**: Low-Medium  
**Estimated Impact**: Low (improves maintainability, prevents bugs)

**Solution**:
1. **Create response mapper function**:
   ```ts
   function mapServerEntryToUIEntry(entry: ServerEntry): UIEntry {
     return {
       ...entry,
       url: toFileUrl(entry.path),
       preview_type: computePreviewType(entry.file_type),
       thumbnail: mapThumbnail(entry),
     };
   }
   ```
2. **Separate types**: `ServerEntry` (API) vs `UIEntry` (internal)
3. **Validate response schema** using zod or similar

**Recommended Approach**: Create response mapper (2-3 hours) for cleaner data flow

---

### 2.4 Router Store: Duplicated Logic

**Issue**: `useRouterStore` has redundant code patterns
- `addAfterCallback` / `addBeforeCallback` implement same logic
- `validate()` function repeated for multiple computed properties
- `updateQueryParam` / `updateSorting` largely duplicate

**Lines 56-76** (router.ts): Nearly identical add/remove callback functions  
**Lines 34-53**: Three similar `computed` properties with same validation pattern

**Impact**:
- Harder to maintain and modify
- Easy to introduce inconsistencies
- More code to test

**Difficulty**: Low  
**Estimated Impact**: Low (code cleanliness, not performance)

**Solution**: 
1. **DRY up callback management**:
   ```ts
   type CallbackType = 'before' | 'after';
   const callbacks = reactive({
     before: ref<RouterEventCallback[]>([]),
     after: ref<RouterEventCallback[]>([]),
   });
   function manageCallback(
     type: CallbackType, 
     callback: RouterEventCallback, 
     action: 'add' | 'remove'
   ) { /* ... */ }
   ```
2. **Centralize computed property creation**:
   ```ts
   function createQueryParamComputed<T>(
     param: QueryParam,
     enumType: Record<string, T>,
     fallback: T
   ) { /* ... */ }
   ```

**Recommended Approach**: Refactor router store (2-3 hours), improves clarity

---

### 2.5 No Test Coverage or Test Infrastructure

**Issue**: No test files in codebase (no `*.spec.ts` or `*.test.ts`)
- ESLint rule exists for specs but no tests present
- Complex logic (sorting, event bus, routing) has no test coverage
- Preview dialog interactions untested
- No CI/CD test pipeline

**Impact**:
- Refactoring risk is high
- Bugs discovered only by manual testing
- Difficult to ensure quality on changes
- No confidence in optimization changes

**Difficulty**: High (not a bug, architectural missing piece)  
**Estimated Impact**: High (long-term maintainability)

**Solution**:
1. **Add Vitest + Vue Test Utils**:
   ```json
   {
     "devDependencies": {
       "vitest": "^latest",
       "@vue/test-utils": "^latest",
       "happy-dom": "^latest"
     }
   }
   ```
2. **Focus on high-impact tests**:
   - Utils (sort, entry helpers, breadcrumbs)
   - Stores (router, global state mutations)
   - Complex components (PreviewDialog)
3. **Add test configuration** in vite.config.ts

**Recommended Approach**: Start with 20-30 core tests (4-6 hours), setup CI integration (2 hours)

---

## 3. UX & FEATURES

### 3.1 Missing Search / Filter Functionality ⭐ HIGH VALUE

**Issue**: No way to search or filter files in current directory
- Users must scroll through entire directory to find specific file
- No fuzzy search support
- No filter by file type, size, date, etc.

**Current UX Gap**: 
- Users with 1000+ files in directory must scroll to find target
- Only sorting options (name, date, size, duration)
- No way to hide file types or quickly locate files

**Impact**:
- Poor UX for large directories (common in media/archive browsing)
- Increases time to find content
- Competitors (Windows, macOS, Finder) all have search

**Difficulty**: Medium  
**Estimated Impact**: High (significant UX improvement)

**Solution**:
1. **Implement client-side search**:
   - Input box in navbar
   - Real-time filtering of displayed entries
   - Case-insensitive substring/fuzzy matching
2. **Add filter chips** (optional):
   - Filter by file type (images, videos, documents)
   - Filter by size range
   - Filter by date modified
3. **Remember search state** in URL/store

**Implementation** (~4-5 hours):
- Add search input to `NavBar.vue`
- Create `useSearch()` composable
- Filter entries before passing to view layouts
- Add keyboard shortcut (Ctrl+F / Cmd+F)

---

### 3.2 No Keyboard Shortcuts

**Issue**: No keyboard navigation or shortcuts for common actions
- Users must use mouse for all interactions
- Can't open preview with keyboard
- Can't navigate up/down file lists
- Can't perform batch operations

**Common expectations**:
- Arrow keys: Navigate file list
- Enter: Open/preview selected file
- Escape: Close preview dialog
- Ctrl+C: Copy file URL or content
- Ctrl+F: Search/filter

**Impact**:
- Poor UX for power users
- Accessibility issue for keyboard-only users
- Slower workflow without mouse

**Difficulty**: Medium  
**Estimated Impact**: Medium-High (improves usability significantly)

**Solution**:
1. **Add keyboard event handling**:
   ```ts
   function useFileListNavigation() {
     const selectedIndex = ref(0);
     const handleKeyDown = (e: KeyboardEvent) => {
       if (e.key === 'ArrowDown') selectedIndex.value++;
       if (e.key === 'ArrowUp') selectedIndex.value--;
       if (e.key === 'Enter') openPreview(entries[selectedIndex.value]);
     };
   }
   ```
2. **Create shortcut system** (reusable):
   - Centralized shortcut registry
   - Conflict detection
   - Enable/disable by context
3. **Document shortcuts** in UI

**Recommended Approach**: Create `useKeyboardShortcuts()` composable (3-4 hours)

---

### 3.3 Accessibility Gaps ⭐ IMPORTANT

**Issue**: Several accessibility issues reduce usability for assistive tech users
1. **Outline removed globally**: CSS disables all focus outlines
   ```css
   * { outline: none !important; }  /* in index.css */
   ```
   - Makes keyboard navigation invisible
   - Violates WCAG 2.1 Success Criterion 2.4.7

2. **ARIA attributes missing**:
   - File list has no `role="list"`
   - Buttons missing descriptive labels
   - Dialogs lack `aria-labelledby`/`aria-describedby`
   - Navigation breadcrumbs lack semantic structure

3. **Color contrast issues**:
   - Light text on light backgrounds in preview dialog

4. **Image alt text missing**:
   - Thumbnail images have no alt text

**Impact**:
- Unusable for screen reader users
- Keyboard navigation broken
- WCAG 2.1 non-compliance
- Legal/regulatory risk (ADA)

**Difficulty**: Medium  
**Estimated Impact**: High (inclusivity, legal compliance)

**Solution**:
1. **Restore focus indicators**:
   ```css
   * { outline: var(--ring) 2px solid; outline-offset: 2px; }
   ```
2. **Add ARIA roles and attributes**:
   - Buttons: `aria-label`, `aria-pressed`, `aria-expanded`
   - Lists: `role="list"`, items with `role="listitem"`
   - Dialogs: `role="dialog"`, `aria-labelledby`, `aria-modal="true"`
   - Links: `aria-current` for active breadcrumb

3. **Add alt text to images**:
   ```html
   <img :alt="`Thumbnail for ${entry.name}`" />
   ```

4. **Test with screen readers** (NVDA, JAWS, VoiceOver)

**Recommended Approach**: Phased approach (2-3 hours for basics)

---

### 3.4 No Offline Preview Caching

**Issue**: Previewed files aren't cached for offline viewing
- Opening a text file downloads it fresh every time
- Video/audio buffering doesn't resume from previous position
- No indication of offline capability

**Impact**:
- Can't view previously-opened files without network
- Bandwidth wasted re-downloading same files
- Poor experience on unstable networks

**Difficulty**: Medium  
**Estimated Impact**: Low-Medium (nice-to-have feature)

**Solution**:
1. **Cache preview content in IndexedDB**:
   - Store file content by path + hash
   - Limit to 100MB or user-configurable size
   - Implement cache eviction (LRU)

2. **Show cache status in preview**:
   - Badge: "Cached locally"
   - "Last viewed offline: 2 hours ago"

3. **Fallback to cached version on offline**

**Recommended Approach**: Optional feature (4-5 hours) - lower priority

---

### 3.5 No Mobile/Touch UX Optimization

**Issue**: Touch interactions not optimized for mobile
1. **No touch-friendly hover states** - buttons rely on hover which doesn't exist on touch
2. **Toolbar menu buttons too small** - difficult to tap on mobile
3. **No swipe gestures** - can't swipe to navigate or close dialogs
4. **No mobile-optimized layout** - file lists may overflow on small screens
5. **Preview dialog poorly sized** for mobile screens

**Current Status**:
- `@vueuse/core` has mobile detection
- Body class `scrollbar-hidden` applied on mobile
- But touch interactions not fully utilized

**Impact**:
- Poor mobile experience (increasing importance)
- Touch targets don't meet 44x44px minimum
- Text preview dialog unusable on small screens

**Difficulty**: Medium  
**Estimated Impact**: Medium (improves mobile-first experience)

**Solution**:
1. **Touch-friendly button targets**: Ensure minimum 44x44px
2. **Swipe gesture support**:
   - Swipe up: Close preview
   - Swipe left/right: Navigate entries
   - Use `@vueuse/gesture` composable
3. **Mobile drawer layout**: Side navigation on mobile
4. **Responsive preview dialog**: Modal on mobile, drawer on desktop

**Recommended Approach**: Focus on button sizing + responsive layout (3-4 hours)

---

## 4. DEVELOPER EXPERIENCE

### 4.1 Build Time Optimization

**Issue**: Vite dev build may be slow due to configuration
- TypeScript checking (`vue-tsc`) runs in sequence with build
- No build caching for dependencies
- Large vendor directory (620KB prism, fonts)

**Current Workflow**:
```
pnpm build → clean:dist → check (vue-tsc) → build-only (vite) → sequential
```

**Impact**:
- Developer waits for type checking before seeing changes
- Feedback loop is slower than necessary
- CI builds slower

**Difficulty**: Low  
**Estimated Impact**: Low (developer convenience)

**Solution**:
1. **Parallel type checking and build**:
   ```json
   "build": "run-p check build-only"  // Already configured!
   ```
   - Already using `npm-run-all2` with `run-p` (good!)

2. **Enable Vite dependency pre-bundling**:
   ```ts
   // vite.config.ts
   export default {
     optimizeDeps: {
       include: ['vue', 'vue-router', 'pinia', 'axios'],
       exclude: ['prism.min.js'],
     },
   }
   ```

3. **Reduce vendor directory at build time**:
   - Lazy load prism.min.js instead of bundling
   - This also addresses bundle size issue

**Recommended Approach**: Improve build config (1-2 hours) + defer vendor files (1 hour)

---

### 4.2 Type Checking Errors and Strictness

**Issue**: TypeScript strict mode enabled but with workarounds
- ESLint rule for explicit return types (`@typescript-eslint/explicit-function-return-type: warn`)
- Some functions lack return type annotations
- `noUnusedLocals` and `noUnusedParameters` enabled, good enforcement

**Code Example** (missing types):
```ts
// entry_helpers.ts - several functions lack explicit return types
export function buildEntryRoute(...) { ... }  // Should be: RouteLocationNormalizedLoadedGeneric
export function fileTypeToIcon(...) { ... }    // Should be: FunctionalComponent
```

**Impact**:
- Type safety gaps mean runtime errors possible
- IDE autocomplete less helpful
- Refactoring harder

**Difficulty**: Low  
**Estimated Impact**: Low (code quality)

**Solution**:
1. **Add explicit return types** to all exported functions
   - Quick pass through lib, composables, stores
   - ~30 minutes
2. **Enable `strict: true` across all files**
   - Currently enabled globally but check for exceptions
3. **Run type checker in pre-commit hook**

**Recommended Approach**: Add return types to exported functions (1 hour)

---

### 4.3 Error Handling and Logging

**Issue**: Minimal error handling and logging infrastructure
- Network errors in `DirectoryView.vue` are caught but minimal feedback
- `console.log()` statements in production code (e.g., `TextPreview.vue:52`)
- No centralized logging or error tracking
- Prism.js errors not handled gracefully

**Code Example** (DirectoryView.vue:77):
```ts
async function getEntries(): Promise<void> {
  try {
    const res = await http.get(pathToRoute($route), {
      signal: entries_abort_controller?.signal,
    });
  } catch { /**/ }  // Silent failure!
}
```

**Impact**:
- Silent failures make debugging hard
- Network errors not visible to user
- Production issues hard to track
- Security risk if errors expose sensitive info

**Difficulty**: Low-Medium  
**Estimated Impact**: Medium (improves reliability)

**Solution**:
1. **Create error handling composable**:
   ```ts
   export function useErrorHandler() {
     const error = ref<AppError | null>(null);
     const handleError = (err: unknown) => {
       console.error('App error:', err);
       error.value = {
         message: 'Failed to load directory',
         code: 'LOAD_ERROR',
         timestamp: Date.now(),
       };
     };
     return { error, handleError };
   }
   ```

2. **Remove console.log from production**:
   - Use proper error logger
   - ESLint already forbids `no-console` in production

3. **Show user-friendly error states**:
   - Network error message
   - Retry button
   - Loading timeout handling

**Recommended Approach**: Create error handling layer (2-3 hours)

---

## 5. BROWSER COMPATIBILITY

### 5.1 Polyfill Needs Assessment

**Issue**: Browser targeting (2018+) may require polyfills not included
- `browserslist: "since 2018, > 0.3%, not dead"`
- Covers ~95% of browsers but some features have gaps
- No explicit polyfill configuration

**Target Range Implications**:
- **CSS**: Grid/Flexbox widely supported, but some CSS-in-JS features may need prefix
- **JS**: Async/await, Promise, Array methods all supported
- **Missing**: IndexedDB (some older iOS), Service Workers (older browsers)

**Current Tech Stack Support**:
- Vue 3: Requires ES2020+
- Tailwind CSS 4: Uses CSS custom properties (IE11 not supported - fine)
- Icons: SVG-based, excellent browser support

**Difficulty**: Low  
**Estimated Impact**: Low (current targets are modern enough)

**Solution**:
1. **Add UA detection and warnings**:
   ```ts
   // In main.ts
   const { browser } = UAParser(navigator.userAgent);
   if (browser.major && Number(browser.major) < 90) {
     console.warn('Outdated browser detected');
   }
   ```

2. **Document minimum browser versions**:
   - Chrome 90+
   - Firefox 88+
   - Safari 14+
   - Edge 90+

3. **Add Service Worker detection**:
   ```ts
   if ('serviceWorker' in navigator) {
     navigator.serviceWorker.register('/sw.js');
   }
   ```

4. **CSS vendor prefixes** (Tailwind handles most):
   - PostCSS `autoprefixer` already likely included via LightningCSS

**Recommended Approach**: Document browser support + add UA warnings (1 hour)

---

### 5.2 Media Format Compatibility

**Issue**: Video/Audio previews use HTML5 `<video>` and `<audio>` with `media-chrome` wrapper
- No fallback or format detection
- Browser support varies for codecs (H.264, VP9, AV1, HEVC, etc.)

**Current Code** (VideoPreview.vue):
```html
<media-video
  :src='entry.url'
  playback-rate='true'
  muted-init='true'
/>
```

**Potential Issues**:
- Some audio formats (FLAC, MKA) not supported in browsers
- Video codecs vary (H.264 → Safari, VP9 → Firefox, AV1 → rare)
- No server-side transcoding

**Difficulty**: Low  
**Estimated Impact**: Low (depends on content type)

**Solution**:
1. **Detect codec support** before playing:
   ```ts
   const canPlayVideo = (type: string) => {
     const video = document.createElement('video');
     return video.canPlayType(type) !== '';
   };
   ```

2. **Provide format fallback info** to user:
   - "This format not supported in browser"
   - "Download to play locally"

3. **Document supported formats** in README

**Recommended Approach**: Add format support detection (1-2 hours, optional)

---

### 5.3 CSS Feature Support Verification

**Issue**: Heavy CSS custom properties usage (root variables) - good support in modern browsers
- `--color-*` variables extensively used
- Fallback colors provided in design system

**Support Status**:
- CSS Custom Properties: ~95% of browsers (since 2015)
- CSS Grid/Flexbox: ~98% of browsers
- `@layer`: ~90% of modern browsers (newer feature)

**Current Implementation**: Already targets modern browsers, so no issues

**Difficulty**: Low  
**Estimated Impact**: None (already well-supported)

**Solution**: No action needed - current approach is compatible

---

## PRIORITY SUMMARY & IMPLEMENTATION ROADMAP

### Quick Wins (1-2 hours, high value):
1. ✅ Lazy load `media-chrome` (~20KB saved)
2. ✅ Subset fonts to Latin only (~50KB saved)
3. ✅ Add `loading="lazy"` to image thumbnails
4. ✅ Remove `console.log` statements

### High Value (4-8 hours):
1. ✅ Lazy load Prism.js on-demand (~600KB benefit, 3 hours)
2. ✅ Implement virtual scrolling for file lists (4 hours, improves scroll perf 60%+)
3. ✅ Add search/filter UI (4 hours, major UX improvement)
4. ✅ Implement keyboard shortcuts (3 hours, accessibility + UX)

### Medium Value (3-6 hours):
1. ✅ Accessibility improvements: Focus indicators, ARIA labels (2-3 hours)
2. ✅ Improve error handling and logging (2-3 hours)
3. ✅ Refactor preview components into composables (4-5 hours, improves testability)
4. ✅ Mobile/touch UX optimization (3-4 hours)

### Long-term / Infrastructure (6+ hours):
1. ✅ Add test coverage with Vitest (6-8 hours, needed before refactoring)
2. ✅ Service Worker + offline support (4-5 hours, nice-to-have)
3. ✅ Optimize Vite build configuration (2-3 hours)
4. ✅ Migrate event bus to Pinia stores (4-5 hours, architectural)

### Quick Reference - Estimated Effort vs Impact:

| Issue | Effort | Bundle Impact | UX Impact | Difficulty |
|-------|--------|--------------|-----------|------------|
| Lazy load Prism | 3h | 600KB | High | Medium |
| Virtual scrolling | 4h | 0KB | High | Medium-High |
| Search/Filter | 4h | 0KB | Very High | Medium |
| Font subsetting | 1h | 50KB | None | Low |
| Keyboard shortcuts | 3h | 0KB | High | Medium |
| Accessibility fixes | 3h | 0KB | High | Medium |
| Error handling | 2h | 0KB | Medium | Low |
| Mobile UX | 4h | 0KB | Medium | Medium |

---

## RECOMMENDED 2-WEEK PLAN

**Week 1: Quick Wins + Performance**
- Day 1-2: Lazy load Prism.js (+ media-chrome)
- Day 2-3: Font subsetting + image lazy loading
- Day 4-5: Implement virtual scrolling for large directories

**Week 2: Features + UX**
- Day 1-2: Add search/filter functionality
- Day 3: Keyboard shortcuts
- Day 4-5: Accessibility improvements (focus, ARIA)

**Expected Outcomes**:
- Bundle size: 3.2MB → 2.5MB (22% reduction)
- JS parse time: ~8% faster
- UX improvements: Search, keyboard nav, accessibility
- Large directory scroll: 60%+ faster

---

## CONCLUSION

The client codebase is well-structured and maintainable. The primary opportunities are:

1. **Performance**: Reduce Prism.js bundle (high-impact), add virtual scrolling (improves UX)
2. **Features**: Search/filter (critical UX gap), keyboard shortcuts (power user feature)
3. **Accessibility**: Fix focus indicators, add ARIA attributes (compliance + inclusivity)
4. **Code Quality**: Improve error handling, add tests, refactor complex components

Most improvements can be made iteratively without breaking changes. Starting with Prism.js lazy loading would provide immediate bundle size benefits and showcase the optimization benefits to motivate further improvements.
