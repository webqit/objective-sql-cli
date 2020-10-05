
/**
 * imports
 */
import Fs from 'fs';
import Path from 'path';
import Chalk from 'chalk';
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
                            type: 'text',
                            message: 'Enter loader arguments/flags (comma-separated):',
                        }
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
            },
            {
                name: 'CREATE_OUTLINE_FILE',
                type: 'toggle',
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
