
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
export async function migrate(Ui, flags = {}, options = {}, params = {}) {
	const config = await migration.read(params);
    Ui.title(`${'Running migrations'} ...`);
    Ui.info('');
    Ui.info(Ui.f`FROM: ${config.MIGRATIONS_DIR}`);
    Ui.info('');

	const cmdArgs = process.argv.slice(2);
	const migrateDirection = flags.down ? 'down' : 'up';
	
	// Use migration lock file
	var migrationFiles = options['--dir'] || Fs.readdirSync(config.MIGRATIONS_DIR);
	var migrationLock = {
		processed: [],
		state: {},
	}, migrationLockFile = options['--lock-file'] || config.MIGRATIONS_LOCK_FILE || Path.join(config.MIGRATIONS_DIR, 'migrations-lock.json');
	if (Fs.existsSync(migrationLockFile)) {
		migrationLock = JSON.parse(Fs.readFileSync(migrationLockFile));
	}
	var dbDriver, dbDriverFile = options['--objsql-instance-file'] || config.OBJSQL_INSTANCE_FILE;
	if (Fs.existsSync(dbDriverFile)) {
		dbDriver = await (await import(Url.pathToFileURL(Path.resolve(dbDriverFile)))).default();
		// Give driver the current state of schema
		// Now, changes mage by migration runners will reflect back
		// at the lock file.
		dbDriver.bindSchema(migrationLock.state || {});
	}
	
	// Run migration...
	var processedFiles = [], ongoingMigration;
	if (migrationFiles.length) {
	
		// Run migrations here
		if (migrateDirection === 'down') {
			migrationFiles.reverse();
		}
	
		migrationFiles.forEach(migrationFile => {
			ongoingMigration = new Promise(async resolve => {
				await ongoingMigration;
	
				var migrationFileUrl = Path.resolve(config.MIGRATIONS_DIR, migrationFile);
				if (Fs.statSync(migrationFileUrl).isDirectory() || !migrationFile.endsWith('.js')) {
					return resolve();
				}
				// On --up, ignore .done.js files
				if ((migrateDirection === 'up' && migrationLock.processed.includes(migrationFile) && options['--only'] !== migrationFile)
				// On --down, ignore .done.js files
				|| (migrateDirection === 'down' && !migrationLock.processed.includes(migrationFile) && options['--only'] !== migrationFile)) {
					return resolve();
				}
				if (!processedFiles.length || flags.all) {
					processedFiles.push(migrationFile);
					const _import = await import(Url.pathToFileURL(migrationFileUrl));
					if (_import[migrateDirection]) {
						if (dbDriver) {
							await _import[migrateDirection](dbDriver);
						} else {
							await _import[migrateDirection]();
						}
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
			Ui.info('');
			Ui.info(Ui.f`${processedFiles.length} total files processed.`);
			Ui.info(Ui.f`See file: ${migrationLockFile} for details.`);
			process.exit();
		});
	
	}
};