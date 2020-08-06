
/**
 * @imports
 */
import Fs from 'fs';
import Path from 'path';
import _each from '@web-native-js/commons/obj/each.js';
import _isObject from '@web-native-js/commons/js/isObject.js';
import _isFunction from '@web-native-js/commons/js/isFunction.js';
import _afterLast from '@web-native-js/commons/str/afterLast.js';

/**
 * ---------------------------
 * The Bundler class
 * ---------------------------
 */
export default class Bundler {
		
	/**
	 * Mounts a Bundler instance over a directory
	 * and runs the bundling process.
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
		this.params.assetsPublicBase = this.params.assetsPublicBase || '/';
		this.depth = depth;
		this.name = depth > 0 ? Path.basename(this.baseDir) : '';
		this.bundle = [];
		Fs.readdirSync(this.baseDir).forEach(name => {
			let resource = Path.join(this.baseDir, name);
			if (Fs.statSync(resource).isDirectory()) {
				this.bundle.push(new Bundler(resource, params, depth + 1));
			} else {
				var ext = Path.extname(resource) || '';
				this.bundle.push(this.params.loader ? this.params.loader(resource, ext) : this.load(resource, ext));
			}
		});
	}
		
	/**
	 * Loads a file and appends it
	 * to the bundle on the specified namespace.
	 *
	 * @param string		file
	 * @param string		ext
	 *
	 * @return string|function
	 */
	load(file, ext) {
		if (ext in Bundler.mime) {
			return assetsDir => {
				if (Fs.statSync(file).size < this.params.maxDataURLsize) {
					var url = 'data:' + Bundler.mime[ext] + ';base64,' + Fs.readFileSync(file).toString('base64');
				} else {
					var absFilename = Path.join(assetsDir || this.baseDir, Path.basename(file));
					Fs.mkdirSync(Path.dirname(absFilename), {recursive:true});
					Fs.copyFileSync(file, absFilename);
					var assetsPublicFilename = getPublicFilename(absFilename, this.depth);
					var url = this.params.assetsPublicBase + assetsPublicFilename;
				}
				return "<img src=\"" + url + "\" />";
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
		return '<template' 
			+ (this.name ? ' name="' + this.name + '"' : '') + '' + (src ? ' src="' + src + '"' : '') + '>' 
			+ (!src ? contents : '')
			+ '</template>';
	}	
		
	/**
	 * Bundles and saves (multiple).
	 *
	 * @param string|object	from
	 * @param string		to
	 * @param object		params
	 *
	 * @return string|object
	 */
	static bundle(from, to = null, params = {}) {
		if (_isObject(from)) {
			var bundles = {};
			_each(from, (name, basePath) => {
				var saveName = to ? to.replace(/\[name\]/g, name) : '';
				bundles[name] = (new Bundler(basePath, params)).output(saveName);
			});
			return bundles;
		}
		return (new Bundler(from, params)).output(to);
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
