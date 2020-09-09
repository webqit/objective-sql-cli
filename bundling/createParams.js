
/**
 * imports
 */
import Fs from 'fs';
import Path from 'path';
import Chalk from 'chalk';
import _merge from '@web-native-js/commons/obj/merge.js';
import Inquirer from 'inquirer';

/**
 * Obtains parameters for initializing a server.
 * 
 * @param string    root
 * @param array     ...args
 * 
 * @return Promise
 */
export default async function(root, ...args) {
    // -------------------
    // Create server parameters
    // -------------------
    var params = {
        root,
        entryDir: './chtml',
        outputFile: './public/app.html',
        templateNamespaceAttribute: 'name',
        maxDataURLsize: 1024,
        assetsPublicBase: '/',
    }, params2;
    // Merge parameters from a JSON file
    if (Fs.existsSync(params2 = Path.join(root, './bundling.json'))) {
        var params2 = JSON.parse(Fs.readSync(serverParams));
        Object.keys(params2).forEach(k => {
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

    if (args[0] === '...') {
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
        // Instance priority args
        if (args[0]) {
            params.entryDir = args[0];
        }
        if (args[1]) {
            params.outputFile = args[1];
        }
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
