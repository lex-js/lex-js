mkdir -p build/{lexdist-linux-x64,lexdist-linux-x86,lexdist-macos-x64}

readarray -d '' dirs < <(find build -type d -iname "lexdist-*" -print0)
IFS=$'\n'
dirs=($(sort <<<"${dirs[*]}"))

readarray -d '' bins < <(find build -type f -iname "lex-*" -print0)
IFS=$'\n'
bins=($(sort <<<"${bins[*]}"))

for f in `find files -type f`; do
  mv "$f" `echo "$f" | tr '[:upper:]' '[:lower:]'`
done

for (( i=0; i < ${#dirs[@]}; i+=1 )); do
  mv "${bins[$i]}" "${dirs[$i]}"
  cp -R files "${dirs[$i]}"
done

echo build/lexdist-linux-x64/ build/lexdist-linux-x86/ | xargs -n 1 cp node_modules/opn/xdg-open $1

cd build/
for (( i=0; i < ${#dirs[@]}; i+=1 )); do
  zip -r "$(basename "${dirs[$i]}").zip" "$(basename "${dirs[$i]}")/"
  rm -rf "$(basename "${dirs[$i]}")/"
done

cd ../
