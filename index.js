#!/usr/bin/env node

/**
 * imports
 */
import chalk from 'chalk';
import createBundlerParams from './bundling/createParams.js';
import bundle from './bundling/bundle.js';

var commands = {
    bundle: 'Bundles HTML templates.',
};
switch(process.argv[2]) {
    case 'bundle':
        createBundlerParams(process.cwd(), ...process.argv.slice(3)).then(params => {
            bundle(params);
        });
    break;
    case 'help':
    default:
        console.log('');
        console.log(chalk.bgYellow(chalk.black(' CHTML HELP ')));
        console.log('');
        console.log('Say ' + chalk.bold(chalk.yellow('chtml')) + ' <command> <args>');
        console.log('');
        console.log('Where <command> is one of:');
        Object.keys(commands).forEach(name => {
            console.log('   ' + chalk.bold(chalk.yellow(name)) + ': ' + commands[name]);
        });
        console.log('');
        console.log('Where <args> is zero or more arguments. (Use an ellipsis [' + chalk.bold(chalk.yellow('...')) + '] for a walkthrough.)');
        console.log('');
        console.log('Example: ' + chalk.bold(chalk.yellow('chtml bundle ...')));
}