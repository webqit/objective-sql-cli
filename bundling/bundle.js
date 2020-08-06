
/**
 * imports
 */
import chalk from 'chalk';
import Bundler from './Bundler.js';

/**
 * Bundles files from the given entry directory
 * to the given output directory.
 * 
 * @param object params
 * 
 * @return void
 */
export default function(params) {
	console.info('');
	console.info('Building chtml bundles:');
	console.info(chalk.blueBright('> ') + chalk.bgWhite(chalk.black('from')) + ': ' + chalk.blueBright(params.entryDir));
	console.info(chalk.blueBright('> ') + chalk.bgWhite(chalk.black('to')) + ': ' + chalk.blueBright(params.outputFile));
	console.info('');
	var total = 0;
	params.namespaceCallback = (ns, resource, fnameNoExt, ext) => {
		if (!ext || ext === '.html') {
			console.info(chalk.blueBright('> ') + ns + ': ' + chalk.green(fnameNoExt + ext));
			total ++;
		}
	};
	Bundler.bundle(params.entryDir, params.outputFile, params);
	console.info('');
	console.info(total + ' total files bundled.');
};
