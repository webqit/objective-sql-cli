#!/usr/bin/env node

/**
 * imports
 */
import Chalk from 'chalk';
import _arrLast from '@onephrase/util/arr/last.js';
import _arrFrom from '@onephrase/util/arr/from.js';
import { createParams as createBundlerParams, execBundle } from './bundling/index.js';

var version = 'v0.0.1';
// Commands list
var commands = {
    bundle: 'Bundles HTML templates.',
};

// Mine parameters
// ------------------------------------------
var command = process.argv[2], _flags = process.argv.slice(3), flags = {}, ellipsis;
if (_arrLast(_flags) === '...') {
    _flags.pop();
    ellipsis = true;
}
_flags.forEach(flag => {
    if (flag.indexOf('+=') > -1 || flag.indexOf('=') > -1 || flag.startsWith('#')) {
        if (flag.indexOf('+=') > -1) {
            flag = flag.split('+=');
            flags[flag[0]] = _arrFrom(flags[flag[0]]);
            flags[flag[0]].push(flag[1]);
        } else {
            flag = flag.split('=');
            flags[flag[0]] = flag[1];
        }
    } else if (flag.startsWith('--')) {
        flags[flag.substr(2)] = true;
    }
});
// ------------------------------------------

switch(command) {
    case 'bundle':
        createBundlerParams(process.cwd(), flags, ellipsis, version).then(params => {
            execBundle(params);
        });
    break;
    case 'help':
    default:
        console.log('');
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