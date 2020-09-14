
/**
 * @imports
 */
import Fs from 'fs';
import Path from 'path';
import Showdown from 'showdown';
import _beforeLast from '@onephrase/util/str/beforeLast.js';

export default function(resource, recieved, params, next) {
    // Catch .md files
    if (!recieved && resource.endsWith('.md')) {
        var markdown = new Showdown.Converter();
        try {
            var html = markdown.makeHtml(Fs.readFileSync(resource).toString());
            var slotName = _beforeLast(Path.basename(resource), '.');
            return `<div ${params.partialNamespaceAttribute}="${slotName}">\r\n${html}\r\n</div>`;
        } catch(e) {
            params.errors.push(e);
        }
    }
    // Or let the flow continue
    return next(recieved);
};