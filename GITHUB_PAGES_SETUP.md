# How to Host on GitHub Pages

1.  **Create a GitHub Repository:**
    *   Go to [GitHub](https://github.com) and sign in.
    *   Click the "+" icon in the top right and select "New repository".
    *   Name your repository (e.g., `gemini-watermark-remover`).
    *   Make sure it is **Public** (GitHub Pages is free for public repositories).
    *   Click "Create repository".

2.  **Upload Your Files:**
    *   **Option A (Command Line - Recommended):**
        *   Open a terminal in your project folder.
        *   Run the following commands (replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual details):
            ```bash
            git init
            git add .
            git commit -m "Initial commit"
            git branch -M main
            git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
            git push -u origin main
            ```
    *   **Option B (Web Interface):**
        *   On your new repository page, click "uploading an existing file".
        *   Drag and drop all your project files (including the `assets` and `js` folders) into the upload area.
        *   Commit the changes.

3.  **Enable GitHub Pages:**
    *   Go to your repository's **Settings** tab.
    *   Click on **Pages** in the left sidebar.
    *   Under "Build and deployment", select **Deploy from a branch**.
    *   Under "Branch", select `main` (or `master`) and `/ (root)`.
    *   Click **Save**.

4.  **Access Your Site:**
    *   Wait a minute or two. Refresh the Pages settings page.
    *   You will see a link like `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`.
    *   Click it to see your live site!

**Note:** Don't forget to replace `[Your Name]` in `index.html` and `README.md` with your actual name before uploading!
