
/**
 * imports
 */
import Path from 'path';
import _merge from '@webqit/util/obj/merge.js';
import { initialGetIndex } from '@webqit/backpack/src/cli/Promptx.js';
import * as DotJson from '@webqit/backpack/src/dotfiles/DotJson.js';

/**
 * Reads BUNDLING from file.
 * 
 * @param object    params
 * 
 * @return object
 */
export async function read(params = {}) {
    return DotJson.read(Path.join(params.ROOT || '', './.oohtml-cli/config/bundler.json'));
};

/**
 * Writes BUNDLING to file.
 * 
 * @param object    data
 * @param object    params
 * 
 * @return void
 */
export async function write(data, params = {}) {
    DotJson.write(data, Path.join(params.ROOT || '', './.oohtml-cli/config/bundler.json'));
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
    const DATA = _merge({
        ENTRY_DIR: './',
        OUTPUT_FILE: './bundle.html',
        SHOW_OUTLINE_NUMBERING: true,
        LOADERS: [],
        // ---------
        // Advanced
        // ---------
        IGNORE_FOLDERS_BY_PREFIX: ['.'],
        CREATE_OUTLINE_FILE: true,
        EXPORT_ID_ATTR: 'export',
        TEMPLATE_NAME_ATTR: 'name',
        MAX_DATA_URL_SIZE: 1024,
        ASSETS_PUBLIC_BASE: '/',
    }, config);

    // Choices hash...
    const CHOICES = _merge({
        create_outline_file: [
            {value: '', title: 'No outline'},
            {value: 'create', title: 'Create'},
            {value: 'create_merge', title: 'Create and merge'},
        ],
    }, choices);

    // Questions
    return [
        {
            name: 'ENTRY_DIR',
            type: 'text',
            message: 'Enter the entry directory:',
            initial: DATA.ENTRY_DIR,
            validation: ['important'],
        },
        {
            name: 'OUTPUT_FILE',
            type: 'text',
            message: 'Enter the output file name:',
            initial: DATA.OUTPUT_FILE,
            validation: ['important'],
        },
        {
            name: 'SHOW_OUTLINE_NUMBERING',
            type: 'toggle',
            message: 'Choose whether to show outline numbering:',
            active: 'YES',
            inactive: 'NO',
            initial: DATA.SHOW_OUTLINE_NUMBERING,
        },
        {
            name: 'LOADERS',
            type: 'recursive',
            initial: DATA.LOADERS,
            controls: {
                name: 'loader',
            },
            questions: [
                {
                    name: 'name',
                    type: 'text',
                    message: 'Enter loader name:',
                    validation: ['important'],
                },
                {
                    name: 'args',
                    type: 'recursive',
                    controls: {
                        name: 'argument/flag',
                        combomode: true,
                    },
                    questions: [
                        {
                            name: 'name',
                            type: 'text',
                            message: 'Enter argument/flag name:',
                            validation: ['important'],
                        },
                        {
                            name: 'value',
                            type: 'text',
                            message: 'Enter argument/flag value:',
                            validation: ['important'],
                        },
                    ]
                },
            ]
        },
        // ---------
        // Advanced
        // ---------
        {
            name: '__advanced',
            type: 'toggle',
            message: 'Show advanced options?',
            active: 'YES',
            inactive: 'NO',
            initial: DATA.__advanced,
        },
        {
            name: 'IGNORE_FOLDERS_BY_PREFIX',
            type: (prev, answers) => answers.__advanced ? 'list' : null,
            message: 'List folders to ignore by prefix (comma-separated):',
            initial: (DATA.IGNORE_FOLDERS_BY_PREFIX || []).join(', '),
        },
        {
            name: 'CREATE_OUTLINE_FILE',
            type: (prev, answers) => answers.__advanced ? 'select' : null,
            message: 'Choose whether to create an outline file:',
            choices: CHOICES.create_outline_file,
            initial: initialGetIndex(CHOICES.create_outline_file, DATA.CREATE_OUTLINE_FILE),
        },
        {
            name: 'EXPORT_ID_ATTR',
            type: (prev, answers) => answers.__advanced ? 'text' : null,
            message: 'Enter the "export ID" attribute:',
            initial: DATA.EXPORT_ID_ATTR,
            validation: ['important'],
        },
        {
            name: 'TEMPLATE_NAME_ATTR',
            type: (prev, answers) => answers.__advanced ? 'text' : null,
            message: 'Enter the "template name" attribute:',
            initial: DATA.TEMPLATE_NAME_ATTR,
            validation:['important'],
        },
        {
            name: 'MAX_DATA_URL_SIZE',
            type: (prev, answers) => answers.__advanced ? 'number' : null,
            message: 'Enter the data-URL threshold for media files:',
            initial: DATA.MAX_DATA_URL_SIZE,
            validation: ['important'],
        },
        {
            name: 'ASSETS_PUBLIC_BASE',
            type: (prev, answers) => answers.__advanced ? 'text' : null,
            message: 'Enter the public base for assets:',
            initial: DATA.ASSETS_PUBLIC_BASE,
        },
    ];
};
