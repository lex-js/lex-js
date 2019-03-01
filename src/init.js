const App = require('./app');
const attachFastClick = require('fastclick');

try {
  // remove 300ms delay for 'click' events in mobile browsers
  attachFastClick(document.body);
} catch (e) {
  console.log(e);
}


document.addEventListener("DOMContentLoaded", () => {
  const app = window.app = new App();
  app.init();
});
