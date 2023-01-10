import { OutputChunk } from "rollup";
import { Plugin, ResolvedConfig } from "vite";

type Options = {
  files: string[];
};

/**
 * Wraps the code in an anonymous function to prevent global variables from leaking.
 *
 * @return {Plugin}
 */
export default function closurify(
  { files }: Options | undefined = { files: [] }
): Plugin {
  // Globally so we can add it to legacy and non-legacy bundle.
  let config: ResolvedConfig;

  return {
    apply: "build",
    enforce: "post",
    name: "closurify",
    configResolved(_config) {
      config = _config;
    },
    async generateBundle(_opts, bundle) {
      if (config.build.ssr) {
        return;
      }

      const jsAssets = Object.keys(bundle).filter(
        (i) =>
          bundle[i].type == "chunk" &&
          bundle[i].fileName.match(/.[cm]?js$/) != null &&
          !bundle[i].fileName.includes("polyfill")
      );

      for (const jsAsset of jsAssets) {
        if (files.length > 0 && !files.includes(bundle[jsAsset].fileName)) {
          continue;
        }

        const asset = bundle[jsAsset] as OutputChunk;
        const appCode = asset.code;
        const sentryWrapper = `
        const script = document.createElement("script");
        script.type = "text/javascript";
        script.src = "https://browser.sentry-cdn.com/7.29.0/bundle.tracing.min.js";
        // script.integrity = "sha384-3j0bt1Hsickwz9yU41Ct73WWNewuV+DoTZXK/mD/HWfBvyUoPPlCAbgu0C3rAIVs";
        script.crossorigin = "anonymous";
        script.onreadystatechange = function () {
          if (this.readyState == "complete") {
            Sentry.init({
              dsn: "${config.env.VITE_AUTH_SENTRY_DSN}",
              environment: "${config.env.MODE}",
              integrations: [new Sentry.BrowserTracing()],
              tracesSampleRate: 0.1,
            });
          }
        };

        document.head.appendChild(script);

        try {
          (function(){${appCode}})();
        } catch (e) {
          if(window?.Sentry) { Sentry.captureException(e); }
        }
        `;
        asset.code = `${sentryWrapper}`;
      }
    },
  };
}
