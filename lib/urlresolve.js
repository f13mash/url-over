module.exports.parseFromURL = parseFromURL;
module.exports.parseFromHTML = parseFromHTML;

var request = require('request');
var cheerio = require('cheerio');

var default_ns = ["http://ogp.me/ns#", "http://opengraphprotocol.org/schema/"];

var ret = {
    'og': {},
    'extra': {}
};

function parseFromURL(url, cb, xmlns) {
    if(!xmlns)
        xmlns = default_ns;
    else
        if(!Array.isArray(xmlns))
            xmlns = [xmlns];
    request(url, function (err, res, html) {
        if (!err && res.statusCode == 200) {
            parseFromHTML(html, xmlns);
            cb(null, ret);
        }
        else {
            cb(err, null);
        }
    });
}

function parseFromHTML(html, xmlns) {
    if(!xmlns)
        xmlns = default_ns;
    else
        if(!Array.isArray(xmlns))
            xmlns = [xmlns];

    $ = cheerio.load(html);
    parseOGData($, xmlns);

    return ret;

}

function parseOGData($, xmlns) {
    var ogns;

    for(var key in xmlns){
        var attr = $("html").attr();
        var ns = xmlns[key];
        for(var key in attr){
            if(attr[key].indexOf(xmlns) != -1)
                ogns = key.split(':')[1];
        }

        if(!ogns) {
            var prefix = $("head").attr("prefix");
            prefix = prefix.trim().replace(/\s{2,}/g, ' ');
            var escns = escapeRegExp(ns);
            var pattern = new RegExp('(\\w)+:\\s'+escns+'', 'g');
            ogns = prefix.match(pattern)[0].replace(ns, '').split(':')[0];
            ogns += ':';
        }
        if(ogns)
            break;
    }

    if(ogns) {
        $("meta").each(function(index, element){
            element = $(element);
            if(element.attr('property') && element.attr('property').trim().indexOf(ogns) == 0 && element.attr('content')){
                var key = element.attr('property').trim().replace(ogns, '');
                if(!ret['og'][key])
                    ret['og'][key] = [];
                ret['og'][key].push(element.attr('content'));
            }
        });
    }
};

function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}