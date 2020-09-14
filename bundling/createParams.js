
/**
 * imports
 */
import Fs from 'fs';
import Path from 'path';
import Chalk from 'chalk';
import _merge from '@onephrase/util/obj/merge.js';
import Inquirer from 'inquirer';

/**
 * Obtains parameters for initializing a server.
 * 
 * @param string    root
 * @param object    flags
 * @param bool      ellipsis
 * @param string    version
 * 
 * @return Promise
 */
export default async function(root, flags, ellipsis, version) {
    // -------------------
    // Create server parameters
    // -------------------
    var params = _merge({
        root,
        entryDir: './chtml',
        outputFile: './public/app.html',
        templateNamespaceAttribute: 'name',
        maxDataURLsize: 1024,
        assetsPublicBase: '/',
    }, flags), serverParams;
    // Merge parameters from a JSON file
    if (Fs.existsSync(serverParams = Path.join(root, flags['config'] || './chtml.config.js'))) {
        var params2 = await import('file:///' + serverParams);
        Object.keys(params2 || {}).forEach(k => {
            params[k] = params2[k];
        });
    }
    const validation = {
        entryDir: suffix => {
            return val => val ? true : 'Please provide a directory' + suffix;
        },
        outputFile: suffix => {
            return val => val ? true : 'Please provide a file name' + suffix;
        },
        templateNamespaceAttribute: suffix => {
            return val => val ? true : 'Please provide an attribute name' + suffix;
        },
        maxDataURLsize: suffix => {
            return val => val ? true : 'Please provide a number' + suffix;
        },
        assetsPublicBase: suffix => {
            return val => val ? true : 'Please provide a value' + suffix;
        },
    };

    if (ellipsis) {
        var questions = [
            {
                name: 'entryDir',
                type: 'input',
                message: 'Enter the entry directory:',
                default: params.entryDir,
                validate: validation.entryDir(':'),
            },
            {
                name: 'outputFile',
                type: 'input',
                message: 'Enter the output file name:',
                default: params.outputFile,
                validate: validation.outputFile(':'),
            },
            {
                name: 'templateNamespaceAttribute',
                type: 'input',
                message: 'Enter the "template name" attribute:',
                default: params.templateNamespaceAttribute,
                validate: validation.templateNamespaceAttribute(':'),
            },
            {
                name: 'maxDataURLsize',
                type: 'number',
                message: 'Enter the data-URL threshold for media files:',
                default: params.maxDataURLsize,
                validate: validation.maxDataURLsize(':'),
            },
            {
                name: 'assetsPublicBase',
                type: 'input',
                message: 'Enter the public base for assets:',
                default: params.assetsPublicBase,
                validate: validation.assetsPublicBase(':'),
            },
        ];
        console.log('');
        console.log(Chalk.whiteBright(`Enter parameters:`));
        _merge(params, await Inquirer.prompt(questions));
    } else {
        // Valiate
        Object.keys(params).forEach(k => {
            var msg;
            if (validation[k] && (msg = validation[k]('!')(params[k])) !== true) {
                console.log('');
                console.log(Chalk.redBright('[' + k + ']: ' + msg));
                console.log(Chalk.redBright('Exiting...'));
                process.exit();
            }
        });
    }

    // Resolve paths
    ['entryDir', 'outputFile'].forEach(name => {
        params[name] = Path.resolve(Path.join(params.root, params[name]));
    });

    return params;
};
