const libraryName = 'Leaflet.Draw';
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const webpack = require('webpack');
const path = require('path');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const SpritesmithPlugin = require('webpack-spritesmith');

const extractLess = new ExtractTextPlugin({
    filename: '[name].css'
});

const config = {
    entry: {
        'Leaflet.draw': __dirname + '/src/Leaflet.Draw.js',
        'Leaflet.draw.min': __dirname + '/src/Leaflet.Draw.js',
    },
    devtool: 'source-map',
    target: 'web',
    externals: {
        leaflet: 'L',
        'leaflet-editable': 'leaflet-editable'
    },
    output: {
        path: __dirname + '/dist',
        filename: '[name].js',
        library: libraryName,
        libraryTarget: 'umd',
        umdNamedDefine: true
    },
    module: {
        rules: [{
            test: /(\.jsx|\.js)$/,
            use: [
                {loader: 'babel-loader'},
                {loader: 'eslint-loader'}
            ],
            exclude: /(node_modules|bower_components)/
        }, {
            test: /\.less/,
            use: extractLess.extract({
                use: [
                    {loader: 'css-loader'},
                    {loader: 'less-loader'}
                ],
                fallback: 'style-loader'
            })
        }, {
            test: /\.(gif|png|jpg|jpeg|svg)($|\?)/,
            use: {
                loader: 'url-loader',
                options: {
                    limit: 200,
                    name: 'images/[name].[ext]'
                }
            }
        }]
    },
    plugins: [
        extractLess,
        new UglifyJSPlugin({
            include: /\.min\.js$/
        }),
        new SpritesmithPlugin({
            src: {
                cwd: path.resolve(__dirname, 'src/images'),
                glob: '*.png'
            },
            target: {
                image: path.resolve(__dirname, 'src/styles/draw-sprite.png'),
                css: path.resolve(__dirname, 'src/styles/sprite.less')
            },
            spritesmithOptions: {
                algorithm: 'top-down'
            },
            apiOptions: {
                cssImageRef: './sprite.png'
            },
            retina: '@2x'
        })
    ]
};

module.exports = config;
