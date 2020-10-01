
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
        var markdown = new Showdown.Converter({metadata: true});
        if (params['md-flavor']) {
            markdown.setFlavor(params['md-flavor']);
        }
        try {
            var html = markdown.makeHtml(Fs.readFileSync(resource).toString());
            var meta = markdown.getMetadata();
            //console.log(meta);
            var slotName = _beforeLast(Path.basename(resource), '.').toLowerCase();
            var t = "\t".repeat(params.indentation + 2), t2 = "\t".repeat(params.indentation + 1);
            var content = `\r\n\r\n` + t + html + `\r\n\r\n` + t2;
            if (params.partialNamespaceAttribute) {
                return `<div ${params.partialNamespaceAttribute}="${slotName}">${content}</div>`;
            }
            return `<div>${content}</div>`;
        } catch(e) {
            params.errors.push(e);
        }
    }
    // Or let the flow continue
    return next(recieved);
};