# Eleport

## Why Eleport? 🚀

### Key Features

1. **Not just a toy, but truly battle-tested.**  
   Eleport powers our PC game **[Fusionist](https://www.fusionist.io/)**, which has **9,000+ files** and a total size of **10GB**—all handled smoothly.

2. **Fork & Deploy Effortlessly.**  
   Eleport uses **GitHub Releases** for its own updates, so you don’t need any extra deployment steps for launcher upgrades.

3. **Ultra-Low Modification Barrier.**  
   Built with the popular **Electron + JS** stack, so if you have any web developers on your team, they can easily customize it.  
   *(Yes, we made a deal with the devil, resulting in a bigger bundle size—sorry about that. If minimizing size is your top priority, feel free to skip this feature.)*

4. **Super-Fast Downloads.**  
   Our approach to **multithreading** goes beyond single-file chunking. Multiple files are downloaded **in parallel** at all times, because **your time matters to us**.

5. **Minimal Resource Footprint.**  
   Eleport focuses on being a **launcher**—nothing more. You won’t see it hogging CPU or RAM at the top of your resource monitor.

6. **No UI Freezes During Downloads.**  
   It may sound silly, but some other launchers [freeze the UI](https://x.com/charles_print/status/1889615989404475547) when downloading. Eleport was partly born to fix that very issue.

## Get started

### Preparation

1. **Define your `.env` file**  
Rename the `.env.example` file to `.env` in your project directory.

2. **Generate `manifest.json` for your game**  
Before uploading your game, you need to generate a `manifest.json` file. Place the `manifest_gen.exe` file from the `extra/manifest_gen/` directory in the same directory as your game and run it. This will generate the `manifest.json` file for your game.

3. **Add a version file (optional)**  
To display the version number on the launcher, you can create a `version` file in the game directory and input the relevant version number.

4. **Prepare game files**  
Upload your game files to your server or storage bucket. Once uploaded, obtain the download URL and add it to the `MAIN_VITE_UPDATE_SERVER_URL` field in your `.env` file.
 
### Project Setup

#### Install
Install the necessary dependencies using:
```bash
$ pnpm install
```

#### Development
To start the development server, run:
```bash
$ pnpm dev
```

#### Build
To build the project for Windows:
```bash
$ pnpm build:win
```

#### Publish
To publish the build, use the following command:
```bash
$ pnpm publish
```
**Note:** If you're publishing to GitHub, ensure that the GH_TOKEN environment variable is set up for authentication.
