with import <nixpkgs> {};

stdenv.mkDerivation {
  name = "lex-js-env";
  buildInputs = [
    chromium
    nodejs-10_x
    (python34.withPackages (ps: with ps; [bottle]))
  ];
  shellHook = ''
    export PUPPETEER_EXECUTABLE_PATH=${chromium}/bin/chromium
    npm install
  '';
}
