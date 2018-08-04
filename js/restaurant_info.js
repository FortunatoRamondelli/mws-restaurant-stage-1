let restaurant;
var map;
let id;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL().then(restaurant => {
    self.map = new google.maps.Map(document.getElementById('map'), {
      zoom: 16,
      center: restaurant.latlng,
      scrollwheel: false
    });
    fillBreadcrumb();
    DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
  }).catch(error => console.error(error));
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = () => {
  self.id = parseInt(getParameterByName('id'));
  if (self.restaurant) { // restaurant already fetched!
    return Promise.resolve(self.restaurant);
  }
  if (!self.id) { // no id found in URL
    return Promise.reject('No restaurant id in URL')
  } else {
    return DBHelper.fetchRestaurantById(self.id).then(restaurant => {
      if (!restaurant) {
        return Promise.reject(`Restaurant with ID ${self.id} was not found`);
      }
      self.restaurant = restaurant;
      fillRestaurantHTML();
      return restaurant;
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const source_large = document.getElementById('restaurant-img-large');
  source_large.media = '(min-width: 800px)';
  source_large.srcset = DBHelper.imageUrlForRestaurant(restaurant);

  const source_medium = document.getElementById('restaurant-img-medium');
  source_medium.media = '(min-width: 500px)';
  source_medium.srcset = DBHelper.imageUrlForRestaurant(restaurant, '_medium');

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img';
  image.alt = `${restaurant.name} Restaurant`;
  image.title = restaurant.name;
  image.src = DBHelper.imageUrlForRestaurant(restaurant, '_small');

  const figcaption = document.getElementById('restaurant-img-figcaption');
  figcaption.innerHTML = restaurant.name;

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  DBHelper.fetchReviews(restaurant.id).then(reviews => fillReviewsHTML(reviews));
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.id = 'zero-reviews';
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.reverse().forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li      = document.createElement('li');
  const article = document.createElement('article');
  const aside   = document.createElement('aside');

  const name = document.createElement('p');
  name.innerHTML = review.name;
  name.className = 'review review-name';
  aside.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = new Date(review.createdAt).toLocaleString();
  date.className = 'review review-date';
  aside.appendChild(date);
  article.appendChild(aside);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  rating.className = 'review review-rating';
  article.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  comments.className = 'review review-comments';
  article.appendChild(comments);

  li.appendChild(article);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
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

addReview = () => {
    event.preventDefault(); // prevent the default action associated with the event from happening

    const name     =          document.getElementById('name'                  ).value ;
    const rating   = parseInt(document.querySelector ('#rating option:checked').value);
    const comments =          document.getElementById('comments'              ).value ;

    const review = {
      restaurant_id: self.id,
      name,
      rating,
      comments,
      createdAt: new Date()
    };

    DBHelper.addReview(review);
    fillReviewHTML(review);
    document.getElementById('add-review-form').reset();
}

fillReviewHTML = (review) => {
  const noReviews = document.getElementById('zero-reviews');
  if (noReviews) {
    noReviews.remove();
  }

  const container = document.getElementById('reviews-container');
  const ul        = document.getElementById('reviews-list');
  ul.insertBefore(createReviewHTML(review), ul.firstChild);
  container.appendChild(ul);
}
