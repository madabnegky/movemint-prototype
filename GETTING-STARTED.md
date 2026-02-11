# Getting Started with the DSF Prototype

This guide will help you set up and run the Movemint DSF prototype on your local machine.

---

## Prerequisites

Before you begin, you'll need to install:

### 1. Visual Studio Code
Download and install from: https://code.visualstudio.com/

### 2. Node.js (version 18 or higher)
Download and install from: https://nodejs.org/
- Choose the **LTS** (Long Term Support) version
- During installation, accept all default options

### 3. Git
Download and install from: https://git-scm.com/downloads
- During installation, accept all default options

---

## Setup Instructions

### Step 1: Open VS Code

Launch Visual Studio Code from your Applications folder (Mac) or Start Menu (Windows).

### Step 2: Open the Terminal in VS Code

1. Go to the menu bar and click **Terminal** → **New Terminal**
2. A terminal panel will appear at the bottom of VS Code

### Step 3: Choose a Location for the Project

In the terminal, navigate to where you want to store the project. For example:

**Mac:**
```bash
cd ~/Documents
```

**Windows:**
```bash
cd C:\Users\YourName\Documents
```

### Step 4: Clone the Repository

Copy and paste this command into the terminal and press Enter:

```bash
git clone https://github.com/madabnegky/movemint-prototype.git
```

This will download the project to your computer.

### Step 5: Open the Project Folder

1. In VS Code, go to **File** → **Open Folder...**
2. Navigate to the `movemint-prototype` folder you just cloned
3. Click **Open**

### Step 6: Install Dependencies

1. Open a new terminal in VS Code (**Terminal** → **New Terminal**)
2. Run this command:

```bash
npm install
```

Wait for it to finish (this may take a minute or two).

### Step 7: Start the Development Server

Run this command:

```bash
npm run dev
```

You should see output that includes something like:
```
▲ Next.js 15.x.x (Turbopack)
- Local: http://localhost:3000
```

### Step 8: View the Prototype

1. Open your web browser (Chrome, Safari, Edge, etc.)
2. Go to: **http://localhost:3000**

You should now see the DSF prototype running!

---

## Stopping and Restarting

### To Stop the Server
In the VS Code terminal, press **Ctrl + C** (Windows) or **Cmd + C** (Mac)

### To Restart Later
1. Open VS Code
2. Open the project folder
3. Open terminal and run: `npm run dev`
4. Go to http://localhost:3000 in your browser

---

## Project Navigation

Once running, here are the main areas of the prototype:

| URL | Description |
|-----|-------------|
| `/` | Landing page |
| `/storefront` | Member-facing storefront with offers |
| `/home-banking` | Home banking dashboard simulation |
| `/admin` | Admin dashboard |
| `/admin/campaigns` | Campaign management |
| `/admin/feature-flags` | Toggle prototype features on/off |

---

## Feature Flags

The prototype has feature flags that let you turn features on and off:

1. Go to **http://localhost:3000/admin/feature-flags**
2. Toggle any features you want to test
3. Changes apply immediately and persist in your browser

---

## Troubleshooting

### "command not found: npm" or "command not found: git"
- Make sure you installed Node.js and Git (see Prerequisites)
- Close and reopen VS Code after installing

### "Port 3000 is already in use"
Another application is using port 3000. Either:
- Close the other application, or
- Run on a different port: `npm run dev -- -p 3001`

### Changes not showing up
- Make sure you saved the file (**Cmd + S** or **Ctrl + S**)
- Try refreshing your browser (**Cmd + R** or **Ctrl + R**)
- Try a hard refresh (**Cmd + Shift + R** or **Ctrl + Shift + R**)

### "Cannot find module" errors
Run `npm install` again to make sure all dependencies are installed.

---

## Making Changes

You can edit any file in the `src` folder. The browser will automatically refresh when you save changes.

Key folders:
- `src/app/` - Pages and routes
- `src/components/` - Reusable UI components
- `src/context/` - State management (StoreContext.tsx has all the data)

---

## Questions?

Reach out to Kyle if you run into any issues!
