# 🚀 Getting Started with the UI

## Quick Start (30 seconds)

### In Terminal/PowerShell:

```powershell
cd c:\Projects\aiVerifications

# Run both API and UI at once
npm run dev:all
```

✨ That's it! You should see:

```
✨ Age Verification API Server running on http://localhost:3001
📋 Test endpoint: POST http://localhost:3001/api/test
📊 History endpoint: GET http://localhost:3001/api/history

VITE v5.0.0  ready in 123 ms

➜  Local:   http://localhost:3000/
```

### Open in Browser:
Visit **http://localhost:3000** and start testing!

---

## 🎯 How to Use

1. **Enter URL** - Type any website URL in the form (e.g., `https://example.com`)
2. **Click "Start Test"** - The system will analyze all 4 stages
3. **View Results** - See compliance status, confidence %, and age providers
4. **Check History** - All tests are saved in the table below

---

## 📊 Understanding Results

### Status Types:
- ✅ **COMPLIANT** - Has age verification implemented
- ❌ **NOT_COMPLIANT** - Needs verification but doesn't have it  
- ⚠️ **UNCERTAIN** - Requires human review (e.g., regulatory-only restrictions)
- ℹ️ **NOT_REQUIRED** - Content is appropriate for all ages

### Confidence Level:
The percentage (0-100%) indicates how confident the system is in its analysis.

### Age Providers:
Shows which specific verification methods or platforms were detected (e.g., "Found age keywords", "Modal dialog detected", etc.)

---

## 🛠 Running Services Separately

If you prefer to run them in separate terminals:

```powershell
# Terminal 1: Start API server
npm run api

# Terminal 2: Start UI (from project root)
npm run ui
```

---

## 📁 What's New

✅ **New Files Created:**
- `api.ts` - Express backend server
- `ui/` - Complete React app folder
- `UI_README.md` - Detailed documentation

✅ **Updated Files:**
- `package.json` - Added API, UI, and dev:all scripts
- `test-5-sites-sequential.ts` - Exported function for API usage

---

## 🎨 Design Features

- **Utah Colors**: Beehive blue (#002868) and gold (#D4AF37)
- **Minimal & Clean**: No unnecessary clutter
- **Responsive**: Works on phones, tablets, and desktops
- **Fast**: Vite-powered hot module replacement (HMR)

---

## ⚡ Troubleshooting

### "Connection refused" on startup?
- Make sure the API server finished loading before opening the browser
- Check that ports 3000 and 3001 are available
- Look for error messages in the first terminal

### UI loads but no results?
- Open browser DevTools (F12) → Console tab
- Check for any red error messages
- Make sure the API server is running on http://localhost:3001

### "Module not found" errors?
```bash
# Reinstall dependencies
npm install
cd ui && npm install && cd ..
```

---

## 📞 Support

For more details, see:
- `UI_README.md` - Full documentation
- API endpoints in `api.ts`
- React components in `ui/src/components/`

Enjoy! 🎉
