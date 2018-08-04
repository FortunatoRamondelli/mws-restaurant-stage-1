// Check that service workers are registered
if('serviceWorker' in navigator) {
  // Use the window load event to keep the page load performant
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').then(function(registration) {
      console.log("Service Worker registration worked: ", registration);
    }).catch(function(error) {
      console.error("Service Worker registration failed: ", error);
    });
  });
}
