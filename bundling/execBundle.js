
/**
 * imports
 */
import Clui from 'clui';
import Chalk from 'chalk';
import Path from 'path';
import Bundler from './Bundler.js';
import _isString from '@onephrase/util/js/isString.js';
import _isObject from '@onephrase/util/js/isObject.js';

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
	console.info(Chalk.blueBright('> ') + Chalk.bgWhiteBright(Chalk.black(' FROM ')) + ': ' + Chalk.greenBright(params.ENTRY_DIR));
	console.info(Chalk.blueBright('> ') + Chalk.bgWhiteBright(Chalk.black(' TO ')) + ': ' + Chalk.greenBright(params.OUTPUT_FILE));
	console.info('');

	if (params.LOADERS) {
		if (typeof params.LOADERS === 'string') {
			params.LOADERS = params.LOADERS.split(',');
		}
		const LOADERS = params.LOADERS;
		params.LOADERS = [];
		const resolveLoaders = async loader => {
			if (!(loader = LOADERS.shift())) {
				return;
			}
			if (_isString(loader)) {
				loader = {name: loader.trim()};
			}
			if (_isObject(loader) && loader.name) {
				var loaderName = loader.name;
				var loaderUrl = loaderName;
				if (loaderName.startsWith('default:')) {
					loaderUrl = Path.join(Path.dirname(import.meta.url), '/LOADERS', loaderName.replace('default:', ''));
				}
				var imported = await import(loaderUrl + '.js');
				if (imported.default) {
					loader = imported.default;
				} else {
					throw new Error('Loader "' + loaderName + '" not found at ' + loaderUrl);
				}
			}
			params.LOADERS.push(loader);
			resolveLoaders();
		};
		await resolveLoaders();
	}
		
	var spnnr, total = 0;
	if (!params.loadStart) {
		params.loadStart = resource => {
			if (resource === Path.resolve(params.OUTPUT_FILE)) {
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
	await Bundler.bundle(params.ENTRY_DIR, params.OUTPUT_FILE, params);
	// -------------------------------

	console.info('');
	console.info(total + ' total files bundled.');
};
