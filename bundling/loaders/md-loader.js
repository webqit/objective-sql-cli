
/**
 * @imports
 */
import Fs from 'fs';
import Path from 'path';
import Showdown from 'showdown';
import ShowdownHighlight from 'showdown-highlight';
import _beforeLast from '@onephrase/util/str/beforeLast.js';

export default function(resource, recieved, params, next) {
    // Catch .md files
    if (!recieved && resource.endsWith('.md')) {
        var showdownParams = {metadata: true};
        if (params['MD-LOADER:CODE_HIGHLIGHTING']) {
            showdownParams.extensions = [ShowdownHighlight];
        }
        var markdown = new Showdown.Converter(showdownParams);
        if (params['MD-LOADER:FLAVOR']) {
            markdown.setFlavor(params['MD-LOADER:FLAVOR']);
        }
        try {
            var html = markdown.makeHtml(Fs.readFileSync(resource).toString());
            var meta = markdown.getMetadata();
            //console.log(meta);
            var slotName = _beforeLast(Path.basename(resource), '.').toLowerCase();
            var t = "\t".repeat(params.indentation + 2), t2 = "\t".repeat(params.indentation + 1);
            var content = `\r\n\r\n` + t + html + `\r\n\r\n` + t2;
            if (params.PARTIALS_NAMESPACE_ATTR) {
                return `<div ${params.PARTIALS_NAMESPACE_ATTR}="${slotName}">${content}</div>`;
            }
            return `<div>${content}</div>`;
        } catch(e) {
            params.errors.push(e);
        }
    }
    // Or let the flow continue
    return next(recieved);
};