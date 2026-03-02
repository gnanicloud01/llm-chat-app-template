# DeepSeek R1 Thinking Feature

## What's New
Added support for DeepSeek R1's thinking process visualization. When using DeepSeek R1 model, the app now:

1. **Detects thinking tags** - Automatically identifies `<think>...</think>` blocks in the response
2. **Shows thinking indicator** - Displays a visual indicator with elapsed time while the model is thinking
3. **Hides thinking content** - Only shows the final response to users, not the internal reasoning
4. **Real-time updates** - Updates the thinking timer every second

## How It Works

### Visual Indicator
When DeepSeek R1 is thinking, you'll see:
```
🤔 Thinking... 3s
```

The indicator includes:
- Animated thinking emoji (🤔)
- Pulsing animation
- Real-time elapsed time counter
- Subtle background highlighting

### Content Filtering
The system automatically:
- Strips out `<think>...</think>` tags and their content
- Handles incomplete thinking blocks during streaming
- Shows only the final response after thinking is complete

## Technical Details

### Frontend Changes
**vanillaChat.js:**
- Added thinking state tracking
- Implemented `extractResponse()` function to filter thinking tags
- Added real-time timer with `setInterval`
- Enhanced streaming logic to detect thinking blocks

**index.css:**
- Added `.thinking-indicator` styles
- Created pulsing animation for thinking icon
- Styled thinking timer display

### How to Use
1. Select DeepSeek R1 model from the model dropdown
2. Send your message
3. Watch the thinking indicator while the model processes
4. See only the final response (thinking content is hidden)

## Example
**User:** "Explain quantum computing"

**What you see:**
```
🤔 Thinking... 5s
[After thinking completes]
Quantum computing is a revolutionary approach...
```

**What's hidden:**
```
<think>
Let me break this down... quantum mechanics... qubits...
superposition... entanglement... [internal reasoning]
</think>
```

## Benefits
- Transparency: Users know when the model is actively thinking
- Better UX: Clear feedback during longer processing times
- Clean output: No cluttered thinking content in responses
- Time awareness: See how long the model takes to reason

## Browser Compatibility
Works in all modern browsers that support:
- CSS animations
- JavaScript intervals
- Regex with lookahead/lookbehind
