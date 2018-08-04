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
    return `http://localhost:${port}/`;
  }

  static openDatabase () {
    // If the browser doesn't support service worker,
    // we don't care about having a database
    if (!navigator.serviceWorker) {
      console.log(`Browser doesn't support Service Workers`);
      return Promise.resolve();
    }

    return idb.open('restaurant-db', 2, function (upgradeDb) {
      switch (upgradeDb.oldVersion) {
        case 0:
          const restaurantsStore = upgradeDb.createObjectStore('restaurants', { keyPath: 'id' });
        case 1:
          const reviewsStore     = upgradeDb.createObjectStore('reviews',     { keyPath: 'id' });
          reviewsStore.createIndex('by-restaurant', 'restaurant_id');
      }
    });
  }

  static fetchRestaurantsAndPutOnDb() {
    return fetch(`${DBHelper.DATABASE_URL}restaurants`)
      .then(response    => response.json())
      .then(restaurants => {
        // put restaurants to indexedDB:
        return this.openDatabase().then(db => {
          if (!db) return;

          const restaurantsStore = db.transaction('restaurants', 'readwrite')
                                     .objectStore('restaurants');

          restaurants.forEach(restaurant => restaurantsStore.put(restaurant));

          return tx.complete.then(() => Promise.resolve(restaurants));
        });
      });
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants() {
    return this.openDatabase().then(db => {
      if (!db) return;

      return db.transaction('restaurants')
               .objectStore('restaurants')
               .getAll();
    }).then(restaurants => {
      if (restaurants.length === 0) {
        return this.fetchRestaurantsAndPutOnDb();
      }
      return Promise.resolve(restaurants);
    });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id) {
    return DBHelper.fetchRestaurants().then(restaurants => restaurants.find  (r => r.id           === id));
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine) {
    return DBHelper.fetchRestaurants().then(restaurants => restaurants.filter(r => r.cuisine_type === cuisine));
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood) {
    return DBHelper.fetchRestaurants().then(restaurants => restaurants.filter(r => r.neighborhood === neighborhood));
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood) {
    return DBHelper.fetchRestaurants().then(restaurants => {
      let results = restaurants
      if (cuisine != 'all') { // filter by cuisine
        results = results.filter(r => r.cuisine_type == cuisine);
      }
      if (neighborhood != 'all') { // filter by neighborhood
        results = results.filter(r => r.neighborhood == neighborhood);
      }
      return results;
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods() {
    // Fetch all restaurants
    return DBHelper.fetchRestaurants().then(restaurants => {
      // Get all neighborhoods from all restaurants
      const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
      // Remove duplicates from neighborhoods
      const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
      return uniqueNeighborhoods;
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    return DBHelper.fetchRestaurants().then(restaurants => {
     // Get all cuisines from all restaurants
      const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
      // Remove duplicates from cuisines
      const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
      return uniqueCuisines;
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
  * @returns {string} filename with suffix (e.g. '1.webp' '_small' -> 1_small.webp)
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
    const filename = DBHelper.setSuffix((restaurant.photograph || restaurant.id) + '.webp', suffix);
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

  static toggleFavorite(id, favorite) {
    fetch(`${DBHelper.DATABASE_URL}restaurants/${id}/?is_favorite=${favorite}`, {
        method: 'PUT'
      }).then(() => {
        this.openDatabase().then(db => {
          if (!db) return;

          const restaurantsStore = db.transaction('restaurants', 'readwrite')
                                     .objectStore('restaurants');
          restaurantsStore.get(id).then(restaurant => {
            restaurant.is_favorite = favorite;
            restaurantsStore.put(restaurant);
          });
        })
    })
  }

  static fetchReviews(restaurant_id) {
    return fetch(`${DBHelper.DATABASE_URL}reviews/?restaurant_id=${restaurant_id}`)
      .then(response => response.json())
      .then(reviews => {
        // put reviews to indexedDB:
        return this.openDatabase().then(db => {
          if (!db) return;

          const reviewsStore = db.transaction('reviews', 'readwrite')
                                 .objectStore('reviews');

          reviews.forEach(review => reviewsStore.put(review));

          return Promise.resolve(reviews);
        });
      })
      .catch(error => {
        return DBHelper.getStoredReviews('reviews', 'by-restaurant', restaurant_id)
          .then(storedReviews => Promise.resolve(storedReviews))
      });
  }

  static getStoredReviews(reviews, index, restaurant_id) {
    return this.openDatabase().then(db => {
      if (!db) return;

      const reviewsStore = db.transaction(reviews)
                             .objectStore(reviews);

      const reviewsIndex = reviewsStore.index(index);
      return reviewsIndex.getAll(restaurant_id);
    });
  }

  static addReview(review) {
    if (!navigator.onLine) {
      DBHelper.offline(review);
      return;
    }

    // POST Endpoints to create a new restaurant review, see: https://github.com/udacity/mws-restaurant-stage-3
    fetch(`http://localhost:1337/reviews`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(review)
    }).then (response => response.json()
     ).catch(error    => console.log('error:', error));
  }

  static offline(review) {
    // notify the user that are not connected:
    alert("You're connection is offline ...");
    localStorage.setItem('review', JSON.stringify(review));

    // determine when the connection is available again:
    window.addEventListener('online', event => {
      const data = JSON.parse(localStorage.getItem('review'));
      DBHelper.addReview(review);
      localStorage.removeItem('review');
    });
  }

}
