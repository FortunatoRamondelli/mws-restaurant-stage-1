/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  static openDatabase () {
    // If the browser doesn't support service worker,
    // we don't care about having a database
    if (!navigator.serviceWorker) {
      console.log(`Browser doesn't support Service Workers`);
      return Promise.resolve();
    }

    return idb.open('restaurant-db', 1, function (upgradeDb) {
      const store = upgradeDb.createObjectStore('restaurants', { keyPath: 'id' });
    });
  }

  /**
   * Get a parameter by name from page URL.
   */
  static getParameterByName(name, url) {
    if (!url)
      url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
      results = regex.exec(url);
    if (!results)
      return null;
    if (!results[2])
      return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
  }

  /**
   * Fetch url.
   */
  static fetchUrl(url, callback) {
    // getAll restaurants from indexedDB:
    DBHelper.openDatabase().then(function (db) {
      if (!db) return;

      const id = DBHelper.getParameterByName('id');

      return db.transaction('restaurants')
               .objectStore('restaurants')
               .getAll(id);
    }).then(function (restaurants) {
      if (restaurants.length === 0) return;
      callback(null, restaurants);
    });

    fetch(url)
      .then (response    => {
        const messages = response.json();
      //console.log(messages);
        return messages;
    }).then (restaurants => {
        // put restaurants to indexedDB:
        DBHelper.openDatabase().then(function (db) {
          if (!db) return;
          const store = db.transaction('restaurants', 'readwrite')
                          .objectStore('restaurants');

          if (Array.isArray(restaurants) ) {
            restaurants.forEach(function (restaurant) {
              store.put(restaurant);
            });
          } else {
            store.put(restaurants);
          }
        });

        callback(null, restaurants)
    }).catch(error       => callback(`Request failed. Returned error: ${error}`, null));
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    DBHelper.fetchUrl(DBHelper.DATABASE_URL, callback);
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    DBHelper.fetchUrl(`${DBHelper.DATABASE_URL}/${id}`, callback);
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
  * @description Add suffix to filename
  * @param {string} filename - Name of file
  * @param {string} suffix - Suffix to append
  * @returns {string} filename with suffix (e.g. '1.jpg' '_small' -> 1_small.jpg)
  */
  static setSuffix(filename, suffix) {
    const index = filename.lastIndexOf(".");
    if (index === -1) {
      return filename + suffix;
    }
    else {
      return filename.substring(0, index)
           + suffix
           + filename.substring(   index);
    }
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant, suffix = '') {
    const filename = DBHelper.setSuffix((restaurant.photograph || restaurant.id) + '.jpg', suffix);
    return (`/img/${filename}`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }

}
