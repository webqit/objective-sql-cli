
/**
 * imports
 */
import Clui from 'clui';
import Chalk from 'chalk';
import Path from 'path';
import Bundler from './Bundler.js';

/**
 * Bundles files from the given entry directory
 * to the given output directory.
 * 
 * @param object params
 * 
 * @return void
 */
export default async function(params) {
	console.info('');
	console.info('Building chtml bundles:');
	console.info('');
	console.info(Chalk.blueBright('> ') + Chalk.bgWhiteBright(Chalk.black(' FROM ')) + ': ' + Chalk.greenBright(params.entryDir));
	console.info(Chalk.blueBright('> ') + Chalk.bgWhiteBright(Chalk.black(' TO ')) + ': ' + Chalk.greenBright(params.outputFile));
	console.info('');

	if (params.loaders) {
		if (typeof params.loaders === 'string') {
			params.loaders = params.loaders.split(',');
		}
		const loaders = params.loaders;
		params.loaders = [];
		const resolveLoaders = async loader => {
			if (!(loader = loaders.shift())) {
				return;
			}
			if (typeof loader === 'string') {
				loader = loader.trim();
				var loaderUrl = loader;
				if (loader.startsWith('default:')) {
					loaderUrl = Path.join(Path.dirname(import.meta.url), '/loaders', loader.replace('default:', ''));
				}
				var imported = await import(loaderUrl + '.js');
				if (imported.default) {
					loader = imported.default;
				} else {
					throw new Error('Loader "' + loader + '" not found at ' + loaderUrl);
				}
			}
			params.loaders.push(loader);
			resolveLoaders();
		};
		await resolveLoaders();
	}
		
	var spnnr, total = 0;
	if (!params.loadStart) {
		params.loadStart = resource => {
			if (resource === Path.resolve(params.outputFile)) {
				return false;
			}
			if (spnnr) {
				spnnr.stop(); spnnr = null;
			}
			spnnr = new Clui.Spinner(Chalk.blueBright('Evaluating - ') + Chalk.greenBright(resource));
			spnnr.start();
		};
	}
	if (!params.loadEnd) {
		params.loadEnd = (resource, content, errors, info) => {
			if (spnnr) {
				spnnr.stop(); spnnr = null;
			}
			if (errors.length) {
				console.info(Chalk.white('> error - ' + resource + ': '));
				errors.forEach(error => {
					console.info('  ' + Chalk.yellow(error));
				});
			} else {
				if (content) {
					console.info(Chalk.whiteBright('> loaded: ') + Chalk.greenBright(resource));
					total ++;
				}
				if (info.length) {
					info.forEach(_info => {
						console.info('  ' + Chalk.blueBright(_info));
					});
				}
			}
			
		};
	}

	// -------------------------------
	await Bundler.bundle(params.entryDir, params.outputFile, params);
	// -------------------------------

	console.info('');
	console.info(total + ' total files bundled.');
};
