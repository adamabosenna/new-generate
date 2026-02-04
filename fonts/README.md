Add any .ttf font files you want bundled with the app here or in `assets/fonts/`.

Recommended: Inter-Bold.ttf, Inter-Regular.ttf or Roboto-Bold.ttf, Roboto-Regular.ttf

Quick install (Windows PowerShell):

1. Run the included download script from the repo root:

```powershell
scripts\download-inter-fonts.ps1
```

2. Commit and push the downloaded fonts, then redeploy on Railway.

Note: When deployed to hosts without system fonts (Railway, some Docker images), you must commit these files and redeploy so `canvas` can render text.