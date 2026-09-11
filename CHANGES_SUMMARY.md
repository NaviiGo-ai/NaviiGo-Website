# Summary of Changes to Eliminate Mock/Fallback Data in Frontend

## Files Modified

### 1. Frontend/lib/api/travel-search.ts
- **What was removed**: All mock/fabricated data for flights, trains, cabs, and hotels
- **What replaced it**: Empty arrays (`[]`) when APIs are unavailable
- **Functions affected**:
  - `searchFlights`: Removed mock flight data generation
  - `searchTrains`: Removed mock train data generation (including TRAIN_CORPUS usage)
  - `searchCabs`: Now returns empty array instead of attempting to generate links
  - `searchHotels`: Removed mock hotel data generation
- **Key change**: Each search function now returns `[]` when API keys are missing or APIs fail, instead of generating plausible-looking but fake data

### 2. Frontend/components/features/itinerary/DayViewPage.tsx
- **What was removed**: Fallback to Kerala destination data (`FALLBACK_DEST`)
- **What replaced it**: Empty state object with descriptive messages when destination data is unavailable
- **Key change**: 
  ```typescript
  // Before: const staticData = DEST_DATA[destId] ?? FALLBACK_DEST;
  // After: 
  const staticData = DEST_DATA[destId];
  const data: any = useMemo(() => {
    if (!staticData) {
      // Return empty state instead of fallback
      return {
        description: 'Destination data not available',
        avgCost: '',
        weather: {},
        crowdLevel: 'Low',
        crowdNote: 'Data unavailable for this destination',
        // ... other empty/default fields
      };
    }
    // ... rest of logic
  }, [generatedData, staticData]);
  ```

### 3. Frontend/components/features/itinerary/ResultPage.tsx
- **What was removed**: Fallback to Kerala destination data (`FALLBACK_DEST`)
- **What replaced it**: Empty state object with descriptive messages when destination data is unavailable
- **Key change**: Similar to DayViewPage, replaced fallback with empty state containing messages like 'Destination data not available'

### 4. Frontend/lib/usePlacePhoto.ts
- **What was removed**: Fallback to local image when Google Places API fails
- **What replaced it**: Empty string (no image) when photo is unavailable
- **Key changes**:
  - Removed `fallback` parameter from function signature
  - Changed state initialization to return empty string instead of fallback
  - In catch block, now leaves url as empty string instead of silently keeping fallback
  - Removed the comment "// Silently fail — keep the fallback image"

### 5. Frontend/components/shared/PlaceImage.tsx
- **What was removed**: Fallback to category image when Places photo fails to load
- **What replaced it**: Show nothing (empty state) when photo is unavailable
- **Key changes**:
  - Modified to use `usePlacePhoto(name, city, width)` (removed fallback parameter)
  - Added `displaySrc = src || ''` to explicitly handle empty string
  - For background images: only sets backgroundImage if displaySrc is truthy
  - For img tags: sets src to displaySrc (which will be empty string if unavailable)
  - Removed the onError handler that was falling back to category images

### 6. Frontend/lib/imageService.ts
- **What was removed**: All fallback chains that returned local/Unsplash images when real photos unavailable
- **What replaced it**: Empty string (`""`) when no real image source is available
- **Key changes in `resolveImgSrc`**:
  - When `!src || src === 'placeholder'`: returns `''` instead of category image
  - For Gemini-style strings with '_': returns `''` instead of trying category hints
  - For Legacy Unsplash ID format: returns `''` instead of falling back to local images
  - Final fallback: returns `''` instead of category-aware hash
- **Note**: Other functions in this file (like `getCategoryImage`, `unsplashUrl`, etc.) remain unchanged but are no longer used as fallbacks in the image resolution chain

## Verification
- Ran `npx tsc --noEmit` in the Frontend directory - no new TypeScript errors introduced
- All changes strictly follow the requirement to show honest "unavailable/retry" states instead of fabricated data
- No new dependencies added
- No changes to .env files or backend code

## Result
When APIs are unavailable or data is missing:
- Transport/search results show empty lists instead of fake options
- Destination pages show "Data not available" messages instead of Kerala fallback
- Place photos show nothing (empty space) instead of local/category images
- The user sees genuine empty states that honestly reflect data availability