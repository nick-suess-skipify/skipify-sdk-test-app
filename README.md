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
- `build:[environment]` - generates the bundles, environment can be development | staging | production

Bundles get generated inside the dist folder

## Developing

```
// Start development server
npm run dev
```

Inside another terminal:
```
// Start development server
npm run host
```
Your scripts should be now live on http://localhost:4200/

BigCommerce
Add hosted script to the store by pasting the following code snippet
Remember to replace merchantId in the query
```
var script = document.createElement("script");
script.src = `http://localhost:4200/bigCommerce.js?merchantId=52498a0a-7ae5-4877-af19-0f4d38f228f8&date=${new Date().getTime()}`;
document.head.appendChild(script);
```
