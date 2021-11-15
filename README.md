# PopulationData
Model State Population over ~50 years.

## How to run
1. run `npm i` in the root folder
2. run `npm run watch`

## Creating the database
* If you want to create the database on your local machine run `node db-seeder.js` this will create the population database with following collections
    * map-paths
        * used by d3 to draw the boundaries of the states/counties
    * states
        * population data from each state from 1969-2019
    * counties
        * population data from each county from 2010-2019

## Folder Structure

### public
* client side html/css/js files

### data
* counties-10m.json
    * Contains path information d3 reads to mark the state/county boundaries. This was retrieved from https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json
* popest-annual-historical.csv
    * contains state population data from 1969-2009
* popest-annual.csv
    * contains state population data from 2010-2019
* co-est2019-annres.csv
    * breakdown of all the counties from 2010-2019 
    * retrieved here: https://www.census.gov/data/datasets/time-series/demo/popest/2010s-counties-total.html