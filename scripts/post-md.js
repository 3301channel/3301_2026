'use strict';

/**
 * 把每篇文章的 markdown 源文件输出到 public/md/ 目录，
 * 供文章末尾的「下载 Markdown」链接使用。
 */
hexo.extend.generator.register('post-md', function (locals) {
    const fs = require('hexo-fs');

    return locals.posts.map(function (post) {
        const src = post.full_source;      // 源文件绝对路径
        const name = post.slug + '.md';    // 以 slug 命名，避免特殊字符
        return {
            path: 'md/' + name,
            data: function () {
                return fs.createReadStream(src);
            }
        };
    });
});
