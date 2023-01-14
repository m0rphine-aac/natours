export const displayMap = locations => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoibTBycGhpbmUtYWFjIiwiYSI6ImNsY3VjZGp4djE4ZWMzcm1zMm8xMmNqcDQifQ._pvrIh9sXwzYMz0N_yugtQ';

  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/m0rphine-aac/clcuf0sve00al14t9f6qvw35q',
    scrollZoom: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach(location => {
    // Create marker
    const el = document.createElement('div');
    el.className = 'marker';

    // Add marker
    new mapboxgl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat(location.coordinates)
      .addTo(map);

    // Add popup
    new mapboxgl.Popup({ offset: 30 })
      .setLngLat(location.coordinates)
      .setHTML(`<p>Day ${location.day}: ${location.description}</p>`)
      .addTo(map);

    // Extends map bounds to include the current location
    bounds.extend(location.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};
