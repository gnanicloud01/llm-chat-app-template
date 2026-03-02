# AI Response Save Fix

## Problem
AI responses were not being saved to conversation history. Only user prompts were saved, so when accessing the chat from another device, AI responses were missing.

## Root Cause
The stream parsing logic in `ctx.waitUntil()` had issues:
1. Incomplete line buffering - lines were split incorrectly
2. Missing error handling for different SSE response formats
3. No logging to debug what was happening
4. Early exit conditions that might skip content

## Solution
Enhanced the stream capture logic with:
- Proper line buffering to handle incomplete chunks
- Support for multiple response formats (response, choices[0].delta.content, delta.content, content)
- Comprehensive logging to track save operations
- Better error handling and validation
- Trim whitespace from saved content

## Testing
Restart your dev server and test:
1. Send a message to the AI
2. Check browser console for logs: "Saving assistant message" and "Assistant message saved successfully"
3. Open the chat on another device/browser - AI responses should now appear

## Technical Details
The fix improves SSE (Server-Sent Events) stream parsing by maintaining a buffer for incomplete lines and trying multiple JSON field paths to extract the AI response content.
