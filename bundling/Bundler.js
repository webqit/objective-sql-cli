
/**
 * @imports
 */
import Fs from 'fs';
import Path from 'path';
import _each from '@onephrase/util/obj/each.js';
import _merge from '@onephrase/util/obj/merge.js'
import _isObject from '@onephrase/util/js/isObject.js';
import _isFunction from '@onephrase/util/js/isFunction.js';
import _beforeLast from '@onephrase/util/str/beforeLast.js';

/**
 * ---------------------------
 * The Bundler class
 * ---------------------------
 */
export default class Bundler {
		
	/**
	 * Bundles and saves (multiple).
	 *
	 * @param string|object	from
	 * @param string		to
	 * @param object		params
	 *
	 * @return string|object
	 */
	static async bundle(from, to = null, params = {}) {
		if (_isObject(from)) {
			var fromNames = Object.keys(from), bundles = {};

			var readShift = async () => {
				var name;
				if (!(name = fromNames.shift())) {
					return;
				}
				var saveName = to ? to.replace(/\[name\]/g, name) : '';
				var bundler = await Bundler.readdir(basePath, params);
				bundles[name] = bundler.output(saveName);
				await readShift();
			};
			await readShift();

			return bundles;
		}
		return (await Bundler.readdir(from, params)).output(to);
	}

	/**
	 * Mounts a Bundler instance over a directory
	 * and runs the directory-reading and files-loading process.
	 *
	 * @param string		baseDir
	 * @param object		params
	 * @param number		depth
	 *
	 * @return void
	 */
	static async readdir(basePath, params, depth = 0) {
		const bundler = new Bundler(basePath, params, depth);
		// --------------------------------
		var load = async (resource, paramsCopy) => {
			var callLoader = async function(index, resource, recieved) {
				if (bundler.params.loaders && bundler.params.loaders[index]) {
					return await bundler.params.loaders[index](resource, recieved, paramsCopy, async (...args) => {
						return await callLoader(index + 1, resource, ...args);
					});
				}
				if (!recieved) {
				//if (arguments.length === 2) {
					return bundler.load(resource, params);
				}
				return recieved;
			};
			return await callLoader(0, resource);
		};
		// --------------------------------
		var resources = Fs.readdirSync(bundler.baseDir);
		var readShift = async () => {
			var resourceName;
			if (!(resourceName = resources.shift())) {
				return;
			}
			let resource = Path.join(bundler.baseDir, resourceName);
			if (Fs.statSync(resource).isDirectory()) {
				bundler.bundle.push(await Bundler.readdir(resource, bundler.params, depth + 1));
			} else {
				var paramsCopy = _merge({errors:[], info:[],}, bundler.params);
				if (bundler.params.loadStart) {
					bundler.params.loadStart(resource);
				}
				var content = await load(resource, paramsCopy);
				if (bundler.params.loadEnd) {
					bundler.params.loadEnd(resource, content, paramsCopy.errors, paramsCopy.info);
				}
				if (content) {
					bundler.bundle.push(content);
				}
			}
			await readShift();
		};
		await readShift();

		return bundler;
	}
		
	/**
	 * A Bundler instance.
	 *
	 * @param string		baseDir
	 * @param object		params
	 * @param number		depth
	 *
	 * @return void
	 */
	constructor(baseDir, params = {}, depth = 0) {
		if (!baseDir.endsWith('/')) {
			baseDir += '/';
		}
		this.baseDir = baseDir;
		this.params = params;
		this.params.templateNamespaceAttribute = this.params.templateNamespaceAttribute || 'name';
		this.params.partialNamespaceAttribute = this.params.partialNamespaceAttribute || 'partials-slot';
		this.params.assetsPublicBase = this.params.assetsPublicBase || '/';
		this.depth = depth;
		this.name = depth > 0 ? Path.basename(this.baseDir) : '';
		this.bundle = [];
	}
		
	/**
	 * Loads a file and appends it
	 * to the bundle on the specified namespace.
	 *
	 * @param string		file
	 * @param object		params
	 *
	 * @return string|function
	 */
	load(file, params) {
		var ext = Path.extname(file) || '';
		if (ext in Bundler.mime) {
			return assetsDir => {
				if (Fs.statSync(file).size < params.maxDataURLsize) {
					var url = 'data:' + Bundler.mime[ext] + ';base64,' + Fs.readFileSync(file).toString('base64');
				} else {
					var absFilename = Path.join(assetsDir || this.baseDir, Path.basename(file));
					Fs.mkdirSync(Path.dirname(absFilename), {recursive:true});
					Fs.copyFileSync(file, absFilename);
					var assetsPublicFilename = getPublicFilename(absFilename, this.depth);
					var url = params.assetsPublicBase + assetsPublicFilename;
				}
				var slotName = _beforeLast(Path.basename(file), '.');
				return `<img ${params.partialNamespaceAttribute}="${slotName}" src="${url}" />`;
			};
		} else {
			var contents = Fs.readFileSync(file).toString();
			var contentsTrimmed = contents.trim();
			if (contentsTrimmed.startsWith('<') && !contentsTrimmed.startsWith('<!') && !contentsTrimmed.startsWith('<?xml')) {
				return contentsTrimmed;
			}
		}
	}
		
	/**
	 * Stringifies the bundle
	 * and optionally saves it to a Path.
	 *
	 * @param string			outputFile
	 *
	 * @return string
	 */
	output(outputFile = null) {
		// -----------------------------------------
		var outputFileExt, outputDir, subOutputDir, src;
		if (outputFile) {
			if (!Path.isAbsolute(outputFile)) {
				outputFile = Path.resolve(this.baseDir, outputFile);
			}
			if (outputFileExt = Path.extname(outputFile)) {
				outputDir = Path.dirname(outputFile);
			} else {
				outputDir = Path.join(outputFile, this.name);
			}
		}
		// -----------------------------------------
		var t = "\t".repeat(this.depth + 1), t2 = "\t".repeat(this.depth);
		var contents = "\r\n" + t + this.bundle.map(html => {
			return _isFunction(html) ? html(outputDir) : (html instanceof Bundler ? html.output(outputDir) : html);
		}).join("\r\n\r\n" + t) + "\r\n" + t2;
		// -----------------------------------------
		if (outputFileExt) {
			Fs.mkdirSync(outputDir, {recursive:true});
			Fs.writeFileSync(outputFile, contents);
			src = getPublicFilename(outputFile, this.depth);
		}
		// -----------------------------------------
		return `<template${
				(this.name ? ' ' + this.params.templateNamespaceAttribute + '="' + this.name + '"' : '') + (src ? ' src="' + src + '"' : '')
			}>${(!src ? contents : '')}</template>`;
	}	
}

/**
 * @var object
 */
Bundler.mime = {
	'.ico': 'image/x-icon',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.svg': 'image/svg+xml',
};

/**
 * @var function
 */
const getPublicFilename = (filename, depth) => {
	return filename.replace(/\\/g, '/').split('/').slice(- (depth + 1)).join('/');
};
