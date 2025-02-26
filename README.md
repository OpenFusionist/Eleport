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


## Project Setup

### Install

```bash
$ pnpm install
```

### Development

```bash
$ pnpm dev
```

### Build

```bash
$ pnpm build:win
```

### Publish

```bash
$ pnpm publish
```