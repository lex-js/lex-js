mkdir -p build/{lex-js-win-x64,lex-js-win-x86}

readarray -d '' dirs < <(find build -type d -iname "lex-js-*" -print0)
IFS=$'\n'
dirs=($(sort <<<"${dirs[*]}"))

for (( i=0; i < ${#dirs[@]}; i+=1 )); do
  cp -R config "${dirs[$i]}"
done

curl -SL https://ci.appveyor.com/api/projects/limitedeternity/lex-js/artifacts/build/lex-win-x86.exe?job=Environment%3A%20APPVEYOR_BUILD_WORKER_IMAGE%3DVisual%20Studio%202015%2C%20PYTHON%3DC%3A%5CPython34%2C%20ARCH%3Dx86 -o build/lex-js-win-x86/lex-win-x86.exe
curl -SL https://ci.appveyor.com/api/projects/limitedeternity/lex-js/artifacts/build/lex-win-x64.exe?job=Environment%3A%20APPVEYOR_BUILD_WORKER_IMAGE%3DVisual%20Studio%202015%2C%20PYTHON%3DC%3A%5CPython34-x64%2C%20ARCH%3Dx64 -o build/lex-js-win-x64/lex-win-x64.exe

cd build/
for (( i=0; i < ${#dirs[@]}; i+=1 )); do
  zip -r "$(basename "${dirs[$i]}").zip" "$(basename "${dirs[$i]}")/"
  rm -rf "$(basename "${dirs[$i]}")/"
done

cd ../

zip -r -FS ./build/lex-js-basic.zip index.html public
