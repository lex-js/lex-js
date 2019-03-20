mkdir -p build/{lexdist-win-x64,lexdist-win-x86,lexdist-linux-x64,lexdist-linux-x86,lexdist-macos-x64}

readarray -d '' dirs < <(find build -type d -iname "lexdist-*" -print0)
IFS=$'\n'
dirs=($(sort <<<"${dirs[*]}"))

for f in `find files -type f`; do
  mv "$f" `echo "$f" | tr '[:upper:]' '[:lower:]'`
done

for (( i=0; i < ${#dirs[@]}; i+=1 )); do
  cp -R files "${dirs[$i]}"
done

curl -SL https://ci.appveyor.com/api/projects/limitedeternity/lex-js/artifacts/build/lex-win-x86.exe -o build/lexdist-win-x86/lex-win-x86.exe
curl -SL https://ci.appveyor.com/api/projects/limitedeternity/lex-js/artifacts/build/lex-win-x64.exe -o build/lexdist-win-x64/lex-win-x64.exe
curl -SL https://ci.appveyor.com/api/projects/limitedeternity/lex-js/artifacts/build/lex-linux-x64 -o build/lexdist-linux-x64/lex-linux-x64
curl -SL https://ci.appveyor.com/api/projects/limitedeternity/lex-js/artifacts/build/lex-linux-x86 -o build/lexdist-linux-x86/lex-linux-x86
curl -SL https://ci.appveyor.com/api/projects/limitedeternity/lex-js/artifacts/build/lex-macos-x64 -o build/lexdist-macos-x64/lex-macos-x64

echo build/lexdist-linux-x64/xdg-open build/lexdist-linux-x86/xdg-open | xargs -n 1 curl -sSL https://github.com/sindresorhus/opn/raw/master/xdg-open -o $1

cd build/
for (( i=0; i < ${#dirs[@]}; i+=1 )); do
  zip -r "$(basename "${dirs[$i]}").zip" "$(basename "${dirs[$i]}")/"
  rm -rf "$(basename "${dirs[$i]}")/"
done

cd ../
