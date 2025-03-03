
import MarkdownIt from 'markdown-it';
import markdownItContainer from 'markdown-it-container';
import markdownItAttrs from 'markdown-it-attrs';
import xss from 'xss';
import markdownItHtml5Embed from 'markdown-it-html5-embed';

// Create a new instance of markdown-it
const md = new MarkdownIt({
    html: true,
    linkify: true,
});

// Get the default renderer
const defaultRender = md.renderer.rules.html_block || ((tokens, idx, options, env, self) => {
    return self.renderToken(tokens, idx, options);
});

// Override the renderer for HTML blocks
md.renderer.rules.html_block = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    if (token.content.includes('<img')) {
        // Custom processing for <img> tags
        // This is a very basic example, it should be improved for production use
        token.content = token.content.replace(/<img(.*?)>/g, (match, p1) => {
            // Keep the entire <img> tag but ensure it's a valid HTML
            // You might want to add additional checks or sanitizations here
            return `<img ${p1}>`;
        });
    }
    return defaultRender(tokens, idx, options, env, self);
};


md.use(markdownItHtml5Embed, { 
    html5embed: { 
        useImageSyntax: true,
        useLinkSyntax: true 
    } 
});


const allowList = {...xss.whiteList, 'iframe': ['src','width','height','frameborder','allow','allowfullscreen','style','class']};
for(let el in allowList) {allowList[el].push('class','style');}
const xssOpts = {
    allowList,
}


// md.use(markdownItAttrs, {
//     // This is where you can define your custom rules
//     allowedAttributes: [] 
// });


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
        return xss(md.render(input),xssOpts) //xss might not be necessary. only the site owner can edit the content
        // return md.render(input);
    },
    md
};