/*
Author: Joey Jaikaran
Date: May 13, 2026
Purpose: Fetches and caches all Pokémon data from PokeAPI on first load.
         Retrieves Pokémon details, species data, and type weaknesses in
         batches and stores the results in localStorage to avoid repeated
         API calls on subsequent visits.
*/

const POKEAPI_BASE = "https://pokeapi.co/api/v2";
const TOTAL_POKEMON = 1025;
const BATCH_SIZE = 20;
const CACHE_KEY = "pokewordle_data";
const CACHE_VERSION = "1.1";

async function fetchWithRetry(url, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
      return await res.json();
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
}

async function buildPokemonList(){
    // Check to see if any data is loaded in cache already, if it is then return it, if not then load data from API
    const cached = loadFromCache();
    if (cached) return cached;

    // Fetch data from API, take the returned response object and call 
    // .json on it to take the response body and parse it into a JavaScript object 
    // This object has a results attribute which is the array of pokemon objects and each one of these objects has a URL 
    // so we are creating a new container that just contains the URL's for each pokemon
    const listRes = await fetchWithRetry(`${POKEAPI_BASE}/pokemon?limit=${TOTAL_POKEMON}`);
    const listData = listRes;
    const urls = listData.results.map(p => p.url);

    // Create arrays that will hold all pokemon data objects with data from pokemon API, 
    // and the other will hold all pokemon species data with data from pokemon species API
    const [rawPokemon, rawSpecies] = await Promise.all([
        fetchInBatches(urls),
        fetchSpeciesData(urls)
    ]);

    // Create array holding the weaknesses for every pokemon
    const weaknesses = await fetchWeaknesses(rawPokemon);

    // Go through each pokemon and create a new pokemon object that 
    // contains the data that we need for that pokemon and map it to a new list
    const pokemonList = rawPokemon.map((pokemon, index) => {
        const species = rawSpecies[index];
        
        return {
            name: pokemon.name,
            types: pokemon.types.map(t => t.type.name),
            weaknesses: weaknesses[index],
            generation: species.generation.name,
            colour: species.color.name,
            sprite: pokemon.sprites.front_default
        };
    });

    // Set local storage, so data will persist between sessions and only needs to be fetched once
    localStorage.setItem(CACHE_KEY, JSON.stringify({
        version: CACHE_VERSION,
        data: pokemonList
    }));

    return pokemonList;
}

function loadFromCache(){
    // Retrieve value from local storage at specified key, local storage will store the value as a JSON string
    // If it doesn't find anything at that key then return null
    const raw = localStorage.getItem(CACHE_KEY);
    if(!raw) return null;
    // Parse the retrieved JSON string into a JavaScript object, 
    // it will have two properties the version, and data which contains the array of Pokemon objects
    const parsed = JSON.parse(raw);
    // Check the version number if it doesn't match then return null
    // This is how we can unsure that user has correct and up to date data, 
    // if we change the version number then it forces the browser to do a new fetch
    if(parsed.version !== CACHE_VERSION) return null;

    return parsed.data;
}

async function fetchInBatches(urls){
    const results = [];

    // Loop through URLS one batch at a time
    for(let i = 0; i < urls.length; i += BATCH_SIZE){
        // Get the URLS for just this batch
        const batch = urls.slice(i, i + BATCH_SIZE);
        // Make a fetch call on each URL in batch, take the response from that request and call .json 
        // to get a JavaScript object, Promise.all ensures they all run at once, not one by one, 
        // and then we await for them all to finish 
        // This will now hold an array with all available data on every pokemon in this batch
        const batchResults = await Promise.all(
            batch.map(url => fetchWithRetry(url))
        );
        // Use spread operator to unpack batchResults and add individual objects to results
        results.push(...batchResults);
    }

    return results;
}

async function fetchSpeciesData(urls){
    // Replace the word "pokemon" in URL with "pokemon-species", 
    // so that we are able to fetch from new URL to get species data 
    // which contains generation and colour which we need
    const speciesUrls = urls.map(url => url.replace("pokemon", "pokemon-species"));

    const results = [];

    for(let i = 0; i < speciesUrls.length; i += BATCH_SIZE){
        const batch = speciesUrls.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(
            batch.map(url => fetchWithRetry(url))
        );

        results.push(...batchResults);
    }

    return results;
}

async function fetchWeaknesses(pokemonList) {
  const allTypes = [
    "normal", "fire", "water", "electric", "grass", "ice",
    "fighting", "poison", "ground", "flying", "psychic", "bug",
    "rock", "ghost", "dragon", "dark", "steel", "fairy"
  ];

  const typeCache = {};

  for (const typeName of allTypes) {
    try {
      const data = await fetchWithRetry(`${POKEAPI_BASE}/type/${typeName}`);
      typeCache[typeName] = data.damage_relations.double_damage_from.map(t => t.name);
    } catch (err) {
      console.warn(`Failed to fetch type: ${typeName}`, err);
      typeCache[typeName] = [];
    }
  }

  return pokemonList.map(pokemon => {
    const typeNames = pokemon.types.map(t => t.type.name);
    const weaknessArrays = typeNames.map(typeName => typeCache[typeName] || []);
    return [...new Set(weaknessArrays.flat())];
  });
}

export { buildPokemonList };