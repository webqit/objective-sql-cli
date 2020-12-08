
/**
 * imports
 */
import Path from 'path';
import Bundler from '../modules/bundler/Bundler.js';
import _isString from '@webqit/util/js/isString.js';
import _isObject from '@webqit/util/js/isObject.js';
import * as bundler from '../config/bundler.js'

/**
 * @description
 */
export const desc = {
    bundle: 'Creates the "partials" bundles.',
};

/**
 * @build
 */
export async function bundle(Ui, params = {}) {
	const config = await bundler.read(params);
    Ui.title(`${'Creating Partials bundles'} ...`);
    Ui.info('');
    Ui.info(Ui.f`FROM: ${config.ENTRY_DIR}`);
    Ui.info(Ui.f`TO: ${config.OUTPUT_FILE}`);
    Ui.info('');

	if (config.LOADERS) {
		if (typeof config.LOADERS === 'string') {
			config.LOADERS = config.LOADERS.split(',');
		}
		const LOADERS = config.LOADERS;
		config.LOADERS = [];
		const resolveLoaders = async loader => {
			if (!(loader = LOADERS.shift())) {
				return;
			}
			if (_isString(loader)) {
				loader = {name: loader.trim()};
			}
			if (_isObject(loader) && loader.name) {
				var loaderName = loader.name, isDefault;
				if (loaderName.startsWith('default:')) {
					isDefault = true;
					loaderName = loaderName.replace('default:', '');
				}
				// ---------------
				// Use info so far to resolve loader args
				if (_isObject(loader.args)) {
					Object.keys(loader.args).forEach(name => {
						config[(loaderName + ':' + name).toUpperCase()] = loader.args[name];
					});
				}
				// ---------------
				var loaderUrl = loaderName;
				if (isDefault) {
					loaderUrl = Path.join(Path.dirname(import.meta.url), '/LOADERS', loaderName);
				}
				var imported = await import(loaderUrl + '.js');
				if (imported.default) {
					loader = imported.default;
				} else {
					throw new Error('Loader "' + loaderName + '" not found at ' + loaderUrl);
				}
			}
			config.LOADERS.push(loader);
			resolveLoaders();
		};
		await resolveLoaders();
	}
		
	var waiting, total = 0;
	if (!config.loadStart) {
		config.loadStart = resource => {
			if (resource === Path.resolve(config.OUTPUT_FILE)) {
				return false;
			}
			if (waiting) {
				waiting.stop(); waiting = null;
			}
			waiting = Ui.waiting(Ui.f`${'Evaluating'} - ${resource}`);
			waiting.start();
		};
	}
	if (!config.loadEnd) {
		config.loadEnd = (resource, content, errors, info) => {
			if (waiting) {
				waiting.stop(); waiting = null;
			}
			if (errors.length) {
				Ui.error(Ui.f`Error - ${resource}:`);
				errors.forEach(error => {
					Ui.info(Ui.f`  ${Ui.style.err(error)}`);
				});
			} else {
				if (content) {
                    Ui.error(Ui.f`Loaded - ${resource}:`);
					total ++;
				}
				if (info.length) {
					info.forEach(_info => {
                        Ui.info(Ui.f`  ${_info}`);
					});
				}
			}
			
		};
	}

	// -------------------------------
	await Bundler.bundle(config.ENTRY_DIR, config.OUTPUT_FILE, config);
	// -------------------------------

	Ui.info('');
    Ui.info(Ui.f`${total} total files bundled.`);
};