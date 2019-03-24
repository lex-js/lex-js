mkdir -p build/{lexdist-win-x64,lexdist-win-x86,lexdist-linux-x64,lexdist-linux-x86,lexdist-macos-x64}

readarray -d '' dirs < <(find build -type d -iname "lexdist-*" -print0)
IFS=$'\n'
dirs=($(sort <<<"${dirs[*]}"))

for (( i=0; i < ${#dirs[@]}; i+=1 )); do
  cp -R config "${dirs[$i]}"
done

curl -SL https://ci.appveyor.com/api/projects/limitedeternity/lex-js/artifacts/build/lex-win-x86.exe?job=Environment%3A%20APPVEYOR_BUILD_WORKER_IMAGE%3DVisual%20Studio%202015%2C%20PYTHON%3DC%3A%5CPython34%2C%20ARCH%3Dx86 -o build/lexdist-win-x86/lex-win-x86.exe
curl -SL https://ci.appveyor.com/api/projects/limitedeternity/lex-js/artifacts/build/lex-win-x64.exe?job=Environment%3A%20APPVEYOR_BUILD_WORKER_IMAGE%3DVisual%20Studio%202015%2C%20PYTHON%3DC%3A%5CPython34-x64%2C%20ARCH%3Dx64 -o build/lexdist-win-x64/lex-win-x64.exe
curl -SL https://ci.appveyor.com/api/projects/limitedeternity/lex-js/artifacts/build/lex-linux-x64?job=Environment%3A%20APPVEYOR_BUILD_WORKER_IMAGE%3DUbuntu1804 -o build/lexdist-linux-x64/lex-linux-x64
curl -SL https://ci.appveyor.com/api/projects/limitedeternity/lex-js/artifacts/build/lex-linux-x86?job=Environment%3A%20APPVEYOR_BUILD_WORKER_IMAGE%3DUbuntu1804 -o build/lexdist-linux-x86/lex-linux-x86
curl -SL https://ci.appveyor.com/api/projects/limitedeternity/lex-js/artifacts/build/lex-macos-x64?job=Environment%3A%20APPVEYOR_BUILD_WORKER_IMAGE%3DUbuntu1804 -o build/lexdist-macos-x64/lex-macos-x64

echo build/lexdist-linux-x64/xdg-open build/lexdist-linux-x86/xdg-open | xargs -n 1 curl -sSL https://github.com/sindresorhus/opn/raw/master/xdg-open -o $1
echo build/lexdist-linux-x64/xdg-open build/lexdist-linux-x86/xdg-open | xargs -n 1 chmod +x $1
echo build/lexdist-linux-x64/lex-linux-x64 build/lexdist-linux-x86/lex-linux-x86 build/lexdist-macos-x64/lex-macos-x64 | xargs -n 1 chmod +x $1

cd build/
for (( i=0; i < ${#dirs[@]}; i+=1 )); do
  zip -r "$(basename "${dirs[$i]}").zip" "$(basename "${dirs[$i]}")/"
  rm -rf "$(basename "${dirs[$i]}")/"
done

cd ../
