var fs = require('fs'),
	uglifyjs = require('uglify-js'),
	deps = require('./deps.js').deps;

exports.getFiles = function () {
	var memo = {};

	function addFiles(srcs) {
		for (var j = 0, len = srcs.length; j < len; j++) {
			memo[srcs[j]] = true;
		}
	}

	for (var i in deps) {
		addFiles(deps[i].src);
	}

	var files = [];

	for (var src in memo) {
		files.push('src/' + src);
	}

	return files;
};

exports.uglify = function (code) {
	var pro = uglifyjs.uglify;

	var ast = uglifyjs.parser.parse(code);
	ast = pro.ast_mangle(ast, {mangle: true});
	ast = pro.ast_squeeze(ast);
	ast = pro.ast_squeeze_more(ast);

	return pro.gen_code(ast) + ';';
};

exports.combineFiles = function (files) {
	var content = '(function () {\n\n';
	for (var i = 0, len = files.length; i < len; i++) {
		content += fs.readFileSync(files[i], 'utf8') + '\n\n';
	}
	return content + '\n\n}());';
};

exports.save = function (savePath, compressed) {
	return fs.writeFileSync(savePath, compressed, 'utf8');
};

exports.load = function (loadPath) {
	try {
		return fs.readFileSync(loadPath, 'utf8');
	} catch (e) {
		return null;
	}
};

exports.getSizeDelta = function (newContent, oldContent) {
	if (!oldContent) {
		return 'new';
	}
	var delta = newContent.length - oldContent.length;
	return (delta >= 0 ? '+' : '') + delta;
};