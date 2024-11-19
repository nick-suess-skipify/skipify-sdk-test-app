# Skipify Checkout SDK

![skipify-logo](https://user-images.githubusercontent.com/5350362/204699214-f9b54d89-0328-4475-a83f-06dd469813fd.svg)

Checkout script generation, used for enabling Skipify checkout in a merchant store

## Tooling

- NX
- Vite
- Rollup
- ESBuild

## Features

- Static file generation
- Shared features across platforms
- Platform-specific features

## Usage

The project contains the following scripts:

- `nx run [platform]:build:[environment]` - generates the bundles, platform can be bigcommerce | custom, environment can be dev | stage | prod

Bundles get generated inside the dist folder

## Developing

```
// Start development server
`nx run bigcommerce:build:dev --watch`
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
script.src = `http://localhost:4200/bigcommerce/bigcommerce.js?merchantId=ca4d3697-4579-4dda-9c89-ee63ae5a7b41&date=${new Date().getTime()}`;
document.head.appendChild(script);
```

Available apps:
```
nx run bigcommerce:build:dev
nx run shopify:build:dev
nx run custom:build:dev
nx run shared:build:dev
nx run embedded-components:build:dev
nx run magento:build:dev
```

Running all apps:
```
npm run all:build:dev
```

## Custom SDK x Platform SDKs

#### Platform-Related SDK (e.g., Shopify):

- This SDK listens to DOM changes and automatically initializes itself in the appropriate elements.

#### Custom SDK

- This SDK requires merchants to manually initialize it and control the experience

#### Embedded Components SDK

- This SDK is used for embedded components.

## Custom SDK

After building and hosting the custom SDK, you can test the flow on the test page available at
http://localhost:4200/shared/components/playground.html

Usage example:
```
// Initialize client
const skipifyClient = new window.skipify({
    merchantId,
})

// Optional options
const options = { onClose, onApprove }

// Render Skipify button
skipifyClient.button("my-ref-test", options).render(buttonRef.current)

// Enable input listener
skipifyClient.email("my-email-ref-test").enable(inputRef.current)

```

## Embedded Components SDK

After building and hosting the embedded components SDK, you can test the flow on the test page available at

http://localhost:4200/shared/components/embedded_components_playground.html



## Apps and libs dependencies graph
```
nx graph
```


## Deployments, Releases, & Rollbacks

- Please see confluence page on [Deployments, Releases, & Rollbacks](https://skipify.atlassian.net/wiki/spaces/PE/pages/1727496537/Deployments+Releases+Rollbacks)
