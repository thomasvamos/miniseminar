import * as cheerio from 'cheerio';

import { Section, convertImageSrcSet, host, sanitizeImageSrc, parseParams } from './util';

export function mermaid(section: Section): Section {
  const $ = cheerio.load(section.body);
  const mermaids = $('.mermaid');
  if (mermaids.length === 0) return section;
  mermaids.each((i, el) => {
    const mermaid = $(el);
    mermaid.css('background-color', 'white');
    mermaid.css('font-size', '18px');
  });
  section.body = $.html();
  return section;
}

export function attached(req) {
  return (section: Section): Section => {
    const $ = cheerio.load(section.body);
    const imgs = $('img');
    if (imgs.length === 0) return section;
    imgs.map((_i, el) => {
      const img = $(el);
      if (img.data('linked-resource-type') !== 'attachment') return section;
      const imageSrc = img.data('image-src');
      img.attr('src', req.baseUrl + '/image' + sanitizeImageSrc(imageSrc));
      const imageSrcSet = img.attr('srcset');
      if (imageSrcSet) {
        img.attr('srcset', convertImageSrcSet(req.baseUrl, imageSrcSet));
      }
    });
    section.body = $.html();
    return section;
  };
}

export function backgroundImage(section: Section): Section {
  const $ = cheerio.load(section.body);
  const imgs = $('img');
  imgs.map((_i, el) => {
    const img = $(el);
    const originalSize = !img.attr('height') && !img.attr('width');
    if (!originalSize) return;
    section.background = img.data('image-src');
    img.remove();
  });
  section.body = $.html();
  return section;
}

export function emoticon(req) {
  return (section: Section): Section => {
    const $ = cheerio.load(section.body);
    const imgs = $('img.emoticon');
    if (imgs.length === 0) return section;
    imgs.map((i, el) => {
      const img = $(el);
      const imageSrc = img.attr('src');
      img.attr('src', req.baseUrl + '/emoticon' + sanitizeImageSrc(imageSrc));
      img.css('border', '0px');
      img.css('height', '32px');
      img.css('margin', '5px');
      img.css('vertical-align', 'bottom');
    });
    section.body = $.html();
    return section;
  };
}

export function gliffy(req) {
  return (section: Section): Section => {
    const $ = cheerio.load(section.body);
    const imgs = $('img');
    if (imgs.length === 0) return section;
    imgs.map((i, el) => {
      const img = $(el);
      if (img.attr('class').trim() !== 'gliffy-image') return section;
      const imageSrc = img.attr('src');
      img.attr('src', req.baseUrl + '/image' + sanitizeImageSrc(imageSrc));
      const imageSrcSet = img.attr('srcset');
      if (imageSrcSet) {
        img.attr('srcset', convertImageSrcSet(req.baseUrl, imageSrcSet));
      }
    });
    section.body = $.html();
    return section;
  };
}

export function link(section: Section): Section {
  const $ = cheerio.load(section.body);
  const aList = $('a');
  if (aList.length === 0) return section;
  aList.each((i, el) => {
    if (el.attribs.href[0] === '/') {
      el.attribs.href = host + el.attribs.href;
    }
  });
  section.body = $.html();
  return section;
}

const LANGS = {
  actionscript3: 'lang-actionscript',
  'c#': 'lang-cs',
  coldfusion: 'lang-xx',
  jfx: 'lang-java',
  jscript: 'lang-js',
  text: 'lang-md',
  powershell: 'lang-powershell',
  sass: 'lang-scss'
};

function brushToLang(brush) {
  return LANGS[brush] || 'lang-' + brush;
}

function codeFor58(script) {
  let code = 'nocontent';
  try {
    code = script[0].children[0].children[0].data;
  } catch (e) {
    console.error(e);
  }
  const s = 'font-size: smaller';
  script.parent().html(`<pre><code data-trim data-noescape style="${s}">${code}</code></pre>`);
}

function codeFor59(pre) {
  const code = pre[0].children[0].data;
  const params = parseParams(pre.data('syntaxhighlighter-params'));
  const c = brushToLang(params.brush);
  const s = 'font-size: smaller';
  pre.parent().html(`<pre><code data-trim data-noescape class="${c}" style="${s}">${code}</code></pre>`)
}

export function code(section: Section): Section {
  const $ = cheerio.load(section.body, {xmlMode: true});

  // for confluence-5.8
  const script = $('.code.panel.pdl script[type=syntaxhighlighter]');
  if (script.length !== 0) {
    codeFor58(script);
    section.body = $.html();
    return section;
  }

  // for confluence-5.9
  const pre = $('.codeContent.panelContent.pdl pre');
  if (pre.length !== 0) {
    codeFor59(pre);
    section.body = $.html();
    return section;
  }
  return section;
}

export function fragmentLi($) {
  const list = $('li');
  if (list.length === 0) return;
  list.each((i, el) => {
    el = $(el);
    let text = el.text();
    if (text.includes('⏎')) {
      el.addClass('fragment');
      const children = el.children();
      if (children.length === 0) {
        text = text.replace('⏎', '');
        el.text(text);
        return;
      }
      children.each((i, child) => {
        if (child.next && child.next.data && child.next.data.includes('⏎')) {
          const text = child.next.data.replace('⏎', '');
          child.next.data = text;
        }
      });
    }
  });
}

function fragmentTags($, tagName) {
  const list = $(tagName);
  if (list.length === 0) return;
  list.each((i, el) => {
    el = $(el);
    let text = el.text();
    if (text.includes('⏎')) {
      const children = el.children();
      if (children.length === 0) {
        text = text.replace('⏎', '');
        el.text(text);
        el.addClass('fragment');
        return;
      }
      children.each((i, child) => {
        if (child.next && child.next.data && child.next.data.includes('⏎')) {
          const text = child.next.data.replace('⏎', '');
          child.next.data = text;
          $(child).addClass('fragment');
        }
      });
    }
  });
}

export function fragment(section: Section): Section {
  const $ = cheerio.load(section.body);
  fragmentLi($);
  fragmentTags($, 'p');
  section.body = $.html();
  return section;
}