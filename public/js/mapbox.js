/* eslint-disable */

export default function displayMap(locations) {
  //api token
  mapboxgl.accessToken =
    'pk.eyJ1Ijoic2VzMzM5NDI4MzI2IiwiYSI6ImNsaHB2anhvaTBhbG8zam1majE3cGF3aTAifQ.b9DkqD8Q6IEKOXLlUmcpjw';

  //boxmap setting
  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/ses339428326/clhq07ld600ld01pz4cj6h8rr',
    scrollZoom: false,
  });

  //bounds
  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    //create marker
    const el = document.createElement('div');
    el.className = 'marker';

    //marker point position
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    //popup window
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day} ${loc.description}</p>`)
      .addTo(map);

    //bound setting
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
}
