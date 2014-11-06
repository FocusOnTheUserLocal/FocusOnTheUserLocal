#!/usr/bin/zsh

cd $(dirname $0)
fn=../lib_compiled.js
cat jquery.min.js > $fn
echo >> $fn
echo >> $fn
echo 'jQuery.noConflict()' >> $fn
echo >> $fn
cat mootools-yui-compressed.js >> $fn
