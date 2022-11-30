# Skipify Checkout SDK

![skipify-logo](https://user-images.githubusercontent.com/5350362/204699214-f9b54d89-0328-4475-a83f-06dd469813fd.svg)

Checkout script generation, used for enabling Skipify checkout in a merchant store

## Tooling

- Vite
- Rollup
- ESBuild

## Features

- Static file generation
- Shared features across platforms
- Platform-specific features

## Usage

The project contains the following scripts:

- `dev` - starts dev server
- `build` - generates the bundles

Bundles are generated inside the dist folder

## Developing 

```
// Start development server
npm run dev
```

BigCommerce

Get the bigCommerce bundle inside the /dist folder and manually add to BigCommerce checkout page inside a store



