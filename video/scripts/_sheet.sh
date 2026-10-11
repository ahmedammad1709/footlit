#!/bin/bash
# usage: _sheet.sh out.png cols t1 t2 ...   (times as given to --preview)
out=$1; cols=$2; shift 2
files=()
for t in "$@"; do files+=("out/preview/t${t//./_}.png"); done
node scripts/sheet.mjs "$out" "$cols" "${files[@]}"
