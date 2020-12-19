
/**
 * @imports
 */
import Fs from 'fs';
import Path from 'path';
import _each from '@webqit/util/obj/each.js';
import _merge from '@webqit/util/obj/merge.js'
import _isObject from '@webqit/util/js/isObject.js';
import _isNumeric from '@webqit/util/js/isNumeric.js';
import _isFunction from '@webqit/util/js/isFunction.js';
import _beforeLast from '@webqit/util/str/beforeLast.js';
import _before from '@webqit/util/str/before.js';
import _after from '@webqit/util/str/after.js';
import _preceding from '@webqit/util/arr/preceding.js';
import _following from '@webqit/util/arr/following.js';
import Lexer from '@webqit/util/str/Lexer.js';

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
	 *
	 * @return void
	 */
	static async readdir(basePath, params) {
		const bundler = new Bundler(basePath, params);
		// --------------------------------
		var load = async (resource, paramsCopy) => {
			var callLoader = async function(index, resource, recieved) {
				if (bundler.params.LOADERS && bundler.params.LOADERS[index]) {
					return await bundler.params.LOADERS[index](resource, recieved, paramsCopy, async (...args) => {
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
				if (!(bundler.params.IGNORE_FOLDERS_BY_PREFIX || []).filter(prfx => resourceName.substr(0, prfx.length) === prfx).length) {
					var _params = {...bundler.params};
					_params.indentation ++;
					// -------------------
					var subBundler = await Bundler.readdir(resource, _params);
					// -------------------
					bundler.outline[subBundler.displayName] = subBundler.outline;
					// -------------------
					bundler.bundle.push(subBundler);
				}
			} else {
				var paramsCopy = _merge({errors:[], info:[],}, bundler.params);
				if (!bundler.params.loadStart || bundler.params.loadStart(resource) !== false) {
					var content = await load(resource, paramsCopy);
					if (bundler.params.loadEnd) {
						bundler.params.loadEnd(resource, content, paramsCopy.errors, paramsCopy.info);
					}
					if (content) {
						bundler.bundle.push(content);
					}
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
	 *
	 * @return void
	 */
	constructor(baseDir, params = {}) {
		if (!baseDir.endsWith('/')) {
			baseDir += '/';
		}
		this.baseDir = baseDir;
		this.params = params;
		this.params.ASSETS_PUBLIC_BASE = this.params.ASSETS_PUBLIC_BASE || '/';
		this.params.indentation = this.params.indentation || 0;
		// ----------------------------------------
		const divideByComment = tag => {
			var _comment = '', _tag;
			if (tag.startsWith('<!--')) {
				_comment = _before(tag, '-->') + '-->';
				_tag = _after(tag, '-->');
			} else {
				_tag = tag;
			}
			// Shift whitespace too
			_comment += _before(_tag, '<');
			tag = '<' + _after(_tag, '<');
			return [_comment, _tag];
		};
		// ----------------------------------------
		this.params.getAttributeDefinition = (tag, attributeName) => {
			var [ comment, tag ] = divideByComment(tag);
			// --------------
			var regexes = [' ' + attributeName + '([ ]+)?=([ ]+)?"([^"])+"', " " + attributeName + "([ ]+)?=([ ]+)?'([^'])+'"];
			return regexes.reduce((result, regex) => {
				return result || Lexer.match(tag, regex, {stopChars: '>', useRegex:'i', blocks:[]})[0];
			}, '');
		};
		this.params.defineAttribute = (tag, attributeName, attributeValue) => {
			var [ comment, tag ] = divideByComment(tag);
			// --------------
			var parts = Lexer.split(tag, '>', {limit: 1, blocks:[]});
			return comment + parts[0] + ' ' + attributeName + '="' + attributeValue + '">' + parts[1];
		};
		// ----------------------------------------
		this.name = this.params.indentation > 0 ? Path.basename(this.baseDir) : '';
		this.displayName = !this.params.SHOW_OUTLINE_NUMBERING && _isNumeric(_before(this.name, '-')) ? _after(this.name, '-') : this.name;
		// -----------------------------------------
		this.outline = {};
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
		var slotName = _beforeLast(Path.basename(file), '.').toLowerCase();
		if (ext in Bundler.mime) {
			return assetsDir => {
				if (Fs.statSync(file).size < params.MAX_DATA_URL_SIZE) {
					var url = 'data:' + Bundler.mime[ext] + ';base64,' + Fs.readFileSync(file).toString('base64');
				} else {
					var absFilename = Path.join(assetsDir || this.baseDir, Path.basename(file));
					Fs.mkdirSync(Path.dirname(absFilename), {recursive:true});
					Fs.copyFileSync(file, absFilename);
					var assetsPublicFilename = getPublicFilename(absFilename, params.indentation);
					var url = params.ASSETS_PUBLIC_BASE + assetsPublicFilename;
				}
				if (params.EXPORT_ID_ATTR) {
					return `<img ${params.EXPORT_ID_ATTR}="${slotName}" src="${url}" />`;
				}
				return `<img src="${url}" />`;
			};
		} else {
			var contents = Fs.readFileSync(file).toString();
			var contentsTrimmed = contents.trim();
			if (contentsTrimmed.startsWith('<') && !contentsTrimmed.startsWith('<!DOCTYPE') && !contentsTrimmed.startsWith('<?xml')) {
				if (params.EXPORT_ID_ATTR && !params.getAttributeDefinition(contentsTrimmed, params.EXPORT_ID_ATTR)) {
					return params.defineAttribute(contentsTrimmed, params.EXPORT_ID_ATTR, slotName);
				}
				return contentsTrimmed;
			}
		}
	}
		
	/**
	 * Stringifies the bundle
	 * and optionally saves it to a Path.
	 *
	 * @param string			outputFile
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
		var subBundles = Object.keys(this.outline);
		var totalSubBundles = subBundles.length;
		var t = "\t".repeat(this.params.indentation + 1), t2 = "\t".repeat(this.params.indentation);
		var contents = "\r\n" + t + this.bundle.map(html => {
			if (html instanceof Bundler) {
				var templateHTML = html.output(outputDir);
				if (this.params.CREATE_OUTLINE_FILE) {
					templateHTML = this.params.defineAttribute(templateHTML, 'prev', _preceding(subBundles, html.displayName) || '');
					templateHTML = this.params.defineAttribute(templateHTML, 'index', (subBundles.indexOf(html.displayName) + 1) + '/' + totalSubBundles);
					templateHTML = this.params.defineAttribute(templateHTML, 'next', _following(subBundles, html.displayName) || '');
				}
				return templateHTML;
			}
			return _isFunction(html) ? html(outputDir) : html;
		}).join("\r\n\r\n" + t) + "\r\n" + t2;
		if (this.outlineHTML) {
			contents += "\r\n" + t + this.outlineHTML + "\r\n" + t2;
		}
		// -----------------------------------------
		if (outputFileExt) {
			Fs.mkdirSync(outputDir, {recursive:true});
			Fs.writeFileSync(outputFile, contents);
			if (this.params.CREATE_OUTLINE_FILE) {
				var outlineFile = _beforeLast(outputFile, '.') + '.json';
				var outline = {outline: this.outline};
				if (Fs.existsSync(outlineFile) && this.params.CREATE_OUTLINE_FILE === 'create_merge') {
					outline = _merge(6, {}, JSON.parse(Fs.readFileSync(outlineFile)), outline);
				}
				Fs.writeFileSync(outlineFile, JSON.stringify(outline, null, 4));
			}
			src = getPublicFilename(outputFile, this.params.indentation);
		}
		// -----------------------------------------
		return `<template${
				(this.name ? ' ' + this.params.TEMPLATE_NAME_ATTR + '="' + this.displayName + '"' : '') + (src ? ' src="' + src + '"' : '')
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
const getPublicFilename = (filename, indentation) => {
	return filename.replace(/\\/g, '/').split('/').slice(- (indentation + 1)).join('/');
};
