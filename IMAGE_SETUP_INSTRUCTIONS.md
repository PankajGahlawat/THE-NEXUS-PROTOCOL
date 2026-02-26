# Cyber Heist Image Setup Instructions

## Step 1: Save the Image

1. Save the cyber heist hacker image you provided as: `cyber-heist-hacker.jpg`
2. Place it in: `frontend/public/assets/cyber-heist-hacker.jpg`

## Step 2: Verify the Path

The image should be located at:
```
frontend/
  public/
    assets/
      cyber-heist-hacker.jpg  ← Save here
```

## Step 3: The Code is Already Updated

I've already updated `frontend/src/components/Landing/LandingPage.tsx` to use this image in the "CYBER HEIST" feature card.

The image will appear as the background of the large feature card with:
- Background size: cover (fills the entire card)
- Background position: center
- Opacity: 0.6 (slightly transparent to show the text clearly)

## Step 4: Test

After saving the image:
1. Refresh your browser
2. Scroll to the "THE SYSTEM" section
3. You should see the cyber heist hacker image in the large "CYBER HEIST" card

## Alternative: Use a Different Format

If you prefer PNG or WEBP format:
1. Save as `cyber-heist-hacker.png` or `cyber-heist-hacker.webp`
2. Update the path in `LandingPage.tsx` line 335:
   ```typescript
   backgroundImage: 'url(/assets/cyber-heist-hacker.png)',
   ```

## Troubleshooting

If the image doesn't show:
1. Check the file name matches exactly: `cyber-heist-hacker.jpg`
2. Check the file is in the correct folder: `frontend/public/assets/`
3. Clear browser cache and refresh
4. Check browser console for 404 errors
