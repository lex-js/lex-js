const App = require('./app');
const attachFastClick = require('fastclick');

try {
  // remove 300ms delay for 'click' events in mobile browsers
  attachFastClick(document.body);
} catch (e) {
  console.log(e);
}

const init = () => {
  const app = window.app = new App();
  app.init();
};

if (document.readyState === "interactive" || document.readyState === "complete") {
  init();
} else {
  document.addEventListener("DOMContentLoaded", init);
}
