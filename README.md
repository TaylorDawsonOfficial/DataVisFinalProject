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
* client side css/js files

### views
* contains HTML files
    * We are using the EJS templating engine for this project


### data
* states-10m.json
    * Contains path information d3 reads to mark the state boundaries. This was retrieved from here: https://github.com/topojson/us-atlas
* us-states folder
    * Contains geo data for each individual state. Retrieved from here: https://github.com/deldersveld/topojson/tree/master/countries/us-states
* state-land-area
    * Contains the square mile area for each state. Retrieved from here: https://worldpopulationreview.com/state-rankings/states-by-area
* county-land-area
    * Contains the square mile area for each county. Retrieved from here: https://www.census.gov/library/publications/2011/compendia/usa-counties-2011.html#LND
* popest-annual-historical.csv
    * contains state population data from 1969-2009
* popest-annual.csv
    * contains state population data from 2010-2019
* co-est2019-annres.csv
    * breakdown of all the counties from 2010-2019 
    * retrieved here: https://www.census.gov/data/datasets/time-series/demo/popest/2010s-counties-total.html