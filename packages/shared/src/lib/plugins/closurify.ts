import { OutputChunk } from 'rollup';
import { Plugin, ResolvedConfig } from 'vite';

type Options = {
    files: string[];
};

/**
 * Wraps the code in an anonymous function to prevent global variables from leaking.
 *
 * @return {Plugin}
 */
export function closurify({ files }: Options | undefined = { files: [] }): Plugin {
    // Globally so we can add it to legacy and non-legacy bundle.
    let config: ResolvedConfig;

    return {
        apply: 'build',
        enforce: 'post',
        name: 'closurify',
        configResolved(_config) {
            config = _config;
        },
        async generateBundle(_opts, bundle) {
            if (config.build.ssr) {
                return;
            }

            const jsAssets = Object.keys(bundle).filter(
                (i) =>
                    bundle[i].type == 'chunk' &&
                    bundle[i].fileName.match(/.[cm]?js$/) != null &&
                    !bundle[i].fileName.includes('polyfill'),
            );

            for (const jsAsset of jsAssets) {
                if (files.length > 0 && !files.includes(bundle[jsAsset].fileName)) {
                    continue;
                }

                const asset = bundle[jsAsset] as OutputChunk;
                const appCode = asset.code;
                asset.code = `(function(){${appCode}})();`;
            }
        },
    };
}
