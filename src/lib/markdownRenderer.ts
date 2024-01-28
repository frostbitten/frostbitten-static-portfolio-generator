
import MarkdownIt from 'markdown-it';
import markdownItContainer from 'markdown-it-container';
import xss from 'xss';

// Create a new instance of markdown-it
const md = new MarkdownIt({
    html: true,
    linkify: true,
});

// Use the markdown-it-container extension for custom tags
md.use(markdownItContainer, 'customtag', {
    render: function (tokens, idx) {
        var m = tokens[idx].info.trim().match(/^customtag\s*(.*)$/);

        if (tokens[idx].nesting === 1) {
            // opening tag
            return '<div>' + md.utils.escapeHtml(m[1]);

        } else {
            // closing tag
            return '</div>\n';
        }
    }
});

export default {
    render:(input)=>{
        return xss(md.render(input))
    },
    md
};