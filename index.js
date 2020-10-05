#!/usr/bin/env node

/**
 * imports
 */
import Chalk from 'chalk';
import _arrLast from '@onephrase/util/arr/last.js';
import _arrFrom from '@onephrase/util/arr/from.js';
import { createParams as createBundlerParams, execBundle } from './bundling/index.js';
import _parseArgs from '@onephrase/util/cli/parseArgs.js';

// ------------------------------------------

var commands = {
    bundle: 'Bundles HTML templates.',
};

// ------------------------------------------

const { command, flags, _flags, ellipsis } = _parseArgs(process.argv);

// ------------------------------------------

console.log('');
switch(command) {

    // --------------------------

    case 'bundle':
        createBundlerParams(process.cwd(), flags, ellipsis).then(params => {
            execBundle(params);
        });
    break;

    // --------------------------

    case 'help':
    default:
        console.log(Chalk.bgYellow(Chalk.black(' CHTML HELP ')));
        console.log('');
        console.log('Say ' + Chalk.bold(Chalk.yellow('chtml')) + ' <command> <args>');
        console.log('');
        console.log('Where <command> is one of:');
        Object.keys(commands).forEach(name => {
            console.log('   ' + Chalk.bold(Chalk.yellow(name)) + ': ' + commands[name]);
        });
        console.log('');
        console.log('Where <args> is zero or more arguments. (Use an ellipsis [' + Chalk.bold(Chalk.yellow('...')) + '] for a walkthrough.)');
        console.log('');
        console.log('Example: ' + Chalk.bold(Chalk.yellow('chtml bundle ...')));
}