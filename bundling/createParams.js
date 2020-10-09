
/**
 * imports
 */
import Fs from 'fs';
import Path from 'path';
import Chalk from 'chalk';
import Clear from 'clear';
import _merge from '@onephrase/util/obj/merge.js';
import Promptx, { validateAs, transformAs } from '@onephrase/util/cli/Promptx.js';
import * as DotJson from '@onephrase/util/src/DotJson.js';
import printArgs from '@onephrase/util/cli/printArgs.js';

/**
 * Obtains parameters for initializing a server.
 * 
 * @param string    ROOT
 * @param object    flags
 * @param bool      ellipsis
 * @param string    version
 * 
 * @return Promise
 */
export default async function(ROOT, flags, ellipsis) {
    Clear();
    var _params = {}, _paramsFile;
    if (Fs.existsSync(_paramsFile = Path.join(ROOT, flags['CONFIG'] || './.chtml/bundle.config.json'))) {
        _params = DotJson.read(_paramsFile);
    }
    // -------------------
    // Create server parameters
    // -------------------
    var params = _merge({
        ROOT,
        ENTRY_DIR: './',
        OUTPUT_FILE: './bundle.html',
        SHOW_OUTLINE_NUMBERING: true,
        LOADERS: [],
        // ---------
        // Advanced
        // ---------
        IGNORE_FOLDERS_BY_PREFIX: ['.'],
        CREATE_OUTLINE_FILE: true,
        PARTIALS_NAMESPACE_ATTR: 'partials-slot',
        TEMPLATE_NAMESPACE_ATTR: 'name',
        MAX_DATA_URL_SIZE: 1024,
        ASSETS_PUBLIC_BASE: '/',
    }, _params, flags);

    if (ellipsis) {
        var questions = [
            {
                name: 'ENTRY_DIR',
                type: 'text',
                message: 'Enter the entry directory:',
                initial: params.ENTRY_DIR,
                format: transformAs(['path']),
                validate: validateAs(['important']),
            },
            {
                name: 'OUTPUT_FILE',
                type: 'text',
                message: 'Enter the output file name:',
                initial: params.OUTPUT_FILE,
                format: transformAs(['path']),
                validate: validateAs(['important']),
            },
            {
                name: 'SHOW_OUTLINE_NUMBERING',
                type: 'toggle',
                message: 'Choose whether to show outline numbering:',
                active: 'YES',
                inactive: 'NO',
                initial: params.SHOW_OUTLINE_NUMBERING,
            },
            {
                name: 'LOADERS',
                type: 'toggle',
                message: 'Add LOADERS?',
                active: 'YES',
                inactive: 'NO',
                initial: params.LOADERS ? true : false,
                prompts: {
                    multiple: 'Add another loader?',
                    initial: params.LOADERS,
                    questions: [
                        {
                            name: 'name',
                            type: 'text',
                            message: 'Enter loader name:',
                            validate: validateAs(['important']),
                        },
                        {
                            name: 'args',
                            type: 'toggle',
                            message: 'Add loader arguments/flags?',
                            active: 'YES',
                            inactive: 'NO',
                            prompts: {
                                multiple: 'Add another argument/flag?',
                                combomode: true,
                                questions: [
                                    {
                                        name: 'name',
                                        type: 'text',
                                        message: 'Enter argument/flag name:',
                                        validate: validateAs(['important']),
                                    },
                                    {
                                        name: 'value',
                                        type: 'text',
                                        message: 'Enter argument/flag value:',
                                    },
                                ]
                            }
                        },
                    ]
                }
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
                initial: params.__advanced,
            },
            {
                name: 'IGNORE_FOLDERS_BY_PREFIX',
                type: (prev, answers) => answers.__advanced ? 'list' : null,
                message: 'List folders to ignore by prefix (comma-separated):',
                initial: (params.IGNORE_FOLDERS_BY_PREFIX || []).join(', '),
            },
            {
                name: 'CREATE_OUTLINE_FILE',
                type: (prev, answers) => answers.__advanced ? 'toggle' : null,
                message: 'Choose whether to create an outline file:',
                active: 'YES',
                inactive: 'NO',
                initial: params.CREATE_OUTLINE_FILE,
            },
            {
                name: 'PARTIALS_NAMESPACE_ATTR',
                type: (prev, answers) => answers.__advanced ? 'text' : null,
                message: 'Enter the "partials name" attribute:',
                initial: params.PARTIALS_NAMESPACE_ATTR,
                validate: validateAs(['important']),
            },
            {
                name: 'TEMPLATE_NAMESPACE_ATTR',
                type: (prev, answers) => answers.__advanced ? 'text' : null,
                message: 'Enter the "template name" attribute:',
                initial: params.TEMPLATE_NAMESPACE_ATTR,
                validate: validateAs(['important']),
            },
            {
                name: 'MAX_DATA_URL_SIZE',
                type: (prev, answers) => answers.__advanced ? 'number' : null,
                message: 'Enter the data-URL threshold for media files:',
                initial: params.MAX_DATA_URL_SIZE,
                validate: validateAs(['important']),
            },
            {
                name: 'ASSETS_PUBLIC_BASE',
                type: (prev, answers) => answers.__advanced ? 'number' : null,
                message: 'Enter the public base for assets:',
                initial: params.ASSETS_PUBLIC_BASE,
            },
        ];

        console.log('');
        console.log(Chalk.whiteBright(`Enter parameters:`));
        _merge(params, await Promptx(questions));

    } else {

        console.log('');
        console.log(Chalk.whiteBright(`Creating a bundle with the following params:`));
        printArgs(params);

    }

    // ---------------------------

    if (!flags['CONFIG']) {
        DotJson.write(params, _paramsFile);
    }

    return params;
};
