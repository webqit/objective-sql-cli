
/**
 * imports
 */
import Path from 'path';
import _merge from '@webqit/util/obj/merge.js';
import * as DotJson from '@webqit/backpack/src/dotfiles/DotJson.js';

/**
 * Reads BUNDLING from file.
 * 
 * @param object    flags
 * @param object    params
 * 
 * @return object
 */
export async function read(flags = {}, params = {}) {
    const config = DotJson.read(Path.join(params.ROOT || '', './.obj-sql-cli/config/migrate.json'));
    return _merge({
        MIGRATIONS_DIR: './src/database/migrations',
        MIGRATIONS_LOCK_FILE: '',
        OBJSQL_INSTANCE_FILE: './src/database/index.js',
    }, config);
};

/**
 * Writes BUNDLING to file.
 * 
 * @param object    data
 * @param object    flags
 * @param object    params
 * 
 * @return void
 */
export async function write(data, flags = {}, params = {}) {
    DotJson.write(data, Path.join(params.ROOT || '', './.obj-sql-cli/config/migrate.json'));
};

/**
 * Configures BUNDLING.
 * 
 * @param object    config
 * @param object    choices
 * @param object    params
 * 
 * @return Array
 */
export async function questions(config, choices = {}, params = {}) {

    // Params
    const DATA = config;

    // Questions
    return [
        {
            name: 'MIGRATIONS_DIR',
            type: 'text',
            message: 'Enter the migrations directory',
            initial: DATA.MIGRATIONS_DIR,
            validation: ['important'],
        },
        {
            name: 'MIGRATIONS_LOCK_FILE',
            type: 'text',
            message: 'Enter the migrations-lock file',
            initial: DATA.MIGRATIONS_LOCK_FILE,
            validation: ['important'],
        },
        {
            name: 'OBJSQL_INSTANCE_FILE',
            type: 'text',
            message: 'Enter the Objective SQL instance file',
            initial: DATA.OBJSQL_INSTANCE_FILE,
        },
    ];
};
