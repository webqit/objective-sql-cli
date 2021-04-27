
/**
 * imports
 */
import Fs from 'fs';
import Url from 'url';
import Path from 'path';
import _isString from '@webqit/util/js/isString.js';
import _beforeLast from '@webqit/util/str/beforeLast.js';
import _isObject from '@webqit/util/js/isObject.js';
import _isEmpty from '@webqit/util/js/isEmpty.js';
import * as migration from '../config/migration.js'

/**
 * @description
 */
export const desc = {
    bundle: 'Creates the "partials" bundles.',
};

/**
 * @build
 */
export async function migrate(Ui, flags = {}, params = {}) {
	const config = await migration.read(params);
    Ui.title(`${'Running migration'} ...`);
    Ui.info('');
    Ui.info(Ui.f`FROM: ${config.ENTRY_DIR}`);
    Ui.info(Ui.f`TO: ${config.OUTPUT_FILE}`);
    Ui.info('');

	const cmdArgs = process.argv.slice(2);
	const migrateDirection = cmdArgs.includes('--down') ? 'down' : 'up';
	const __dirname = Path.dirname(Url.fileURLToPath(import.meta.url));
	
	// Use migration lock file
	var migrationFiles = Fs.readdirSync(Path.join(__dirname, 'migrations'));
	var migrationLock = {
		processed: [],
		state: {},
	}, migrationLockFile = Path.join(__dirname, 'migrations-lock.json');
	if (Fs.existsSync(migrationLockFile)) {
		migrationLock = JSON.parse(Fs.readFileSync(migrationLockFile));
	}
	
	// Give driver the current state of schema
	// Now, changes mage by migration runners will reflect back
	// at the lock file.
	const dbDriver = getDbDriver();
	dbDriver.bindSchema(migrationLock.state || {});
	
	// Run migration...
	var lastestFileCalled, ongoingMigration;
	if (migrationFiles.length) {
	
		// Run migrations here
		if (migrateDirection === 'down') {
			migrationFiles.reverse();
		}
	
		migrationFiles.forEach(migrationFile => {
			ongoingMigration = new Promise(async resolve => {
				await ongoingMigration;
	
				var migrationFileUrl = Path.join(__dirname, 'migrations', migrationFile);
				if (Fs.statSync(migrationFileUrl).isDirectory() || !migrationFile.endsWith('.js')) {
					return resolve();
				}
				// On --up, ignore .done.js files
				if ((migrateDirection === 'up' && migrationLock.processed.includes(migrationFile) && !cmdArgs.includes('--only=' + migrationFile))
				// On --down, ignore .done.js files
				|| (migrateDirection === 'down' && !migrationLock.processed.includes(migrationFile) && !cmdArgs.includes('--only=' + migrationFile))) {
					return resolve();
				}
				if (!lastestFileCalled || cmdArgs.includes('--all')) {
					lastestFileCalled = true;
					const _import = await import(migrationFileUrl);
					if (_import[migrateDirection]) {
						await _import[migrateDirection](dbDriver);
					}
					if (migrateDirection === 'down') {
						migrationLock.processed = migrationLock.processed.filter(f => f !== migrationFile);
					} else if (!migrationLock.processed.includes(migrationFile)) {
						migrationLock.processed.push(migrationFile);
					}
				}
	
				resolve();
			});
		});
	
		ongoingMigration.then(() => {
			Fs.writeFileSync(migrationLockFile, JSON.stringify(migrationLock, null, 4));
			process.exit();
		});
	
	}
	
	Ui.info('');
    Ui.info(Ui.f`${total} total files bundled.`);
};