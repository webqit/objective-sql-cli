# OOHTML CLI

<!-- BADGES/ -->

<span class="badge-npmversion"><a href="https://npmjs.org/package/@webqit/objective-sql-cli" title="View this project on NPM"><img src="https://img.shields.io/npm/v/@webqit/objective-sql-cli.svg" alt="NPM version" /></a></span>
<span class="badge-npmdownloads"><a href="https://npmjs.org/package/@webqit/objective-sql-cli" title="View this project on NPM"><img src="https://img.shields.io/npm/dm/@webqit/objective-sql-cli.svg" alt="NPM downloads" /></a></span>

<!-- /BADGES -->


*[Objective SQL CLI](https://webqit.io/tooling/objective-sql-cli)* is a Command-Line utility for Objective SQL.

> [Visit project homepage](https://webqit.io/tooling/objective-sql-cli).

## Installation
Install Objective SQL CLI globally via npm

```text
$ npm i -g npm
$ npm i -g @webqit/objective-sql-cli
```

## Commands
View all available commands and their descriptions:

```text
$ objsql help
```

+ **Config** - Configure the behaviour of a command:

    ```text
    $ objsql config <command>
    ```

    ...where `<command>` is the command name to configure. Use the the ellipsis `...` for options.

+ **Migrate** - Run schema migration:

    ```text
    $ objsql migrate
    ```

    See [Migration Docs](https://webqit.io/tooling/objective-sql-cli/migration) for details.

## Issues
To report bugs or request features, please submit an [issue](https://github.com/webqit/objective-sql-cli/issues).

## License
MIT.
